"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";

export default function SignupPage() {
  const { signUpWithEmail, signInWithGoogle, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  const signupEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signUpWithEmail(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign up";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const signupGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to continue with Google";
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
          <div className="text-5xl mb-3">🚀</div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Join Us
          </h1>
          <p style={{ color: 'var(--muted)' }}>
            Become a Campus Ambassador at IIT Delhi
          </p>
        </div>

        <div className="glass-card p-8 space-y-6 animate-fadeIn">
          {error && (
            <div className="p-4 rounded-lg border" 
                 style={{ background: 'var(--danger-light)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Google Sign Up Button */}
          <button
            onClick={signupGoogle}
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
            style={{ 
              background: '#fff',
              color: '#000',
              border: '2px solid var(--surface-lighter)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--surface-lighter)' }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4" style={{ background: 'var(--surface)', color: 'var(--muted)' }}>
                Or sign up with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form className="space-y-4" onSubmit={signupEmail}>
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
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg p-3 border transition-all focus:outline-none focus:ring-2"
                style={{ 
                  background: 'var(--surface-light)', 
                  borderColor: 'var(--surface-lighter)',
                  color: 'var(--foreground)'
                }}
                minLength={6}
                required
              />
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                Must be at least 6 characters
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
              {loading ? "Creating account..." : "✨ Create Account"}
            </button>
          </form>

          {/* Links */}
          <div className="text-center text-sm pt-4">
            <span style={{ color: 'var(--muted)' }}>Already have an account?</span>{" "}
            <a href="/auth/login" 
               className="transition-all hover:scale-105 inline-block font-semibold"
               style={{ color: 'var(--primary)' }}>
              Sign in →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
