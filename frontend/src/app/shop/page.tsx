"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import config from "../../config";
import LocalStorage from "../../lib/LocalStorage";
import UserService from "../../lib/UserService";
import { getCardBackImage, getCardImagePath } from "../../lib/cardUtils";
import { ProductInterface } from "../../interfaces/API/ProductInterface";
import Navbar from "../components/Navbar";
import styles from "./shop.module.css";

type ShopTab = "recommend" | "table" | "card" | "chip";

const TAB_ORDER: ShopTab[] = ["recommend", "table", "card", "chip"];

const TAB_LABELS: Record<ShopTab, string> = {
  recommend: "Recommend",
  table: "Table",
  card: "Card",
  chip: "Chip",
};

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");

const CARD_PREVIEW_STYLE = {
  borderRadius: 6,
  objectFit: "fill" as const,
  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
};

export default function StorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<ShopTab>("recommend");
  const [hovered, setHovered] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductInterface[]>([]);
  const [owned, setOwned] = useState<Set<number>>(new Set());
  const [buying, setBuying] = useState<number | null>(null);
  const [message, setMessage] = useState<{ id: number; text: string; ok: boolean } | null>(null);
  const [coins, setCoins] = useState<number>(0);

  const active = hovered || selected;

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "recommend" || tab === "table" || tab === "card" || tab === "chip") {
      setSelected(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const data = await UserService.getUser();
      if (!data) {
        router.push("/auth");
        return;
      }

      if (typeof data.coins === "number" && !cancelled) {
        setCoins(data.coins);
      }

      const inventorySet = new Set<number>((data.inventory ?? []).map((item) => item.productId));

      try {
        const token = LocalStorage.getItem("accessToken");
        const res = await fetch(`${config.apiUrl}/shop/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok || cancelled) {
          return;
        }

        const all: ProductInterface[] = await res.json();
        if (!cancelled) {
          setProducts(all);
          setOwned(new Set(all.filter((p) => inventorySet.has(p.id)).map((p) => p.id)));
        }
      } catch {
        // ignore network errors on initial load
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const visibleProducts = useMemo(() => {
    const byTab = products.filter((p) => {
      if (selected === "recommend") {
        return p.isRecommend;
      }
      if (selected === "card") {
        return p.type === "card";
      }
      if (selected === "chip") {
        return p.type === "chip";
      }
      return p.type === "table";
    });

    if (selected === "recommend") {
      return [...byTab].sort((a, b) => Number(owned.has(a.id)) - Number(owned.has(b.id)));
    }

    return byTab;
  }, [owned, products, selected]);

  const buy = async (p: ProductInterface) => {
    setBuying(p.id);
    setMessage(null);

    try {
      const token = LocalStorage.getItem("accessToken");
      const res = await fetch(`${config.apiUrl}/shop/buy`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ productId: p.id, payment: "coins" }),
      });
      const data: { message?: string } = await res.json();

      if (res.ok) {
        setOwned((prev) => new Set([...prev, p.id]));
        setCoins((prev) => {
          const nextCoins = prev - p.coins;
          LocalStorage.setItem("coins", nextCoins.toString());
          return nextCoins;
        });
        setMessage({ id: p.id, text: "Purchased!", ok: true });
      } else {
        setMessage({ id: p.id, text: data.message || "Purchase failed", ok: false });
      }
    } catch {
      setMessage({ id: p.id, text: "Network error", ok: false });
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className={styles.container}>
      <Navbar />
      <button onClick={() => router.push("/")} className={styles.backButton}>
        ← Lobby
      </button>
      <div className={styles.Title}>
        <h2>Shop</h2>
      </div>

      <div className={styles.main}>
        <div className={styles.sidebar}>
          {TAB_ORDER.map((tab) => (
            <button
              key={tab}
              className={active === tab ? styles.active : ""}
              onMouseEnter={() => setHovered(tab)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(tab)}>
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {visibleProducts.length === 0 ? (
            <div style={{ gridColumn: "1/-1", color: "#fff", opacity: 0.65, fontSize: 18, padding: "60px 0", textAlign: "center" }}>No products available.</div>
          ) : (
            visibleProducts.map((p) => {
              const isOwned = owned.has(p.id);
              const isLoading = buying === p.id;
              const msg = message?.id === p.id ? message : null;

              return (
                <div key={p.id} className={styles.product}>
                  <div className={styles.productPreview}>
                    {p.type === "card" ? (
                      <div style={{ position: "relative", width: 140, height: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ position: "absolute", left: 0, top: 10, transform: "rotate(-8deg)", zIndex: 1 }}>
                          <Image src={getCardBackImage(p.path)} alt="back" width={75} height={110} unoptimized style={CARD_PREVIEW_STYLE} />
                        </div>
                        <div style={{ position: "absolute", right: 0, top: 10, transform: "rotate(8deg)", zIndex: 2 }}>
                          <Image src={getCardImagePath({ suit: "♥", rank: "K", value: 10 }, p.path)} alt="king" width={75} height={110} unoptimized style={CARD_PREVIEW_STYLE} />
                        </div>
                      </div>
                    ) : p.image ? (
                      <Image
                        src={p.image}
                        alt={p.name}
                        width={100}
                        height={100}
                        unoptimized
                        style={{ objectFit: "contain", maxWidth: "80%", maxHeight: "80%" }}
                      />
                    ) : (
                      <strong style={{ color: "#e6eaf2", fontSize: 18 }}>{p.type === "chip" ? "Chips" : "Theme"}</strong>
                    )}
                  </div>
                  <div className={styles.productInfo}>
                    <strong>{p.name}</strong>
                    {isOwned ? (
                      <span style={{ color: "#2f6b2f", fontWeight: 700 }}>Owned</span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <span>🪙 {NUMBER_FORMATTER.format(p.coins)}</span>
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
                        {msg && <span style={{ fontSize: 12, color: msg.ok ? "#2a7a2a" : "#a00", marginTop: 2 }}>{msg.text}</span>}
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
