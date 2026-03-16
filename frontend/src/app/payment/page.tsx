"use client";

import Navbar from "@components/Navbar";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";

import styles from "./page.module.css";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const buyTokens = searchParams.get("tokens");
  const price = searchParams.get("price");

  const [method, setMethod] = useState("");

  return (
    <div className={styles.page}>
      <Navbar />

      <button onClick={() => router.push("/topup")} className={styles.backButton}>
        ← LOBBY
      </button>

      <h1 className={styles.title}>Payment</h1>

      <div className={styles.panel}>
        <div className={styles.summarySection}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>Order Summary</div>

            <div className={styles.summaryBody}>
              <div className={styles.summaryRow}>
                <span>Package</span>
                <span>{Number(buyTokens).toLocaleString()} Tokens</span>
              </div>

              <div className={`${styles.summaryRow} ${styles.summaryRowSpaced}`}>
                <span>Price</span>
                <span>{price} THB</span>
              </div>

              <hr className={styles.summaryDivider} />

              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span>{price} THB</span>
              </div>
            </div>
          </div>

          <button className={styles.confirmButton}>CONFIRM PAYMENT</button>
        </div>

        <div className={styles.methods}>
          <div onClick={() => setMethod(method === "qr" ? "" : "qr")} className={`${styles.methodCard} ${method === "qr" ? styles.methodCardActive : ""}`}>
            <div className={styles.methodHeader}>
              <input type="radio" checked={method === "qr"} readOnly className={styles.radio} />

              <div className={styles.methodText}>
                <div>QR Code (PromptPay)</div>
                <div className={styles.methodHint}>Scan To Pay With Your Banking App</div>
              </div>
            </div>

            <div className={`${styles.qrBody} ${method === "qr" ? styles.qrBodyOpen : ""}`}>
              <div className={styles.qrInner}>
                <div className={styles.qrPreview}>QR Code</div>
                <button className={styles.uploadButton}>⬆ UPLOAD SLIP</button>
              </div>
            </div>
          </div>

          <div onClick={() => setMethod(method === "truemoney" ? "" : "truemoney")} className={`${styles.methodCard} ${method === "truemoney" ? styles.methodCardActive : ""}`}>
            <div className={styles.methodHeaderSimple}>
              <input type="radio" checked={method === "truemoney"} readOnly />

              <div className={styles.methodText}>
                <div>Truemoney Envelope</div>
                <div className={styles.methodHint}>Paste The Gift Envelope Link</div>

                <div className={`${styles.linkBody} ${method === "truemoney" ? styles.linkBodyOpen : ""}`}>
                  <input placeholder="https://gift.truemoney.com/..." onClick={(e) => e.stopPropagation()} className={styles.linkInput} />
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
