import { Author } from "./Author";

/**
 * https://slipok.com/api-documentation/
 */
export interface SlipOKResponse {
    success: boolean;
    data: {
        success: boolean;
        message: string;
        language: "TH" | "EN";
        receivingBank: string;
        sendingBank: string;
        transRef: string;
        /**
         * YYYYMMDD
         */
        transDate: string;
        /**
         * HH:mm:ss
         */
        transTime: string;
        transTimestamp: string;
        sender: Author;
        receiver: Author;
        amount: number;
        paidLocalAmount: number;
        paidLocalCurrency: string;
        countryCode: string;
        transFeeAmount: string;
        ref1: string;
        ref2: string;
        ref3: string;
        toMerchantId: string;
        qrcodeData: string;
    };
}
