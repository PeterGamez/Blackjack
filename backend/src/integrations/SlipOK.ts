import type { ErrorResponse, SlipOKResponse } from "../interfaces/SlipOK";
import type Server from "../Server";

export class SlipOK {
    private API_URL = "https://api.slipok.com";

    private server: Server;

    public readonly BankCode = {
        "002": {
            shortName: "BBL",
            fullName: "ธนาคารกรุงเทพ",
        },
        "004": {
            shortName: "KBANK",
            fullName: "ธนาคารกสิกรไทย",
        },
        "006": {
            shortName: "KTB",
            fullName: "ธนาคารกรุงไทย",
        },
        "011": {
            shortName: "TTB",
            fullName: "ธนาคารทหารไทยธนชาต",
        },
        "014": {
            shortName: "SCB",
            fullName: "ธนาคารไทยพาณิชย์",
        },
        "025": {
            shortName: "BAY",
            fullName: "ธนาคารกรุงศรีอยุธยา",
        },
        "069": {
            shortName: "KKP",
            fullName: "ธนาคารเกียรตินาคินภัทร",
        },
        "022": {
            shortName: "CIMBT",
            fullName: "ธนาคารซีไอเอ็มบีไทย",
        },
        "067": {
            shortName: "TISCO",
            fullName: "ธนาคารทิสโก้",
        },
        "024": {
            shortName: "UOBT",
            fullName: "ธนาคารยูโอบี",
        },
        "071": {
            shortName: "TCD",
            fullName: "ธนาคารไทยเครดิตเพื่อรายย่อย",
        },
        "073": {
            shortName: "LHFG",
            fullName: "ธนาคารแลนด์ แอนด์ เฮ้าส์",
        },
        "070": {
            shortName: "ICBCT",
            fullName: "ธนาคารไอซีบีซี (ไทย)",
        },
        "098": {
            shortName: "SME",
            fullName: "ธนาคารพัฒนาวิสาหกิจขนาดกลางและขนาดย่อมแห่งประเทศไทย",
        },
        "034": {
            shortName: "BAAC",
            fullName: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร",
        },
        "035": {
            shortName: "EXIM",
            fullName: "ธนาคารเพื่อการส่งออกและนำเข้าแห่งประเทศไทย",
        },
        "030": {
            shortName: "GSB",
            fullName: "ธนาคารออมสิน",
        },
        "033": {
            shortName: "GHB",
            fullName: "ธนาคารอาคารสงเคราะห์",
        },
    };

    public constructor(server: Server) {
        this.server = server;
    }

    public async request(file: File): Promise<SlipOKResponse & ErrorResponse> {
        const formData = new FormData();
        formData.append("files", file);

        const response = await fetch(`${this.API_URL}/api/line/apikey/${this.server.config.slipok.branch}`, {
            method: "POST",
            headers: {
                "x-authorization": this.server.config.slipok.authorization,
            },
            body: formData,
        });

        const body = await response.json();
        return body as SlipOKResponse & ErrorResponse;
    }
}
