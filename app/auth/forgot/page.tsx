"use client";
import React, { useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await resetPassword(email);
      setMessage("Password reset email sent. Check your inbox.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send password reset email";
      setError(message);
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
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Reset Password
          </h1>
          <p style={{ color: 'var(--muted)' }}>
            Enter your email to receive a password reset link
          </p>
        </div>

        <div className="glass-card p-8 space-y-6 animate-fadeIn">
          {message && (
            <div className="p-4 rounded-lg border" 
                 style={{ background: 'var(--success-light)', borderColor: 'var(--success)', color: 'var(--success)' }}>
              ✓ {message}
            </div>
          )}
          
          {error && (
            <div className="p-4 rounded-lg border" 
                 style={{ background: 'var(--danger-light)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              ⚠️ {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="ambassador@iitd.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg p-3 border transition-all focus:outline-none focus:ring-2"
                style={{ 
                  background: 'var(--surface-light)', 
                  borderColor: 'var(--surface-lighter)',
                  color: 'var(--foreground)'
                }}
                required
              />
              <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                We&apos;ll send you a link to reset your password
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ 
                background: loading ? 'var(--surface-light)' : 'var(--gradient-primary)',
                color: 'var(--foreground)'
              }}
            >
              {loading ? "Sending..." : "📧 Send Reset Link"}
            </button>
          </form>

          {/* Back to login */}
          <div className="text-center text-sm pt-4">
            <a href="/auth/login" 
               className="transition-all hover:scale-105 inline-block"
               style={{ color: 'var(--primary)' }}>
              ← Back to login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
