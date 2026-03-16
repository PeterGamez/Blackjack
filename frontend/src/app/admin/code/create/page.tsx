"use client";

import Navbar from "@components/Navbar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AdminService from "@lib/AdminService";
import UserService from "@lib/UserService";

import styles from "../page.module.css";

type CreateCodeDraft = {
  code: string;
  amount: string;
  type: "coins" | "tokens";
  maxUses: string;
  isActive: boolean;
  expiredDate: string;
};

const defaultDraft: CreateCodeDraft = {
  code: "",
  amount: "",
  type: "coins",
  maxUses: "",
  isActive: true,
  expiredDate: "",
};

export default function AdminCodeCreatePage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [draft, setDraft] = useState<CreateCodeDraft>(defaultDraft);
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
    const amount = Number(draft.amount);
    const maxUses = Number(draft.maxUses);

    if (!draft.code.trim()) {
      setError("Code is required");
      return;
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      setError("Amount must be integer > 0");
      return;
    }

    if (!Number.isInteger(maxUses) || maxUses <= 0) {
      setError("Max uses must be integer > 0");
      return;
    }

    if (!draft.expiredDate) {
      setError("Expired date is required");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      await AdminService.createCode({
        code: draft.code.trim(),
        amount,
        type: draft.type,
        maxUses,
        isActive: draft.isActive,
        expiredDate: new Date(draft.expiredDate).toISOString(),
      });

      router.push("/admin/code");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create code");
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
        <button type="button" className={styles.backButton} onClick={() => router.push("/admin/code")}>
          ← Back to Codes
        </button>

        <div className={styles.card}>
          <h1 className={styles.title}>Create Code</h1>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.grid} style={{ marginTop: 18 }}>
            <label className={styles.label}>
              Code
              <input className={styles.input} value={draft.code} onChange={(e) => setDraft((prev) => ({ ...prev, code: e.target.value }))} />
            </label>

            <label className={styles.label}>
              Amount
              <input className={styles.input} type="number" min={1} step={1} value={draft.amount} onChange={(e) => setDraft((prev) => ({ ...prev, amount: e.target.value }))} />
            </label>

            <label className={styles.label}>
              Type
              <select className={styles.input} value={draft.type} onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value as CreateCodeDraft["type"] }))}>
                <option value="coins">coins</option>
                <option value="tokens">tokens</option>
              </select>
            </label>

            <label className={styles.label}>
              Max Uses
              <input className={styles.input} type="number" min={1} step={1} value={draft.maxUses} onChange={(e) => setDraft((prev) => ({ ...prev, maxUses: e.target.value }))} />
            </label>

            <label className={styles.label}>
              Expired Date
              <input className={styles.input} type="date" value={draft.expiredDate} onChange={(e) => setDraft((prev) => ({ ...prev, expiredDate: e.target.value }))} />
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
              {isCreating ? "Creating..." : "Create Code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
