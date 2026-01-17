/**
 * Semana 6: Esquemas de datos y gestión de red
 */

// ==========================================
// Tarea #2: Esquema de paquete de datos
// ==========================================

export interface PlayerPacket {
    id: string
    position: { x: number; y: number; z: number }
    rotation: { y: number }  // Solo rotación Y para optimizar
    state: PlayerState
    timestamp: number
}

export type PlayerState = 'idle' | 'walk' | 'run' | 'jump' | 'sit' | 'dance'

export interface ChatPacket {
    senderId: string
    senderName: string
    text: string
    timestamp: string
    channel: 'global' | 'local' | 'private'
}

export interface ObjectStatePacket {
    objectId: string
    state: Record<string, any>
    triggeredBy: string
    timestamp: number
}

export interface RoomInfo {
    id: string
    name: string
    playerCount: number
    maxPlayers: number
    isPublic: boolean
}

// ==========================================
// Tarea #10: Room Logic (Salas/Instancias)
// ==========================================

export class RoomManager {
    private currentRoom: string | null = null
    private socket: any

    constructor(socket: any) {
        this.socket = socket
    }

    /**
     * Unirse a una sala
     */
    joinRoom(roomId: string, password?: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.socket.emit('room:join', { roomId, password }, (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    this.currentRoom = roomId
                }
                resolve(response.success)
            })
        })
    }

    /**
     * Crear una nueva sala
     */
    createRoom(options: {
        name: string;
        maxPlayers: number;
        isPublic: boolean;
        password?: string
    }): Promise<string | null> {
        return new Promise((resolve) => {
            this.socket.emit('room:create', options, (response: { success: boolean; roomId?: string }) => {
                if (response.success && response.roomId) {
                    this.currentRoom = response.roomId
                    resolve(response.roomId)
                } else {
                    resolve(null)
                }
            })
        })
    }

    /**
     * Salir de la sala actual
     */
    leaveRoom(): void {
        if (this.currentRoom) {
            this.socket.emit('room:leave', { roomId: this.currentRoom })
            this.currentRoom = null
        }
    }

    /**
     * Obtener lista de salas públicas
     */
    listRooms(): Promise<RoomInfo[]> {
        return new Promise((resolve) => {
            this.socket.emit('room:list', {}, (rooms: RoomInfo[]) => {
                resolve(rooms)
            })
        })
    }

    getCurrentRoom(): string | null {
        return this.currentRoom
    }
}

// ==========================================
// Tarea #11: Delta Compression
// ==========================================

export class DeltaCompressor {
    private lastPacket: PlayerPacket | null = null

    /**
     * Comprime un paquete comparando con el anterior
     */
    compress(packet: PlayerPacket): Partial<PlayerPacket> & { id: string } {
        if (!this.lastPacket) {
            this.lastPacket = packet
            return packet
        }

        const delta: Partial<PlayerPacket> & { id: string } = { id: packet.id }

        // Solo incluir campos que cambiaron
        if (Math.abs(packet.position.x - this.lastPacket.position.x) > 0.01 ||
            Math.abs(packet.position.y - this.lastPacket.position.y) > 0.01 ||
            Math.abs(packet.position.z - this.lastPacket.position.z) > 0.01) {
            delta.position = packet.position
        }

        if (Math.abs(packet.rotation.y - this.lastPacket.rotation.y) > 0.01) {
            delta.rotation = packet.rotation
        }

        if (packet.state !== this.lastPacket.state) {
            delta.state = packet.state
        }

        this.lastPacket = packet
        return delta
    }

    /**
     * Reconstruye un paquete desde un delta
     */
    decompress(delta: Partial<PlayerPacket> & { id: string }, previousPacket: PlayerPacket): PlayerPacket {
        return {
            id: delta.id,
            position: delta.position || previousPacket.position,
            rotation: delta.rotation || previousPacket.rotation,
            state: delta.state || previousPacket.state,
            timestamp: delta.timestamp || Date.now()
        }
    }
}

// ==========================================
// Tarea #14: Límite de jugadores por sala
// ==========================================

export const ROOM_LIMITS = {
    DEFAULT_MAX_PLAYERS: 50,
    ABSOLUTE_MAX_PLAYERS: 100,
    MAX_ROOMS: 20,
    IDLE_TIMEOUT_MS: 5 * 60 * 1000 // 5 minutos
}

export function isRoomFull(room: RoomInfo): boolean {
    return room.playerCount >= room.maxPlayers
}
