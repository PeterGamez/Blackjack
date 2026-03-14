"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import UserService from "../../../../lib/UserService";

export default function Player() {
  const router = useRouter();

  useEffect(() => {
    UserService.getUser().then((user) => {
      if (!user) router.replace("/auth");
    });
  }, [router]);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f4f4f4",
        flexDirection: "column",
        gap: "20px",
      }}>
      <h1 style={{ fontSize: "32px", color: "#333" }}>Coming soon</h1>
      <p style={{ color: "#666" }}>Player vs Player mode is under development.</p>
      <button
        onClick={() => router.push("/play")}
        style={{
          padding: "10px 20px",
          background: "#4da6ff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}>
        Back to modes
      </button>
    </div>
  );
}
