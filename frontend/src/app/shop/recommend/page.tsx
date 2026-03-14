"use client";

import { useRouter } from "next/navigation";

import Navbar from "../../components/Navbar";
import styles from "../shop.module.css";

export default function StorePage() {
  const router = useRouter();
  const products = [
    { name: "Name", price: "price" },
    { name: "Name", price: "price" },
    { name: "Name", price: "price" },
  ];

  return (
    <div className={styles.container}>
      <Navbar />
      {/* Back Button */}
      <button onClick={() => router.push("/")} className={styles.backButton}>
        ← Lobby
      </button>
      {/* Mode Title */}
      <div className={styles.Title}>
        <h2>Shop</h2>
      </div>

      {/* ===== MAIN AREA ===== */}
      <div className={styles.main}>
        {/* SIDEBAR */}
        <div className={styles.sidebar}>
          <button className={styles.active} onClick={() => router.push("/shop/recommend")}>
            Recommend
          </button>
          <button onClick={() => router.push("/shop/theme")}>Theme</button>
          <button onClick={() => router.push("/shop/card")}>Card</button>
          <button onClick={() => router.push("/shop/chips")}>Chips</button>
        </div>

        {/* CONTENT */}
        <div className={styles.content}>
          {products.map((p, index) => (
            <div key={index} className={styles.product}>
              <div className={styles.productPreview}></div>
              <div className={styles.productInfo}>
                <strong>{p.name}</strong>
                <span>{p.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
