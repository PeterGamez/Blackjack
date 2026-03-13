import { Ticket } from "./Ticket";
import { VoucherType } from "./VoucherType";

export interface TruemoneyResponse {
    status: {
        message: string;
        code: "SUCCESS" | "INVALID_INPUT" | "VOUCHER_OUT_OF_STOCK";
    };
    data: {
        voucher: {
            voucher_id: string;
            amount_baht: string;
            redeemed_amount_baht: string;
            member: number;
            status: string;
            link: string;
            detail: string;
            expire_date: number;
            type: VoucherType;
            redeemed: number;
            available: number;
        };
        owner_profile: {
            full_name: string;
        };
        redeemer_profile: {
            mobile_number: string;
        };
        my_ticket: Ticket;
        tickets: Ticket[];
    };
}
