"use client";

import Navbar from "@components/Navbar";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { ProductInterface } from "@interfaces/API/ProductInterface";

import LocalStorage from "@lib/LocalStorage";
import UserService from "@lib/UserService";
import { getCardBackImage, getCardImage, getChipImage, getTableImage } from "@utils/skinUtils";

import ShopService from "@lib/ShopService";

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
const CHIP_PREVIEW_VALUES = [1000, 500, 100, 25, 10, 5, 1];
const CHIP_STACK_LAYOUT = [
  { x: 0.18, y: 0.62, layers: 9, tilt: -9 },
  { x: 0.42, y: 0.56, layers: 10, tilt: -2 },
  { x: 0.67, y: 0.62, layers: 8, tilt: 8 },
  { x: 0.3, y: 0.75, layers: 7, tilt: -6 },
  { x: 0.56, y: 0.7, layers: 8, tilt: 4 },
  { x: 0.78, y: 0.8, layers: 6, tilt: 10 },
  { x: 0.47, y: 0.86, layers: 5, tilt: 0 },
];

const CARD_PREVIEW_STYLE = {
  borderRadius: 6,
  objectFit: "fill" as const,
  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
};

function getProductPayment(product: ProductInterface): { type: "coins" | "tokens"; amount: number } {
  if (product.coins > 0) {
    return { type: "coins", amount: product.coins };
  }

  if (product.tokens > 0) {
    return { type: "tokens", amount: product.tokens };
  }

  return null;
}

function StorePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<ShopTab>("recommend");
  const [hovered, setHovered] = useState<string>(null);
  const [products, setProducts] = useState<ProductInterface[]>([]);
  const [owned, setOwned] = useState<Set<number>>(new Set());
  const [buying, setBuying] = useState<number>(null);
  const [message, setMessage] = useState<{ id: number; text: string; ok: boolean }>(null);
  const [coins, setCoins] = useState<number>(0);
  const [tokens, setTokens] = useState<number>(0);

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

      if (typeof data.tokens === "number" && !cancelled) {
        setTokens(data.tokens);
      }

      const inventorySet = new Set<number>((data.inventory ?? []).map((item) => item.productId));

      try {
        const all: ProductInterface[] = await ShopService.getProducts();
        if (cancelled) {
          return;
        }

        const ownedIds = new Set<number>();
        for (const product of all) {
          if (inventorySet.has(product.id)) {
            ownedIds.add(product.id);
          }
        }

        setProducts(all);
        setOwned(ownedIds);
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
    const payment = getProductPayment(p);
    if (!payment) {
      setMessage({ id: p.id, text: "This product is not purchasable", ok: false });
      return;
    }

    setBuying(p.id);
    setMessage(null);

    try {
      await ShopService.buyProduct(p.id, payment.type);
      setOwned((prev) => new Set([...prev, p.id]));

      if (payment.type === "coins") {
        const nextCoins = coins - payment.amount;
        setCoins(nextCoins);
        LocalStorage.setItem("coins", nextCoins.toString());
      } else {
        const nextTokens = tokens - payment.amount;
        setTokens(nextTokens);
        LocalStorage.setItem("tokens", nextTokens.toString());
      }

      setMessage({ id: p.id, text: "Purchased!", ok: true });
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Network error";
      setMessage({ id: p.id, text: messageText, ok: false });
    } finally {
      setBuying(null);
    }
  };

  const isRecommendTab = selected === "recommend";

  return (
    <div className={styles.container}>
      <div className={styles.pageTopBar} aria-hidden="true" />
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
            <button key={tab} className={active === tab ? styles.active : ""} onMouseEnter={() => setHovered(tab)} onMouseLeave={() => setHovered(null)} onClick={() => setSelected(tab)}>
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        <div className={`${styles.content} ${isRecommendTab ? styles.recommendContent : ""}`}>
          {visibleProducts.length === 0 ? (
            <div
              style={
                isRecommendTab
                  ? { color: "#fff", opacity: 0.65, fontSize: 18, padding: "60px 0", textAlign: "center", width: "100%" }
                  : { gridColumn: "1/-1", color: "#fff", opacity: 0.65, fontSize: 18, padding: "60px 0", textAlign: "center" }
              }>
              No products available.
            </div>
          ) : (
            visibleProducts.map((p) => {
              const isOwned = owned.has(p.id);
              const isLoading = buying === p.id;
              const msg = message?.id === p.id ? message : null;
              const payment = getProductPayment(p);
              const isTokenPayment = payment?.type === "tokens";
              const balance = isTokenPayment ? tokens : coins;
              const canAfford = Boolean(payment) && balance >= (payment?.amount ?? 0);
              const currencyLabel = isTokenPayment ? "token" : "coin";
              const priceText = payment ? `${NUMBER_FORMATTER.format(payment.amount)} ${currencyLabel}` : "Not for sale";
              const cardPreviewWidth = isRecommendTab ? 220 : 140;
              const cardPreviewHeight = isRecommendTab ? 160 : 110;
              const cardWidth = isRecommendTab ? 110 : 75;
              const cardHeight = isRecommendTab ? 160 : 110;
              const cardTopOffset = isRecommendTab ? 0 : 10;
              const chipSize = isRecommendTab ? 68 : 48;
              const chipPreviewWidth = isRecommendTab ? 260 : 185;
              const chipPreviewHeight = isRecommendTab ? 200 : 140;
              const chipLayerOffset = isRecommendTab ? 6 : 4;

              return (
                <div key={p.id} className={`${styles.product} ${isRecommendTab ? styles.recommendProduct : ""}`}>
                  <div className={styles.productPreview}>
                    {p.type === "card" ? (
                      <div style={{ position: "relative", width: cardPreviewWidth, height: cardPreviewHeight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ position: "absolute", left: 0, top: cardTopOffset, transform: "rotate(-8deg)", zIndex: 1 }}>
                          <Image src={getCardBackImage(p.path)} alt="back" width={cardWidth} height={cardHeight} unoptimized style={CARD_PREVIEW_STYLE} />
                        </div>
                        <div style={{ position: "absolute", right: 0, top: cardTopOffset, transform: "rotate(8deg)", zIndex: 2 }}>
                          <Image src={getCardImage({ suit: "♥", rank: "K" }, p.path)} alt="king" width={cardWidth} height={cardHeight} unoptimized style={CARD_PREVIEW_STYLE} />
                        </div>
                      </div>
                    ) : p.type === "chip" ? (
                      <div style={{ position: "relative", width: chipPreviewWidth, height: chipPreviewHeight }}>
                        {CHIP_PREVIEW_VALUES.map((value, index) => {
                          const layout = CHIP_STACK_LAYOUT[index];
                          const centerX = layout.x * chipPreviewWidth;
                          const bottomCenterY = layout.y * chipPreviewHeight;
                          const layerCount = isRecommendTab ? layout.layers : Math.max(3, layout.layers - 2);
                          const tilt = isRecommendTab ? layout.tilt : layout.tilt * 0.7;

                          return (
                            <div key={`${p.id}-stack-${value}`} style={{ position: "absolute", inset: 0 }}>
                              {Array.from({ length: layerCount }).map((_, layerIndex) => {
                                const y = bottomCenterY - layerIndex * chipLayerOffset;

                                return (
                                  <Image
                                    key={`${p.id}-chip-${value}-${layerIndex}`}
                                    src={getChipImage(value, p.path)}
                                    alt={`${p.name} chip ${value}`}
                                    width={chipSize}
                                    height={chipSize}
                                    unoptimized
                                    style={{
                                      position: "absolute",
                                      left: centerX - chipSize / 2,
                                      top: y - chipSize / 2,
                                      transform: `rotate(${tilt}deg)`,
                                      transformOrigin: "center center",
                                      zIndex: 100 + index * 10 + layerIndex,
                                      objectFit: "contain",
                                      filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.3))",
                                    }}
                                  />
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <Image
                        src={getTableImage(p.path)}
                        alt={p.name}
                        width={isRecommendTab ? 180 : 100}
                        height={isRecommendTab ? 180 : 100}
                        unoptimized
                        style={{ objectFit: "contain", maxWidth: isRecommendTab ? "90%" : "80%", maxHeight: isRecommendTab ? "90%" : "80%" }}
                      />
                    )}
                  </div>
                  <div className={styles.productInfo}>
                    <strong>{p.name}</strong>
                    {isOwned ? (
                      <span style={{ color: "#2f6b2f", fontWeight: 700 }}>Owned</span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          {isTokenPayment ? (
                            <img src="/icons/token.png" alt="ticket" style={{ width: 35 }} />
                            ) : (
                              <img src="/icons/coin.png" alt="coin" style={{ width: 35 }} />
                            )} {priceText}
                        </span>
                        <button
                          onClick={() => void buy(p)}
                          disabled={isLoading || !canAfford}
                          style={{
                            marginTop: 2,
                            padding: "4px 18px",
                            borderRadius: 12,
                            border: "none",
                            background: canAfford ? "#1F2A44" : "#aaa",
                            color: "#fff",
                            fontWeight: 700,
                            cursor: canAfford ? "pointer" : "not-allowed",
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

export default function StorePage() {
  return (
    <Suspense fallback={null}>
      <StorePageContent />
    </Suspense>
  );
}