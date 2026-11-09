import { describe, it, expect } from 'vitest';
import { computeMission } from '../computeMission';
import { simulate } from '../simulate';
import { scoreMission } from '../scoreMission';
import { SeededRNG } from '../random';
import type { SpacecraftConfig } from '../../types/game';

describe('GTA NASA Pure Simulation Engine', () => {
  const baseConfig: SpacecraftConfig = {
    scenarioId: 'scenario-earth',
    chassisId: 'nova-core',
    installedModules: [],
    coreComponents: {
      bus: 'bus-medium',
      solar: 'solar-medium',
      battery: 'battery-standard',
      antenna: 'antenna-s-band',
      computer: 'computer-basic',
      acs: 'acs-reaction-wheels',
      shielding: 'shielding-standard',
      fuelTank: 'fuel-tank-std',
      propulsion: 'propulsion-chemical',
    },
    selectedInstruments: ['inst-wide-camera'],
    fuelLoadKg: 450,
    launchVehicleId: 'launcher-pegasus',
  };

  it('calculates mass correctly including chassis, components, instruments, and propellant', () => {
    const calc = computeMission(baseConfig);
    expect(calc.dryMassKg).toBeGreaterThan(700);
    expect(calc.fuelMassKg).toBe(450);
    expect(calc.totalMassKg).toBe(calc.dryMassKg + calc.fuelMassKg);
    expect(calc.isMassCompatible).toBe(true);
  });

  it('enforces launch vehicle payload capacity validation', () => {
    const overweightConfig: SpacecraftConfig = {
      ...baseConfig,
      fuelLoadKg: 1500,
    };
    const calc = computeMission(overweightConfig);
    expect(calc.isMassCompatible).toBe(false);
    expect(calc.checks.some((c) => c.id === 'launcher-overweight')).toBe(true);
    expect(calc.isValidForLaunch).toBe(false);
  });

  it('calculates solar power drop-off with distance (inverse-square law)', () => {
    const earthCalc = computeMission({ ...baseConfig, scenarioId: 'scenario-earth' });
    const marsCalc = computeMission({ ...baseConfig, scenarioId: 'scenario-mars' });
    const europaCalc = computeMission({ ...baseConfig, scenarioId: 'scenario-europa' });

    expect(earthCalc.availablePowerW).toBeGreaterThan(marsCalc.availablePowerW);
    expect(marsCalc.availablePowerW).toBeGreaterThan(europaCalc.availablePowerW);
    expect(europaCalc.availablePowerW).toBeLessThan(100);
  });

  it('demonstrates RTG distance-independent power generation', () => {
    const europaRtgConfig: SpacecraftConfig = {
      ...baseConfig,
      scenarioId: 'scenario-europa',
      coreComponents: {
        ...baseConfig.coreComponents,
        powerSource: 'power-rtg-base',
      },
    };
    const calc = computeMission(europaRtgConfig);
    expect(calc.availablePowerW).toBeGreaterThanOrEqual(250);
  });

  it('calculates data generation vs downlink capacity and detects bottlenecks', () => {
    const highDataConfig: SpacecraftConfig = {
      ...baseConfig,
      selectedInstruments: ['inst-highres-camera'],
      coreComponents: {
        ...baseConfig.coreComponents,
        antenna: 'antenna-s-band',
      },
    };
    const calc = computeMission(highDataConfig);
    expect(calc.totalDataGeneratedGbDay).toBeGreaterThan(calc.downlinkCapacityGbDay);
    expect(calc.lostDataPercent).toBeGreaterThan(0);
    expect(calc.checks.some((c) => c.id === 'data-downlink-bottleneck')).toBe(true);
  });

  it('computes delta-V using the rocket equation and validates required orbital burn', () => {
    const calc = computeMission(baseConfig);
    expect(calc.deltaVAvailableKmS).toBeGreaterThan(0);
    expect(calc.deltaVRequiredKmS).toBeGreaterThan(0);
  });

  it('enforces hardpoint slot limit strictly per chassis (Aero-Dart has 3, Titan-X has 5)', () => {
    const dartExceededConfig: SpacecraftConfig = {
      ...baseConfig,
      chassisId: 'aero-dart',
      installedModules: [
        'heavy-deflector-shield',
        'extra-fuel-tank',
        'high-gain-antenna',
        'radiation-shielding',
      ],
    };
    const dartCalc = computeMission(dartExceededConfig);
    expect(dartCalc.checks.some((c) => c.id === 'hardpoint-exceeded')).toBe(true);
    expect(dartCalc.isValidForLaunch).toBe(false);

    const titanConfig: SpacecraftConfig = {
      ...baseConfig,
      chassisId: 'titan-x',
      installedModules: [
        'heavy-deflector-shield',
        'extra-fuel-tank',
        'high-gain-antenna',
        'radiation-shielding',
        'redundant-flight-computer',
      ],
    };
    const titanCalc = computeMission(titanConfig);
    expect(titanCalc.checks.some((c) => c.id === 'hardpoint-exceeded')).toBe(false);
  });

  it('guarantees seeded simulation reproducibility across identical configurations and seeds', () => {
    const seed = 424242;
    const sim1 = simulate(baseConfig, seed);
    const sim2 = simulate(baseConfig, seed);

    expect(sim1.finalState).toBe(sim2.finalState);
    expect(sim1.finalHullPercent).toBe(sim2.finalHullPercent);
    expect(sim1.finalFuelKg).toBe(sim2.finalFuelKg);
    expect(sim1.totalScienceDownlinked).toBe(sim2.totalScienceDownlinked);
    expect(sim1.timeline.length).toBe(sim2.timeline.length);
    expect(sim1.timeline[15].hullHealth).toBe(sim2.timeline[15].hullHealth);
  });

  it('triggers catastrophic hull failure if high-stakes distress beacon investigation fails', () => {
    const result = simulate(baseConfig, 12345, {
      interactiveChoices: {
        'event-distress-beacon': 'opt-distress-investigate',
      },
    });

    const distressRecord = result.eventsEncountered.find(
      (e) => e.event.id === 'event-distress-beacon'
    );
    expect(distressRecord).toBeDefined();

    if (distressRecord && !distressRecord.wasSuccessful) {
      expect(result.finalHullPercent).toBe(0);
      expect(result.finalState).toBe('failure');
      expect(result.failureReason).toContain('HULL BREACHED');
    }
  });

  it('computes composite mission score with science, engineering, budget, and survival breakdown', () => {
    const sim = simulate(baseConfig, 88888);
    const score = scoreMission(sim);

    expect(score.overallScore).toBeGreaterThanOrEqual(0);
    expect(score.overallScore).toBeLessThanOrEqual(1000);
    expect(score.scienceScore).toBeGreaterThanOrEqual(0);
    expect(score.engineeringEfficiency).toBeGreaterThanOrEqual(0);
    expect(score.budgetEfficiency).toBeGreaterThanOrEqual(0);
    expect(score.survivalScore).toBeGreaterThanOrEqual(0);
    expect(score.causeAndEffectExplanations.length).toBeGreaterThan(0);
  });
});
