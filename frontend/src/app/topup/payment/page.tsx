"use client";

import Navbar from "@components/Navbar";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";

import PaymentService from "@lib/PaymentService";
import UserService from "@lib/UserService";

import styles from "./page.module.css";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const packageId = Number(searchParams.get("packageId"));
  const buyTokens = searchParams.get("tokens");
  const price = searchParams.get("price");

  const [method, setMethod] = useState("");
  const [truemoneyUrl, setTruemoneyUrl] = useState("");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleConfirmPayment = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!packageId || Number.isNaN(packageId)) {
      setErrorMessage("Invalid package. Please return and select a package again.");
      return;
    }

    if (!method) {
      setErrorMessage("Please select a payment method.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (method === "qr") {
        if (!slipFile) {
          setErrorMessage("Please upload a payment slip image.");
          return;
        }

        await PaymentService.payByBankSlip(packageId, slipFile);
      }

      if (method === "truemoney") {
        if (!truemoneyUrl.trim()) {
          setErrorMessage("Please paste your TrueMoney envelope URL.");
          return;
        }

        await PaymentService.payByTrueMoney(packageId, truemoneyUrl.trim());
      }

      await UserService.getUser();
      setSuccessMessage("Payment successful. Your tokens have been updated.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageTopBar} aria-hidden="true" />
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

          <button className={styles.confirmButton} onClick={handleConfirmPayment} disabled={isSubmitting}>
            {isSubmitting ? "PROCESSING..." : "CONFIRM PAYMENT"}
          </button>

          {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
          {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
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
                <label className={styles.uploadButton}>
                  ⬆ UPLOAD SLIP
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setSlipFile(event.target.files?.[0] ?? null)}
                    className={styles.hiddenFileInput}
                  />
                </label>
                <div className={styles.selectedFileName}>{slipFile ? slipFile.name : "No file selected"}</div>
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
                  <input
                    placeholder="https://gift.truemoney.com/..."
                    onClick={(e) => e.stopPropagation()}
                    className={styles.linkInput}
                    value={truemoneyUrl}
                    onChange={(event) => setTruemoneyUrl(event.target.value)}
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
