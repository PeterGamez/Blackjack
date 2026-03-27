"use client";

import Navbar from "@components/Navbar";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import PaymentService from "@lib/PaymentService";
import UserService from "@lib/UserService";

import { PaymentPackageInterface } from "@/interfaces/API/PaymentPackageInterface";

import styles from "./page.module.css";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const packageId = useMemo(() => Number(searchParams.get("packageId")), [searchParams]);

  const [method, setMethod] = useState("");
  const [truemoneyUrl, setTruemoneyUrl] = useState("");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPackage, setIsLoadingPackage] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<PaymentPackageInterface | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [qrPayload, setQrPayload] = useState("");

  useEffect(() => {
    const initPaymentPage = async () => {
      setErrorMessage("");

      if (!packageId || Number.isNaN(packageId)) {
        setErrorMessage("Invalid package. Please return and select a package again.");
        setIsLoadingPackage(false);
        return;
      }

      try {
        const user = await UserService.getUser();
        if (!user) {
          router.replace("/auth");
          return;
        }

        const paymentPackage = await PaymentService.getPackageById(packageId);
        setSelectedPackage(paymentPackage);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load package");
      } finally {
        setIsLoadingPackage(false);
      }
    };

    initPaymentPage();
  }, [packageId, router]);



  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      router.push("/topup");
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [successMessage, router]);

  const handleConfirmPayment = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!packageId || Number.isNaN(packageId)) {
      setErrorMessage("Invalid package. Please return and select a package again.");
      return;
    }

    if (!selectedPackage) {
      setErrorMessage("Package not loaded. Please try again.");
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
      } else if (method === "truemoney") {
        if (!truemoneyUrl.trim()) {
          setErrorMessage("Please paste your TrueMoney envelope URL.");
          return;
        }

        await PaymentService.payByTrueMoney(packageId, truemoneyUrl.trim());
      } else {
        setErrorMessage("Invalid payment method selected.");
        return;
      }

      await UserService.getUser();
      setSuccessMessage("Payment successful. Your tokens have been updated. Redirecting...");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!selectedPackage) return;

    PaymentService.getQrPayload(selectedPackage.id)
      .then(setQrPayload)
      .catch(() => setQrPayload(""));
  }, [selectedPackage]);

  const displayTokens = selectedPackage?.tokens ?? 0;
  const displayPrice = selectedPackage?.price ?? 0;

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
                <span>{isLoadingPackage ? "Loading..." : `${displayTokens.toLocaleString()} Tokens`}</span>
              </div>

              <div className={`${styles.summaryRow} ${styles.summaryRowSpaced}`}>
                <span>Price</span>
                <span>{isLoadingPackage ? "Loading..." : `${displayPrice} THB`}</span>
              </div>

              <hr className={styles.summaryDivider} />

              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span>{isLoadingPackage ? "Loading..." : `${displayPrice} THB`}</span>
              </div>
            </div>
          </div>

          <button className={styles.confirmButton} onClick={handleConfirmPayment} disabled={isSubmitting || isLoadingPackage || !selectedPackage}>
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
              <div className={styles.qrPreview}>
  <div className={styles.qrPreview}>
  {qrPayload ? (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrPayload)}`}
      alt="PromptPay QR"
    />
  ) : (
    <div>Loading QR...</div>
  )}
</div>
</div>
                <label className={styles.uploadButton}>
                  ⬆ UPLOAD SLIP
                  <input type="file" accept="image/*" onChange={(event) => setSlipFile(event.target.files?.[0] ?? null)} className={styles.hiddenFileInput} />
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