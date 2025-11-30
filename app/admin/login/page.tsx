"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { verifyAdminCredentials } from "@/lib/adminAuth";
import { useAdminAuth } from "@/app/providers/AdminAuthProvider";

export default function AdminLoginPage() {
  const { admin, login } = useAdminAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (admin) router.push("/admin");
  }, [admin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await verifyAdminCredentials(username, password);
      if (result.success && result.admin) {
        login(result.admin);
        router.push("/admin");
      } else {
        setError(result.error || "Invalid credentials");
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" 
         style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        {/* Logo/Title Section */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Admin Portal
          </h1>
          <p style={{ color: 'var(--muted)' }}>
            eDC IIT Delhi - Campus Ambassador Platform
          </p>
        </div>

        <div className="glass-card p-8 space-y-6 animate-fadeIn">
          {error && (
            <div className="p-4 rounded-lg border" 
                 style={{ background: 'var(--danger-light)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              ⚠️ {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                👤 Admin Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg p-3 border transition-all focus:outline-none focus:ring-2"
                style={{ 
                  background: 'var(--surface-light)', 
                  borderColor: 'var(--surface-lighter)',
                  color: 'var(--foreground)'
                }}
                placeholder="Enter admin username"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                🔒 Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg p-3 border transition-all focus:outline-none focus:ring-2"
                style={{ 
                  background: 'var(--surface-light)', 
                  borderColor: 'var(--surface-lighter)',
                  color: 'var(--foreground)'
                }}
                placeholder="Enter admin password"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ 
                background: loading ? 'var(--surface-light)' : 'var(--gradient-primary)',
                color: 'var(--foreground)'
              }}
              disabled={loading}
            >
              {loading ? "Signing in..." : "🚀 Sign In as Admin"}
            </button>
          </form>

          <div className="border-t pt-4 text-center" style={{ borderColor: 'var(--surface-lighter)' }}>
            <Link href="/" 
                  className="text-sm transition-all hover:scale-105 inline-block"
                  style={{ color: 'var(--primary)' }}>
              ← Back to homepage
            </Link>
          </div>
        </div>

        {/* User Login Link */}
        <div className="text-center mt-6">
          <a href="/auth/login" 
             className="text-sm transition-all hover:scale-105 inline-block"
             style={{ color: 'var(--muted)' }}>
            👥 User Login
          </a>
        </div>
      </div>
    </div>
  );
}
