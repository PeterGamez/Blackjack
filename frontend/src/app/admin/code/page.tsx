"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AdminService, { AdminCode } from "@lib/AdminService";
import UserService from "@lib/UserService";

import Navbar from "../../components/Navbar";
import styles from "./page.module.css";

export default function AdminCodesPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [codes, setCodes] = useState<AdminCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCodes = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await AdminService.getCodes();
      setCodes(response);
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
      loadCodes();
    };

    init();
  }, [router]);

  if (status === "loading") {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loadingState}>Loading codes...</div>
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
            <h1 className={styles.title}>Code Management</h1>
            <div className={styles.headerActions}>
              <button type="button" className={styles.createButton} onClick={() => router.push("/admin/code/create")}>
                + Create Code
              </button>
              <button type="button" onClick={loadCodes} className={styles.refreshButton} disabled={isLoading}>
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.listSection}>
            <h2 className={styles.sectionTitle}>All Codes ({codes.length})</h2>
            <div className={styles.codeList}>
              {codes.length === 0 ? (
                <p className={styles.emptyText}>No codes found.</p>
              ) : (
                codes.map((item) => (
                  <button key={item.id} type="button" className={styles.codeRow} onClick={() => router.push(`/admin/code/${item.id}`)}>
                    <span>{item.code}</span>
                    <span className={styles.codeMeta}>{item.type}</span>
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
