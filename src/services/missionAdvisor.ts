import { SpacecraftConfig, MissionCalculation, Scenario } from '../types/game';
import scenariosList from '../data/scenarios.json';
import chassisList from '../data/chassis.json';

export interface AdvisorAnalysis {
  status: 'nominal' | 'caution' | 'critical';
  headline: string;
  primaryDiagnosis: string;
  resourceImpacts: {
    resource: string;
    state: 'good' | 'warning' | 'danger';
    detail: string;
  }[];
  actionableRecommendations: string[];
}

export function generateAdvisorAnalysis(
  config: SpacecraftConfig,
  calc: MissionCalculation
): AdvisorAnalysis {
  const scenario = (scenariosList as Scenario[]).find((s) => s.id === config.scenarioId) || scenariosList[0];
  const chassis = chassisList.find((c) => c.id === config.chassisId) || chassisList[0];

  const resourceImpacts: AdvisorAnalysis['resourceImpacts'] = [];
  const recommendations: string[] = [];
  let status: AdvisorAnalysis['status'] = 'nominal';
  let headline = 'MISSION ARCHITECTURE IS BALANCED AND READY';
  let primaryDiagnosis = `All flight engineering margins satisfy ${scenario.title} mission requirements for orbital insertion and scientific operations.`;

  // 1. Mass analysis
  if (!calc.isMassCompatible) {
    status = 'critical';
    headline = 'PAYLOAD MASS EXCEEDS LAUNCH VEHICLE CAPABILITY';
    primaryDiagnosis = `Spacecraft wet mass (${calc.totalMassKg} kg) exceeds ${calc.launcherCapacityKg} kg allowable payload for ${scenario.destination}. The launch vehicle cannot achieve orbital escape velocity.`;
    resourceImpacts.push({
      resource: 'Mass Margin',
      state: 'danger',
      detail: `Over limit by +${calc.totalMassKg - calc.launcherCapacityKg} kg.`,
    });
    recommendations.push(
      'Select a more powerful launch vehicle (e.g. Vulcan-Centaur or Hyperion Heavy), or reduce auxiliary propellant mass.'
    );
  } else {
    const marginKg = calc.launcherCapacityKg - calc.totalMassKg;
    resourceImpacts.push({
      resource: 'Mass Margin',
      state: marginKg > 300 ? 'good' : 'warning',
      detail: `${calc.totalMassKg} kg / ${calc.launcherCapacityKg} kg capacity (+${marginKg} kg margin).`,
    });
  }

  // 2. Power analysis
  if (!calc.isPowerCompatible) {
    status = 'critical';
    headline = 'ELECTRICAL SYSTEM DEFICIT DETECTED';
    primaryDiagnosis = `Total subsystem draw (${calc.requiredPowerW} W) exceeds generation (${calc.availablePowerW} W). Due to inverse-square law solar attenuation at ${scenario.destination}, solar arrays cannot keep internal batteries charged.`;
    resourceImpacts.push({
      resource: 'Power Balance',
      state: 'danger',
      detail: `Deficit of -${Math.abs(calc.netPowerMarginW)} W. Battery depletes in ${calc.batteryReserveHours} hours.`,
    });
    recommendations.push(
      'Install an RTG Power Unit (which operates unaffected by solar distance) or add UltraFlex Solar Wings.'
    );
  } else if (calc.netPowerMarginW < 40) {
    if (status !== 'critical') status = 'caution';
    resourceImpacts.push({
      resource: 'Power Balance',
      state: 'warning',
      detail: `Tight margin: +${calc.netPowerMarginW} W reserve during daytime passes.`,
    });
    recommendations.push(
      'Consider an auxiliary solar wing or larger battery bank to prevent instrument throttling.'
    );
  } else {
    resourceImpacts.push({
      resource: 'Power Balance',
      state: 'good',
      detail: `+${calc.netPowerMarginW} W surplus at destination orbital distance.`,
    });
  }

  // 3. Telemetry and downlink analysis
  if (calc.lostDataPercent > 10) {
    if (status !== 'critical') status = 'caution';
    headline = 'TELEMETRY DOWNLINK BOTTLENECK DETECTED';
    primaryDiagnosis = `Your equipped science payload generates ${calc.totalDataGeneratedGbDay} GB/day, but the antenna downlink only transfers ${calc.downlinkCapacityGbDay} GB/day during ground station contact windows.`;
    resourceImpacts.push({
      resource: 'Downlink Throughput',
      state: 'warning',
      detail: `${calc.lostDataPercent}% of high-resolution science will be overwritten in onboard storage.`,
    });
    recommendations.push(
      'Upgrade to Ka-Band Gimbaled High-Gain Antenna or equip X-Band High-Gain Antenna module to boost downlink capacity.'
    );
  } else {
    resourceImpacts.push({
      resource: 'Downlink Throughput',
      state: 'good',
      detail: `${calc.dataDownlinkEfficiencyPercent}% of scientific data will be successfully downlinked.`,
    });
  }

  // 4. Radiation analysis
  if (calc.radiationSurvivalRisk === 'critical') {
    status = 'critical';
    headline = 'LETHAL RADIATION BELTS DETECTED';
    primaryDiagnosis = `Ambient ionizing radiation (${calc.effectiveRadiationDoseRadPerYear} Rad/yr) will degrade microelectronics and induce bit-flips in flight computer RAM within months.`;
    resourceImpacts.push({
      resource: 'Radiation Shielding',
      state: 'danger',
      detail: `Shielding factor is only ${Math.round(calc.shieldingFactor * 100)}% against extreme Jovian flux.`,
    });
    recommendations.push(
      'Equip Polyethylene-Tantalum Armor or switch to the heavily-shielded Goliath chassis.'
    );
  } else if (calc.radiationSurvivalRisk === 'caution') {
    if (status !== 'critical') status = 'caution';
    resourceImpacts.push({
      resource: 'Radiation Shielding',
      state: 'warning',
      detail: `Elevated dose (${calc.effectiveRadiationDoseRadPerYear} Rad/yr). Minor solar degradation expected.`,
    });
    recommendations.push('Consider adding redundant avionics or graded-Z shielding for longer component life.');
  } else {
    resourceImpacts.push({
      resource: 'Radiation Shielding',
      state: 'good',
      detail: `Safe operational dose (<300 Rad/yr). Spacecraft lifetime rated for ${calc.estimatedLifetimeYears} years.`,
    });
  }

  // 5. Delta-V & Fuel analysis
  if (!calc.isDeltaVCompatible) {
    status = 'critical';
    headline = 'INSUFFICIENT PROPELLANT FOR ORBITAL INSERTION';
    primaryDiagnosis = `Available delta-V (${calc.deltaVAvailableKmS} km/s) is lower than the required orbital insertion burn (${calc.deltaVRequiredKmS} km/s). Spacecraft will fly past the target.`;
    resourceImpacts.push({
      resource: 'Delta-V Velocity Margin',
      state: 'danger',
      detail: `Deficit of -${(calc.deltaVRequiredKmS - calc.deltaVAvailableKmS).toFixed(1)} km/s.`,
    });
    recommendations.push(
      'Increase propellant load or switch to high-Isp ion propulsion (NEXT-C Gridded Ion Thruster).'
    );
  } else {
    resourceImpacts.push({
      resource: 'Delta-V Velocity Margin',
      state: 'good',
      detail: `${calc.deltaVAvailableKmS} km/s available (Target: ${calc.deltaVRequiredKmS} km/s).`,
    });
  }

  // 6. Hardpoint slots check
  if (config.installedModules.length > chassis.hardpointSlots) {
    status = 'critical';
    headline = 'HARDPOINT STRUCTURAL LIMIT EXCEEDED';
    primaryDiagnosis = `${chassis.name} unibody only supports ${chassis.hardpointSlots} hardpoints, but ${config.installedModules.length} are equipped.`;
    recommendations.push(
      `Remove ${config.installedModules.length - chassis.hardpointSlots} upgrade module(s) to clear structural error.`
    );
  }

  return {
    status,
    headline,
    primaryDiagnosis,
    resourceImpacts,
    actionableRecommendations: recommendations.slice(0, 3),
  };
}
