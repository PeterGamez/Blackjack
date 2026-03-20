import { Hono } from "hono";
import type { BlankEnv, BlankSchema } from "hono/types";

import type Server from "../Server";
import type { RouteInterface } from "../interfaces/Route";
import PackageModel from "../models/PackageModel";
import PaymentModel from "../models/PaymentModel";
import UserModel from "../models/UserModel";

export default class PaymentRoute implements RouteInterface {
    private readonly basePath = "/payment";
    private app: Hono<BlankEnv, BlankSchema, typeof this.basePath>;
    private server: Server;

    constructor(server: Server) {
        this.app = new Hono();
        this.server = server;

        this.registerRoutes();
    }

    private registerRoutes() {
        this.app.use("*", this.server.Middleware.auth());

        this.app.get("/packages", async (c) => {
            try {
                const packages = await PackageModel.selectAllActivePackages();

                const response = packages.map((pack) => ({
                    id: pack.id,
                    image: pack.image,
                    price: pack.price,
                    tokens: pack.tokens,
                }));

                return c.json(response);
            } catch (error) {
                this.server.error("PaymentRoute", `Error fetching packages:`);
                console.error(error);
                return c.json({ error: "Internal server error" }, 500);
            }
        });

        this.app.get("/package/:id", async (c) => {
            try {
                const packageId = parseInt(c.req.param("id"));
                if (isNaN(packageId)) {
                    return c.json({ error: "Invalid package ID" }, 400);
                }

                const pack = await PackageModel.selectPackage(packageId);
                if (!pack) {
                    return c.json({ error: "Package not found" }, 404);
                }

                return c.json({
                    id: pack.id,
                    image: pack.image,
                    price: pack.price,
                    tokens: pack.tokens,
                });
            } catch (error) {
                this.server.error("PaymentRoute", `Error fetching package:`);
                console.error(error);
                return c.json({ error: "Error fetching package" }, 500);
            }
        });

        this.app.post("/qr", async (c) => {
            try {
                let body: { packageId: number };
                try {
                    body = await c.req.json();
                } catch {
                    return c.json({ error: "Invalid request body" }, 400);
                }

                const { packageId } = body;

                if (!packageId) {
                    return c.json({ error: "Missing packageId" }, 400);
                }

                const pack = await PackageModel.selectPackage(packageId);
                if (!pack) {
                    return c.json({ error: "Package not found" }, 404);
                }

                const imageUrl = `https://promptpay.io/${this.server.config.bank.promptpay}/${pack.price}.png`;

                return c.json({ url: imageUrl });
            } catch (error) {
                this.server.error("PaymentRoute", `Error processing QR code request:`);
                console.error(error);
                return c.json({ error: "Error processing QR code request" }, 500);
            }
        });

        this.app.get("package/:id", async (c) => {
            try {
                const packageId = parseInt(c.req.param("id"));
                if (isNaN(packageId)) {
                    return c.json({ error: "Invalid package ID" }, 400);
                }

                const pack = await PackageModel.selectPackage(packageId);
                if (!pack) {
                    return c.json({ error: "Package not found" }, 404);
                }

                return c.json({
                    id: pack.id,
                    image: pack.image,
                    price: pack.price,
                    tokens: pack.tokens,
                });
            } catch (error) {
                this.server.error("PaymentRoute", `Error fetching package:`);
                console.error(error);
                return c.json({ error: "Error fetching package" }, 500);
            }
        });

        this.app.post("/bank", async (c) => {
            try {
                let body: { image: File; packageId: string };
                try {
                    body = await c.req.parseBody();
                } catch {
                    return c.json({ error: "Invalid request body" }, 400);
                }

                const { image, packageId: packageIdStr } = body;

                if (!image || !packageIdStr) {
                    return c.json({ error: "Missing image or packageId" }, 400);
                }

                if (!(image instanceof File)) {
                    return c.json({ error: "Invalid file" }, 400);
                }

                const packageId = Number(packageIdStr);

                const [user, pack, response] = await Promise.all([this.server.Middleware.getUser(c), PackageModel.selectPackage(packageId), this.server.SlipOK.request(image)]);

                if (!user) {
                    return c.json({ error: "User not found" }, 404);
                }

                if (!pack) {
                    return c.json({ error: "Package not found" }, 404);
                }

                if (!response.success) {
                    this.server.warn("PaymentRoute", `Failed to verify slip: ${response.message}`);
                    return c.json({ error: "Failed to verify slip" }, 400);
                }

                const data = response.data;

                if (pack.price !== data.paidLocalAmount) {
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
                let body: { url: string; packageId: number };
                try {
                    body = await c.req.json();
                } catch {
                    return c.json({ error: "Invalid request body" }, 400);
                }

                const { url, packageId } = body;

                if (!url || !packageId) {
                    return c.json({ error: "Missing url or packageId" }, 400);
                }

                const [user, pack, verifyResponse] = await Promise.all([this.server.Middleware.getUser(c), PackageModel.selectPackage(packageId), this.server.Truemoney.verify(url)]);

                if (!user) {
                    return c.json({ error: "User not found" }, 404);
                }

                if (!pack) {
                    return c.json({ error: "Package not found" }, 404);
                }

                if (verifyResponse.status.code !== "SUCCESS") {
                    const statusErrors: Record<string, string> = {
                        INVALID_INPUT: "Invalid voucher URL",
                        VOUCHER_OUT_OF_STOCK: "Voucher has already been redeemed",
                    };

                    return c.json({ error: statusErrors[verifyResponse.status.code] ?? "Failed to verify voucher", message: verifyResponse.status.message }, 400);
                }

                const voucher = verifyResponse.data.voucher;
                if (voucher.member !== 1) {
                    return c.json({ error: "Must have exactly 1 recipient" }, 400);
                }

                const redeemAmount = parseFloat(voucher.amount_baht);
                if (pack.price !== redeemAmount) {
                    return c.json({ error: "Redeemed amount does not match package price" }, 400);
                }

                const redeemResponse = await this.server.Truemoney.request(url);
                if (redeemResponse.status.code !== "SUCCESS") {
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
