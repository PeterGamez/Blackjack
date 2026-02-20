import { InterfaceBase } from "./InterfaceBase";

export interface UserInterface extends InterfaceBase {
    username: string;
    password: string;
    email: string;
    cash: number;
    coins: number;
    isVerified: boolean;
}
