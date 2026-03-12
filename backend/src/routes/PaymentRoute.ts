import { Hono } from "hono";
import Server from "../utils/Server";
import { RouteInterface } from "../interfaces/Route";
import { BlankEnv, BlankSchema } from "hono/types";
import PackageModel from "../models/PackageModel";
import UserModel from "../models/UserModel";
import PaymentModel from "../models/PaymentModel";

export default class PaymentRoute implements RouteInterface {
    private readonly basePath = "/payment";
    private app: Hono<BlankEnv, BlankSchema, "/payment">;
    private server: Server;

    constructor(server: Server) {
        this.app = new Hono();
        this.server = server;

        this.registerRoutes();
    }

    private registerRoutes() {
        this.app.use("*", this.server.Middleware.auth());

        this.app.get("/packages", async (c) => {
            const packages = await PackageModel.selectAllActivePackages();
            return c.json({ packages });
        });

        this.app.post("/bank", async (c) => {
            try {
                const user = await this.server.Middleware.getUser(c);
                if (!user) {
                    return c.json({ error: "User not found" }, 404);
                }

                let body: { image: File; packageId: string };
                try {
                    body = await c.req.parseBody();
                } catch {
                    return c.json({ error: "Invalid request body" }, 400);
                }

                const image = body.image;
                const packageIdStr = body.packageId;

                if (!image || !packageIdStr) {
                    return c.json({ error: "Missing image or packageId" }, 400);
                }

                const packageId = Number(packageIdStr);

                const pack = await PackageModel.selectPackage(packageId);
                if (!pack) {
                    return c.json({ error: "Package not found" }, 404);
                }

                if (!(image instanceof File)) {
                    return c.json({ error: "Invalid file" }, 400);
                }

                const response = await this.server.SlipOK.request(image);
                if (!response.success) {
                    this.server.warn("PaymentRoute", `Failed to verify slip: ${response.message}`);
                    return c.json({ error: "Failed to verify slip" }, 400);
                }

                const data = response.data;

                if (pack.price != data.paidLocalAmount) {
                    return c.json({ error: "Paid amount does not match package price" }, 400);
                }

                await PaymentModel.createPayment(user.id, data.transRef, "bank", data.paidLocalAmount);
                await UserModel.increaseBalance(user.id, "tokens", pack.tokens);

                return c.json({ message: "Bank slip verified successfully" });
            } catch (error) {
                this.server.error("PaymentRoute", `Error processing bank slip:`);
                console.error(error);
                return c.json({ error: "Error processing bank slip" }, 500);
            }
        });

        this.app.post("/truemoney", async (c) => {
            try {
                const user = await this.server.Middleware.getUser(c);
                if (!user) {
                    return c.json({ error: "User not found" }, 404);
                }

                let body: { url: string; packageId: number };
                try {
                    body = await c.req.json<typeof body>();
                } catch {
                    return c.json({ error: "Invalid request body" }, 400);
                }

                const url = body.url;
                const packageId = body.packageId;

                if (!url || !packageId) {
                    return c.json({ error: "Missing url or packageId" }, 400);
                }

                const pack = await PackageModel.selectPackage(packageId);
                if (!pack) {
                    return c.json({ error: "Package not found" }, 404);
                }

                const verifyResponse = await this.server.Truemoney.verify(url);

                if (verifyResponse.status.code != "SUCCESS") {
                    if (verifyResponse.status.code == "INVALID_INPUT") {
                        return c.json({ error: "Invalid voucher URL" }, 400);
                    } else if (verifyResponse.status.code == "VOUCHER_OUT_OF_STOCK") {
                        return c.json({ error: "Voucher has already been redeemed" }, 400);
                    } else {
                        return c.json({ error: "Failed to verify voucher", message: verifyResponse.status.message }, 400);
                    }
                }

                const voucher = verifyResponse.data.voucher;
                if (voucher.member != 1) {
                    return c.json({ error: "Must have exactly 1 recipient" }, 400);
                }

                const redeemAmount = parseFloat(voucher.amount_baht);
                if (pack.price != redeemAmount) {
                    return c.json({ error: "Redeemed amount does not match package price" }, 400);
                }

                const redeemResponse = await this.server.Truemoney.request(url);
                if (redeemResponse.status.code != "SUCCESS") {
                    return c.json({ error: "Failed to redeem voucher", message: redeemResponse.status.message }, 400);
                }

                await PaymentModel.createPayment(user.id, voucher.voucher_id, "truemoney", redeemAmount);
                await UserModel.increaseBalance(user.id, "tokens", pack.tokens);

                return c.json({ message: "Voucher redeemed successfully" });
            } catch (error) {
                this.server.error("PaymentRoute", `Error processing TrueMoney:`);
                console.error(error);
                return c.json({ error: "Error processing TrueMoney" }, 500);
            }
        });
    }

    public getApp(app: Hono) {
        app.route(this.basePath, this.app);
        this.server.log("Route", `Registered route: ${this.basePath} [${this.app.routes.length} endpoints]`);
    }
}
