import { fetch } from "bun";

import type Server from "../Server";
import type { TruemoneyResponse } from "../interfaces/Truemoney";

export class Truemoney {
    private API_URL = "https://gift.truemoney.com";

    private server: Server;

    public constructor(server: Server) {
        this.server = server;
    }

    public async verify(url: string): Promise<TruemoneyResponse> {
        const code = this.parseCode(url);
        if (!code) {
            return;
        }

        const response = await fetch(`${this.API_URL}/campaign/vouchers/${code}/verify`);

        const body = await response.json();
        return body as TruemoneyResponse;
    }

    public async request(url: string): Promise<TruemoneyResponse> {
        const code = this.parseCode(url);
        if (!code) {
            return;
        }

        const response = await fetch(`${this.API_URL}/campaign/vouchers/${code}/redeem`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                voucher_hash: code,
                mobile: this.server.config.truemoney.phone,
            }),
        });

        const body = await response.json();
        return body as TruemoneyResponse;
    }

    public parseCode(url: string): string {
        const code = url.split("v=")[1];
        return code;
    }
}
