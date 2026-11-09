import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Shield,
  Zap,
  Radio,
  Fuel,
  Cpu,
  ChevronLeft,
  CheckCircle2,
  DollarSign,
  Send,
  Sparkles,
  Play,
  Copy,
  LogIn,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { sound } from '../../services/soundEffects';
import { multiplayerSync, RoomState, SyncEvent } from '../../services/multiplayerSync';
import { PlayerRole, RoomPlayer, ChatMessage } from '../../types/game';

export const MultiplayerScreen: React.FC = () => {
  const {
    roomCode,
    userRole,
    config,
    calculation,
    setRole,
    setScreen,
    startMission,
  } = useGameStore();

  const [activeRoom, setActiveRoom] = useState<RoomState | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [playerName, setPlayerName] = useState(
    'Commander ' + Math.floor(Math.random() * 900 + 100)
  );
  const [chatInput, setChatInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [joinError, setJoinError] = useState('');

  // If a room code already exists in store, ensure connected
  useEffect(() => {
    if (roomCode && !activeRoom) {
      const stored = localStorage.getItem(`gta_nasa_room_${roomCode}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setActiveRoom(parsed);
          multiplayerSync.connectToRoom(roomCode);
        } catch (_) {}
      }
    }
  }, [roomCode, activeRoom]);

  // Subscribe to real-time BroadcastChannel events across browser tabs
  useEffect(() => {
    const unsubscribe = multiplayerSync.subscribe((event: SyncEvent) => {
      sound.playUiClick();

      if (event.type === 'PLAYER_JOINED') {
        setActiveRoom((prev) => {
          if (!prev) return prev;
          if (prev.players.some((p) => p.id === event.player.id)) return prev;
          return {
            ...prev,
            players: [...prev.players, event.player],
            logs: [
              ...prev.logs,
              {
                id: `log-${Date.now()}`,
                senderName: 'MISSION CONTROL',
                role: 'SYSTEM',
                text: `${event.player.name} connected to the flight deck.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              },
            ],
          };
        });
      } else if (event.type === 'ROLE_CHANGED') {
        setActiveRoom((prev) => {
          if (!prev) return prev;
          const updatedPlayers = prev.players.map((p) =>
            p.id === event.playerId ? { ...p, role: event.newRole } : p
          );
          return { ...prev, players: updatedPlayers };
        });
      } else if (event.type === 'CHAT_MESSAGE') {
        setActiveRoom((prev) => {
          if (!prev) return prev;
          return { ...prev, logs: [...prev.logs, event.message] };
        });
      } else if (event.type === 'BUDGET_REQUESTED') {
        setActiveRoom((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pendingBudgetVote: {
              amount: event.amount,
              requester: event.requester,
              requesterId: event.requesterId,
              yesVotes: [event.requesterId],
              noVotes: [],
            },
          };
        });
      } else if (event.type === 'BUDGET_VOTED') {
        setActiveRoom((prev) => {
          if (!prev || !prev.pendingBudgetVote) return prev;
          const vote = prev.pendingBudgetVote;
          const yesVotes = event.voteYes
            ? Array.from(new Set([...vote.yesVotes, event.playerId]))
            : vote.yesVotes.filter((id) => id !== event.playerId);
          const noVotes = !event.voteYes
            ? Array.from(new Set([...vote.noVotes, event.playerId]))
            : vote.noVotes.filter((id) => id !== event.playerId);

          return {
            ...prev,
            pendingBudgetVote: {
              ...vote,
              yesVotes,
              noVotes,
            },
          };
        });
      } else if (event.type === 'MISSION_LAUNCHED') {
        sound.playLaunchIgnition();
        startMission();
      }
    });

    return () => unsubscribe();
  }, [startMission]);

  const roles: { role: PlayerRole; title: string; desc: string; icon: any }[] = [
    {
      role: 'director',
      title: 'Mission Director',
      desc: 'Authorizes flight launch, resolves high-stakes crisis decisions, approves budget proposals.',
      icon: Shield,
    },
    {
      role: 'engineer',
      title: 'Spacecraft Systems Lead',
      desc: 'Configures bus structural hardpoints, power generation, and thermal/radiation armor.',
      icon: Cpu,
    },
    {
      role: 'science',
      title: 'Lead Science Officer',
      desc: 'Selects science instrument payload and balances observation duty cycles.',
      icon: Sparkles,
    },
    {
      role: 'resource',
      title: 'Resource & Propulsion Manager',
      desc: 'Calculates delta-V burns, manages fuel load, monitors power and budget margins.',
      icon: Fuel,
    },
  ];

  const handleCreateRoom = () => {
    sound.playEquipSound();
    const newRoom = multiplayerSync.createRoom(config.scenarioId, config, playerName);
    useGameStore.setState({ roomCode: newRoom.code, userRole: 'director' });
    setActiveRoom(newRoom);
    setJoinError('');
  };

  const handleJoinRoom = () => {
    if (!inputCode.trim()) return;
    setJoinError('');
    sound.playUiClick();

    const joinedRoom = multiplayerSync.joinRoom(inputCode, playerName);
    if (joinedRoom) {
      sound.playEquipSound();
      useGameStore.setState({ roomCode: joinedRoom.code });
      setActiveRoom(joinedRoom);
      // Determine local player's role in room
      const me = joinedRoom.players.find((p) => p.id === multiplayerSync.getPlayerId());
      if (me) {
        setRole(me.role);
      }
    } else {
      sound.playAlarm();
      setJoinError(`Room "${inputCode.toUpperCase()}" not found. Ensure the code was created in another tab or create a new room.`);
    }
  };

  const handleRoleSelect = (r: PlayerRole) => {
    sound.playEquipSound();
    setRole(r);
    if (activeRoom) {
      const pid = multiplayerSync.getPlayerId();
      multiplayerSync.broadcast({
        type: 'ROLE_CHANGED',
        playerId: pid,
        newRole: r,
      });
      setActiveRoom((prev) => {
        if (!prev) return prev;
        const updated = prev.players.map((p) => (p.id === pid ? { ...p, role: r } : p));
        return { ...prev, players: updated };
      });
    }
  };

  const handleCopyCode = () => {
    if (activeRoom) {
      sound.playUiClick();
      navigator.clipboard.writeText(activeRoom.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeRoom) return;
    sound.playUiClick();

    const newMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      senderName: playerName,
      role: userRole,
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    multiplayerSync.broadcast({
      type: 'CHAT_MESSAGE',
      message: newMsg,
    });

    setActiveRoom((prev) => {
      if (!prev) return prev;
      return { ...prev, logs: [...prev.logs, newMsg] };
    });

    setChatInput('');
  };

  const handleRequestBudget = () => {
    if (!activeRoom) return;
    sound.playUiClick();
    const pid = multiplayerSync.getPlayerId();
    multiplayerSync.broadcast({
      type: 'BUDGET_REQUESTED',
      amount: 25,
      requester: playerName,
      requesterId: pid,
    });

    setActiveRoom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pendingBudgetVote: {
          amount: 25,
          requester: playerName,
          requesterId: pid,
          yesVotes: [pid],
          noVotes: [],
        },
      };
    });
  };

  const handleVoteBudget = (voteYes: boolean) => {
    if (!activeRoom || !activeRoom.pendingBudgetVote) return;
    sound.playUiClick();
    const pid = multiplayerSync.getPlayerId();

    multiplayerSync.broadcast({
      type: 'BUDGET_VOTED',
      playerId: pid,
      voteYes,
    });

    setActiveRoom((prev) => {
      if (!prev || !prev.pendingBudgetVote) return prev;
      const v = prev.pendingBudgetVote;
      const yesVotes = voteYes
        ? Array.from(new Set([...v.yesVotes, pid]))
        : v.yesVotes.filter((id) => id !== pid);
      const noVotes = !voteYes
        ? Array.from(new Set([...v.noVotes, pid]))
        : v.noVotes.filter((id) => id !== pid);

      return {
        ...prev,
        pendingBudgetVote: {
          ...v,
          yesVotes,
          noVotes,
        },
      };
    });
  };

  const handleLaunchTeam = () => {
    if (!activeRoom) return;
    sound.playLaunchIgnition();
    const seed = Math.floor(Math.random() * 1000000);

    multiplayerSync.broadcast({
      type: 'MISSION_LAUNCHED',
      seed,
      config,
    });

    startMission();
  };

  // If no room joined yet, show Lobby Join/Create UI
  if (!activeRoom) {
    return (
      <div className="min-h-screen bg-space-950 text-slate-100 p-6 md:p-12 flex flex-col justify-between select-none">
        <div className="max-w-4xl mx-auto w-full">
          <button
            onClick={() => {
              sound.playUiClick();
              setScreen('landing');
            }}
            className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> [ RETURN TO MAIN MENU ]
          </button>

          <div className="mb-8">
            <h2 className="text-3xl md:text-5xl font-black text-white">
              CO-OP MULTIPLAYER LOBBY
            </h2>
            <p className="text-sm text-slate-400 font-mono mt-1.5">
              Form a mission control crew. Synchronize across browser tabs in real time.
            </p>
          </div>

          {/* Player Call-sign Name Input */}
          <div className="mb-8 p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <label className="text-xs font-mono text-slate-300 uppercase font-bold block">
              Your Flight Call-Sign:
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full max-w-sm px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-sm text-cyan-300 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Room Card */}
            <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-2">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Create New Team Room</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Generate a dedicated 4-letter room code. You become the Mission Director and can invite crew members to join via their browser tabs.
                </p>
              </div>

              <button
                onClick={handleCreateRoom}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Initialize Co-Op Room</span>
              </button>
            </div>

            {/* Join Room Card */}
            <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-2">
                  <LogIn className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Join Existing Room</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Enter the 4-letter room code shared by your Flight Director to join their active spacecraft design session.
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  maxLength={4}
                  placeholder="ROOM CODE (e.g. ABCD)"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-center text-lg font-bold tracking-widest text-white uppercase placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />

                {joinError && (
                  <p className="text-xs text-rose-400 font-mono flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{joinError}</span>
                  </p>
                )}

                <button
                  onClick={handleJoinRoom}
                  disabled={inputCode.length < 4}
                  className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-cyan-400 font-bold text-sm flex items-center justify-center gap-2 border border-slate-700"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Connect to Flight Deck</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-4xl mx-auto w-full pt-6 border-t border-slate-900 text-xs font-mono text-slate-500 flex items-center justify-between">
          <span>Real-time BroadcastChannel Sync Active</span>
          <span>Open two tabs to test multi-player co-op live!</span>
        </div>
      </div>
    );
  }

  // Active Room Lobby View
  return (
    <div className="min-h-screen bg-space-950 text-slate-100 p-4 md:p-8 select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <button
              onClick={() => {
                sound.playUiClick();
                multiplayerSync.leaveRoom();
                setActiveRoom(null);
                setScreen('landing');
              }}
              className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 mb-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> [ LEAVE ROOM & RETURN TO MENU ]
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-white">CO-OP FLIGHT DECK</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                ROOM ACTIVE: {activeRoom.players.length} CREW ONLINE
              </span>
            </div>
          </div>

          {/* Room Code Badge */}
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.15)] font-mono">
            <span className="text-xs text-slate-400">ROOM CODE:</span>
            <span className="text-2xl font-black tracking-widest text-cyan-400">{activeRoom.code}</span>
            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
              title="Copy Code"
            >
              <Copy className="w-4 h-4" />
            </button>
            {copiedCode && <span className="text-[10px] text-emerald-400 font-bold">COPIED!</span>}
          </div>
        </div>

        {/* 4 Roles Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" /> Select Mission Flight Position
            </h3>
            <span className="text-xs font-mono text-slate-500">Your Current Role: <strong className="text-cyan-400 uppercase">{userRole}</strong></span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {roles.map((item) => {
              const isSelected = userRole === item.role;
              const assignedPlayer = activeRoom.players.find((p) => p.role === item.role);
              const Icon = item.icon;

              return (
                <div
                  key={item.role}
                  onClick={() => handleRoleSelect(item.role)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)] ring-1 ring-cyan-400'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-400 text-slate-950 font-bold">
                        YOU
                      </span>
                    ) : assignedPlayer ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 font-medium truncate max-w-[100px]">
                        {assignedPlayer.name}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-500 border border-slate-800">
                        OPEN
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-snug">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Budget Request & Voting System */}
        {activeRoom.pendingBudgetVote && (
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/50 space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> BUDGET EXPANSION VOTE IN PROGRESS
              </span>
              <span className="text-xs text-slate-300">
                Votes: <strong className="text-emerald-400">{activeRoom.pendingBudgetVote.yesVotes.length} Yes</strong> / <strong className="text-rose-400">{activeRoom.pendingBudgetVote.noVotes.length} No</strong>
              </span>
            </div>
            <p className="text-xs text-slate-200">
              {activeRoom.pendingBudgetVote.requester} has formally requested an additional ${activeRoom.pendingBudgetVote.amount}M appropriation for critical flight components.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => handleVoteBudget(true)}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                Vote Approve [Yes]
              </button>
              <button
                onClick={() => handleVoteBudget(false)}
                className="px-4 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs"
              >
                Vote Reject [No]
              </button>
            </div>
          </div>
        )}

        {/* Crew Roster & Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Active Crew Roster (5 cols) */}
          <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                Crew Roster ({activeRoom.players.length} connected)
              </h4>
              <span className="text-[10px] text-cyan-400">MULTI-TAB SYNC</span>
            </div>

            <div className="space-y-2">
              {activeRoom.players.map((p) => {
                const isMe = p.id === multiplayerSync.getPlayerId();

                return (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-lg border flex items-center justify-between ${
                      isMe ? 'bg-cyan-950/40 border-cyan-500/40' : 'bg-slate-950 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-bold text-slate-200">
                        {p.name} {isMe && '(You)'}
                      </span>
                    </div>
                    <span className="text-cyan-400 uppercase text-[11px] font-bold">{p.role}</span>
                  </div>
                );
              })}
            </div>

            {/* Request Budget Action */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={handleRequestBudget}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs"
              >
                + Request $25M Budget Expansion Vote
              </button>
            </div>
          </div>

          {/* Lobby Real-time Crew Chat (7 cols) */}
          <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between h-[300px]">
            <h4 className="font-mono text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">
              Co-Op Radio Frequency (Synchronized)
            </h4>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
              {activeRoom.logs.map((msg) => (
                <div key={msg.id} className="p-2 rounded bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                    <span className="text-cyan-400 font-bold">[{msg.senderName}]</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <span className="text-slate-300">{msg.text}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                placeholder="Broadcast transmission to crew..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Launch Campaign Button */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={() => {
              sound.playUiClick();
              setScreen('builder');
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 transition-colors"
          >
            Adjust Spacecraft Hardware
          </button>

          <button
            onClick={handleLaunchTeam}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.4)]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Team Expedition (All Crew)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
