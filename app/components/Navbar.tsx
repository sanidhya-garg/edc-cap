"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/providers/AuthProvider";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await logout();
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg border-b"
         style={{ 
           background: 'rgba(15, 23, 42, 0.8)',
           borderColor: 'var(--surface-light)'
         }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <div className="relative h-10 w-40">
                <Image 
                  src="/assets/logo.png" 
                  alt="eDC IIT Delhi Logo" 
                  fill
                  className="object-contain transition-transform group-hover:scale-105"
                  priority
                />
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex ml-10 space-x-8">
              <a href="#benefits" 
                 className="text-sm font-medium transition-all hover:scale-105"
                 style={{ color: 'var(--muted)' }}
                 onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                 onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>
                Why Join
              </a>
              <a href="#programs" 
                 className="text-sm font-medium transition-all hover:scale-105"
                 style={{ color: 'var(--muted)' }}
                 onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                 onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>
                What We Do
              </a>
              <a href="#faq" 
                 className="text-sm font-medium transition-all hover:scale-105"
                 style={{ color: 'var(--muted)' }}
                 onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                 onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>
                FAQ
              </a>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
                <div className="w-4 h-4 border-2 rounded-full animate-spin"
                     style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
                Loading...
              </div>
            ) : user ? (
              <>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-all hover:scale-105"
                  style={{ color: 'var(--foreground)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-light)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  📊 Dashboard
                </button>
                <button
                  onClick={() => router.push("/leaderboard")}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-all hover:scale-105"
                  style={{ color: 'var(--foreground)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-light)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  🏆 Leaderboard
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm font-medium border rounded-lg transition-all hover:scale-105"
                  style={{ 
                    background: 'var(--surface)',
                    borderColor: 'var(--surface-light)',
                    color: 'var(--foreground)'
                  }}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push("/auth/login")}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-all hover:scale-105"
                  style={{ color: 'var(--foreground)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-light)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  Login
                </button>
                <button
                  onClick={() => router.push("/auth/signup")}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-all hover:scale-105"
                  style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}>
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg"
              style={{ color: 'var(--foreground)' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t animate-fadeIn"
               style={{ borderColor: 'var(--surface-light)' }}>
            <a href="#benefits" 
               className="block py-2 text-sm font-medium"
               style={{ color: 'var(--muted)' }}
               onClick={() => setMobileMenuOpen(false)}>
              Why Join
            </a>
            <a href="#programs" 
               className="block py-2 text-sm font-medium"
               style={{ color: 'var(--muted)' }}
               onClick={() => setMobileMenuOpen(false)}>
              What We Do
            </a>
            <a href="#faq" 
               className="block py-2 text-sm font-medium"
               style={{ color: 'var(--muted)' }}
               onClick={() => setMobileMenuOpen(false)}>
              FAQ
            </a>
            
            <div className="pt-4 space-y-3 border-t" style={{ borderColor: 'var(--surface-light)' }}>
              {loading ? (
                <div className="text-sm" style={{ color: 'var(--muted)' }}>Loading...</div>
              ) : user ? (
                <>
                  <button
                    onClick={() => {
                      router.push("/dashboard");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-sm font-medium rounded-lg text-left"
                    style={{ background: 'var(--surface-light)', color: 'var(--foreground)' }}>
                    📊 Dashboard
                  </button>
                  <button
                    onClick={() => {
                      router.push("/leaderboard");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-sm font-medium rounded-lg text-left"
                    style={{ background: 'var(--surface-light)', color: 'var(--foreground)' }}>
                    🏆 Leaderboard
                  </button>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-sm font-medium border rounded-lg"
                    style={{ borderColor: 'var(--surface-light)', color: 'var(--foreground)' }}>
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      router.push("/auth/login");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-sm font-medium rounded-lg"
                    style={{ background: 'var(--surface-light)', color: 'var(--foreground)' }}>
                    Login
                  </button>
                  <button
                    onClick={() => {
                      router.push("/auth/signup");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-sm font-semibold rounded-lg"
                    style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}>
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
