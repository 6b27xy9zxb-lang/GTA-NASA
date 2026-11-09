import eventsList from '../data/events.json' with { type: 'json' };
import scenariosList from '../data/scenarios.json' with { type: 'json' };
import orbitsList from '../data/orbits.json' with { type: 'json' };
import { SeededRNG } from './random';
import { computeMission } from './computeMission';
import type {
  SpacecraftConfig,
  SimulationResult,
  TimelineDataPoint,
  MissionEvent,
  MissionEventOption,
  Scenario,
  DestinationOrbit,
} from '../types/game';

export interface SimulationOptions {
  interactiveChoices?: Record<string, string>; // eventId -> chosenOptionId
}

export function simulate(
  config: SpacecraftConfig,
  seed: number,
  options?: SimulationOptions
): SimulationResult {
  const rng = new SeededRNG(seed);
  const calculation = computeMission(config);
  const scenario = (scenariosList as Scenario[]).find((s) => s.id === config.scenarioId) || scenariosList[0];
  const orbit = (orbitsList as DestinationOrbit[]).find((o) => o.id === scenario.destinationOrbitId) || orbitsList[0];

  const totalMissionDays = Math.round(scenario.missionDurationYears * 365.25);
  const timeline: TimelineDataPoint[] = [];

  let currentHull = 100; // percent of maximum chassis hull
  let currentFuelKg = calculation.fuelMassKg;
  let currentScience = 0;
  let finalState: 'success' | 'partial_success' | 'failure' = 'success';
  let failureReason: string | undefined = undefined;

  // Initial failure checks from engineering calculation
  if (!calculation.isMassCompatible) {
    finalState = 'failure';
    failureReason = 'Spacecraft exceeded launcher payload mass capacity at lift-off.';
  } else if (!calculation.isDeltaVCompatible) {
    finalState = 'failure';
    failureReason = 'Insufficient propellant delta-V: spacecraft stranded in transit orbit.';
  }

  const eventsEncountered: SimulationResult['eventsEncountered'] = [];

  // Available events pool
  const candidateEvents = (eventsList as MissionEvent[]).sort(
    (a, b) => a.triggerProgressPercent - b.triggerProgressPercent
  );

  // Generate 50 timeline steps
  const totalSteps = 50;

  for (let step = 0; step <= totalSteps; step++) {
    const progressPercent = Math.round((step / totalSteps) * 100);
    const day = Math.round((progressPercent / 100) * totalMissionDays);

    // Determine mission phase
    let phase = 'Launch & Ascent';
    if (progressPercent > 12 && progressPercent <= 28) phase = 'Trans-Trajectory Burn';
    else if (progressPercent > 28 && progressPercent <= 65) phase = 'Interplanetary Cruise';
    else if (progressPercent > 65 && progressPercent <= 90) phase = 'Science Observations';
    else if (progressPercent > 90) phase = 'Extended Mission / Return';

    // Fuel consumption: burns occur mostly during early & midcourse phases
    if (step > 0 && finalState !== 'failure') {
      const burnFraction = progressPercent < 30 ? 0.025 : progressPercent < 70 ? 0.008 : 0.003;
      currentFuelKg = Math.max(0, currentFuelKg - calculation.fuelMassKg * burnFraction);
    }

    // Science accumulation (accelerates during science ops phase)
    if (finalState !== 'failure') {
      if (progressPercent >= 60) {
        const stepScience = (calculation.expectedUsableScience / 20) * (rng.rangeInt(85, 115) / 100);
        currentScience += stepScience;
      }
    }

    // Check if an event triggers around this progress percent
    const matchingEvent = candidateEvents.find(
      (e) => Math.abs(e.triggerProgressPercent - progressPercent) <= 1 &&
             !eventsEncountered.some((enc) => enc.event.id === e.id)
    );

    if (matchingEvent && finalState !== 'failure') {
      // Determine chosen option (from interactiveChoices or default smart choice)
      const chosenOptionId = options?.interactiveChoices?.[matchingEvent.id];
      let chosenOption: MissionEventOption = matchingEvent.options[0];
      if (chosenOptionId) {
        const found = matchingEvent.options.find((o) => o.id === chosenOptionId);
        if (found) chosenOption = found;
      }

      // Calculate dynamic success probability for this option
      let effectiveRisk = chosenOption.riskProbabilityPercent;

      // Adjust risk based on spacecraft specs
      if (matchingEvent.isHighStakesDistress) {
        // Base 50%
        if (config.chassisId === 'goliath') effectiveRisk -= 15;
        if (config.chassisId === 'titan-x') effectiveRisk -= 5;
        if (config.chassisId === 'aero-dart') effectiveRisk += 15;
        if (config.installedModules.includes('reinforced-hull-plating')) effectiveRisk -= 10;
        if (config.installedModules.includes('heavy-deflector-shield')) effectiveRisk -= 10;
        if (config.installedModules.includes('redundant-flight-computer')) effectiveRisk -= 10;
        if (config.selectedInstruments.includes('inst-radar')) effectiveRisk -= 5;
        effectiveRisk = Math.max(10, Math.min(85, effectiveRisk));
      } else {
        // Normal event mitigations
        if (config.installedModules.includes('redundant-flight-computer')) effectiveRisk *= 0.6;
        if (config.chassisId === 'goliath') effectiveRisk *= 0.7;
      }

      // Roll outcome deterministically with RNG
      const roll = rng.next() * 100;
      const wasSuccessful = roll >= effectiveRisk;

      let consequenceText = '';
      if (wasSuccessful) {
        consequenceText = `SUCCESS: ${chosenOption.successReward}`;
        currentScience += chosenOption.scienceBonus;
        currentFuelKg = Math.max(0, currentFuelKg + chosenOption.fuelImpactKg);
        currentHull = Math.max(0, Math.min(100, currentHull + chosenOption.hullImpact));
      } else {
        consequenceText = `PENALTY: ${chosenOption.failurePenalty}`;
        if (chosenOption.isFatalOnFailure) {
          currentHull = 0;
          finalState = 'failure';
          failureReason = `MISSION FAILED: HULL BREACHED. ${chosenOption.engineeringExplanation}`;
        } else {
          currentHull = Math.max(0, currentHull + chosenOption.hullImpact * 1.8);
          currentFuelKg = Math.max(0, currentFuelKg + chosenOption.fuelImpactKg * 1.5);
          if (currentHull <= 0) {
            finalState = 'failure';
            failureReason = `Spacecraft structural failure during ${matchingEvent.title}.`;
          }
        }
      }

      eventsEncountered.push({
        event: matchingEvent,
        chosenOption,
        wasSuccessful,
        atDay: day,
        consequenceText,
      });
    }

    // Check hull health depletion
    if (currentHull <= 0 && finalState !== 'failure') {
      finalState = 'failure';
      failureReason = 'Hull structural integrity reached 0%. Spacecraft was destroyed.';
    }

    // Power reserve percentage
    const powerReservePercent =
      calculation.netPowerMarginW >= 0 ? 100 : Math.max(5, 100 - (day / (calculation.batteryReserveHours / 24)) * 100);

    // Comm quality percentage
    let commQualityPercent = calculation.dataDownlinkEfficiencyPercent;
    if (progressPercent > 50 && orbit.commDistanceAu > 2.0) {
      commQualityPercent = Math.max(20, commQualityPercent - (progressPercent - 50) * 0.4);
    }

    timeline.push({
      timeDays: day,
      progressPercent,
      hullHealth: Math.max(0, Math.round(currentHull)),
      fuelKg: Math.round(currentFuelKg),
      powerReservePercent: Math.max(0, Math.round(powerReservePercent)),
      scienceCollected: Math.round(currentScience),
      commQualityPercent: Math.round(commQualityPercent),
      phase,
    });

    if (finalState === 'failure' && currentHull <= 0) {
      break;
    }
  }

  // Determine final state if not already set to failure
  const totalScienceCollected = Math.round(currentScience);
  const totalScienceDownlinked = Math.round(
    totalScienceCollected * (calculation.dataDownlinkEfficiencyPercent / 100)
  );

  if (finalState !== 'failure') {
    if (totalScienceDownlinked >= scenario.minScienceGoal && currentHull >= 30) {
      finalState = 'success';
    } else if (totalScienceDownlinked >= scenario.minScienceGoal * 0.5) {
      finalState = 'partial_success';
    } else {
      finalState = 'partial_success';
    }
  }

  return {
    seed,
    scenarioId: config.scenarioId,
    config,
    calculation,
    timeline,
    eventsEncountered,
    finalState,
    failureReason,
    finalHullPercent: Math.max(0, Math.round(currentHull)),
    finalFuelKg: Math.round(currentFuelKg),
    totalScienceCollected,
    totalScienceDownlinked,
    missionDurationDays: totalMissionDays,
  };
}
