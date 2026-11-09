import scenariosList from '../data/scenarios.json' with { type: 'json' };
import gameBalance from '../data/gameBalance.json' with { type: 'json' };
import type { SimulationResult, MissionScore, Scenario } from '../types/game';

export function scoreMission(result: SimulationResult): MissionScore {
  const scenarios = scenariosList as Scenario[];
  const scenario: Scenario = scenarios.find((s) => s.id === result.scenarioId) ?? scenarios[0];
  const calc = result.calculation;

  const mistakes: string[] = [];
  const causeAndEffectExplanations: string[] = [];
  const recommendations: string[] = [];
  const earnedAchievements: string[] = [];

  // 1. Science Score (Max 400 pts)
  const scienceRatio = Math.min(1.5, result.totalScienceDownlinked / Math.max(scenario.minScienceGoal, 1));
  let scienceScore = Math.round(scienceRatio * 260);
  if (result.finalState === 'failure') {
    scienceScore = Math.round(scienceScore * 0.2);
  }

  // 2. Engineering Efficiency (Max 200 pts)
  // Evaluates margins: mass margin, power margin, delta-V margin
  let engScore = 120;
  if (calc.netPowerMarginW > 50) engScore += 25;
  else if (calc.netPowerMarginW < 0) engScore -= 60;

  if (calc.deltaVAvailableKmS >= calc.deltaVRequiredKmS * 1.15) engScore += 30;
  else if (!calc.isDeltaVCompatible) engScore -= 50;

  if (calc.dataDownlinkEfficiencyPercent >= 90) engScore += 25;
  else engScore -= Math.round((100 - calc.dataDownlinkEfficiencyPercent) * 0.4);

  const engineeringEfficiency = Math.max(0, Math.min(200, engScore));

  // 3. Budget Efficiency (Max 150 pts)
  const budgetRatio = calc.totalBudgetMillion / scenario.budgetLimitMillion;
  let budgetEfficiency = 100;
  if (budgetRatio <= 0.75) {
    budgetEfficiency = 150;
    earnedAchievements.push('ach-frugal-engineer');
  } else if (budgetRatio <= 0.90) {
    budgetEfficiency = 130;
  } else if (budgetRatio <= 1.0) {
    budgetEfficiency = 100;
  } else {
    budgetEfficiency = Math.max(10, Math.round(100 - (budgetRatio - 1.0) * 200));
  }

  // 4. Survival Score (Max 150 pts)
  let survivalScore = 0;
  if (result.finalState === 'success') {
    survivalScore = Math.round(50 + (result.finalHullPercent / 100) * 100);
  } else if (result.finalState === 'partial_success') {
    survivalScore = Math.round(30 + (result.finalHullPercent / 100) * 40);
  } else {
    survivalScore = 10;
  }

  // 5. Resource Score (Max 100 pts)
  const fuelRemainingRatio = calc.fuelMassKg > 0 ? result.finalFuelKg / calc.fuelMassKg : 0;
  const resourceScore = Math.round(fuelRemainingRatio * 50 + (calc.batteryReserveHours > 2 ? 50 : 20));

  // Overall Score clamped to 0 - 1000
  let overallScore = scienceScore + engineeringEfficiency + budgetEfficiency + survivalScore + resourceScore;
  if (result.finalState === 'failure') {
    overallScore = Math.min(300, Math.round(overallScore * 0.35));
  }
  overallScore = Math.max(0, Math.min(1000, overallScore));

  // Achievements checks
  if (calc.lostDataPercent < 2 && result.totalScienceCollected > 0) {
    earnedAchievements.push('ach-zero-waste-data');
  }
  if (
    calc.netPowerMarginW > 50 &&
    calc.deltaVAvailableKmS > calc.deltaVRequiredKmS * 1.15 &&
    calc.launcherCapacityKg - calc.totalMassKg > 200
  ) {
    earnedAchievements.push('ach-perfect-margin');
  }
  if (result.finalHullPercent > 0 && result.finalHullPercent <= 20 && result.finalState !== 'failure') {
    earnedAchievements.push('ach-mission-survivor');
  }
  if (calc.commDelayMinutes > 10 && calc.dataDownlinkEfficiencyPercent > 85) {
    earnedAchievements.push('ach-master-communicator');
  }
  if (result.totalScienceDownlinked >= 800) {
    earnedAchievements.push('ach-scientific-pioneer');
  }
  const resolvedCriticalEvents = result.eventsEncountered.filter(
    (e) => e.wasSuccessful && e.event.severity !== 'minor'
  );
  if (resolvedCriticalEvents.length >= 2) {
    earnedAchievements.push('ach-survived-three-failures');
  }

  // ==========================================
  // CAUSE & EFFECT / WHY DID THIS HAPPEN?
  // ==========================================
  if (calc.lostDataPercent > 15) {
    mistakes.push(`Communications bottleneck caused ${calc.lostDataPercent}% scientific telemetry loss.`);
    causeAndEffectExplanations.push(
      `Your instruments generated ${calc.totalDataGeneratedGbDay} GB/day, but the antenna system could only transmit ${calc.downlinkCapacityGbDay} GB/day. Because onboard solid-state buffers saturated, high-resolution scientific data had to be discarded before downlink.`
    );
    recommendations.push(
      'Equip a Ka-Band Gimbaled High-Gain Antenna or reduce duty cycle on high-bandwidth optical cameras.'
    );
  }

  if (calc.netPowerMarginW < 0) {
    mistakes.push(`Negative electrical power margin (-${Math.abs(calc.netPowerMarginW)} W).`);
    causeAndEffectExplanations.push(
      `Solar flux decreases inversely with the square of distance (1/r²). At destination orbit (${scenario.destination}), solar panels produce significantly less current than at Earth orbit, creating a persistent power deficit during science operations.`
    );
    recommendations.push(
      'Add an RTG Power Unit (which delivers distance-independent continuous wattage) or upgrade to High-Efficiency UltraFlex Solar Wings.'
    );
  }

  if (calc.effectiveRadiationDoseRadPerYear > 300) {
    mistakes.push(`Elevated radiation dose (${calc.effectiveRadiationDoseRadPerYear} Rad/yr).`);
    causeAndEffectExplanations.push(
      `Intense trapped electron and proton belts around the target body eroded solar array efficiency and increased single-event upsets in flight computer registers.`
    );
    recommendations.push(
      'Install Polyethylene-Tantalum Armor shielding or choose the heavily-armored Goliath chassis.'
    );
  }

  if (result.finalState === 'failure' && result.failureReason) {
    mistakes.push(`Mission Loss: ${result.failureReason}`);
    causeAndEffectExplanations.push(
      `Catastrophic failure occurred: ${result.failureReason} In space mission design, a single unresolved subsystem bottleneck cascades rapidly across thermal, electrical, and orbital parameters.`
    );
    recommendations.push(
      'Review launcher mass limits, ensure redundant attitude control systems, and maintain at least 15% safety margin on fuel.'
    );
  }

  if (causeAndEffectExplanations.length === 0) {
    causeAndEffectExplanations.push(
      'Flawless subsystem balancing: Propellant delta-V, electrical generation, and telemetry downlink margins all remained positive throughout all mission phases.'
    );
    recommendations.push(
      'Try advancing to a more challenging scenario like Europa Life Search, or test your engineering in Sandbox mode!'
    );
  }

  // Rule-based AI Narrative
  const aiNarrative = generateRuleBasedNarrative(result, scenario, overallScore);

  return {
    overallScore,
    scienceScore,
    engineeringEfficiency,
    budgetEfficiency,
    resourceScore,
    survivalScore,
    mistakes,
    causeAndEffectExplanations,
    recommendations,
    earnedAchievements: Array.from(new Set(earnedAchievements)),
    aiNarrative,
  };
}

function generateRuleBasedNarrative(
  result: SimulationResult,
  scenario: Scenario,
  score: number
): string {
  const statusStr =
    result.finalState === 'success'
      ? 'A RESOUNDING SUCCESS'
      : result.finalState === 'partial_success'
      ? 'A QUALIFIED SCIENTIFIC SUCCESS'
      : 'A CATASTROPHIC MISSION LOSS';

  const dateStr = 'MISSION DAY 742';

  return `[MISSION ARCHIVE DEBRIEF // SECTOR KEPLER // ${dateStr}]
Designation: GTA NASA Expedition "${scenario.title}"
Status: ${statusStr} (Composite Score: ${score}/1000)

Spacecraft telemetry logged ${result.totalScienceDownlinked} GB of scientific telemetry returned to Earth from ${scenario.destination}. Throughout the trajectory, total spacecraft dry mass of ${result.calculation.dryMassKg} kg was accelerated via a ${(result.calculation.deltaVAvailableKmS).toFixed(1)} km/s burn profile.

${
  result.finalState === 'failure'
    ? `Tragedy struck the expedition: ${result.failureReason}. Mission telemetry halted with ${result.finalHullPercent}% hull integrity remaining. Flight controllers have archived the flight data recorder to identify lessons for subsequent hardware iterations.`
    : `The spacecraft performed admirably across all phases. Power subsystems stabilized at +${result.calculation.netPowerMarginW} W net margin while downlink efficiency reached ${result.calculation.dataDownlinkEfficiencyPercent}%. This mission paves the way for humanity's eventual deep-space transit to the Kepler sector.`
}`;
}
