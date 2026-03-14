"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import config from "../../../config";
import SessionCache from "../../../lib/SessionCache";
import UserService from "../../../lib/UserService";
import { getCardBackImage, getCardImagePath } from "../../../lib/cardUtils";
import ProfileAvatar from "../../components/ProfileAvatar";
import styles from "../test.module.css";

interface ApiProduct {
  id: number;
  name: string;
  description: string;
  image: string;
  tokens: number;
  coins: number;
  type: string;
}

function toFolderName(name: string): string {
  return name.replace(/\s+/g, "_");
}

export default function CardShopPage() {
  const router = useRouter();
  const cachedProfile = SessionCache.getCachedProfileSnapshot();
  const [username, setUsername] = useState<string>(cachedProfile.username);
  const [coins, setCoins] = useState<number>(cachedProfile.coins);
  const [tokens, setTokens] = useState<number>(cachedProfile.tokens);
  const [selected, setSelected] = useState("card");
  const [hovered, setHovered] = useState<string | null>(null);
  const active = hovered || selected;

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [owned, setOwned] = useState<Set<number>>(new Set());
  const [buying, setBuying] = useState<number | null>(null);
  const [message, setMessage] = useState<{ id: number; text: string; ok: boolean } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await UserService.getUser();
        if (!data) return;
        setUsername(data.username || "");
        if (typeof data.coins === "number") setCoins(data.coins);
        if (typeof data.tokens === "number") setTokens(data.tokens);
        setOwned(new Set(data.inventory?.map(Number) ?? []));

        const token = sessionStorage.getItem("accessToken");
        const res = await fetch(`${config.apiUrl}/shop/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const all: ApiProduct[] = await res.json();
        setProducts(all.filter((p) => p.type === "card"));
      } catch (err) {
        console.error("failed to load shop", err);
      }
    };
    void load();
  }, []);

  const buy = async (product: ApiProduct) => {
    setBuying(product.id);
    setMessage(null);
    try {
      const token = sessionStorage.getItem("accessToken");
      const res = await fetch(`${config.apiUrl}/shop/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, payment: "coins" }),
      });
      const json = await res.json();
      if (res.ok) {
        setOwned((prev) => new Set([...prev, product.id]));
        setCoins((prev) => {
          const next = prev - product.coins;
          sessionStorage.setItem("cached_coins", String(next));
          return next;
        });
        setMessage({ id: product.id, text: "Purchased!", ok: true });
      } else {
        setMessage({ id: product.id, text: (json as { error?: string }).error || "Purchase failed", ok: false });
      }
    } catch {
      setMessage({ id: product.id, text: "Network error", ok: false });
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <div className={styles.profileSection}>
          <ProfileAvatar username={username} className={styles.profileAvatar} />
          <span className={styles.username}>{username}</span>
        </div>
        <div className={styles.resourcesSection}>
          <div className={styles.resourceBox}>
            <span className={styles.coinIcon}>🪙</span>
            <span className={styles.resourceValue}>{coins.toLocaleString()}</span>
          </div>
          <div className={styles.resourceBox}>
            <div className={styles.tokenIcon}>
              <span className={styles.tokenLetter}>T</span>
            </div>
            <span className={styles.resourceValue}>{tokens.toLocaleString()}</span>
            <button className={styles.plusButton}>+</button>
          </div>
        </div>
      </div>

      <button onClick={() => router.push("/")} className={styles.backButton}>← Lobby</button>
      <div className={styles.Title}><h2>Shop</h2></div>

      <div className={styles.main}>
        <div className={styles.sidebar}>
          <button
            className={active === "recommend" ? styles.active : ""}
            onMouseEnter={() => setHovered("recommend")} onMouseLeave={() => setHovered(null)}
            onClick={() => { setSelected("recommend"); router.push("/shop"); }}>
            Recommend
          </button>
          <button
            className={active === "theme" ? styles.active : ""}
            onMouseEnter={() => setHovered("theme")} onMouseLeave={() => setHovered(null)}
            onClick={() => { setSelected("theme"); router.push("/shop/theme"); }}>
            Theme
          </button>
          <button
            className={active === "card" ? styles.active : ""}
            onMouseEnter={() => setHovered("card")} onMouseLeave={() => setHovered(null)}
            onClick={() => { setSelected("card"); router.push("/shop/card"); }}>
            Card
          </button>
          <button
            className={active === "chips" ? styles.active : ""}
            onMouseEnter={() => setHovered("chips")} onMouseLeave={() => setHovered(null)}
            onClick={() => { setSelected("chips"); router.push("/shop/chips"); }}>
            Chips
          </button>
        </div>

        <div className={styles.content}>
          {products.length === 0 ? (
            <div style={{ gridColumn: "1/-1", color: "#fff", opacity: 0.6, fontSize: 18, padding: "60px 0", textAlign: "center" }}>
              No card skins available.
            </div>
          ) : (
            products.map((p) => {
              const isOwned = owned.has(p.id);
              const isLoading = buying === p.id;
              const msg = message?.id === p.id ? message : null;
              return (
                <div key={p.id} className={styles.product}>
                  <div className={styles.productPreview}>
                    {(() => {
                      const folder = toFolderName(p.name);
                      const cardStyle = { borderRadius: 6, objectFit: "fill" as const, boxShadow: "0 4px 12px rgba(0,0,0,0.5)" };
                      return (
                        <div style={{ position: "relative", width: 140, height: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ position: "absolute", left: 0, top: 10, transform: "rotate(-8deg)", zIndex: 1 }}>
                            <Image src={getCardBackImage(folder)} alt="back" width={75} height={110} unoptimized style={cardStyle} />
                          </div>
                          <div style={{ position: "absolute", right: 0, top: 10, transform: "rotate(8deg)", zIndex: 2 }}>
                            <Image src={getCardImagePath({ suit: "♥", rank: "K", value: 10 }, folder)} alt="king" width={75} height={110} unoptimized style={cardStyle} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div className={styles.productInfo}>
                    <strong>{p.name}</strong>
                    {isOwned ? (
                      <span style={{ color: "#4a7a4a", fontWeight: 700 }}>Owned</span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <span>🪙 {p.coins.toLocaleString()}</span>
                        <button
                          onClick={() => void buy(p)}
                          disabled={isLoading || coins < p.coins}
                          style={{
                            marginTop: 2,
                            padding: "4px 18px",
                            borderRadius: 12,
                            border: "none",
                            background: coins < p.coins ? "#aaa" : "#1F2A44",
                            color: "#fff",
                            fontWeight: 700,
                            cursor: coins < p.coins ? "not-allowed" : "pointer",
                            fontSize: 13,
                          }}>
                          {isLoading ? "..." : "Buy"}
                        </button>
                        {msg && (
                          <span style={{ fontSize: 12, color: msg.ok ? "#2a7a2a" : "#a00", marginTop: 2 }}>
                            {msg.text}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
