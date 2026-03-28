"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Navbar from "@components/Navbar";

import AdminService from "@lib/AdminService";
import UserService from "@lib/UserService";

import styles from "../page.module.css";

type CreatePackageDraft = {
  image: string;
  price: string;
  tokens: string;
  isActive: boolean;
};

const defaultDraft: CreatePackageDraft = {
  image: "",
  price: "",
  tokens: "",
  isActive: true,
};

export default function AdminPackageCreatePage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [draft, setDraft] = useState<CreatePackageDraft>(defaultDraft);
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
    const price = Number(draft.price);
    const tokens = Number(draft.tokens);

    if (!draft.image.trim()) {
      setError("Image is required");
      return;
    }

    if (!Number.isInteger(price) || price <= 0) {
      setError("Price must be integer > 0");
      return;
    }

    if (!Number.isInteger(tokens) || tokens <= 0) {
      setError("Tokens must be integer > 0");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      await AdminService.createPackage({
        image: draft.image.trim(),
        price,
        tokens,
        isActive: draft.isActive,
      });

      router.push("/admin/package");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create package");
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
        <button type="button" className={styles.backButton} onClick={() => router.push("/admin/package")}>
          ← Back to Packages
        </button>

        <div className={styles.card}>
          <h1 className={styles.title}>Create Package</h1>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.grid} style={{ marginTop: 18 }}>
            <label className={styles.label}>
              Image URL
              <input className={styles.input} value={draft.image} onChange={(e) => setDraft((prev) => ({ ...prev, image: e.target.value }))} />
            </label>

            <label className={styles.label}>
              Price (THB)
              <input className={styles.input} type="number" min={1} step={1} value={draft.price} onChange={(e) => setDraft((prev) => ({ ...prev, price: e.target.value }))} />
            </label>

            <label className={styles.label}>
              Tokens
              <input className={styles.input} type="number" min={1} step={1} value={draft.tokens} onChange={(e) => setDraft((prev) => ({ ...prev, tokens: e.target.value }))} />
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
              {isCreating ? "Creating..." : "Create Package"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
