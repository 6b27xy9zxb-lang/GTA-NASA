/**
 * Standalone Engine Verification Test Runner
 * Executes all 10 core simulation engine tests using Node.js
 */

import { computeMission } from './src/engine/computeMission.ts';
import { simulate } from './src/engine/simulate.ts';
import { scoreMission } from './src/engine/scoreMission.ts';
import { SeededRNG } from './src/engine/random.ts';

const baseConfig = {
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

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    passed++;
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('--- STARTING GTA NASA SIMULATION ENGINE TESTS ---\n');

// 1. Mass calculation
const calc1 = computeMission(baseConfig);
assert(calc1.dryMassKg > 700, 'Calculates dry mass correctly');
assert(calc1.totalMassKg === calc1.dryMassKg + 450, 'Total mass equals dry mass + propellant mass');
assert(calc1.isMassCompatible === true, 'Valid mass is within launcher capacity');

// 2. Launcher capacity validation
const overweightConfig = { ...baseConfig, fuelLoadKg: 1500 };
const calc2 = computeMission(overweightConfig);
assert(calc2.isMassCompatible === false, 'Overweight spacecraft correctly rejected by launcher validation');
assert(calc2.checks.some((c) => c.id === 'launcher-overweight'), 'Launcher overweight error check generated');

// 3. Solar flux inverse-square law
const earthCalc = computeMission({ ...baseConfig, scenarioId: 'scenario-earth' });
const marsCalc = computeMission({ ...baseConfig, scenarioId: 'scenario-mars' });
const europaCalc = computeMission({ ...baseConfig, scenarioId: 'scenario-europa' });
assert(earthCalc.availablePowerW > marsCalc.availablePowerW, 'Earth solar power > Mars solar power');
assert(marsCalc.availablePowerW > europaCalc.availablePowerW, 'Mars solar power > Europa solar power');
assert(europaCalc.availablePowerW < 100, 'Europa solar power severely attenuated at 5.2 AU');

// 4. RTG distance-independent power
const rtgConfig = {
  ...baseConfig,
  scenarioId: 'scenario-europa',
  coreComponents: { ...baseConfig.coreComponents, powerSource: 'power-rtg-base' },
};
const rtgCalc = computeMission(rtgConfig);
assert(rtgCalc.availablePowerW >= 250, 'RTG produces steady >=250W at 5.2 AU unaffected by distance');

// 5. Data downlink vs generation bottleneck
const highDataConfig = {
  ...baseConfig,
  selectedInstruments: ['inst-highres-camera'],
  coreComponents: { ...baseConfig.coreComponents, antenna: 'antenna-s-band' },
};
const dataCalc = computeMission(highDataConfig);
assert(dataCalc.lostDataPercent > 0, 'Detects telemetry bottleneck when generation > downlink capacity');
assert(dataCalc.checks.some((c) => c.id === 'data-downlink-bottleneck'), 'Downlink bottleneck check generated');

// 6. Delta-V rocket equation
assert(calc1.deltaVAvailableKmS > 0, 'Rocket equation computes positive delta-V margin');
assert(calc1.deltaVRequiredKmS > 0, 'Mission scenario defines required orbital insertion delta-V');

// 7. Hardpoint slots limit enforcement
const dartExceededConfig = {
  ...baseConfig,
  chassisId: 'aero-dart',
  installedModules: ['heavy-deflector-shield', 'extra-fuel-tank', 'high-gain-antenna', 'radiation-shielding'],
};
const dartCalc = computeMission(dartExceededConfig);
assert(dartCalc.checks.some((c) => c.id === 'hardpoint-exceeded'), 'Aero-Dart strictly prevents exceeding 3 hardpoints');

const titanConfig = {
  ...baseConfig,
  chassisId: 'titan-x',
  installedModules: ['heavy-deflector-shield', 'extra-fuel-tank', 'high-gain-antenna', 'radiation-shielding', 'redundant-flight-computer'],
};
const titanCalc = computeMission(titanConfig);
assert(!titanCalc.checks.some((c) => c.id === 'hardpoint-exceeded'), 'Titan-X successfully accommodates 5 hardpoint modules');

// 8. Seeded reproducibility
const simA = simulate(baseConfig, 999999);
const simB = simulate(baseConfig, 999999);
assert(simA.finalState === simB.finalState, 'Identical seed produces identical final mission state');
assert(simA.finalHullPercent === simB.finalHullPercent, 'Identical seed produces identical hull health');
assert(simA.finalFuelKg === simB.finalFuelKg, 'Identical seed produces identical remaining fuel');
assert(simA.totalScienceDownlinked === simB.totalScienceDownlinked, 'Identical seed produces identical science yield');

// 9. Distress Beacon fatal hull breach outcome
const distressSim = simulate(baseConfig, 12345, {
  interactiveChoices: { 'event-distress-beacon': 'opt-distress-investigate' },
});
const distressRecord = distressSim.eventsEncountered.find((e) => e.event.id === 'event-distress-beacon');
assert(distressRecord !== undefined, 'Distress beacon event triggers in deep space phase');
if (!distressRecord.wasSuccessful) {
  assert(distressSim.finalHullPercent === 0, 'Failed distress investigation drops hull to 0%');
  assert(distressSim.finalState === 'failure', 'Failed distress investigation ends mission with failure');
}

// 10. Composite scoring
const score = scoreMission(simA);
assert(score.overallScore >= 0 && score.overallScore <= 1000, 'Composite score is within [0, 1000]');
assert(score.causeAndEffectExplanations.length > 0, 'Generates causal "Why Did This Happen?" explanations');

console.log(`\n🎉 ALL ${passed}/${total} GTA NASA SIMULATION ENGINE TESTS PASSED!`);
