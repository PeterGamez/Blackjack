"use client";

import { useEffect, useRef, useState } from "react";

import PaymentService from "@lib/PaymentService";
import UserService from "@lib/UserService";

import styles from "./TokenConverterModal.module.css";

interface TokenConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTokens: number;
}

export default function TokenConverterModal({ isOpen, onClose, availableTokens }: TokenConverterModalProps) {
  const [tokenAmount, setTokenAmount] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [convertedAmount, setConvertedAmount] = useState({ tokens: 0, coins: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const conversionRate = 5;
  const parsedTokens = parseInt(tokenAmount.replaceAll(",", "").trim(), 10) || 0;
  const coinsToReceive = parsedTokens * conversionRate;

  useEffect(() => {
    if (isOpen && inputRef.current && !showSuccess) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, showSuccess]);

  useEffect(() => {
    if (!isOpen) {
      setShowSuccess(false);
      setTokenAmount("");
    }
  }, [isOpen]);

  const handleConvert = async () => {
    if (parsedTokens <= 0) {
      window.alert("Please enter a valid token amount greater than 0");
      return;
    }

    if (parsedTokens > availableTokens) {
      window.alert("Insufficient tokens");
      return;
    }

    try {
      setIsConverting(true);
      await PaymentService.convertTokensToCoins(parsedTokens);
      await UserService.getUser();
      
      setConvertedAmount({ tokens: parsedTokens, coins: coinsToReceive });
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        setTokenAmount("");
        setTimeout(() => {
          onClose();
        }, 300);
      }, 3000);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to convert tokens");
    } finally {
      setIsConverting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isConverting && parsedTokens > 0) {
      handleConvert();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.closeButton} onClick={onClose} disabled={isConverting || showSuccess}>
          ✕
        </button>

        {showSuccess ? (
          <div className={styles.successView}>
            <div className={styles.successIcon}>
              <svg viewBox="0 0 52 52" className={styles.checkmarkSvg}>
                <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none" />
                <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <h2 className={styles.successTitle}>แปลงสำเร็จ!</h2>
            <div className={styles.successDetails}>
              <div className={styles.successRow}>
                <span className={styles.successLabel}>Token ที่แปลง:</span>
                <span className={styles.successValue}>-{convertedAmount.tokens.toLocaleString()}</span>
              </div>
              <div className={styles.successDivider}>→</div>
              <div className={styles.successRow}>
                <span className={styles.successLabel}>Coin ที่ได้รับ:</span>
                <span className={`${styles.successValue} ${styles.successValueGreen}`}>+{convertedAmount.coins.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h2 className={styles.title}>แปลง Token เป็น Coin</h2>

        <div className={styles.conversionInfo}>
          <div className={styles.rateBox}>
            <span className={styles.rateLabel}>อัตราแลกเปลี่ยน:</span>
            <span className={styles.rateValue}>1 Token = {conversionRate} Coins</span>
          </div>
        </div>

        <div className={styles.balanceInfo}>
          <span className={styles.balanceLabel}>Token ที่มีอยู่:</span>
          <span className={styles.balanceValue}>{availableTokens.toLocaleString()}</span>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="tokenAmount" className={styles.label}>
            จำนวน Token ที่ต้องการแปลง
          </label>
          <input
            ref={inputRef}
            id="tokenAmount"
            type="text"
            className={styles.input}
            value={tokenAmount}
            onChange={(e) => {
              const value = e.target.value.replaceAll(",", "");
              if (value === "" || /^\d+$/.test(value)) {
                setTokenAmount(value);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="0"
            disabled={isConverting}
          />
        </div>

        {parsedTokens > 0 && (
          <div className={styles.previewBox}>
            <div className={styles.previewRow}>
              <span>คุณจะได้รับ:</span>
              <span className={styles.previewCoins}>{coinsToReceive.toLocaleString()} Coins</span>
            </div>
          </div>
        )}

        {parsedTokens > availableTokens && (
          <div className={styles.errorMessage}>Token ไม่เพียงพอ</div>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onClose} disabled={isConverting}>
            ยกเลิก
          </button>
          <button type="button" className={styles.convertButton} onClick={handleConvert} disabled={isConverting || parsedTokens <= 0 || parsedTokens > availableTokens}>
            {isConverting ? "กำลังแปลง..." : "แปลง"}
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
