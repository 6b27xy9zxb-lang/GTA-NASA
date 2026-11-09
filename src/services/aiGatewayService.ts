/**
 * GTA NASA AI Mission Architect Service (AI Gateway Integration)
 * Evaluates player custom mission descriptions, goals, and spacecraft designs,
 * generating personalized design trade-offs and launch recommendations.
 *
 * Connects to AI Gateway endpoint when configured, with an intelligent
 * simulation-engine backed fallback that operates offline.
 */

import { SpacecraftConfig, MissionCalculation, Scenario } from '../types/game';
import chassisList from '../data/chassis.json';
import launchersList from '../data/launchers.json';
import modulesList from '../data/modules.json';

export interface AIAdvisorResponse {
  source: 'ai_gateway' | 'neural_engine_fallback';
  headline: string;
  strategicSummary: string;
  designTradeOffs: {
    aspect: string;
    pro: string;
    con: string;
  }[];
  launcherRecommendation: {
    recommendedLauncher: string;
    reasoning: string;
  };
  subsystemModifications: string[];
  physicsExplanation: string;
}

export async function consultAiMissionArchitect(
  userGoalDescription: string,
  scenario: Scenario,
  config: SpacecraftConfig,
  calc: MissionCalculation
): Promise<AIAdvisorResponse> {
  const gatewayUrl = (import.meta as any).env?.VITE_AI_GATEWAY_URL;
  const gatewayKey = (import.meta as any).env?.VITE_AI_GATEWAY_KEY;

  // If AI Gateway is configured, attempt remote model call
  if (gatewayUrl) {
    try {
      const prompt = `You are the Lead NASA Flight Dynamics & Spacecraft Systems Architect for project GTA NASA.
Evaluate this user's mission description and current spacecraft design:
Target Destination: ${scenario.destination} (${scenario.title})
Budget Limit: $${scenario.budgetLimitMillion}M | Mass Limit: ${scenario.massLimitKg} kg
User Stated Goal: "${userGoalDescription}"
Current Spacecraft Wet Mass: ${calc.totalMassKg} kg | Power Margin: ${calc.netPowerMarginW} W | Delta-V: ${calc.deltaVAvailableKmS} km/s (Req: ${calc.deltaVRequiredKmS} km/s) | Downlink: ${calc.dataDownlinkEfficiencyPercent}%
Chassis: ${config.chassisId} | Launcher: ${config.launchVehicleId}

Respond strictly in valid JSON format with:
{
  "headline": string,
  "strategicSummary": string,
  "designTradeOffs": [{"aspect": string, "pro": string, "con": string}],
  "launcherRecommendation": {"recommendedLauncher": string, "reasoning": string},
  "subsystemModifications": [string],
  "physicsExplanation": string
}`;

      const res = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(gatewayKey ? { Authorization: `Bearer ${gatewayKey}` } : {}),
        },
        body: JSON.stringify({
          model: 'gemini-1.5-flash',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const contentStr = data.choices?.[0]?.message?.content || data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (contentStr) {
          const parsed = JSON.parse(contentStr.replace(/```json|```/g, '').trim());
          return {
            source: 'ai_gateway',
            headline: parsed.headline,
            strategicSummary: parsed.strategicSummary,
            designTradeOffs: parsed.designTradeOffs || [],
            launcherRecommendation: parsed.launcherRecommendation,
            subsystemModifications: parsed.subsystemModifications || [],
            physicsExplanation: parsed.physicsExplanation,
          };
        }
      }
    } catch (_) {
      // Fallback to intelligent local simulation advisor
    }
  }

  // Intelligent local simulation engine backed fallback
  return generateIntelligentFallback(userGoalDescription, scenario, config, calc);
}

function generateIntelligentFallback(
  goal: string,
  scenario: Scenario,
  config: SpacecraftConfig,
  calc: MissionCalculation
): AIAdvisorResponse {
  const goalLower = goal.toLowerCase();
  const chassis = chassisList.find((c) => c.id === config.chassisId) || chassisList[0];

  const wantsFast = goalLower.includes('fast') || goalLower.includes('speed') || goalLower.includes('quick');
  const wantsBudget = goalLower.includes('budget') || goalLower.includes('cheap') || goalLower.includes('cost') || goalLower.includes('frugal');
  const wantsScience = goalLower.includes('science') || goalLower.includes('data') || goalLower.includes('sample') || goalLower.includes('radar') || goalLower.includes('plume');
  const isEuropa = scenario.destinationOrbitId === 'orbit-europa' || goalLower.includes('europa') || goalLower.includes('jupiter');

  const tradeOffs: AIAdvisorResponse['designTradeOffs'] = [];
  const modifications: string[] = [];

  // Evaluate Chassis trade-off
  if (wantsFast && config.chassisId !== 'aero-dart') {
    tradeOffs.push({
      aspect: 'Spaceframe Inertia & Delta-V',
      pro: 'Switching to Aero-Dart yields a +15% thruster Isp bonus and reduces dry mass by ~400 kg.',
      con: 'Aero-Dart has strictly 3 upgrade hardpoints and 75 HP hull fragility.',
    });
    modifications.push('Consider selecting the Aero-Dart chassis for ultra-fast transit burns.');
  } else if (isEuropa && config.chassisId !== 'goliath') {
    tradeOffs.push({
      aspect: 'Jovian Radiation Hardening',
      pro: 'Goliath provides 35% passive radiation attenuation and high hull armor against trapped relativistic electrons.',
      con: 'Goliath adds heavy dry mass (1,600 kg) and attenuates antenna RF gain, requiring dedicated high-gain dishes.',
    });
    modifications.push('Equip Goliath or Polyethylene-Tantalum Armor to survive Jupiter’s extreme magnetosphere.');
  } else {
    tradeOffs.push({
      aspect: 'Balanced Explorer Architecture',
      pro: `${chassis.name} delivers solid baseline performance across electrical and payload metrics.`,
      con: 'Demands active subsystem prioritization to meet tight mission parameters.',
    });
  }

  // Evaluate Power trade-off
  if (isEuropa) {
    if (!config.installedModules.includes('rtg-power-unit') && config.coreComponents.powerSource !== 'power-rtg-base') {
      tradeOffs.push({
        aspect: 'Distance-Independent Nuclear Power',
        pro: 'MMRTG delivers constant 180W-250W baseload unaffected by 5.2 AU distance or Jovian shadow.',
        con: 'Adds $48M licensing cost and 75 kg package mass to the payload budget.',
      });
      modifications.push('Replace solar arrays with an MMRTG Nuclear Power Unit for reliable 5.2 AU wattage.');
    }
  }

  // Evaluate Science & Downlink trade-off
  if (wantsScience || config.selectedInstruments.length > 2) {
    if (calc.lostDataPercent > 5) {
      tradeOffs.push({
        aspect: 'Downlink Throughput vs. Instrument Generation',
        pro: 'Ka-Band Gimbaled Reflector prevents onboard solid-state storage overflow and data dumping.',
        con: 'Transmitter RF amplifiers draw an additional 70W-85W of continuous electrical grid power.',
      });
      modifications.push('Upgrade to Ka-Band High-Gain Antenna or equip X-Band High-Gain module to eliminate science bottlenecks.');
    }
  }

  // Launcher recommendation
  let recLauncher = 'Vulcan-Centaur Standard';
  let launcherReason = 'Provides optimal payload margin without triggering budget overrun.';
  if (calc.totalMassKg > 2000 || isEuropa) {
    recLauncher = 'Hyperion Heavy Three-Core';
    launcherReason = 'Delivers sufficient C3 injection energy for deep-space planetary capture.';
  } else if (wantsBudget && calc.totalMassKg <= 1600) {
    recLauncher = 'Falcon-Lite Mini';
    launcherReason = 'Minimizes mission launch expenditures to preserve funds for science instrumentation.';
  }

  return {
    source: 'neural_engine_fallback',
    headline: `AI Mission Architect: Tailored Assessment for "${goal.slice(0, 40)}${goal.length > 40 ? '...' : ''}"`,
    strategicSummary: `Based on your stated mission objective, your spacecraft design exhibits ${
      calc.isValidForLaunch ? 'viable flight parameters' : 'critical engineering bottlenecks'
    }. At ${scenario.destination}, the governing trade-off lies between ${
      isEuropa ? 'radiation protection, mass margins, and nuclear power' : 'delta-V velocity, electrical generation, and science return'
    }.`,
    designTradeOffs: tradeOffs,
    launcherRecommendation: {
      recommendedLauncher: recLauncher,
      reasoning: launcherReason,
    },
    subsystemModifications: modifications,
    physicsExplanation: `Orbital mechanics dictates that every 100 kg of added payload exponentially increases required propellant via the rocket equation Δv = Isp · g₀ · ln(m₀ / mf). Balancing dry mass against power generation is essential for high composite mission ratings.`,
  };
}
