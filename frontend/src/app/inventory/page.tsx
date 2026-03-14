"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import config from "../../config";
import LocalStorage from "../../lib/LocalStorage";
import UserService from "../../lib/UserService";
import { getCardBackImage, getCardImagePath } from "../../lib/cardUtils";
import Navbar from "../components/Navbar";
import styles from "./page.module.css";

type TabType = "card" | "chips" | "theme";

interface SkinItem {
  id: string; // folder name used in /cards/{id}/
  name: string;
  preview: string; // image path for preview
  productId?: number;
  builtIn?: boolean;
}

interface ApiProduct {
  id: number;
  name: string;
  image: string;
  type: string;
}

const BUILT_IN_SKINS: Record<TabType, SkinItem[]> = {
  card: [{ id: "Default", name: "Default", preview: "/cards/Default/backcard.png", builtIn: true }],
  chips: [],
  theme: [],
};

function toFolderName(name: string): string {
  return name.replace(/\s+/g, "_");
}

export default function InventoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("card");
  const [selectedCardSkin, setSelectedCardSkin] = useState<string>(LocalStorage.getItem("selectedCardSkin") ?? "Default");
  const [ownedSkins, setOwnedSkins] = useState<SkinItem[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await UserService.getUser();
      if (!data) {
        router.push("/auth");
        return;
      }

      if (!data.inventory?.length) return;

      try {
        const token = LocalStorage.getItem("accessToken");
        const res = await fetch(`${config.apiUrl}/shop/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const products: ApiProduct[] = await res.json();
        const inventorySet = new Set(data.inventory.map((item) => item.productId));
        const owned = products
          .filter((p) => inventorySet.has(p.id) && p.type === "card")
          .map((p) => ({
            id: toFolderName(p.name),
            name: p.name,
            preview: p.image || getCardBackImage(toFolderName(p.name)),
            productId: p.id,
          }));
        setOwnedSkins(owned);

        const matched = data.cardId ? owned.find((s) => s.productId === data.cardId) : null;
        const resolvedSkin = matched?.id ?? "Default";
        setSelectedCardSkin(resolvedSkin);
        LocalStorage.setItem("selectedCardSkin", resolvedSkin);
      } catch {
        // no products in DB yet — that's fine
      }
    };
    void load();
  }, [router]);

  const selectSkin = async (skinId: string, productId?: number) => {
    setSelectedCardSkin(skinId);
    LocalStorage.setItem("selectedCardSkin", skinId);
    const token = LocalStorage.getItem("accessToken");
    await fetch(`${config.apiUrl}/user/me`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: productId ?? 0 }),
    });
  };

  const activeHover = hovered || activeTab;
  const displayedSkins: SkinItem[] = activeTab === "card" ? [...BUILT_IN_SKINS.card, ...ownedSkins] : BUILT_IN_SKINS[activeTab];

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
          {(["card", "chips", "theme"] as TabType[]).map((tab) => (
            <button key={tab} className={activeHover === tab ? styles.active : ""} onMouseEnter={() => setHovered(tab)} onMouseLeave={() => setHovered(null)} onClick={() => setActiveTab(tab)}>
              {tab === "card" ? "Card Skins" : tab === "chips" ? "Chips" : "Theme"}
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {displayedSkins.length === 0 ? (
            <div className={styles.emptyState}>No items owned yet.</div>
          ) : (
            displayedSkins.map((skin) => {
              const isEquipped = activeTab === "card" && selectedCardSkin === skin.id;
              return (
                <div key={skin.id} className={`${styles.skinCard} ${isEquipped ? styles.skinEquipped : ""}`.trim()} onClick={() => activeTab === "card" && selectSkin(skin.id, skin.productId)}>
                  <div className={styles.skinPreview}>
                    <div style={{ position: "relative", width: 140, height: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ position: "absolute", left: 0, top: 10, transform: "rotate(-8deg)", zIndex: 1 }}>
                        <Image
                          src={getCardBackImage(skin.id)}
                          alt="back"
                          width={75}
                          height={110}
                          unoptimized
                          style={{ borderRadius: 6, objectFit: "fill" as const, boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}
                        />
                      </div>
                      <div style={{ position: "absolute", right: 0, top: 10, transform: "rotate(8deg)", zIndex: 2 }}>
                        <Image
                          src={getCardImagePath({ suit: "♥", rank: "K", value: 10 }, skin.id)}
                          alt="king"
                          width={75}
                          height={110}
                          unoptimized
                          style={{ borderRadius: 6, objectFit: "fill" as const, boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}
                        />
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
