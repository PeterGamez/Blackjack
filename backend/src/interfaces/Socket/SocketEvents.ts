import type { AckResponse, RoomMessagePayload, RoomStatePayload, PlayerPayload } from "./SocketPayloads";

// Events the server sends to clients in a room
export type RoomServerEvents = {
    "room:state": (payload: RoomStatePayload) => void;
    "room:player-joined": (payload: PlayerPayload) => void;
    "room:player-left": (payload: PlayerPayload) => void;
    "room:error": (message: string) => void;
};

// Events clients send to the server
export type RoomClientEvents = {
    "room:join": (tableId: string, ack: (res: AckResponse) => void) => void;
    "room:leave": (tableId: string, ack: (res: AckResponse) => void) => void;
    "room:message": (payload: RoomMessagePayload, ack: (res: AckResponse) => void) => void;
};
