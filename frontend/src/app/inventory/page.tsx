"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";

import { ProductInterface } from "@interfaces/API/ProductInterface";

import LocalStorage from "@lib/LocalStorage";
import UserService from "@lib/UserService";
import { getCardBackImage, getCardImagePath, getSelectedCardSkin } from "@lib/cardUtils";

import config from "@/config";

import Navbar from "../components/Navbar";
import styles from "./page.module.css";

interface SkinItem {
  path: string; // folder name used in /cards/{id}/
  name: string;
  preview: string; // image path for preview
  productId: number;
}

const BUILT_IN_SKINS: Record<ProductInterface["type"], SkinItem[]> = {
  card: [{ path: "default", name: "Default Card", preview: "/cards/default/backcard.png", productId: 0 }],
  chip: [{ path: "default", name: "Default Chip", preview: "/chips/default.png", productId: 0 }],
  table: [{ path: "default", name: "Default Table", preview: "/tables/default.png", productId: 0 }],
};

const TABS: ProductInterface["type"][] = ["card", "chip", "table"];

const CARD_STACK_STYLE: CSSProperties = {
  position: "relative",
  width: 140,
  height: 110,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const CARD_BACK_WRAPPER_STYLE: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 10,
  transform: "rotate(-8deg)",
  zIndex: 1,
};

const CARD_FRONT_WRAPPER_STYLE: CSSProperties = {
  position: "absolute",
  right: 0,
  top: 10,
  transform: "rotate(8deg)",
  zIndex: 2,
};

const CARD_IMAGE_STYLE: CSSProperties = {
  borderRadius: 6,
  objectFit: "fill",
  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
};

const TAB_LABELS: Record<ProductInterface["type"], string> = {
  card: "Card Skins",
  chip: "Chip Skins",
  table: "Table Skins",
};

export default function InventoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProductInterface["type"]>("card");
  const [selectedCardSkin, setSelectedCardSkin] = useState<string>("default");
  const [ownedSkins, setOwnedSkins] = useState<SkinItem[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

  const resetToDefaultSkin = useCallback(() => {
    setOwnedSkins([]);
    setSelectedCardSkin("default");
    LocalStorage.setItem("selectedCardSkin", "default");
  }, []);

  useEffect(() => {
    // Keep the first SSR/CSR render deterministic; hydrate browser-cached skin after mount.
    setSelectedCardSkin(getSelectedCardSkin());

    let cancelled = false;

    const load = async () => {
      const data = await UserService.getUser();
      if (!data) {
        router.push("/auth");
        return;
      }

      try {
        const token = LocalStorage.getItem("accessToken");
        const res = await fetch(`${config.apiUrl}/shop/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (!cancelled) {
            resetToDefaultSkin();
          }
          return;
        }
        const products: ProductInterface[] = await res.json();
        const inventorySet = new Set((data.inventory ?? []).map((item) => item.productId));
        const owned = products
          .filter((p) => inventorySet.has(p.id) && p.type === "card")
          .map((p) => ({
            path: p.path,
            name: p.name,
            preview: p.image || getCardBackImage(p.path),
            productId: p.id,
          }));
        if (!cancelled) {
          setOwnedSkins(owned);
        }
      } catch {
        if (!cancelled) {
          resetToDefaultSkin();
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [resetToDefaultSkin, router]);

  const selectSkin = useCallback(
    async (skinId: string, productId?: number) => {
      if (selectedCardSkin === skinId) {
        return;
      }

      const previousSkin = selectedCardSkin;
      setSelectedCardSkin(skinId);
      LocalStorage.setItem("selectedCardSkin", skinId);
      const token = LocalStorage.getItem("accessToken");
      try {
        const res = await fetch(`${config.apiUrl}/user/me`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: productId ?? 0 }),
        });

        if (!res.ok) {
          throw new Error("Failed to update selected skin");
        }
      } catch {
        setSelectedCardSkin(previousSkin);
        LocalStorage.setItem("selectedCardSkin", previousSkin);
      }
    },
    [selectedCardSkin]
  );

  const activeHover = hovered || activeTab;
  const displayedSkins: SkinItem[] = useMemo(() => (activeTab === "card" ? [...BUILT_IN_SKINS.card, ...ownedSkins] : BUILT_IN_SKINS[activeTab]), [activeTab, ownedSkins]);

  return (
    <div className={styles.container}>
      <Navbar />

      <button onClick={() => router.push("/")} className={styles.backButton}>
        ← Lobby
      </button>
      <div className={styles.Title}>
        <h2>Inventory</h2>
      </div>

      <div className={styles.main}>
        <div className={styles.sidebar}>
          {TABS.map((tab) => (
            <button key={tab} className={activeHover === tab ? styles.active : ""} onMouseEnter={() => setHovered(tab)} onMouseLeave={() => setHovered(null)} onClick={() => setActiveTab(tab)}>
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {displayedSkins.length === 0 ? (
            <div className={styles.emptyState}>No items owned yet.</div>
          ) : (
            displayedSkins.map((skin) => {
              const isEquipped = activeTab === "card" && selectedCardSkin === skin.path;
              return (
                <div key={skin.path} className={`${styles.skinCard} ${isEquipped ? styles.skinEquipped : ""}`.trim()} onClick={() => activeTab === "card" && selectSkin(skin.path, skin.productId)}>
                  <div className={styles.skinPreview}>
                    <div style={CARD_STACK_STYLE}>
                      <div style={CARD_BACK_WRAPPER_STYLE}>
                        <Image src={getCardBackImage(skin.path)} alt="back" width={75} height={110} unoptimized style={CARD_IMAGE_STYLE} />
                      </div>
                      <div style={CARD_FRONT_WRAPPER_STYLE}>
                        <Image src={getCardImagePath({ suit: "♥", rank: "K", value: 10 }, skin.path)} alt="king" width={75} height={110} unoptimized style={CARD_IMAGE_STYLE} />
                      </div>
                    </div>
                  </div>
                  <div className={styles.skinInfo}>
                    <strong>{skin.name}</strong>
                    {isEquipped && <span className={styles.equippedBadge}>Equipped</span>}
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
