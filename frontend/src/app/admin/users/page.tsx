"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AdminService, { AdminUser } from "@lib/AdminService";
import UserService from "@lib/UserService";

import Navbar from "../../components/Navbar";
import styles from "./page.module.css";

type AdminUserDraft = Omit<AdminUser, "tokens" | "coins"> & {
  tokens: string;
  coins: string;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [authUserId, setAuthUserId] = useState<number | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [drafts, setDrafts] = useState<Record<number, AdminUserDraft>>({});
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/admin");
  };

  const loadUsers = async (keepSelectedId?: number | null) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await AdminService.getUsers();
      setUsers(response);
      setDrafts(
        response.reduce<Record<number, AdminUserDraft>>((acc, user) => {
          acc[user.id] = {
            ...user,
            tokens: user.tokens.toString(),
            coins: user.coins.toString(),
          };
          return acc;
        }, {}),
      );

      setSelectedUserId((prev) => {
        const target = keepSelectedId ?? prev;
        if (target && response.some((user) => user.id === target)) {
          return target;
        }
        return response[0]?.id || null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
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

      setAuthUserId(currentUser.id);
      setStatus("ready");
      await loadUsers();
    };

    init();
  }, [router]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUsers = users.filter((item) => {
    if (!normalizedSearch) {
      return true;
    }

    return (
      item.username.toLowerCase().includes(normalizedSearch) ||
      item.email.toLowerCase().includes(normalizedSearch) ||
      item.role.toLowerCase().includes(normalizedSearch)
    );
  });

  useEffect(() => {
    if (!filteredUsers.length) {
      setSelectedUserId(null);
      return;
    }

    if (!selectedUserId || !filteredUsers.some((item) => item.id === selectedUserId)) {
      setSelectedUserId(filteredUsers[0].id);
    }
  }, [filteredUsers, selectedUserId]);

  const handleDraftChange = <T extends keyof AdminUserDraft>(field: T, value: AdminUserDraft[T]) => {
    if (!selectedUserId) {
      return;
    }

    setDrafts((prev) => {
      const current = prev[selectedUserId];
      if (!current) {
        return prev;
      }

      return {
        ...prev,
        [selectedUserId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const handleSave = async () => {
    if (!selectedUserId) {
      return;
    }

    const draft = drafts[selectedUserId];
    if (!draft) {
      return;
    }

    const tokens = Number(draft.tokens);
    const coins = Number(draft.coins);

    if (!Number.isInteger(tokens) || tokens < 0 || !Number.isInteger(coins) || coins < 0) {
      setError("Coins and tokens must be integers >= 0");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await AdminService.updateUser(selectedUserId, {
        username: draft.username.trim(),
        email: draft.email.trim(),
        role: draft.role,
        tokens,
        coins,
        isVerified: draft.isVerified,
      });

      await loadUsers(selectedUserId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUserId) {
      return;
    }

    const targetUser = users.find((item) => item.id === selectedUserId);
    if (!targetUser) {
      return;
    }

    const confirmed = window.confirm(`Delete player ${targetUser.username}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      await AdminService.deleteUser(selectedUserId);
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loadingState}>Loading users...</div>
      </div>
    );
  }

  const selectedUser = filteredUsers.find((item) => item.id === selectedUserId) || null;
  const selectedDraft = selectedUserId ? drafts[selectedUserId] : null;

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.container}>
        <button type="button" className={styles.backButton} onClick={handleBack}>← Back to Admin</button>

        <div className={styles.card}>
          <div className={styles.headerRow}>
            <h1 className={styles.title}>User Management</h1>
            <button type="button" onClick={() => loadUsers(selectedUserId)} className={styles.refreshButton} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.userListSection}>
            <h2 className={styles.sectionTitle}>All Users ({filteredUsers.length}/{users.length})</h2>

            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by username, email, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className={styles.userList}>
              {filteredUsers.length === 0 ? (
                <p className={styles.emptyText}>No users matched your search.</p>
              ) : (
                filteredUsers.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.userRow} ${selectedUserId === item.id ? styles.userRowActive : ""}`}
                    onClick={() => setSelectedUserId(item.id)}
                  >
                    <span>{item.username}</span>
                    <span className={styles.userMeta}>{item.role}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {selectedUser && selectedDraft && (
            <div className={styles.editorSection}>
              <h2 className={styles.sectionTitle}>Edit User: {selectedUser.username}</h2>
              <div className={styles.grid}>
                <label className={styles.label}>
                  Username
                  <input className={styles.input} value={selectedDraft.username} onChange={(e) => handleDraftChange("username", e.target.value)} />
                </label>

                <label className={styles.label}>
                  Email
                  <input className={styles.input} value={selectedDraft.email} onChange={(e) => handleDraftChange("email", e.target.value)} />
                </label>

                <label className={styles.label}>
                  Role
                  <select className={styles.input} value={selectedDraft.role} onChange={(e) => handleDraftChange("role", e.target.value as AdminUserDraft["role"])}>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </label>

                <label className={styles.label}>
                  Coins
                  <input className={styles.input} type="number" min={0} step={1} value={selectedDraft.coins} onChange={(e) => handleDraftChange("coins", e.target.value)} />
                </label>

                <label className={styles.label}>
                  Tokens
                  <input className={styles.input} type="number" min={0} step={1} value={selectedDraft.tokens} onChange={(e) => handleDraftChange("tokens", e.target.value)} />
                </label>

                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={selectedDraft.isVerified} onChange={(e) => handleDraftChange("isVerified", e.target.checked)} />
                  Email verified
                </label>
              </div>

              <div className={styles.actionRow}>
                <button type="button" className={styles.saveButton} onClick={handleSave} disabled={isSaving || isDeleting}>
                  {isSaving ? "Saving..." : "Save User"}
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={handleDelete}
                  disabled={isSaving || isDeleting || selectedUser.id === authUserId}
                >
                  {isDeleting ? "Deleting..." : "Delete User"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
