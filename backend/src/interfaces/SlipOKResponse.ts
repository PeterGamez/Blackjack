import { InterfaceBase } from "./Database/InterfaceBase";

export interface SlipOKResponse extends InterfaceBase {
    code: string;
    message: string;
    data?: {
        transRef: string;
        sendingAmount: number;
        senderName: string;
        receiverName: string;
        transactionDatetime: Date;
    };
}