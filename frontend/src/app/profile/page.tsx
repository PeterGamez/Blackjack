"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import LocalStorage from "@lib/LocalStorage";
import AdminService, { AdminUser } from "@lib/AdminService";
import UserService from "@lib/UserService";

import Navbar from "../components/Navbar";
import ProfileAvatar from "../components/ProfileAvatar";
import styles from "./page.module.css";

type AdminUserDraft = Omit<AdminUser, "tokens" | "coins"> & {
  tokens: string;
  coins: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    id: number;
    username: string;
    email: string;
    role: string;
    coins: number;
    tokens: number;
  } | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminDrafts, setAdminDrafts] = useState<Record<number, AdminUserDraft>>({});
  const [selectedAdminUserId, setSelectedAdminUserId] = useState<number | null>(null);
  const [isLoadingAdminUsers, setIsLoadingAdminUsers] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  useEffect(() => {
    UserService.getUser().then((data) => {
      if (data) {
        setUser(data);
        LocalStorage.setItem("coins", data.coins.toString());
        LocalStorage.setItem("tokens", data.tokens.toString());
      }
    });
  }, []);

  const loadAdminUsers = async () => {
    setIsLoadingAdminUsers(true);
    setAdminError("");

    try {
      const users = await AdminService.getUsers();
      setAdminUsers(users);
      setAdminDrafts(
        users.reduce<Record<number, AdminUserDraft>>((acc, adminUser) => {
          acc[adminUser.id] = {
            ...adminUser,
            tokens: adminUser.tokens.toString(),
            coins: adminUser.coins.toString(),
          };
          return acc;
        }, {}),
      );
      setSelectedAdminUserId((prev) => {
        if (prev && users.some((adminUser) => adminUser.id === prev)) {
          return prev;
        }

        return users[0]?.id || null;
      });
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setIsLoadingAdminUsers(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      loadAdminUsers();
    }
  }, [user?.role]);

  const handleLogout = () => {
    UserService.logout();
    router.push("/auth");
  };

  const handleDraftChange = <T extends keyof AdminUserDraft>(userId: number, field: T, value: AdminUserDraft[T]) => {
    setAdminDrafts((prev) => {
      const current = prev[userId];
      if (!current) {
        return prev;
      }

      return {
        ...prev,
        [userId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const handleAdminSave = async (targetUserId: number) => {
    const draft = adminDrafts[targetUserId];
    if (!draft) {
      return;
    }

    const parsedTokens = Number(draft.tokens);
    const parsedCoins = Number(draft.coins);

    if (!Number.isInteger(parsedTokens) || parsedTokens < 0 || !Number.isInteger(parsedCoins) || parsedCoins < 0) {
      setAdminError("Coins and tokens must be integer values greater than or equal to 0");
      return;
    }

    setUpdatingUserId(targetUserId);
    setAdminError("");

    try {
      const updatedUser = await AdminService.updateUser(targetUserId, {
        username: draft.username.trim(),
        email: draft.email.trim(),
        role: draft.role,
        tokens: parsedTokens,
        coins: parsedCoins,
        isVerified: draft.isVerified,
      });

      setAdminUsers((prev) => prev.map((adminUser) => (adminUser.id === targetUserId ? updatedUser : adminUser)));
      setAdminDrafts((prev) => ({
        ...prev,
        [targetUserId]: {
          ...updatedUser,
          tokens: updatedUser.tokens.toString(),
          coins: updatedUser.coins.toString(),
        },
      }));

      if (user?.id === targetUserId) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                coins: updatedUser.coins,
                tokens: updatedUser.tokens,
              }
            : prev,
        );

        LocalStorage.setItem("coins", updatedUser.coins.toString());
        LocalStorage.setItem("tokens", updatedUser.tokens.toString());
      }
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Failed to update user");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleAdminDelete = async (targetUserId: number) => {
    const targetUser = adminUsers.find((adminUser) => adminUser.id === targetUserId);

    if (!targetUser) {
      return;
    }

    const confirmed = window.confirm(`Delete player ${targetUser.username}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeletingUserId(targetUserId);
    setAdminError("");

    try {
      await AdminService.deleteUser(targetUserId);
      setAdminUsers((prev) => prev.filter((adminUser) => adminUser.id !== targetUserId));
      setAdminDrafts((prev) => {
        const next = { ...prev };
        delete next[targetUserId];
        return next;
      });
      setSelectedAdminUserId((prev) => {
        if (prev !== targetUserId) {
          return prev;
        }

        const remainingUsers = adminUsers.filter((adminUser) => adminUser.id !== targetUserId);
        return remainingUsers[0]?.id || null;
      });
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setDeletingUserId(null);
    }
  };

  const selectedAdminUser = adminUsers.find((adminUser) => adminUser.id === selectedAdminUserId) || null;
  const selectedAdminDraft = selectedAdminUserId ? adminDrafts[selectedAdminUserId] : null;
  const selectedIsBusy =
    selectedAdminUserId !== null && (updatingUserId === selectedAdminUserId || deletingUserId === selectedAdminUserId);

  if (!user) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.emptyState}>
          <p>No profile data. Please login first.</p>
          <button type="button" onClick={() => router.push("/auth")} className={styles.primaryButton}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.container}>
        <button type="button" onClick={() => router.push("/")} className={styles.backButton}>
          ← Back
        </button>
        <div className={styles.card}>
          <div className={styles.avatarWrapper}>
            <ProfileAvatar username={user.username} className={styles.avatar} />
          </div>
          <div className={styles.info}>
            <h1 className={styles.username}>{user.username}</h1>
            <span className={styles.roleBadge}>{user.role}</span>
            <p className={styles.email}>{user.email}</p>
          </div>
          <div className={styles.stats}>
            <div className={styles.statPill}>
              <div>
                <p className={styles.statLabel}>Coins</p>
                <p className={styles.statValue}>{user.coins.toLocaleString()}</p>
              </div>
            </div>
            <div className={styles.statPill}>
              <div>
                <p className={styles.statLabel}>Tokens</p>
                <p className={styles.statValue}>{user.tokens.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <button type="button" onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>

        {user.role === "admin" && (
          <div className={styles.adminPanel}>
            <div className={styles.adminPanelHeader}>
              <h2 className={styles.adminPanelTitle}>Admin Panel</h2>
              <button type="button" onClick={loadAdminUsers} className={styles.reloadButton} disabled={isLoadingAdminUsers}>
                {isLoadingAdminUsers ? "Refreshing..." : "Refresh users"}
              </button>
            </div>

            {adminError && <p className={styles.adminError}>{adminError}</p>}

            {isLoadingAdminUsers && adminUsers.length === 0 ? (
              <p className={styles.adminHint}>Loading players...</p>
            ) : adminUsers.length === 0 ? (
              <p className={styles.adminHint}>No players found.</p>
            ) : (
              <>
                <label className={`${styles.adminLabel} ${styles.adminPlayerSelect}`}>
                  Select player
                  <select
                    className={styles.adminInput}
                    value={selectedAdminUserId ?? ""}
                    onChange={(event) => setSelectedAdminUserId(Number(event.target.value))}
                  >
                    {adminUsers.map((adminUser) => (
                      <option key={adminUser.id} value={adminUser.id}>
                        {adminUser.username}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedAdminUser && selectedAdminDraft && (
                  <div className={styles.adminUserCard}>
                    <div className={styles.adminUserHead}>
                      <p className={styles.adminUserId}>ID #{selectedAdminUser.id}</p>
                      <span className={styles.adminStatus}>{selectedAdminDraft.isVerified ? "Verified" : "Unverified"}</span>
                    </div>

                    <div className={styles.adminGrid}>
                      <label className={styles.adminLabel}>
                        Username
                        <input
                          type="text"
                          className={styles.adminInput}
                          value={selectedAdminDraft.username}
                          onChange={(event) => handleDraftChange(selectedAdminUser.id, "username", event.target.value)}
                        />
                      </label>

                      <label className={styles.adminLabel}>
                        Email
                        <input
                          type="email"
                          className={styles.adminInput}
                          value={selectedAdminDraft.email}
                          onChange={(event) => handleDraftChange(selectedAdminUser.id, "email", event.target.value)}
                        />
                      </label>

                      <label className={styles.adminLabel}>
                        Role
                        <select
                          className={styles.adminInput}
                          value={selectedAdminDraft.role}
                          onChange={(event) => handleDraftChange(selectedAdminUser.id, "role", event.target.value as AdminUserDraft["role"])}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </label>

                      <label className={styles.adminLabel}>
                        Coins
                        <input
                          type="number"
                          className={styles.adminInput}
                          min={0}
                          step={1}
                          value={selectedAdminDraft.coins}
                          onChange={(event) => handleDraftChange(selectedAdminUser.id, "coins", event.target.value)}
                        />
                      </label>

                      <label className={styles.adminLabel}>
                        Tokens
                        <input
                          type="number"
                          className={styles.adminInput}
                          min={0}
                          step={1}
                          value={selectedAdminDraft.tokens}
                          onChange={(event) => handleDraftChange(selectedAdminUser.id, "tokens", event.target.value)}
                        />
                      </label>

                      <label className={styles.adminCheckboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedAdminDraft.isVerified}
                          onChange={(event) => handleDraftChange(selectedAdminUser.id, "isVerified", event.target.checked)}
                        />
                        Email verified
                      </label>
                    </div>

                    <div className={styles.adminActions}>
                      <button
                        type="button"
                        className={styles.saveButton}
                        onClick={() => handleAdminSave(selectedAdminUser.id)}
                        disabled={selectedIsBusy}
                      >
                        {updatingUserId === selectedAdminUser.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => handleAdminDelete(selectedAdminUser.id)}
                        disabled={selectedIsBusy || user.id === selectedAdminUser.id}
                      >
                        {deletingUserId === selectedAdminUser.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
