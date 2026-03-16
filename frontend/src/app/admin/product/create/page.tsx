"use client";

import Navbar from "@components/Navbar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AdminService from "@lib/AdminService";
import UserService from "@lib/UserService";

import styles from "../page.module.css";

type CreateProductDraft = {
  name: string;
  description: string;
  image: string;
  path: string;
  tokens: string;
  coins: string;
  type: "card" | "chip" | "table";
  isRecommend: boolean;
  isActive: boolean;
};

const defaultDraft: CreateProductDraft = {
  name: "",
  description: "",
  image: "",
  path: "",
  tokens: "",
  coins: "",
  type: "card",
  isRecommend: false,
  isActive: true,
};

export default function AdminProductCreatePage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [draft, setDraft] = useState<CreateProductDraft>(defaultDraft);
  const [isCreating, setIsCreating] = useState(false);
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

      setStatus("ready");
    };

    init();
  }, [router]);

  const handleCreate = async () => {
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

    setIsCreating(true);
    setError("");

    try {
      await AdminService.createProduct({
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

      router.push("/admin/product");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create product");
      setIsCreating(false);
    }
  };

  if (status === "loading") {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loadingState}>Loading...</div>
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
          <h1 className={styles.title}>Create Product</h1>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.grid} style={{ marginTop: 18 }}>
            <label className={styles.label}>
              Name
              <input className={styles.input} value={draft.name} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} />
            </label>

            <label className={styles.label}>
              Type
              <select className={styles.input} value={draft.type} onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value as CreateProductDraft["type"] }))}>
                <option value="card">card</option>
                <option value="chip">chip</option>
                <option value="table">table</option>
              </select>
            </label>

            <label className={styles.label}>
              Image URL
              <input className={styles.input} value={draft.image} onChange={(e) => setDraft((prev) => ({ ...prev, image: e.target.value }))} />
            </label>

            <label className={styles.label}>
              Asset Path
              <input className={styles.input} value={draft.path} onChange={(e) => setDraft((prev) => ({ ...prev, path: e.target.value }))} />
            </label>

            <label className={styles.label}>
              Tokens Cost
              <input className={styles.input} type="number" min={0} step={1} value={draft.tokens} onChange={(e) => setDraft((prev) => ({ ...prev, tokens: e.target.value }))} />
            </label>

            <label className={styles.label}>
              Coins Cost
              <input className={styles.input} type="number" min={0} step={1} value={draft.coins} onChange={(e) => setDraft((prev) => ({ ...prev, coins: e.target.value }))} />
            </label>

            <label className={styles.label}>
              Description
              <input className={styles.input} value={draft.description} onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))} />
            </label>

            <label className={styles.label}>
              <input className={styles.toggleInput} type="checkbox" checked={draft.isRecommend} onChange={(e) => setDraft((prev) => ({ ...prev, isRecommend: e.target.checked }))} />
              Recommended
              <div className={`${styles.toggleTrack}${draft.isRecommend ? ` ${styles.toggleTrackOn}` : ""}`}>
                <div className={`${styles.toggleThumb}${draft.isRecommend ? ` ${styles.toggleThumbOn}` : ""}`} />
              </div>
            </label>

            <label className={styles.label}>
              <input className={styles.toggleInput} type="checkbox" checked={draft.isActive} onChange={(e) => setDraft((prev) => ({ ...prev, isActive: e.target.checked }))} />
              Active
              <div className={`${styles.toggleTrack}${draft.isActive ? ` ${styles.toggleTrackOn}` : ""}`}>
                <div className={`${styles.toggleThumb}${draft.isActive ? ` ${styles.toggleThumbOn}` : ""}`} />
              </div>
            </label>
          </div>

          <div className={styles.actionRow} style={{ marginTop: 14 }}>
            <button type="button" className={styles.saveButton} onClick={handleCreate} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
