"use client";

import Navbar from "@components/Navbar";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AdminService, { AdminUser } from "@lib/AdminService";
import LocalStorage from "@lib/LocalStorage";
import UserService from "@lib/UserService";

import styles from "../page.module.css";

type AdminUserDraft = {
  username: string;
  email: string;
  role: "user" | "admin";
  tokens: string;
  coins: string;
};

export default function AdminUserEditPage() {
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.id as string);

  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [authUserId, setAuthUserId] = useState<number | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [draft, setDraft] = useState<AdminUserDraft | null>(null);

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

      setAuthUserId(currentUser.id);

      if (isNaN(userId)) {
        router.push("/admin/user");
        return;
      }

      try {
        const u = await AdminService.getUser(userId);
        setUser(u);
        setDraft({ username: u.username, email: u.email, role: u.role, tokens: u.tokens.toString(), coins: u.coins.toString() });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load user");
      }

      setStatus("ready");
    };

    init();
  }, [router, userId]);

  const handleDraftChange = <T extends keyof AdminUserDraft>(field: T, value: AdminUserDraft[T]) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!draft) return;

    const tokens = Number(draft.tokens);
    const coins = Number(draft.coins);

    if (!Number.isInteger(tokens) || tokens < 0 || !Number.isInteger(coins) || coins < 0) {
      setError("Coins and tokens must be integers >= 0");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await AdminService.updateUser(userId, {
        username: draft.username.trim(),
        email: draft.email.trim(),
        role: draft.role,
        tokens,
        coins,
      });

      const updated = await AdminService.getUser(userId);
      setUser(updated);
      setDraft({ username: updated.username, email: updated.email, role: updated.role, tokens: updated.tokens.toString(), coins: updated.coins.toString() });

      if (authUserId === updated.id) {
        LocalStorage.setItem("username", updated.username);
        LocalStorage.setItem("coins", updated.coins.toString());
        LocalStorage.setItem("tokens", updated.tokens.toString());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loadingState}>Loading user...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.container}>
        <button type="button" className={styles.backButton} onClick={() => router.push("/admin/user")}>
          ← Back to Users
        </button>

        <div className={styles.card}>
          <div className={styles.headerRow}>
            <h1 className={styles.title}>Edit User{user ? `: ${user.username}` : ""}</h1>
            {user && <span className={user.isVerified ? styles.verifiedBadge : styles.unverifiedBadge}>{user.isVerified ? "Verified" : "Unverified"}</span>}
          </div>

          {error && <p className={styles.error}>{error}</p>}

          {draft && (
            <>
              <div className={styles.grid} style={{ marginTop: 18 }}>
                <label className={styles.label}>
                  Username
                  <input className={styles.input} value={draft.username} onChange={(e) => handleDraftChange("username", e.target.value)} />
                </label>

                <label className={styles.label}>
                  Email
                  <input className={styles.input} value={draft.email} onChange={(e) => handleDraftChange("email", e.target.value)} />
                </label>

                <label className={styles.label}>
                  Role
                  <select className={styles.input} value={draft.role} onChange={(e) => handleDraftChange("role", e.target.value as AdminUserDraft["role"])}>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </label>

                <label className={styles.label}>
                  Coins
                  <input className={styles.input} type="number" min={0} step={1} value={draft.coins} onChange={(e) => handleDraftChange("coins", e.target.value)} />
                </label>

                <label className={styles.label}>
                  Tokens
                  <input className={styles.input} type="number" min={0} step={1} value={draft.tokens} onChange={(e) => handleDraftChange("tokens", e.target.value)} />
                </label>
              </div>

              <div className={styles.actionRow}>
                <button type="button" className={styles.saveButton} onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save User"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
