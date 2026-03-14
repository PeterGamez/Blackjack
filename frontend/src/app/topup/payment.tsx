"use client";

import { useState } from "react";

import styles from "./payment.module.css";

export default function PaymentPage() {
  const [method, setMethod] = useState("qr");

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Payment</h1>

      <div className={styles.panel}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>Order Summary</div>

          <div className={styles.summaryBody}>
            <div className={`${styles.summaryRow} ${styles.summaryRowBottom}`}>
              <span>Package</span>
              <span>10,000 Tokens</span>
            </div>

            <div className={`${styles.summaryRow} ${styles.summaryRowGap}`}>
              <span>Price</span>
              <span>729 THB</span>
            </div>

            <hr />

            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>729 THB</span>
            </div>
          </div>
        </div>

        <div className={styles.methods}>
          <div onClick={() => setMethod("qr")} className={`${styles.methodCard} ${method === "qr" ? styles.methodCardActive : ""}`}>
            <div className={styles.methodRow}>
              <input type="radio" checked={method === "qr"} readOnly />

              <div>
                <div>QR Code (PromptPay)</div>
                <div className={styles.methodHint}>Scan To Pay With Your Banking App</div>
              </div>
            </div>
          </div>

          <div onClick={() => setMethod("truemoney")} className={`${styles.methodCard} ${method === "truemoney" ? styles.methodCardActive : ""}`}>
            <div className={styles.methodRow}>
              <input type="radio" checked={method === "truemoney"} readOnly />

              <div>
                <div>Truemoney Envelope</div>
                <div className={styles.methodHint}>Paste The Gift Envelope Link</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.confirmButton}>CONFIRM PAYMENT</button>
      </div>
    </div>
  );
}
