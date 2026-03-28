"use client";

import Navbar from "@components/Navbar";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import PaymentService from "@lib/PaymentService";
import UserService from "@lib/UserService";

import { PaymentPackageInterface } from "@interfaces/API/PaymentPackageInterface";

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
  const [qrPayload, setQrPayload] = useState("");
  const [slipPreviewUrl, setSlipPreviewUrl] = useState("");
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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





  const handleConfirmPayment = async () => {
    setErrorMessage("");
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
      setShowSuccessModal(true);
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

  useEffect(() => {
    if (!slipFile) {
      setSlipPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(slipFile);
    setSlipPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [slipFile]);

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
                <div className={styles.qrPreviewRow}>
                  <div className={styles.qrPreview}>
                    {qrPayload ? (
                      <Image
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrPayload)}`}
                        alt="PromptPay QR"
                        width={220}
                        height={220}
                        unoptimized
                      />
                    ) : (
                      <div>Loading QR...</div>
                    )}
                  </div>

                  {slipPreviewUrl && (
                    <button
                      type="button"
                      className={styles.slipPreview}
                      onClick={(event) => {
                        event.stopPropagation();
                        setIsSlipModalOpen(true);
                      }}
                    >
                      <Image src={slipPreviewUrl} alt="Uploaded slip preview" width={120} height={120} unoptimized />
                    </button>
                  )}
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

      {isSlipModalOpen && slipPreviewUrl && (
        <div className={styles.slipModalOverlay} onClick={() => setIsSlipModalOpen(false)}>
          <div
            className={styles.slipModalBody}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <button type="button" className={styles.slipModalClose} onClick={() => setIsSlipModalOpen(false)}>
              Close
            </button>
            <Image src={slipPreviewUrl} alt="Uploaded slip full preview" className={styles.slipModalImage} width={1200} height={1600} unoptimized />
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className={styles.successOverlay}>
          <div className={styles.successModal}>
            <div className={styles.successIcon}>
              <svg viewBox="0 0 52 52" className={styles.checkmarkSvg}>
                <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none" />
                <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <h2 className={styles.successTitle}>ชำระเงินสำเร็จ!</h2>
            <div className={styles.successDetails}>
              <div className={styles.successRow}>
                <span className={styles.successLabel}>Package:</span>
                <span className={styles.successValue}>{displayTokens.toLocaleString()} Tokens</span>
              </div>
              <div className={styles.successDivider}>↑</div>
              <div className={styles.successRow}>
                <span className={styles.successLabel}>ราคา:</span>
                <span className={`${styles.successValue} ${styles.successValueGreen}`}>{displayPrice.toLocaleString()} THB</span>
              </div>
            </div>
            <button className={styles.successReturnButton} onClick={() => router.push("/topup")}>
              กลับไปหน้าเติมเงิน
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorMessage && (
        <div className={styles.errorOverlay} onClick={() => setErrorMessage("")}>
          <div className={styles.errorModal} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.errorCloseButton} onClick={() => setErrorMessage("")}>
              ✕
            </button>
            <div className={styles.errorIcon}>
              <svg viewBox="0 0 52 52" className={styles.errorSvg}>
                <circle className={styles.errorCircle} cx="26" cy="26" r="25" fill="none" />
                <path className={styles.errorX} fill="none" d="M16 16 36 36 M36 16 16 36" />
              </svg>
            </div>
            <h2 className={styles.errorTitle}>เกิดข้อผิดพลาด</h2>
            <p className={styles.errorText}>{errorMessage}</p>
            <button className={styles.errorOkButton} onClick={() => setErrorMessage("")}>
              ตกลง
            </button>
          </div>
        </div>
      )}
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
