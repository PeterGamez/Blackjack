import { Hono } from "hono";
import Server from "../utils/Server";
import { SlipOK } from "../utils/SlipOK";
import { JWTPayload } from "../interfaces/Auth";

export default (app: Hono, server: Server) => {
    const slipOK = new SlipOK();

    // รับข้อมูล slip QR code จาก frontend และตรวจสอบ
    app.post("/payment", async (c) => {
        try {
            // ดึง JWT payload จาก middleware
            const jwtPayload = c.get("jwtPayload") as JWTPayload;
            const userId = jwtPayload.userId;

            // รับข้อมูล QR code + base64 image จาก frontend
            const { qrData, imageBase64 } = await c.req.json();

            if (!qrData || !imageBase64) {
                return c.json({ error: "ไม่พบ QR data หรือ image" }, 400);
            }

            // ส่ง image base64 ไปยัง SlipOK เพื่อตรวจสอบ
            const slipOKResponse = await slipOK.request(server, { url: imageBase64 });

            // ตรวจสอบ response นั้นเป็นของจริงหรือไม่
            if (slipOKResponse.code !== "00") {
                return c.json(
                    {
                        error: "การตรวจสอบ slip ล้มเหลว",
                        message: slipOKResponse.message,
                    },
                    400
                );
            }

            // ตรวจสอบข้อมูล slip
            if (!slipOKResponse.data) {
                return c.json(
                    { error: "ไม่พบข้อมูลใน slip" },
                    400
                );
            }

            const slipData = slipOKResponse.data;
            const amount = slipData.sendingAmount;

            // บันทึกข้อมูลการชำระเงิน
            // TODO: บันทึกลงฐานข้อมูล

            return c.json({
                success: true,
                message: "ยืนยันการชำระเงินสำเร็จ",
                slipData: {
                    transRef: slipData.transRef,
                    amount: amount,
                    senderName: slipData.senderName,
                    receiverName: slipData.receiverName,
                    dateTime: slipData.transactionDatetime,
                },
            });
        } catch (error) {
            server.error("PaymentRoute", `Error confirming payment: ${error}`);
            return c.json(
                { error: "เกิดข้อผิดพลาดในการยืนยันการชำระเงิน" },
                500
            );
        }
    });

    return app;
};
