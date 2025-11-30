"use client";
import React from "react";
import Link from "next/link";
import { useAuth } from "@/app/providers/AuthProvider";

export default function StorePage() {
  const { userProfile } = useAuth();
  const userPoints = userProfile?.points || 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--surface-light)', background: 'var(--surface)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
            style={{ background: 'var(--surface-light)', color: 'var(--foreground)' }}
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-6xl w-full">
          {/* Main Content - Single View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            {/* Left Side - Hero */}
            <div className="text-center lg:text-left">
              <div className="text-7xl sm:text-8xl mb-4 lg:mb-6">🏪</div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
                NO CAP Store
              </h1>
              <div className="inline-block px-6 py-3 rounded-full mb-6 animate-pulse"
                   style={{ background: 'var(--gradient-primary)' }}>
                <span className="text-base sm:text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                  COMING SOON
                </span>
              </div>
              <p className="text-lg sm:text-xl mb-6" style={{ color: 'var(--muted)' }}>
                We&apos;re cooking up something amazing! The most fire collection of rewards is on its way. 🔥
              </p>
              
              {/* Your Points */}
              <div className="inline-block p-6 rounded-xl mb-6" style={{ background: 'var(--surface)' }}>
                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>
                  Your Balance
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div className="text-4xl sm:text-5xl font-bold" style={{ color: 'var(--primary)' }}>
                    {userPoints}
                  </div>
                  <span className="text-lg font-semibold" style={{ color: 'var(--muted)' }}>pts</span>
                </div>
              </div>
            </div>

            {/* Right Side - Features */}
            <div className="space-y-4">
              {/* What's Coming */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
                <div className="p-5 rounded-xl transition-all hover:scale-105" style={{ background: 'var(--surface)' }}>
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🎁</div>
                    <div>
                      <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--foreground)' }}>Exclusive Merch</h3>
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        Limited edition EDC gear and swag
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl transition-all hover:scale-105" style={{ background: 'var(--surface)' }}>
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🎟️</div>
                    <div>
                      <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--foreground)' }}>Event Tickets</h3>
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        VIP access to exclusive events
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl transition-all hover:scale-105" style={{ background: 'var(--surface)' }}>
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">💎</div>
                    <div>
                      <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--foreground)' }}>Premium Rewards</h3>
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        Tech gadgets and amazing prizes
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="p-6 rounded-xl text-center" style={{ background: 'var(--gradient-primary)' }}>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                  Get Ready! 🎉
                </h3>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                  Keep completing tasks and stacking points. We&apos;ll notify you when the store launches!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
