"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import UserService from "../../lib/UserService";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; email: string; role: string } | null>(null);

  useEffect(() => {
    UserService.getUser().then((data) => {
      if (data) setUser(data);
    });
  }, []);

  const handleLogout = () => {
    UserService.logout();
    router.push("/auth");
  };

  if (!user) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <button
          type="button"
          onClick={() => router.push("/")}
          style={{
            marginBottom: "20px",
            padding: "6px 12px",
            background: "#ccc",
            border: "none",
            cursor: "pointer",
          }}>
          ← Back
        </button>
        <p>No profile data. Please login first.</p>
        <button onClick={() => router.push("/login")}>Go to Login</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", maxWidth: "400px", margin: "100px auto", background: "white", border: "1px solid #ccc" }}>
      <button
        type="button"
        onClick={() => router.back()}
        style={{
          alignSelf: "flex-start",
          marginBottom: "20px",
          padding: "6px 12px",
          background: "#ccc",
          border: "none",
          cursor: "pointer",
        }}>
        ← Back
      </button>
      <h2>Profile</h2>
      <p>
        <strong>Username:</strong> {user.username}
      </p>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Role:</strong> {user.role}
      </p>
      <button onClick={handleLogout} style={{ marginTop: "20px", padding: "10px 20px", background: "#f44336", color: "white", border: "none", cursor: "pointer" }}>
        Logout
      </button>
    </div>
  );
}
