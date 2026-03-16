"use client";

import Navbar from "@components/Navbar";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AdminService, { AdminCode } from "@lib/AdminService";
import UserService from "@lib/UserService";

import styles from "../page.module.css";

type AdminCodeDraft = Omit<AdminCode, "amount" | "maxUses"> & {
  amount: string;
  maxUses: string;
};

const mapCodeToDraft = (code: AdminCode): AdminCodeDraft => ({
  ...code,
  amount: code.amount.toString(),
  maxUses: code.maxUses.toString(),
  expiredDate: new Date(code.expiredDate).toISOString().slice(0, 10),
});

export default function AdminCodeEditPage() {
  const router = useRouter();
  const params = useParams();
  const codeId = parseInt(params.id as string);

  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [code, setCode] = useState<AdminCode | null>(null);
  const [draft, setDraft] = useState<AdminCodeDraft | null>(null);
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

      if (isNaN(codeId)) {
        router.push("/admin/code");
        return;
      }

      try {
        const c = await AdminService.getCode(codeId);
        setCode(c);
        setDraft(mapCodeToDraft(c));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load code");
      }

      setStatus("ready");
    };

    init();
  }, [router, codeId]);

  const handleDraftChange = <T extends keyof AdminCodeDraft>(field: T, value: AdminCodeDraft[T]) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!draft) return;

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

    setIsSaving(true);
    setError("");

    try {
      await AdminService.updateCode(codeId, {
        code: draft.code.trim(),
        amount,
        type: draft.type,
        maxUses,
        isActive: draft.isActive,
        expiredDate: new Date(draft.expiredDate).toISOString(),
      });

      const updated = await AdminService.getCode(codeId);
      setCode(updated);
      setDraft(mapCodeToDraft(updated));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update code");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loadingState}>Loading code...</div>
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
          <h1 className={styles.title}>Edit Code{code ? `: ${code.code}` : ""}</h1>

          {error && <p className={styles.error}>{error}</p>}

          {draft && (
            <>
              <div className={styles.grid} style={{ marginTop: 18 }}>
                <label className={styles.label}>
                  Code
                  <input className={styles.input} value={draft.code} onChange={(e) => handleDraftChange("code", e.target.value)} />
                </label>

                <label className={styles.label}>
                  Amount
                  <input className={styles.input} type="number" min={1} step={1} value={draft.amount} onChange={(e) => handleDraftChange("amount", e.target.value)} />
                </label>

                <label className={styles.label}>
                  Type
                  <select className={styles.input} value={draft.type} onChange={(e) => handleDraftChange("type", e.target.value as AdminCodeDraft["type"])}>
                    <option value="coins">coins</option>
                    <option value="tokens">tokens</option>
                  </select>
                </label>

                <label className={styles.label}>
                  Max Uses
                  <input className={styles.input} type="number" min={1} step={1} value={draft.maxUses} onChange={(e) => handleDraftChange("maxUses", e.target.value)} />
                </label>

                <label className={styles.label}>
                  Expired Date
                  <input className={styles.input} type="date" value={draft.expiredDate} onChange={(e) => handleDraftChange("expiredDate", e.target.value)} />
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
                  {isSaving ? "Saving..." : "Save Code"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
