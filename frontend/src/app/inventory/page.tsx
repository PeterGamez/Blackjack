"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";

import Navbar from "@components/Navbar";

import { ProductInterface } from "@interfaces/API/ProductInterface";

import AuthService from "@lib/AuthService";
import LocalStorage from "@lib/LocalStorage";
import ShopService from "@lib/ShopService";
import UserService from "@lib/UserService";

import { getCardBackImage, getCardImage, getCardSkin, getChipImage, getChipSkin, getTableImage, getTableSkin } from "@utils/skinUtils";

import styles from "./page.module.css";

interface SkinItem {
  path: string;
  name: string;
  productId: number;
  type: ProductInterface["type"];
}

const BUILT_IN_SKINS: Record<ProductInterface["type"], SkinItem[]> = {
  card: [{ path: "default", name: "Default Card", productId: 0, type: "card" }],
  chip: [{ path: "default", name: "Default Chip", productId: 0, type: "chip" }],
  table: [{ path: "default", name: "Default Table", productId: 0, type: "table" }],
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

const STORAGE_KEY_BY_TAB: Record<ProductInterface["type"], "cardSkin" | "chipSkin" | "tableSkin"> = {
  card: "cardSkin",
  chip: "chipSkin",
  table: "tableSkin",
};

const PAYLOAD_KEY_BY_TAB: Record<ProductInterface["type"], "cardId" | "chipId" | "tableId"> = {
  card: "cardId",
  chip: "chipId",
  table: "tableId",
};

type SelectedSkinsState = Record<ProductInterface["type"], string>;
type OwnedSkinsState = Record<ProductInterface["type"], SkinItem[]>;

export default function InventoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProductInterface["type"]>("card");
  const [selectedSkins, setSelectedSkins] = useState<SelectedSkinsState>({ card: "default", chip: "default", table: "default" });
  const [ownedSkinsByType, setOwnedSkinsByType] = useState<OwnedSkinsState>({ card: [], chip: [], table: [] });
  const [hovered, setHovered] = useState<string>(null);
  const [equipMessage, setEquipMessage] = useState<{ ok: boolean; text: string }>(null);

  const resetToDefaultSkins = useCallback(() => {
    setOwnedSkinsByType({ card: [], chip: [], table: [] });
    setSelectedSkins({ card: "default", chip: "default", table: "default" });
    LocalStorage.setItem("cardSkin", "default");
    LocalStorage.setItem("chipSkin", "default");
    LocalStorage.setItem("tableSkin", "default");
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const data = await UserService.getUser();
      if (!data) {
        router.push("/auth");
        return;
      }

      if (!cancelled) {
        // Hydrate browser-cached skins after mount without sync setState in effect body.
        setSelectedSkins({
          card: getCardSkin(),
          chip: getChipSkin(),
          table: getTableSkin(),
        });
      }

      try {
        const products = await ShopService.getProducts();
        if (cancelled) {
          return;
        }

        const inventorySet = new Set((data.inventory ?? []).map((item) => item.productId));
        const ownedByType: OwnedSkinsState = { card: [], chip: [], table: [] };

        for (const product of products) {
          if (!inventorySet.has(product.id)) {
            continue;
          }

          if (product.type === "card") {
            ownedByType.card.push({
              path: product.path,
              name: product.name,
              productId: product.id,
              type: "card",
            });
            continue;
          }

          if (product.type === "chip") {
            ownedByType.chip.push({
              path: product.path,
              name: product.name,
              productId: product.id,
              type: "chip",
            });
            continue;
          }

          if (product.type === "table") {
            ownedByType.table.push({
              path: product.path,
              name: product.name,
              productId: product.id,
              type: "table",
            });
          }
        }

        if (!cancelled) {
          setOwnedSkinsByType(ownedByType);
        }
      } catch {
        if (!cancelled) {
          resetToDefaultSkins();
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [resetToDefaultSkins, router]);

  const selectSkin = useCallback(
    async (type: ProductInterface["type"], skinId: string, productId?: number) => {
      if (selectedSkins[type] === skinId) {
        return;
      }

      const previousSkin = selectedSkins[type];
      const storageKey = STORAGE_KEY_BY_TAB[type];
      const payloadKey = PAYLOAD_KEY_BY_TAB[type];

      setSelectedSkins((prev) => ({ ...prev, [type]: skinId }));
      LocalStorage.setItem(storageKey, skinId);
      setEquipMessage(null);

      try {
        await AuthService.updateCurrentUser({ [payloadKey]: productId ?? 0 });
        setEquipMessage({ ok: true, text: "Skin equipped" });

        // Best-effort sync from server; do not roll back a successful equip when sync fails.
        const latestUser = await UserService.getUser();
        if (latestUser) {
          setSelectedSkins({
            card: getCardSkin(),
            chip: getChipSkin(),
            table: getTableSkin(),
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to equip skin. Please try again.";
        setSelectedSkins((prev) => ({ ...prev, [type]: previousSkin }));
        LocalStorage.setItem(storageKey, previousSkin);
        setEquipMessage({ ok: false, text: errorMessage });
      }
    },
    [selectedSkins]
  );

  const activeHover = hovered || activeTab;
  const displayedSkins: SkinItem[] = useMemo(() => [...BUILT_IN_SKINS[activeTab], ...ownedSkinsByType[activeTab]], [activeTab, ownedSkinsByType]);

  return (
    <div className={styles.container}>
      <div className={styles.pageTopBar} aria-hidden="true" />
      <Navbar />

      <button onClick={() => router.push("/")} className={styles.backButton}>
        ← Lobby
      </button>
      <div className={styles.Title}>
        <h2>Inventory</h2>
      </div>
      {equipMessage && <div style={{ color: equipMessage.ok ? "#2f6b2f" : "#a00", fontWeight: 700, marginTop: 8 }}>{equipMessage.text}</div>}

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
              const isEquipped = selectedSkins[activeTab] === skin.path;
              const chipSize = 46;
              const chipPreviewWidth = 185;
              const chipPreviewHeight = 140;
              const chipLayerOffset = 4;

              return (
                <div
                  key={`${activeTab}-${skin.productId}-${skin.path}`}
                  className={`${styles.skinCard} ${isEquipped ? styles.skinEquipped : ""}`.trim()}
                  onClick={() => void selectSkin(activeTab, skin.path, skin.productId)}>
                  <div className={styles.skinPreview}>
                    {activeTab === "card" ? (
                      <div style={CARD_STACK_STYLE}>
                        <div style={CARD_BACK_WRAPPER_STYLE}>
                          <Image src={getCardBackImage(skin.path)} alt="back" width={75} height={110} unoptimized style={CARD_IMAGE_STYLE} />
                        </div>
                        <div style={CARD_FRONT_WRAPPER_STYLE}>
                          <Image src={getCardImage({ suit: "♥", rank: "K" }, skin.path)} alt="king" width={75} height={110} unoptimized style={CARD_IMAGE_STYLE} />
                        </div>
                      </div>
                    ) : activeTab === "chip" ? (
                      <div style={{ position: "relative", width: chipPreviewWidth, height: chipPreviewHeight }}>
                        {CHIP_PREVIEW_VALUES.map((value, index) => {
                          const layout = CHIP_STACK_LAYOUT[index];
                          const centerX = layout.x * chipPreviewWidth;
                          const bottomCenterY = layout.y * chipPreviewHeight;

                          return (
                            <div key={`${skin.path}-stack-${value}`} style={{ position: "absolute", inset: 0 }}>
                              {Array.from({ length: layout.layers }).map((_, layerIndex) => {
                                const y = bottomCenterY - layerIndex * chipLayerOffset;

                                return (
                                  <Image
                                    key={`${skin.path}-chip-${value}-${layerIndex}`}
                                    src={getChipImage(value, skin.path)}
                                    alt={`${skin.name} chip ${value}`}
                                    width={chipSize}
                                    height={chipSize}
                                    unoptimized
                                    style={{
                                      position: "absolute",
                                      left: centerX - chipSize / 2,
                                      top: y - chipSize / 2,
                                      transform: `rotate(${layout.tilt}deg)`,
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
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                        <Image src={getTableImage(skin.path)} alt={skin.name} width={120} height={120} unoptimized style={{ objectFit: "contain", maxWidth: "90%", maxHeight: "90%" }} />
                      </div>
                    )}
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
