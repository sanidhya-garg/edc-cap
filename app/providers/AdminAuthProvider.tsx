"use client";
import React, { createContext, useContext, useState } from "react";
import { AdminCredentials } from "@/lib/adminAuth";

type AdminAuthContextValue = {
  admin: AdminCredentials | null;
  loading: boolean;
  login: (admin: AdminCredentials) => void;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminCredentials | null>(() => {
    // Initialize from localStorage
    if (typeof window !== "undefined") {
      const storedAdmin = localStorage.getItem("adminSession");
      if (storedAdmin) {
        try {
          return JSON.parse(storedAdmin);
        } catch {
          localStorage.removeItem("adminSession");
        }
      }
    }
    return null;
  });
  const loading = false;

  const login = (adminData: AdminCredentials) => {
    setAdmin(adminData);
    localStorage.setItem("adminSession", JSON.stringify(adminData));
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem("adminSession");
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
