"use client";

import Navbar from "@components/Navbar";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AdminService, { AdminPackage } from "@lib/AdminService";
import UserService from "@lib/UserService";

import styles from "../page.module.css";

type AdminPackageDraft = Omit<AdminPackage, "price" | "tokens"> & {
  price: string;
  tokens: string;
};

const mapPackageToDraft = (pkg: AdminPackage): AdminPackageDraft => ({
  ...pkg,
  price: pkg.price.toString(),
  tokens: pkg.tokens.toString(),
});

export default function AdminPackageEditPage() {
  const router = useRouter();
  const params = useParams();
  const packageId = parseInt(params.id as string);

  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [pkg, setPkg] = useState<AdminPackage | null>(null);
  const [draft, setDraft] = useState<AdminPackageDraft | null>(null);
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

      if (isNaN(packageId)) {
        router.push("/admin/package");
        return;
      }

      try {
        const p = await AdminService.getPackage(packageId);
        setPkg(p);
        setDraft(mapPackageToDraft(p));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load package");
      }

      setStatus("ready");
    };

    init();
  }, [router, packageId]);

  const handleDraftChange = <T extends keyof AdminPackageDraft>(field: T, value: AdminPackageDraft[T]) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!draft) return;

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

    setIsSaving(true);
    setError("");

    try {
      await AdminService.updatePackage(packageId, {
        image: draft.image.trim(),
        price,
        tokens,
        isActive: draft.isActive,
      });

      const updated = await AdminService.getPackage(packageId);
      setPkg(updated);
      setDraft(mapPackageToDraft(updated));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update package");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loadingState}>Loading package...</div>
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
          <h1 className={styles.title}>Edit Package{pkg ? `: #${pkg.id}` : ""}</h1>

          {error && <p className={styles.error}>{error}</p>}

          {draft && (
            <>
              <div className={styles.grid} style={{ marginTop: 18 }}>
                <label className={styles.label}>
                  Image URL
                  <input className={styles.input} value={draft.image} onChange={(e) => handleDraftChange("image", e.target.value)} />
                </label>

                <label className={styles.label}>
                  Price (THB)
                  <input className={styles.input} type="number" min={1} step={1} value={draft.price} onChange={(e) => handleDraftChange("price", e.target.value)} />
                </label>

                <label className={styles.label}>
                  Tokens
                  <input className={styles.input} type="number" min={1} step={1} value={draft.tokens} onChange={(e) => handleDraftChange("tokens", e.target.value)} />
                </label>

                <label className={styles.label}>
                  <input className={styles.toggleInput} type="checkbox" checked={draft.isActive} onChange={(e) => handleDraftChange("isActive", e.target.checked)} />
                  Active
                  <div className={`${styles.toggleTrack}${draft.isActive ? ` ${styles.toggleTrackOn}` : ""}`}>
                    <div className={`${styles.toggleThumb}${draft.isActive ? ` ${styles.toggleThumbOn}` : ""}`} />
                  </div>
                </label>
              </div>

              <div className={styles.actionRow} style={{ marginTop: 14 }}>
                <button type="button" className={styles.saveButton} onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Package"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
