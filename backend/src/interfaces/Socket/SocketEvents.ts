import type { AckResponse, RoomDataPayload, RoomMessagePayload, RoomStatePayload, PlayerPayload } from "./SocketPayloads";

export type RoomServerEvents = {
    "room:state": (payload: RoomStatePayload) => void;
    "room:player-joined": (payload: PlayerPayload) => void;
    "room:player-left": (payload: PlayerPayload) => void;
    "room:data": (payload: RoomDataPayload) => void;
    "room:error": (message: string) => void;
};

export type RoomClientEvents = {
    "room:join": (tableId: string, ack: (res: AckResponse) => void) => void;
    "room:leave": (tableId: string, ack: (res: AckResponse) => void) => void;
    "room:message": (payload: RoomMessagePayload, ack: (res: AckResponse) => void) => void;
};
