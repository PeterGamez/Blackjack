"use client";

import Navbar from "@components/Navbar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AdminService, { AdminPackage } from "@lib/AdminService";
import UserService from "@lib/UserService";

import styles from "./page.module.css";

export default function AdminPackagesPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPackages = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await AdminService.getPackages();
      setPackages(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load packages");
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
      loadPackages();
    };

    init();
  }, [router]);

  if (status === "loading") {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loadingState}>Loading packages...</div>
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
            <h1 className={styles.title}>Package Management</h1>
            <div className={styles.headerActions}>
              <button type="button" className={styles.createButton} onClick={() => router.push("/admin/package/create")}>
                + Create Package
              </button>
              <button type="button" onClick={loadPackages} className={styles.refreshButton} disabled={isLoading}>
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div>
            <h2 className={styles.sectionTitle}>All Packages ({packages.length})</h2>
            <input type="text" className={styles.searchInput} placeholder="Search by image URL, token amount, or price..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

            <div className={styles.itemList}>
              {packages.length === 0 ? (
                <p className={styles.emptyText}>No packages found.</p>
              ) : (
                packages
                  .filter((item) => {
                    const normalized = searchTerm.trim().toLowerCase();
                    if (!normalized) return true;

                    return item.image.toLowerCase().includes(normalized) || item.tokens.toString().includes(normalized) || item.price.toString().includes(normalized);
                  })
                  .map((item) => (
                    <button key={item.id} type="button" className={styles.itemRow} onClick={() => router.push(`/admin/package/${item.id}`)}>
                      <span>
                        #{item.id} • {item.tokens} tokens
                      </span>
                      <span className={styles.itemMeta}>
                        {item.price} THB • {item.isActive ? "active" : "inactive"}
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
