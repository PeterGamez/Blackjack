"use client";

import Navbar from "@components/Navbar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AdminService, { AdminProduct } from "@lib/AdminService";
import UserService from "@lib/UserService";

import styles from "./page.module.css";

export default function AdminProductsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProducts = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await AdminService.getProducts();
      setProducts(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load products");
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
      loadProducts();
    };

    init();
  }, [router]);

  if (status === "loading") {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loadingState}>Loading products...</div>
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
            <h1 className={styles.title}>Product Management</h1>
            <div className={styles.headerActions}>
              <button type="button" className={styles.createButton} onClick={() => router.push("/admin/product/create")}>
                + Create Product
              </button>
              <button type="button" onClick={loadProducts} className={styles.refreshButton} disabled={isLoading}>
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div>
            <h2 className={styles.sectionTitle}>All Products ({products.length})</h2>
            <input type="text" className={styles.searchInput} placeholder="Search by name, type, or path..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

            <div className={styles.itemList}>
              {products.length === 0 ? (
                <p className={styles.emptyText}>No products found.</p>
              ) : (
                products
                  .filter((item) => {
                    const normalized = searchTerm.trim().toLowerCase();
                    if (!normalized) return true;

                    return item.name.toLowerCase().includes(normalized) || item.type.toLowerCase().includes(normalized) || item.path.toLowerCase().includes(normalized);
                  })
                  .map((item) => (
                    <button key={item.id} type="button" className={styles.itemRow} onClick={() => router.push(`/admin/product/${item.id}`)}>
                      <span>
                        #{item.id} • {item.name}
                      </span>
                      <span className={styles.itemMeta}>
                        {item.type} • {item.isRecommend ? "recommended" : "normal"} • {item.isActive ? "active" : "inactive"}
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
