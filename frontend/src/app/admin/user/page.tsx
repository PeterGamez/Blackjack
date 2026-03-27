"use client";

import Navbar from "@components/Navbar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AdminService from "@lib/AdminService";
import UserService from "@lib/UserService";

import { UserInterface } from "@interfaces/Admin/UserInterface";

import styles from "./page.module.css";

export default function AdminUsersPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [users, setUsers] = useState<UserInterface[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await AdminService.getUsers();
      setUsers(response);
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

      setStatus("ready");
      loadUsers();
    };

    init();
  }, [router]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    if (!normalizedSearch) return true;
    return user.username.toLowerCase().includes(normalizedSearch) || user.email.toLowerCase().includes(normalizedSearch) || user.role.toLowerCase().includes(normalizedSearch);
  });

  if (status === "loading") {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loadingState}>Loading users...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.container}>
        <button type="button" className={styles.backButton} onClick={() => router.push("/admin")}>
          ← Back to Admin
        </button>

        <div className={styles.card}>
          <div className={styles.headerRow}>
            <h1 className={styles.title}>User Management</h1>
            <button type="button" onClick={loadUsers} className={styles.refreshButton} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.userListSection}>
            <h2 className={styles.sectionTitle}>
              All Users ({filteredUsers.length}/{users.length})
            </h2>

            <input type="text" className={styles.searchInput} placeholder="Search by username, email, role..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

            <div className={styles.userList}>
              {filteredUsers.length === 0 ? (
                <p className={styles.emptyText}>No users matched your search.</p>
              ) : (
                filteredUsers.map((user) => (
                  <button key={user.id} type="button" className={styles.userRow} onClick={() => router.push(`/admin/user/${user.id}`)}>
                    <span>{user.username}</span>
                    <span className={styles.userMeta}>
                      {user.isVerified ? (
                        <span className={styles.verifiedBadge} style={{ marginRight: 8 }}>
                          VERIFIED
                        </span>
                      ) : (
                        <span className={styles.unverifiedBadge} style={{ marginRight: 8 }}>
                          UNVERIFIED
                        </span>
                      )}
                      {user.role}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
