"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import Navbar from "../../components/Navbar";
import styles from "../test.module.css";

export default function StorePage() {
  const router = useRouter();
  const [selected, setSelected] = useState("theme");
  const [hovered, setHovered] = useState<string | null>(null);
  const active = hovered || selected;
  const products = [
    { name: "Name", price: "price" },
    { name: "Name", price: "price" },
    { name: "Name", price: "price" },
    { name: "Name", price: "price" },
    { name: "Name", price: "price" },
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
          <button
            className={active === "recommend" ? styles.active : ""}
            onMouseEnter={() => setHovered("recommend")}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              setSelected("recommend");
              router.push("/shop");
            }}>
            Recommend
          </button>

          <button
            className={active === "theme" ? styles.active : ""}
            onMouseEnter={() => setHovered("theme")}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              setSelected("theme");
              router.push("/shop/theme");
            }}>
            Theme
          </button>

          <button
            className={active === "card" ? styles.active : ""}
            onMouseEnter={() => setHovered("card")}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              setSelected("card");
              router.push("/shop/card");
            }}>
            Card
          </button>

          <button
            className={active === "chips" ? styles.active : ""}
            onMouseEnter={() => setHovered("chips")}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              setSelected("chips");
              router.push("/shop/chips");
            }}>
            Chips
          </button>
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
