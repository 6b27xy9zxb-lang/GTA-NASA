import chassisList from '../data/chassis.json' with { type: 'json' };
import modulesList from '../data/modules.json' with { type: 'json' };
import componentsList from '../data/components.json' with { type: 'json' };
import instrumentsList from '../data/instruments.json' with { type: 'json' };
import launchersList from '../data/launchers.json' with { type: 'json' };
import orbitsList from '../data/orbits.json' with { type: 'json' };
import scenariosList from '../data/scenarios.json' with { type: 'json' };
import gameBalance from '../data/gameBalance.json' with { type: 'json' };

import type {
  SpacecraftConfig,
  MissionCalculation,
  EngineeringCheck,
  Chassis,
  UpgradeModule,
  CoreComponent,
  ScientificInstrument,
  LaunchVehicle,
  DestinationOrbit,
  Scenario,
} from '../types/game';

export function computeMission(config: SpacecraftConfig): MissionCalculation {
  const checks: EngineeringCheck[] = [];

  // 1. Resolve Scenario & Destination Orbit
  const scenario = (scenariosList as Scenario[]).find((s) => s.id === config.scenarioId) || scenariosList[0];
  const orbit = (orbitsList as DestinationOrbit[]).find((o) => o.id === scenario.destinationOrbitId) || orbitsList[0];

  // 2. Resolve Chassis
  const chassis = (chassisList as Chassis[]).find((c) => c.id === config.chassisId) || chassisList[0];

  // Check hardpoints limit
  const maxHardpoints = chassis.hardpointSlots;
  const installedModules = (modulesList as UpgradeModule[]).filter((m) =>
    config.installedModules.includes(m.id)
  );

  let usedHardpoints = 0;
  installedModules.forEach((m) => {
    // Count occurrences if stacked
    const count = config.installedModules.filter((id) => id === m.id).length;
    usedHardpoints += m.hardpointCost * count;
  });

  if (usedHardpoints > maxHardpoints) {
    checks.push({
      id: 'hardpoint-exceeded',
      level: 'error',
      category: 'mass',
      title: 'Hardpoint Capacity Exceeded',
      message: `${chassis.name} allows a maximum of ${maxHardpoints} upgrade hardpoints. Current modules occupy ${usedHardpoints}.`,
      remedy: `Remove at least ${usedHardpoints - maxHardpoints} upgrade module(s) to fit within the chassis structural hardpoints.`,
    });
  }

  // 3. Resolve Core Components
  const selectedCoreComponentIds = Object.values(config.coreComponents).filter(Boolean);
  const coreComponents = (componentsList as CoreComponent[]).filter((c) =>
    selectedCoreComponentIds.includes(c.id)
  );

  // 4. Resolve Instruments
  const instruments = (instrumentsList as ScientificInstrument[]).filter((inst) =>
    config.selectedInstruments.includes(inst.id)
  );

  // 5. Resolve Launch Vehicle
  const launcher = (launchersList as LaunchVehicle[]).find((l) => l.id === config.launchVehicleId) || launchersList[0];

  // ==========================================
  // MASS COMPUTATION
  // Total = Dry Mass + Fuel Mass
  // Dry Mass = Chassis dryMass + Core components mass + Instruments mass + Modules mass
  // ==========================================
  let dryMassKg = chassis.dryMass;
  coreComponents.forEach((c) => {
    dryMassKg += c.mass;
  });
  instruments.forEach((inst) => {
    dryMassKg += inst.mass;
  });
  installedModules.forEach((mod) => {
    const count = config.installedModules.filter((id) => id === mod.id).length;
    dryMassKg += mod.mass * count;
  });

  // Calculate Fuel capacity & fuel mass
  let fuelTankCapacity = 0;
  const fuelTankComp = coreComponents.find((c) => c.category === 'fuel_tank');
  if (fuelTankComp && fuelTankComp.specs.capacityKg) {
    fuelTankCapacity += fuelTankComp.specs.capacityKg;
  }
  // Chassis base capacity
  fuelTankCapacity = Math.max(fuelTankCapacity, chassis.maxFuelCapacity);

  // Add extra fuel tank module bonus
  installedModules.forEach((mod) => {
    const count = config.installedModules.filter((id) => id === mod.id).length;
    if (mod.effects.fuelCapacityBonus) {
      fuelTankCapacity += mod.effects.fuelCapacityBonus * count;
    }
  });

  // Clamp fuel load to actual tank capacity
  const fuelMassKg = Math.min(Math.max(0, config.fuelLoadKg), fuelTankCapacity);
  const totalMassKg = dryMassKg + fuelMassKg;

  // Launcher capacity based on destination
  let launcherCapacityKg = launcher.leoCapacityKg;
  if (scenario.destinationOrbitId === 'orbit-moon') {
    launcherCapacityKg = launcher.lunarCapacityKg;
  } else if (scenario.destinationOrbitId === 'orbit-mars') {
    launcherCapacityKg = launcher.marsCapacityKg;
  } else if (scenario.destinationOrbitId === 'orbit-europa') {
    launcherCapacityKg = launcher.deepSpaceCapacityKg;
  }

  // Mass constraint checks
  const isMassCompatible = totalMassKg <= launcherCapacityKg && totalMassKg <= scenario.massLimitKg;
  if (totalMassKg > launcherCapacityKg) {
    checks.push({
      id: 'launcher-overweight',
      level: 'error',
      category: 'mass',
      title: 'Launcher Payload Exceeded',
      message: `Total spacecraft mass (${Math.round(totalMassKg)} kg) exceeds ${launcher.name}'s capacity to ${scenario.destination} (${launcherCapacityKg} kg).`,
      remedy: `Choose a heavier launch vehicle, reduce fuel load, or install lighter components.`,
    });
  }

  if (totalMassKg > scenario.massLimitKg) {
    checks.push({
      id: 'scenario-mass-limit',
      level: 'error',
      category: 'mass',
      title: 'Mission Scenario Mass Limit Exceeded',
      message: `Total mass (${Math.round(totalMassKg)} kg) exceeds the scenario requirement ceiling of ${scenario.massLimitKg} kg.`,
      remedy: `Optimize spacecraft structure, remove secondary instruments or upgrade modules.`,
    });
  }

  // ==========================================
  // POWER COMPUTATION
  // Available Power = RTG power + Solar (scaled by 1 / r^2) + Module generation
  // ==========================================
  let baseSolarPower1AuW = 0;
  let baseRtgPowerW = 0;
  let batteryCapacityWh = 500; // minimal bus reserve

  coreComponents.forEach((c) => {
    if (c.category === 'solar' && c.specs.powerGenerationW) {
      baseSolarPower1AuW += c.specs.powerGenerationW;
    }
    if (c.category === 'power_source' && c.specs.powerGenerationW) {
      baseRtgPowerW += c.specs.powerGenerationW;
    }
    if (c.category === 'battery' && c.specs.powerCapacityWh) {
      batteryCapacityWh += c.specs.powerCapacityWh;
    }
  });

  installedModules.forEach((mod) => {
    const count = config.installedModules.filter((id) => id === mod.id).length;
    if (mod.effects.powerGenerationBonus) {
      if (mod.id === 'rtg-power-unit') {
        baseRtgPowerW += mod.effects.powerGenerationBonus * count;
      } else {
        baseSolarPower1AuW += mod.effects.powerGenerationBonus * count;
      }
    }
  });

  // Solar flux drops with 1 / r^2
  const distanceAu = orbit.distanceFromSunAu;
  const solarFluxFactor = 1 / (distanceAu * distanceAu);
  const effectiveSolarPowerW = baseSolarPower1AuW * solarFluxFactor;

  // Nova-Core special ability: +12% hybrid grid efficiency
  const gridEfficiencyMultiplier = config.chassisId === 'nova-core' ? 1.12 : 1.0;
  const availablePowerW = Math.round((effectiveSolarPowerW + baseRtgPowerW) * gridEfficiencyMultiplier);

  // Power consumption: Core components + Instruments (weighted by duty cycle) + Modules
  let requiredPowerW = 0;
  coreComponents.forEach((c) => {
    if (c.powerConsumption > 0) {
      requiredPowerW += c.powerConsumption;
    }
  });

  instruments.forEach((inst) => {
    requiredPowerW += Math.round(inst.powerConsumption * inst.dutyCycle);
  });

  installedModules.forEach((mod) => {
    const count = config.installedModules.filter((id) => id === mod.id).length;
    if (mod.powerConsumption > 0) {
      requiredPowerW += mod.powerConsumption * count;
    }
  });

  const netPowerMarginW = availablePowerW - requiredPowerW;
  const isPowerCompatible = netPowerMarginW >= 0;

  // Battery reserve calculation (hours of survival during eclipse/deficit)
  const averageHourlyDraw = Math.max(requiredPowerW, 20);
  const batteryReserveHours = Math.round((batteryCapacityWh / averageHourlyDraw) * 10) / 10;

  if (netPowerMarginW < 0) {
    checks.push({
      id: 'power-deficit',
      level: 'error',
      category: 'power',
      title: 'Electrical Power Deficit',
      message: `Power required (${requiredPowerW} W) exceeds generation at destination (${availablePowerW} W). Battery will deplete in ${batteryReserveHours} hours!`,
      remedy: distanceAu > 2.0
        ? `At ${distanceAu} AU, solar flux is only ${(solarFluxFactor * 100).toFixed(1)}%. Add an RTG power unit or reduce instrument load.`
        : `Install larger solar wings, add an RTG, or reduce high-drain instruments.`,
    });
  } else if (netPowerMarginW < 40) {
    checks.push({
      id: 'power-low-margin',
      level: 'warning',
      category: 'power',
      title: 'Tight Power Margin',
      message: `Power margin is only +${netPowerMarginW} W. Fluctuations or solar panel degradation may cause system resets.`,
      remedy: `Consider adding an auxiliary solar wing or larger battery buffer for safe margins.`,
    });
  }

  // ==========================================
  // PROPULSION & DELTA-V (Rocket Equation)
  // Delta-V = Isp * g0 * ln(m0 / mf)
  // ==========================================
  let effectiveIsp = 310; // Default bipropellant Isp
  const propulsionComp = coreComponents.find((c) => c.category === 'propulsion');
  if (propulsionComp && propulsionComp.specs.ispSeconds) {
    effectiveIsp = propulsionComp.specs.ispSeconds;
  }

  // Chassis ability bonus (Aero-Dart +15% Isp)
  if (config.chassisId === 'aero-dart') {
    effectiveIsp *= 1.15;
  }

  // Module Isp bonus
  installedModules.forEach((mod) => {
    if (mod.effects.ispBonus) {
      effectiveIsp += mod.effects.ispBonus;
    }
  });

  const m0 = totalMassKg;
  const mf = Math.max(dryMassKg, 1);
  const g0 = gameBalance.physics.standardGravityG0; // 9.80665 m/s²
  // deltaV in km/s = (Isp * g0 * ln(m0 / mf)) / 1000
  const deltaVAvailableKmS =
    fuelMassKg > 0
      ? Math.round(((effectiveIsp * g0 * Math.log(m0 / mf)) / 1000) * 100) / 100
      : 0;

  const deltaVRequiredKmS = orbit.deltaVRequiredKmS;
  const isDeltaVCompatible = deltaVAvailableKmS >= deltaVRequiredKmS * 0.95; // 5% tolerance margin

  if (!isDeltaVCompatible) {
    checks.push({
      id: 'deltav-shortfall',
      level: 'error',
      category: 'fuel',
      title: 'Insufficient Delta-V for Trajectory',
      message: `Spacecraft delta-V (${deltaVAvailableKmS.toFixed(1)} km/s) falls short of mission requirement (${deltaVRequiredKmS.toFixed(1)} km/s). Spacecraft will not reach ${scenario.destination}.`,
      remedy: `Increase propellant load, install high-Isp ion propulsion, or lighten dry mass.`,
    });
  }

  // ==========================================
  // SCIENTIFIC DATA & COMMUNICATION
  // Downlink vs Generation
  // ==========================================
  let totalDataGeneratedGbDay = 0;
  let baseSciencePotential = 0;

  instruments.forEach((inst) => {
    // Data (Gb/day) = Mbps * 3600 * 24 * dutyCycle / 8000
    const dailyGb = (inst.dataGenerationRateMbps * 86400 * inst.dutyCycle) / 8000;
    totalDataGeneratedGbDay += dailyGb;
    baseSciencePotential += inst.scienceValue;
  });

  // Communication capability
  let downlinkRateMbps = 1.0;
  let commRangeAu = chassis.baseCommRangeAu;

  coreComponents.forEach((c) => {
    if (c.category === 'antenna') {
      if (c.specs.downlinkRateMbps) downlinkRateMbps = c.specs.downlinkRateMbps;
      if (c.specs.commRangeAu) commRangeAu = Math.max(commRangeAu, c.specs.commRangeAu);
    }
  });

  let downlinkMultiplier = 1.0;
  installedModules.forEach((mod) => {
    const count = config.installedModules.filter((id) => id === mod.id).length;
    if (mod.effects.commRangeBonusAu) commRangeAu += mod.effects.commRangeBonusAu * count;
    if (mod.effects.downlinkMultiplier) downlinkMultiplier *= Math.pow(mod.effects.downlinkMultiplier, count);
    if (mod.effects.scienceMultiplier) baseSciencePotential *= mod.effects.scienceMultiplier * count;
  });

  // Effective downlink Gb/day (assuming 8 hours contact time per day with ground stations)
  const contactHoursPerDay = 8;
  const downlinkCapacityGbDay =
    Math.round(((downlinkRateMbps * downlinkMultiplier * 3600 * contactHoursPerDay) / 8000) * 10) / 10;

  // Check communication distance vs range
  const isOutOfRange = orbit.commDistanceAu > commRangeAu;
  if (isOutOfRange) {
    checks.push({
      id: 'comm-out-of-range',
      level: 'error',
      category: 'comm',
      title: 'Communication Range Limit Exceeded',
      message: `Destination distance (${orbit.commDistanceAu} AU) exceeds max antenna range (${commRangeAu.toFixed(1)} AU). Ground control link will be lost!`,
      remedy: `Upgrade to Ka-Band Gimbaled High-Gain Antenna or equip X-Band High-Gain Antenna module.`,
    });
  }

  // Downlink efficiency
  let dataDownlinkEfficiencyPercent = 100;
  let lostDataPercent = 0;
  if (totalDataGeneratedGbDay > 0) {
    if (isOutOfRange) {
      dataDownlinkEfficiencyPercent = 10;
      lostDataPercent = 90;
    } else if (downlinkCapacityGbDay < totalDataGeneratedGbDay) {
      dataDownlinkEfficiencyPercent = Math.round((downlinkCapacityGbDay / totalDataGeneratedGbDay) * 100);
      lostDataPercent = 100 - dataDownlinkEfficiencyPercent;

      checks.push({
        id: 'data-downlink-bottleneck',
        level: 'warning',
        category: 'comm',
        title: 'Telemetry Downlink Bottleneck',
        message: `Instruments generate ${totalDataGeneratedGbDay.toFixed(1)} GB/day, but communications can only downlink ${downlinkCapacityGbDay.toFixed(1)} GB/day. Approximately ${lostDataPercent}% of science data will be lost onboard!`,
        remedy: `Upgrade antenna downlink throughput or deactivate redundant high-bandwidth instruments.`,
      });
    }
  }

  // Comm Delay
  const commDelayMinutes = orbit.lightDelayMinutes;

  // Expected usable science
  const expectedUsableScience = Math.round(baseSciencePotential * (dataDownlinkEfficiencyPercent / 100));

  // ==========================================
  // RADIATION SHIELDING & SURVIVAL
  // ==========================================
  let shieldingFactor = 0.15; // baseline unibody chassis protection
  if (config.chassisId === 'goliath') {
    shieldingFactor += 0.35; // Goliath Aegis Bulkhead
  }

  coreComponents.forEach((c) => {
    if (c.category === 'radiation_shield' && c.specs.radiationAbsorptionPercent) {
      shieldingFactor += c.specs.radiationAbsorptionPercent / 100;
    }
  });

  installedModules.forEach((mod) => {
    const count = config.installedModules.filter((id) => id === mod.id).length;
    if (mod.effects.radiationResistanceBonus) {
      shieldingFactor += mod.effects.radiationResistanceBonus * count;
    }
  });

  shieldingFactor = Math.min(shieldingFactor, 0.95); // max 95% protection

  // Ambient radiation Rad/year
  let ambientRadPerYear = gameBalance.radiation.annualBaseCosmicRad;
  if (orbit.ambientRadiationLevel === 'extreme') {
    ambientRadPerYear *= gameBalance.radiation.europaJovianRadMultiplier; // ~5250 Rad/yr
  } else if (orbit.ambientRadiationLevel === 'high' || orbit.ambientRadiationLevel === 'moderate') {
    ambientRadPerYear *= gameBalance.radiation.marsRadMultiplier; // ~270 Rad/yr
  }

  const effectiveRadiationDoseRadPerYear = Math.round(ambientRadPerYear * (1 - shieldingFactor));
  let radiationSurvivalRisk: 'safe' | 'caution' | 'critical' = 'safe';

  if (effectiveRadiationDoseRadPerYear > 1500) {
    radiationSurvivalRisk = 'critical';
    checks.push({
      id: 'radiation-lethal',
      level: 'error',
      category: 'radiation',
      title: 'Lethal Radiation Exposure',
      message: `Effective radiation dose is ${effectiveRadiationDoseRadPerYear} Rad/year. Unshielded avionics and sensor optics will suffer catastrophic latch-ups within months!`,
      remedy: `Equip Goliath chassis, Polyethylene-Tantalum Armor, or Heavy Deflector Shield.`,
    });
  } else if (effectiveRadiationDoseRadPerYear > 300) {
    radiationSurvivalRisk = 'caution';
    checks.push({
      id: 'radiation-elevated',
      level: 'warning',
      category: 'radiation',
      title: 'Elevated Radiation Degradation',
      message: `Radiation dose (${effectiveRadiationDoseRadPerYear} Rad/year) will degrade solar arrays and sensor sensitivity over the mission timeline.`,
      remedy: `Add radiation shielding or redundant computer modules to mitigate failure risk.`,
    });
  }

  // ==========================================
  // BUDGET COMPUTATION
  // Total = Chassis + Components + Instruments + Modules + Launcher + Operations
  // ==========================================
  let totalBudgetMillion = chassis.cost;
  coreComponents.forEach((c) => {
    totalBudgetMillion += c.cost;
  });
  instruments.forEach((inst) => {
    totalBudgetMillion += inst.cost;
  });
  installedModules.forEach((mod) => {
    const count = config.installedModules.filter((id) => id === mod.id).length;
    totalBudgetMillion += mod.cost * count;
  });
  totalBudgetMillion += launcher.cost;

  // Operations cost: $4M/year
  const operationsCost = Math.round(scenario.missionDurationYears * 4);
  totalBudgetMillion += operationsCost;

  const isBudgetCompatible = totalBudgetMillion <= scenario.budgetLimitMillion;
  if (!isBudgetCompatible) {
    checks.push({
      id: 'budget-overrun',
      level: 'error',
      category: 'budget',
      title: 'Budget Limit Exceeded',
      message: `Total mission cost ($${totalBudgetMillion}M) exceeds scenario appropriation ($${scenario.budgetLimitMillion}M).`,
      remedy: `Choose a lower-cost launch vehicle, economical chassis, or streamline instrument suite.`,
    });
  }

  // ==========================================
  // ESTIMATED LIFETIME
  // ==========================================
  let estimatedLifetimeYears = 10;
  // Limited by radiation dose: 4500 Rad lethal limit / effective dose
  if (effectiveRadiationDoseRadPerYear > 0) {
    const radLifetime = Math.round((gameBalance.radiation.lethalAnnualDoseRad / effectiveRadiationDoseRadPerYear) * 10) / 10;
    estimatedLifetimeYears = Math.min(estimatedLifetimeYears, radLifetime);
  }

  if (netPowerMarginW < 0) {
    estimatedLifetimeYears = Math.min(estimatedLifetimeYears, 0.1);
  }

  const isLifetimeCompatible = estimatedLifetimeYears >= scenario.missionDurationYears;
  if (!isLifetimeCompatible) {
    checks.push({
      id: 'lifetime-shortfall',
      level: 'error',
      category: 'lifetime',
      title: 'Insufficient Mission Lifetime',
      message: `Spacecraft estimated survival lifetime (${estimatedLifetimeYears} yrs) is shorter than target mission duration (${scenario.missionDurationYears} yrs).`,
      remedy: `Improve radiation protection and ensure steady power generation throughout the timeline.`,
    });
  }

  // Scientific goal check
  if (instruments.length === 0) {
    checks.push({
      id: 'no-instruments',
      level: 'error',
      category: 'comm',
      title: 'No Scientific Payload Installed',
      message: `Mission has no scientific instruments equipped. Primary scientific objectives cannot be achieved!`,
      remedy: `Equip at least one scientific instrument matching the scenario goals.`,
    });
  } else if (expectedUsableScience < scenario.minScienceGoal) {
    checks.push({
      id: 'science-goal-unmet',
      level: 'warning',
      category: 'comm',
      title: 'Sub-Optimal Science Yield',
      message: `Expected usable science yield (${expectedUsableScience} pts) is below target goal (${scenario.minScienceGoal} pts).`,
      remedy: `Install recommended instruments: ${scenario.recommendedInstruments.join(', ')}.`,
    });
  }

  // ==========================================
  // FINAL LAUNCH READINESS & SUCCESS PROBABILITY
  // ==========================================
  const errorChecks = checks.filter((c) => c.level === 'error');
  const isValidForLaunch = errorChecks.length === 0;

  let successProbability = 85;
  if (!isValidForLaunch) {
    successProbability = Math.max(5, 50 - errorChecks.length * 20);
  } else {
    // Bonuses / penalties
    if (netPowerMarginW > 50) successProbability += 5;
    if (isOutOfRange) successProbability -= 25;
    if (radiationSurvivalRisk === 'caution') successProbability -= 10;
    if (deltaVAvailableKmS > deltaVRequiredKmS * 1.1) successProbability += 5;
    if (usedHardpoints <= maxHardpoints) successProbability += 3;
    successProbability = Math.min(99, Math.max(10, successProbability));
  }

  return {
    dryMassKg: Math.round(dryMassKg),
    fuelMassKg: Math.round(fuelMassKg),
    totalMassKg: Math.round(totalMassKg),
    launcherCapacityKg,
    isMassCompatible,

    availablePowerW,
    requiredPowerW,
    netPowerMarginW,
    batteryReserveHours,
    isPowerCompatible,

    totalDataGeneratedGbDay: Math.round(totalDataGeneratedGbDay * 10) / 10,
    downlinkCapacityGbDay,
    dataDownlinkEfficiencyPercent,
    lostDataPercent,
    commDelayMinutes,

    deltaVAvailableKmS,
    deltaVRequiredKmS,
    isDeltaVCompatible,

    radiationDoseRadPerYear: Math.round(ambientRadPerYear),
    shieldingFactor: Math.round(shieldingFactor * 100) / 100,
    effectiveRadiationDoseRadPerYear,
    radiationSurvivalRisk,

    totalBudgetMillion,
    budgetLimitMillion: scenario.budgetLimitMillion,
    isBudgetCompatible,

    estimatedLifetimeYears,
    targetDurationYears: scenario.missionDurationYears,
    isLifetimeCompatible,

    baseSciencePotential: Math.round(baseSciencePotential),
    expectedUsableScience,

    checks,
    isValidForLaunch,
    successProbabilityPercent: Math.round(successProbability),
  };
}
