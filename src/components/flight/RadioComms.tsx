import React, { useState, useRef, useEffect } from 'react';
import { Send, Radio, User, Terminal } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { sound } from '../../services/soundEffects';

export const RadioComms: React.FC = () => {
  const { flightLogs, addChatMessage, userRole } = useGameStore();
  const [inputText, setInputText] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [flightLogs]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sound.playUiClick();
    addChatMessage({
      senderName: 'Commander (You)',
      role: userRole,
      text: inputText.trim(),
    });

    setInputText('');

    // Simulated responsive reply after 1.2s in local demo mode
    setTimeout(() => {
      const responses = [
        'Roger that, Commander. Telemetry packets verified on secondary carrier.',
        'Copy. Subsystem parameters updated in active buffer.',
        'Acknowledged. Science sensors confirm recalibration complete.',
        'Standing by on attitude control thrusters. Margins holding.',
      ];
      const reply = responses[Math.floor(Math.random() * responses.length)];
      addChatMessage({
        senderName: 'Flight Director',
        role: 'FLIGHT_DIRECTOR',
        text: reply,
      });
    }, 1200);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'FLIGHT_DIRECTOR':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40';
      case 'SYSTEM':
        return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
      case 'science':
        return 'text-purple-400 bg-purple-950/60 border-purple-500/40';
      case 'engineer':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';
      default:
        return 'text-slate-300 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800/90 p-4 space-y-3 backdrop-blur-md shadow-xl flex flex-col justify-between h-[280px] select-none">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h4 className="font-mono text-xs uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          Mission Voice & Telemetry Radio
        </h4>
        <span className="text-[10px] font-mono text-slate-400">DSN GOLDSTONE // 8.4 GHz</span>
      </div>

      {/* Message History */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs"
      >
        {flightLogs.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded-lg border leading-snug ${
              msg.isUrgent
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                : 'bg-slate-950/70 border-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className={`px-1.5 py-0.2 rounded font-bold uppercase border ${getRoleBadge(msg.role)}`}>
                {msg.senderName}
              </span>
              <span className="text-slate-500">{msg.timestamp}</span>
            </div>
            <p className="text-[11px] leading-tight">{msg.text}</p>
          </div>
        ))}
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSend} className="flex items-center gap-2 pt-2 border-t border-slate-800">
        <input
          type="text"
          placeholder="Transmit order to mission team..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          className="p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors"
          title="Send Transmission"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
