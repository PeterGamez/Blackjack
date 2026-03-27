"use client";

import Navbar from "@components/Navbar";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AdminService from "@lib/AdminService";
import UserService from "@lib/UserService";

import { ProductInterface } from "@interfaces/Admin/ProductInterface";
import { CurrencyType } from "@interfaces/CurrencyType";

import styles from "../page.module.css";

type AdminProductDraft = Omit<ProductInterface, CurrencyType> & {
  tokens: string;
  coins: string;
};

const mapProductToDraft = (product: ProductInterface): AdminProductDraft => ({
  ...product,
  tokens: product.tokens.toString(),
  coins: product.coins.toString(),
});

export default function AdminProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const productId = parseInt(params.id as string);

  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [product, setProduct] = useState<ProductInterface>(null);
  const [draft, setDraft] = useState<AdminProductDraft>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      const currentUser = await UserService.getUser();
      if (!currentUser) {
        router.push("/auth");
        return;
      }

      if (currentUser.role !== "admin") {
        router.push("/profile");
        return;
      }

      if (isNaN(productId)) {
        router.push("/admin/product");
        return;
      }

      try {
        const p = await AdminService.getProduct(productId);
        setProduct(p);
        setDraft(mapProductToDraft(p));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load product");
      }

      setStatus("ready");
    };

    init();
  }, [router, productId]);

  const handleDraftChange = <T extends keyof AdminProductDraft>(field: T, value: AdminProductDraft[T]) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!draft) return;

    const tokens = Number(draft.tokens);
    const coins = Number(draft.coins);

    if (!draft.name.trim() || !draft.description.trim() || !draft.image.trim() || !draft.path.trim()) {
      setError("Name, description, image, and path are required");
      return;
    }

    if (!Number.isInteger(tokens) || tokens < 0) {
      setError("Tokens must be integer >= 0");
      return;
    }

    if (!Number.isInteger(coins) || coins < 0) {
      setError("Coins must be integer >= 0");
      return;
    }

    if (tokens === 0 && coins === 0) {
      setError("At least one of tokens or coins must be greater than 0");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await AdminService.updateProduct(productId, {
        name: draft.name.trim(),
        description: draft.description.trim(),
        image: draft.image.trim(),
        path: draft.path.trim(),
        tokens,
        coins,
        type: draft.type,
        isRecommend: draft.isRecommend,
        isActive: draft.isActive,
      });

      const updated = await AdminService.getProduct(productId);
      setProduct(updated);
      setDraft(mapProductToDraft(updated));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update product");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loadingState}>Loading product...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.container}>
        <button type="button" className={styles.backButton} onClick={() => router.push("/admin/product")}>
          ← Back to Products
        </button>

        <div className={styles.card}>
          <h1 className={styles.title}>Edit Product{product ? `: ${product.name}` : ""}</h1>

          {error && <p className={styles.error}>{error}</p>}

          {draft && (
            <>
              <div className={styles.grid} style={{ marginTop: 18 }}>
                <label className={styles.label}>
                  Name
                  <input className={styles.input} value={draft.name} onChange={(e) => handleDraftChange("name", e.target.value)} />
                </label>

                <label className={styles.label}>
                  Type
                  <select className={styles.input} value={draft.type} onChange={(e) => handleDraftChange("type", e.target.value as AdminProductDraft["type"])}>
                    <option value="card">card</option>
                    <option value="chip">chip</option>
                    <option value="table">table</option>
                  </select>
                </label>

                <label className={styles.label}>
                  Image URL
                  <input className={styles.input} value={draft.image} onChange={(e) => handleDraftChange("image", e.target.value)} />
                </label>

                <label className={styles.label}>
                  Asset Path
                  <input className={styles.input} value={draft.path} onChange={(e) => handleDraftChange("path", e.target.value)} />
                </label>

                <label className={styles.label}>
                  Tokens Cost
                  <input className={styles.input} type="number" min={0} step={1} value={draft.tokens} onChange={(e) => handleDraftChange("tokens", e.target.value)} />
                </label>

                <label className={styles.label}>
                  Coins Cost
                  <input className={styles.input} type="number" min={0} step={1} value={draft.coins} onChange={(e) => handleDraftChange("coins", e.target.value)} />
                </label>

                <label className={styles.label}>
                  <input className={styles.toggleInput} type="checkbox" checked={draft.isRecommend} onChange={(e) => handleDraftChange("isRecommend", e.target.checked)} />
                  Recommended
                  <div className={`${styles.toggleTrack}${draft.isRecommend ? ` ${styles.toggleTrackOn}` : ""}`}>
                    <div className={`${styles.toggleThumb}${draft.isRecommend ? ` ${styles.toggleThumbOn}` : ""}`} />
                  </div>
                </label>

                <label className={styles.label}>
                  <input className={styles.toggleInput} type="checkbox" checked={draft.isActive} onChange={(e) => handleDraftChange("isActive", e.target.checked)} />
                  Active
                  <div className={`${styles.toggleTrack}${draft.isActive ? ` ${styles.toggleTrackOn}` : ""}`}>
                    <div className={`${styles.toggleThumb}${draft.isActive ? ` ${styles.toggleThumbOn}` : ""}`} />
                  </div>
                </label>

                <label className={styles.label} style={{ gridColumn: "1 / -1" }}>
                  Description
                  <input className={styles.input} value={draft.description} onChange={(e) => handleDraftChange("description", e.target.value)} />
                </label>
              </div>

              <div className={styles.actionRow} style={{ marginTop: 14 }}>
                <button type="button" className={styles.saveButton} onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Product"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
