import { InterfaceBase } from "./InterfaceBase";

export interface GameHistoryInterface extends InterfaceBase {
    userId1: number;
    userId2: number;
    result: string;
    mode: string;
    bet: number;
    reward: number;
}
