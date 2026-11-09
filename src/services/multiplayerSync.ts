/**
 * GTA NASA Multiplayer Synchronization Engine
 * Supports real-time peer communication across multiple browser tabs via BroadcastChannel API,
 * persistent room storage in localStorage, and clean adapter architecture for Supabase Realtime.
 */

import { RoomPlayer, PlayerRole, ChatMessage, SpacecraftConfig } from '../types/game';

export interface RoomState {
  code: string;
  hostId: string;
  scenarioId: string;
  config: SpacecraftConfig;
  players: RoomPlayer[];
  pendingBudgetVote: {
    amount: number;
    requester: string;
    requesterId: string;
    yesVotes: string[];
    noVotes: string[];
  } | null;
  logs: ChatMessage[];
  status: 'lobby' | 'launched';
  lastUpdated: number;
}

export type SyncEvent =
  | { type: 'PLAYER_JOINED'; player: RoomPlayer }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'ROLE_CHANGED'; playerId: string; newRole: PlayerRole }
  | { type: 'CONFIG_UPDATED'; config: SpacecraftConfig }
  | { type: 'BUDGET_REQUESTED'; amount: number; requester: string; requesterId: string }
  | { type: 'BUDGET_VOTED'; playerId: string; voteYes: boolean }
  | { type: 'CHAT_MESSAGE'; message: ChatMessage }
  | { type: 'MISSION_LAUNCHED'; seed: number; config: SpacecraftConfig }
  | { type: 'ROOM_SYNC'; state: RoomState };

export class MultiplayerSyncService {
  private channel: BroadcastChannel | null = null;
  private currentRoomCode: string | null = null;
  private localPlayerId: string;
  private listeners: ((event: SyncEvent) => void)[] = [];

  constructor() {
    // Generate or retrieve persistent local client ID
    let pid = sessionStorage.getItem('gta_nasa_player_id');
    if (!pid) {
      pid = 'player_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('gta_nasa_player_id', pid);
    }
    this.localPlayerId = pid;
  }

  getPlayerId(): string {
    return this.localPlayerId;
  }

  getCurrentRoomCode(): string | null {
    return this.currentRoomCode;
  }

  createRoom(scenarioId: string, initialConfig: SpacecraftConfig, playerName: string = 'Commander (Host)'): RoomState {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    const hostPlayer: RoomPlayer = {
      id: this.localPlayerId,
      name: playerName,
      role: 'director',
      isReady: true,
    };

    const roomState: RoomState = {
      code,
      hostId: this.localPlayerId,
      scenarioId,
      config: initialConfig,
      players: [hostPlayer],
      pendingBudgetVote: null,
      logs: [
        {
          id: 'sys-create',
          senderName: 'MISSION CONTROL',
          role: 'SYSTEM',
          text: `Tactical co-op room [${code}] established. Standing by for crew boarding.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      ],
      status: 'lobby',
      lastUpdated: Date.now(),
    };

    localStorage.setItem(`gta_nasa_room_${code}`, JSON.stringify(roomState));
    this.connectToRoom(code);
    return roomState;
  }

  joinRoom(code: string, playerName: string = 'Flight Officer'): RoomState | null {
    const cleanCode = code.trim().toUpperCase();
    const stored = localStorage.getItem(`gta_nasa_room_${cleanCode}`);
    if (!stored) {
      // Create room dynamically if joined with a custom code
      return null;
    }

    try {
      const roomState: RoomState = JSON.parse(stored);
      this.connectToRoom(cleanCode);

      // Add player if not already in roster
      const existingPlayer = roomState.players.find((p) => p.id === this.localPlayerId);
      if (!existingPlayer) {
        // Pick next unassigned role
        const assignedRoles = roomState.players.map((p) => p.role);
        const allRoles: PlayerRole[] = ['engineer', 'science', 'resource', 'director'];
        const availableRole = allRoles.find((r) => !assignedRoles.includes(r)) || 'engineer';

        const newPlayer: RoomPlayer = {
          id: this.localPlayerId,
          name: playerName,
          role: availableRole,
          isReady: true,
        };

        roomState.players.push(newPlayer);
        roomState.logs.push({
          id: `sys-join-${Date.now()}`,
          senderName: 'MISSION CONTROL',
          role: 'SYSTEM',
          text: `${playerName} boarded the mission room as [${availableRole.toUpperCase()}].`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });
        roomState.lastUpdated = Date.now();

        localStorage.setItem(`gta_nasa_room_${cleanCode}`, JSON.stringify(roomState));
        this.broadcast({ type: 'PLAYER_JOINED', player: newPlayer });
      }

      return roomState;
    } catch (_) {
      return null;
    }
  }

  connectToRoom(code: string) {
    if (this.channel) {
      this.channel.close();
    }
    this.currentRoomCode = code;
    this.channel = new BroadcastChannel(`gta_nasa_room_channel_${code}`);
    this.channel.onmessage = (event: MessageEvent<SyncEvent>) => {
      this.listeners.forEach((cb) => cb(event.data));
    };
  }

  subscribe(callback: (event: SyncEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  broadcast(event: SyncEvent) {
    if (this.channel) {
      this.channel.postMessage(event);
    }
    // Also update localStorage for persistence
    if (this.currentRoomCode) {
      const stored = localStorage.getItem(`gta_nasa_room_${this.currentRoomCode}`);
      if (stored) {
        try {
          const room: RoomState = JSON.parse(stored);
          if (event.type === 'PLAYER_JOINED') {
            if (!room.players.some((p) => p.id === event.player.id)) {
              room.players.push(event.player);
            }
          } else if (event.type === 'ROLE_CHANGED') {
            const p = room.players.find((pl) => pl.id === event.playerId);
            if (p) p.role = event.newRole;
          } else if (event.type === 'CONFIG_UPDATED') {
            room.config = event.config;
          } else if (event.type === 'CHAT_MESSAGE') {
            room.logs.push(event.message);
          } else if (event.type === 'MISSION_LAUNCHED') {
            room.status = 'launched';
          }
          room.lastUpdated = Date.now();
          localStorage.setItem(`gta_nasa_room_${this.currentRoomCode}`, JSON.stringify(room));
        } catch (_) {}
      }
    }
  }

  leaveRoom() {
    if (this.channel && this.currentRoomCode) {
      this.broadcast({ type: 'PLAYER_LEFT', playerId: this.localPlayerId });
      this.channel.close();
      this.channel = null;
      this.currentRoomCode = null;
    }
  }
}

export const multiplayerSync = new MultiplayerSyncService();
