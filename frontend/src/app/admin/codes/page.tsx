"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AdminService, { AdminCode } from "@lib/AdminService";
import UserService from "@lib/UserService";

import Navbar from "../../components/Navbar";
import styles from "./page.module.css";

type AdminCodeDraft = Omit<AdminCode, "amount" | "maxUses"> & {
  amount: string;
  maxUses: string;
};

type CreateCodeDraft = {
  code: string;
  amount: string;
  type: "coins" | "tokens";
  maxUses: string;
  expiredDate: string;
};

const defaultCreateDraft: CreateCodeDraft = {
  code: "",
  amount: "",
  type: "coins",
  maxUses: "",
  expiredDate: "",
};

export default function AdminCodesPage() {
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [codes, setCodes] = useState<AdminCode[]>([]);
  const [drafts, setDrafts] = useState<Record<number, AdminCodeDraft>>({});
  const [selectedCodeId, setSelectedCodeId] = useState<number | null>(null);

  const [createDraft, setCreateDraft] = useState<CreateCodeDraft>(defaultCreateDraft);

  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/admin");
  };

  const mapCodeToDraft = (code: AdminCode): AdminCodeDraft => ({
    ...code,
    amount: code.amount.toString(),
    maxUses: code.maxUses.toString(),
    expiredDate: new Date(code.expiredDate).toISOString().slice(0, 10),
  });

  const loadCodes = async (keepSelectedId?: number | null) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await AdminService.getCodes();
      setCodes(response);
      setDrafts(
        response.reduce<Record<number, AdminCodeDraft>>((acc, code) => {
          acc[code.id] = mapCodeToDraft(code);
          return acc;
        }, {}),
      );

      setSelectedCodeId((prev) => {
        const target = keepSelectedId ?? prev;
        if (target && response.some((code) => code.id === target)) {
          return target;
        }
        return response[0]?.id || null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load codes");
    } finally {
      setIsLoading(false);
    }
  };

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
      await loadCodes();
    };

    init();
  }, [router]);

  const handleCreate = async () => {
    const amount = Number(createDraft.amount);
    const maxUses = Number(createDraft.maxUses);

    if (!createDraft.code.trim()) {
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

    if (!createDraft.expiredDate) {
      setError("Expired date is required");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      await AdminService.createCode({
        code: createDraft.code.trim(),
        amount,
        type: createDraft.type,
        maxUses,
        expiredDate: new Date(createDraft.expiredDate).toISOString(),
      });

      setCreateDraft(defaultCreateDraft);
      await loadCodes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create code");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCodeDraftChange = <T extends keyof AdminCodeDraft>(field: T, value: AdminCodeDraft[T]) => {
    if (!selectedCodeId) {
      return;
    }

    setDrafts((prev) => {
      const current = prev[selectedCodeId];
      if (!current) {
        return prev;
      }

      return {
        ...prev,
        [selectedCodeId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const handleSave = async () => {
    if (!selectedCodeId) {
      return;
    }

    const draft = drafts[selectedCodeId];
    if (!draft) {
      return;
    }

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
      await AdminService.updateCode(selectedCodeId, {
        code: draft.code.trim(),
        amount,
        type: draft.type,
        maxUses,
        isActive: draft.isActive,
        expiredDate: new Date(draft.expiredDate).toISOString(),
      });

      await loadCodes(selectedCodeId);
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
        <div className={styles.loadingState}>Loading codes...</div>
      </div>
    );
  }

  const selectedCode = codes.find((item) => item.id === selectedCodeId) || null;
  const selectedDraft = selectedCodeId ? drafts[selectedCodeId] : null;

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.container}>
        <button type="button" className={styles.backButton} onClick={handleBack}>← Back to Admin</button>

        <div className={styles.card}>
          <div className={styles.headerRow}>
            <h1 className={styles.title}>Code Management</h1>
            <button type="button" onClick={() => loadCodes(selectedCodeId)} className={styles.refreshButton} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.createSection}>
            <h2 className={styles.sectionTitle}>Create Code</h2>
            <div className={styles.grid}>
              <label className={styles.label}>
                Code
                <input className={styles.input} value={createDraft.code} onChange={(e) => setCreateDraft((prev) => ({ ...prev, code: e.target.value }))} />
              </label>

              <label className={styles.label}>
                Amount
                <input className={styles.input} type="number" min={1} step={1} value={createDraft.amount} onChange={(e) => setCreateDraft((prev) => ({ ...prev, amount: e.target.value }))} />
              </label>

              <label className={styles.label}>
                Type
                <select className={styles.input} value={createDraft.type} onChange={(e) => setCreateDraft((prev) => ({ ...prev, type: e.target.value as CreateCodeDraft["type"] }))}>
                  <option value="coins">coins</option>
                  <option value="tokens">tokens</option>
                </select>
              </label>

              <label className={styles.label}>
                Max Uses
                <input className={styles.input} type="number" min={1} step={1} value={createDraft.maxUses} onChange={(e) => setCreateDraft((prev) => ({ ...prev, maxUses: e.target.value }))} />
              </label>

              <label className={styles.label}>
                Expired Date
                <input className={styles.input} type="date" value={createDraft.expiredDate} onChange={(e) => setCreateDraft((prev) => ({ ...prev, expiredDate: e.target.value }))} />
              </label>
            </div>

            <button type="button" className={styles.createButton} onClick={handleCreate} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Code"}
            </button>
          </div>

          <div className={styles.listSection}>
            <h2 className={styles.sectionTitle}>All Codes ({codes.length})</h2>
            <div className={styles.codeList}>
              {codes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.codeRow} ${selectedCodeId === item.id ? styles.codeRowActive : ""}`}
                  onClick={() => setSelectedCodeId(item.id)}
                >
                  <span>{item.code}</span>
                  <span className={styles.codeMeta}>{item.type}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedCode && selectedDraft && (
            <div className={styles.editorSection}>
              <h2 className={styles.sectionTitle}>Edit Code: {selectedCode.code}</h2>

              <div className={styles.grid}>
                <label className={styles.label}>
                  Code
                  <input className={styles.input} value={selectedDraft.code} onChange={(e) => handleCodeDraftChange("code", e.target.value)} />
                </label>

                <label className={styles.label}>
                  Amount
                  <input className={styles.input} type="number" min={1} step={1} value={selectedDraft.amount} onChange={(e) => handleCodeDraftChange("amount", e.target.value)} />
                </label>

                <label className={styles.label}>
                  Type
                  <select className={styles.input} value={selectedDraft.type} onChange={(e) => handleCodeDraftChange("type", e.target.value as AdminCodeDraft["type"])}>
                    <option value="coins">coins</option>
                    <option value="tokens">tokens</option>
                  </select>
                </label>

                <label className={styles.label}>
                  Max Uses
                  <input className={styles.input} type="number" min={1} step={1} value={selectedDraft.maxUses} onChange={(e) => handleCodeDraftChange("maxUses", e.target.value)} />
                </label>

                <label className={styles.label}>
                  Expired Date
                  <input className={styles.input} type="date" value={selectedDraft.expiredDate} onChange={(e) => handleCodeDraftChange("expiredDate", e.target.value)} />
                </label>

                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={selectedDraft.isActive} onChange={(e) => handleCodeDraftChange("isActive", e.target.checked)} />
                  Active
                </label>
              </div>

              <div className={styles.actionRow}>
                <button type="button" className={styles.saveButton} onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Code"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
