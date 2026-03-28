"use client";

import Navbar from "@components/Navbar";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "./table.module.css";

export default function TableSettingPage() {
  const router = useRouter();

  const [roomId, setRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [startingMoney, setStartingMoney] = useState(1000);
  const [minimumBet, setMinimumBet] = useState(50);

  // เพิ่ม State สำหรับจัดการตัวเลือกสกุลเงิน
  const [startingMoneyType, setStartingMoneyType] = useState("Coin");
  const [minimumBetType, setMinimumBetType] = useState("Coin");

  return (
    <div className={styles.container}>
      <Navbar />

      {/* Back Button */}
      <button className={styles.backButton} onClick={() => router.push("/")}>
        ← Lobby
      </button>

      {/* Title */}
      <div className={styles.Title}>
        <h2>Table Setting</h2>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Row 1 */}
        <div className={styles.row}>
          <div className={styles.inputGroup}>
            <label>Room ID</label>
            <input type="text" placeholder="XXXXXXXX" value={roomId} onChange={(e) => setRoomId(e.target.value)} />
          </div>

          <div className={styles.inputGroup}>
            <label>Room Password</label>
            <input type="password" placeholder="XXXXXX" value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} />
          </div>
        </div>

        {/* Row 2 */}
        <div className={styles.row}>
          {/* Starting Money */}
          <div className={styles.inputGroup}>
            <label>Starting Money</label>

            <div className={styles.inputWithSelect}>
              <Image src={startingMoneyType === "Token" ? "/icons/token.png" : "/icons/coin.png"} alt={startingMoneyType.toLowerCase()} className={styles.inputIcon} width={24} height={24} />

              <input type="number" value={startingMoney} onChange={(e) => setStartingMoney(Number(e.target.value))} />

              <select value={startingMoneyType} onChange={(e) => setStartingMoneyType(e.target.value)}>
                <option value="Coin">Coin</option>
                <option value="Token">Token</option>
              </select>
            </div>
          </div>

          {/* Minimum Bet */}
          <div className={styles.inputGroup}>
            <label>Minimum Bet</label>

            <div className={styles.inputWithSelect}>
              <Image src={minimumBetType === "Token" ? "/icons/token.png" : "/icons/coin.png"} alt={minimumBetType.toLowerCase()} className={styles.inputIcon} width={24} height={24} />

              <input type="number" value={minimumBet} onChange={(e) => setMinimumBet(Number(e.target.value))} />

              <select value={minimumBetType} onChange={(e) => setMinimumBetType(e.target.value)}>
                <option value="Coin">Coin</option>
                <option value="Token">Token</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Create Button */}
      <div className={styles.createButtonWrapper}>
        <button className={styles.createButton} onClick={() => router.push("/comingsoon")}>
          CREATE TABLE
        </button>
      </div>
    </div>
  );
}
