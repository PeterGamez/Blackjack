import { SlipOKResponse } from "../interfaces/SlipOKResponse";
import { fetch } from "bun";

export class SlipOK {
    private API_URL = "https://api.slipok.com";

    public async request(client: any, image: any): Promise<SlipOKResponse> {
        const respond = await fetch(`${this.API_URL}/api/line/apikey/${client.config.slipok.branch}`, {
            method: "POST",
            headers: {
                "x-authorization": client.config.slipok.api,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                url: image.url,
                log: true,
            }),
        });

        const body = await respond.json();
        return body as SlipOKResponse;
    }
}
