import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Weight,
  Zap,
  Radio,
  Fuel,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { sound } from '../../services/soundEffects';

export const TutorialScreen: React.FC = () => {
  const { tutorialStep, nextTutorialStep, prevTutorialStep, setScreen } = useGameStore();

  const lessons = [
    {
      title: 'Module 1: Spacecraft Mass & Launcher Payload Limits',
      icon: Weight,
      color: 'text-cyan-400',
      concept: 'Dry Mass vs. Wet Mass',
      summary:
        'A spacecraft’s mass consists of Dry Mass (chassis, electronics, instruments, solar panels) plus Propellant Mass. Every launch vehicle has a hard ceiling on payload weight to each destination orbit.',
      takeaway:
        'If your spacecraft wet mass exceeds the rocket’s capacity, your spacecraft cannot reach escape velocity and the mission cannot launch.',
      physicsFormula: 'm₀ = m_dry + m_fuel',
    },
    {
      title: 'Module 2: Electrical Power Budget & The Inverse-Square Law',
      icon: Zap,
      color: 'text-amber-400',
      concept: 'Solar Flux Degradation (1/r²)',
      summary:
        'Solar arrays produce clean power at Earth orbit (1 AU), but sunlight drops off dramatically with distance. At Mars (1.52 AU), solar energy is only 43%. At Jupiter/Europa (5.2 AU), solar energy is a mere 3.7% of Earth levels!',
      takeaway:
        'For distant outer solar system destinations like Europa, solar arrays must become enormous, or you must switch to Radioisotope Thermoelectric Generators (RTGs) which produce constant nuclear decay heat independent of solar distance.',
      physicsFormula: 'Flux = P₀ / (4π r²)',
    },
    {
      title: 'Module 3: Communication Downlink vs. Data Generation',
      icon: Radio,
      color: 'text-blue-400',
      concept: 'Telemetry Buffers & Contact Windows',
      summary:
        'Scientific instruments collect data continuously or in bursts. If your sensors generate 10 GB/day but your antenna can only downlink 4 GB/day during ground contact windows, your onboard solid-state storage will overflow.',
      takeaway:
        'Excess untransmitted scientific data is lost forever. Always pair high-resolution cameras and radar with Ka-band high-gain reflectors or optimize sensor duty cycles.',
      physicsFormula: 'Data_Throughput = Bitrate × Contact_Time',
    },
    {
      title: 'Module 4: Delta-V & The Tsiolkovsky Rocket Equation',
      icon: Fuel,
      color: 'text-orange-400',
      concept: 'Specific Impulse (Isp) & Velocity Margin',
      summary:
        'Delta-V is the change in velocity required to alter spacecraft orbits and capture into destination orbits. Chemical engines provide high thrust but moderate fuel efficiency (Isp ~320s). Ion engines provide astronomical efficiency (Isp ~4000s) at very low continuous thrust.',
      takeaway:
        'A higher engine Isp extracts significantly more velocity change from every kilogram of propellant. Maintain at least a 10% positive delta-V margin for trajectory corrections.',
      physicsFormula: 'Δv = Isp × g₀ × ln(m₀ / m_f)',
    },
    {
      title: 'Module 5: Ionizing Radiation & Mission Lifetime',
      icon: ShieldAlert,
      color: 'text-purple-400',
      concept: 'Trapped Electron Belts & Rad-Hardening',
      summary:
        'Near Jupiter and deep space cosmic ray paths, high-energy particle radiation bombards spacecraft electronics, degrading solar panels and causing memory bit-flips and processor latch-ups.',
      takeaway:
        'Tungsten, tantalum, and polyethylene shielding absorb radiation dose, extending spacecraft operational lifetime from months to years.',
      physicsFormula: 'Effective_Dose = Ambient_Dose × (1 - Shielding_Factor)',
    },
  ];

  const currentLesson = lessons[tutorialStep];
  const Icon = currentLesson.icon;

  const handleNext = () => {
    sound.playUiClick();
    if (tutorialStep >= lessons.length - 1) {
      setScreen('hangar');
    } else {
      nextTutorialStep();
    }
  };

  const handlePrev = () => {
    sound.playUiClick();
    prevTutorialStep();
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 p-4 md:p-8 flex flex-col justify-between select-none">
      {/* Header */}
      <div className="max-w-4xl mx-auto w-full border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <button
            onClick={() => {
              sound.playUiClick();
              setScreen('landing');
            }}
            className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 mb-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> [ EXIT ACADEMY ]
          </button>
          <h2 className="text-2xl md:text-3xl font-black text-white">
            GTA NASA FLIGHT ACADEMY
          </h2>
          <span className="text-xs font-mono text-slate-400">
            5-PART SPACECRAFT ENGINEERING MASTERCLASS
          </span>
        </div>

        {/* Step Counter */}
        <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-cyan-400">
          LESSON {tutorialStep + 1} / {lessons.length}
        </span>
      </div>

      {/* Center Interactive Lesson Card */}
      <main className="max-w-4xl mx-auto w-full my-6 flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={tutorialStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-6 md:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <Icon className={`w-8 h-8 ${currentLesson.color}`} />
              </div>
              <div>
                <span className="font-mono text-xs text-slate-400 uppercase tracking-widest font-bold block">
                  {currentLesson.concept}
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-white">
                  {currentLesson.title}
                </h3>
              </div>
            </div>

            <p className="text-sm md:text-base text-slate-300 leading-relaxed font-sans">
              {currentLesson.summary}
            </p>

            {/* Formula Pill */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs flex items-center justify-between">
              <span className="text-slate-400">Governing Educational Formula:</span>
              <span className="text-cyan-300 font-bold bg-cyan-950/50 px-3 py-1 rounded border border-cyan-500/30">
                {currentLesson.physicsFormula}
              </span>
            </div>

            {/* Core Takeaway Box */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs md:text-sm text-emerald-200 font-sans leading-relaxed flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-300 block mb-0.5 font-mono text-xs uppercase font-bold">
                  Commander's Rule of Thumb:
                </strong>
                {currentLesson.takeaway}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation Footer */}
      <footer className="max-w-4xl mx-auto w-full border-t border-slate-800 pt-4 flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={tutorialStep === 0}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
        >
          Previous Lesson
        </button>

        {/* Progress Dots */}
        <div className="flex items-center gap-2">
          {lessons.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === tutorialStep ? 'bg-cyan-400 w-6' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg"
        >
          <span>{tutorialStep === lessons.length - 1 ? 'Complete & Build Spacecraft' : 'Next Lesson'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
};
