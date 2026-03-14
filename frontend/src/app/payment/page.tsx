"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";

import SessionCache from "../../lib/SessionCache";

function PaymentContent() {
  const cachedProfile = SessionCache.getCachedProfileSnapshot();

  const router = useRouter();
  const searchParams = useSearchParams();

  const buyTokens = searchParams.get("tokens");
  const price = searchParams.get("price");

  const [method, setMethod] = useState("");
  const [username] = useState(cachedProfile.username);
  const [coins] = useState(cachedProfile.coins);
  const [tokensBalance] = useState(cachedProfile.tokens);

  return (
    <div
      style={{
        background: "#e9edf3",
        minHeight: "150vh",
        paddingTop: "200px",
      }}>
      {/* HEADER */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 3rem",
          background: "rgba(30,36,48,0.95)",
          height: "183px",
          zIndex: 100,
        }}>
        {/* USER */}
        <div
          onClick={() => router.push(username ? "/profile" : "/auth")}
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            background: "rgba(92,107,138,0.6)",
            border: "1px solid rgba(92,107,138,0.8)",
            borderRadius: "20px",
            padding: "8px 24px 8px 0",
            height: "64px",
          }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#fff",
              border: "3px solid #5c6b8a",
              marginLeft: "-20px",
              marginRight: "12px",
            }}
          />

          <div style={{ color: "#e6eaf2", fontSize: "18px" }}>{username || "username"}</div>
        </div>

        {/* BALANCE */}
        <div style={{ display: "flex", gap: "24px" }}>
          <div
            style={{
              height: "64px",
              minWidth: "200px",
              borderRadius: "20px",
              background: "rgba(92,107,138,0.6)",
              border: "1px solid rgba(92,107,138,0.8)",
              color: "#e6eaf2",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "0 24px",
            }}>
            🪙 {coins.toLocaleString()}
          </div>

          <div
            style={{
              height: "64px",
              minWidth: "200px",
              borderRadius: "20px",
              background: "rgba(92,107,138,0.6)",
              border: "1px solid rgba(92,107,138,0.8)",
              color: "#e6eaf2",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "0 24px",
            }}>
            <div
              style={{
                width: "30px",
                height: "30px",
                background: "#b28bff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
              }}>
              T
            </div>

            {tokensBalance.toLocaleString()}

            <span style={{ marginLeft: "auto", fontSize: "24px" }}>+</span>
          </div>
        </div>
      </div>

      {/* LOBBY BUTTON */}
      <button
        onClick={() => router.push("/topup")}
        style={{
          position: "absolute",
          top: "210px",
          left: "40px",
          padding: "10px 18px",
          background: "#e3b75c",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          fontWeight: "600",
        }}>
        ← LOBBY
      </button>

      <h1
        style={{
          textAlign: "center",
          marginBottom: "20px",
          fontSize: "26px",
          position: "relative",
          top: "50px",
        }}>
        Payment
      </h1>

      {/* PAYMENT BOX */}
      <div
        style={{
          maxWidth: "900px",
          margin: "120px auto",
          background: "#7b8caf",
          borderRadius: "18px",
          padding: "50px",
          display: "flex",
          justifyContent: "space-between",
          transform: "scale(1.25)",
          transformOrigin: "top center",
        }}>
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              width: "240px",
              background: "#e5e7ec",
              borderRadius: "6px",
              overflow: "hidden",
            }}>
            <div
              style={{
                background: "#e3b75c",
                padding: "14px",
                fontWeight: "600",
                textAlign: "center",
              }}>
              Order Summary
            </div>

            <div style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Package</span>
                <span>{Number(buyTokens).toLocaleString()} Tokens</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                <span>Price</span>
                <span>{price} THB</span>
              </div>

              <hr style={{ margin: "15px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600" }}>
                <span>Total</span>
                <span>{price} THB</span>
              </div>
            </div>
          </div>

          <button
            style={{
              marginTop: "25px",
              background: "linear-gradient(90deg,#f6d07a,#e3b75c)",
              border: "none",
              padding: "12px 34px",
              borderRadius: "30px",
              fontWeight: "600",
              cursor: "pointer",
            }}>
            CONFIRM PAYMENT
          </button>
        </div>

        {/* RIGHT */}
        <div style={{ width: "380px" }}>
          {/* QR PAYMENT */}
          <div
            onClick={() => setMethod(method === "qr" ? "" : "qr")}
            style={{
              border: "2px solid #2c3344",
              padding: "20px",
              marginBottom: "20px",
              cursor: "pointer",
              background: method === "qr" ? "#8fa1c5" : "transparent",
              transition: "all 0.25s ease",
            }}>
            {/* HEADER */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <input type="radio" checked={method === "qr"} readOnly style={{ marginTop: "4px" }} />

              <div style={{ width: "100%" }}>
                <div>QR Code (PromptPay)</div>
                <div style={{ fontSize: "12px" }}>Scan To Pay With Your Banking App</div>
              </div>
            </div>

            <div
              style={{
                maxHeight: method === "qr" ? "250px" : "0px",
                opacity: method === "qr" ? 1 : 0,
                overflow: "hidden",
                transition: "all 0.35s ease",
              }}>
              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  marginLeft: "28px",
                }}>
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  QR Code
                </div>

                <button
                  style={{
                    marginTop: "15px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid #2c3344",
                    background: "#6c7fa3",
                    color: "#fff",
                    cursor: "pointer",
                  }}>
                  ⬆ UPLOAD SLIP
                </button>
              </div>
            </div>
          </div>

          {/* TRUEMONEY */}
          <div
            onClick={() => setMethod(method === "truemoney" ? "" : "truemoney")}
            style={{
              border: "2px solid #2c3344",
              padding: "20px",
              cursor: "pointer",
              background: method === "truemoney" ? "#8fa1c5" : "transparent",
              transition: "all 0.25s ease",
            }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <input type="radio" checked={method === "truemoney"} readOnly />

              <div style={{ width: "100%" }}>
                <div>Truemoney Envelope</div>
                <div style={{ fontSize: "12px" }}>Paste The Gift Envelope Link</div>

                <div
                  style={{
                    maxHeight: method === "truemoney" ? "120px" : "0px",
                    opacity: method === "truemoney" ? 1 : 0,
                    overflow: "hidden",
                    transition: "all 0.35s ease",
                  }}>
                  <input
                    placeholder="https://gift.truemoney.com/..."
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      marginTop: "12px",
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #2c3344",
                      outline: "none",
                      boxShadow: "none",
                      background: "#8fa1c5",
                      color: "#000",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentContent />
    </Suspense>
  );
}
