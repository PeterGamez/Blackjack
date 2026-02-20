export interface RoomStatePayload {
    tableId: string;
    members: string[]; // socket ids currently in the room
}

export interface PlayerPayload {
    tableId: string;
    socketId: string;
}

export interface RoomMessagePayload {
    tableId: string;
    data: unknown;
}

export interface AckResponse {
    ok: boolean;
    message?: string;
}
