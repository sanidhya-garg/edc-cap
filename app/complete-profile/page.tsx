"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { useAuth } from "@/app/providers/AuthProvider";
import { db } from "@/lib/firebase";

export default function CompleteProfilePage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [college, setCollege] = useState("");
  const [graduationYear, setGraduationYear] = useState<number>(new Date().getFullYear() + 4);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // Wait for userProfile to load
    if (!userProfile) {
      return;
    }

    setLoading(false);

    // If profile is already completed, redirect to dashboard
    if (userProfile.profileCompleted) {
      router.replace("/dashboard");
      return;
    }

    // Pre-fill display name from Google Auth or email
    if (user.displayName) {
      setDisplayName(user.displayName);
    } else if (user.email) {
      // Extract name from email (before @)
      const emailName = user.email.split("@")[0];
      const formattedName = emailName
        .split(/[._-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      setDisplayName(formattedName);
    }
  }, [user, userProfile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate phone number (10 digits)
    if (!/^\d{10}$/.test(phoneNumber)) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim(),
        phoneNumber: `+91${phoneNumber}`,
        college: college.trim(),
        graduationYear,
        profileCompleted: true,
        updatedAt: Timestamp.now(),
      });

      router.push("/dashboard");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="flex items-center gap-3" style={{ color: 'var(--muted)' }}>
          <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin" 
               style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
          Loading...
        </div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-2xl p-6">
        <div className="glass-card p-8 animate-fadeIn">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Complete Your Profile
            </h1>
            <p style={{ color: 'var(--muted)' }}>
              Tell us a bit more about yourself to get started
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg border" 
                 style={{ background: 'var(--danger-light)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Full Name *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg p-3 border transition-all focus:outline-none focus:ring-2"
                style={{ 
                  background: 'var(--surface-light)', 
                  borderColor: 'var(--surface-lighter)',
                  color: 'var(--foreground)'
                }}
                placeholder="Your full name"
                required
              />
            </div>

            {/* Email (readonly) */}
            <div>
              <label className="block font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Email
              </label>
              <input
                type="email"
                value={user.email || ""}
                readOnly
                className="w-full rounded-lg p-3 border"
                style={{ 
                  background: 'var(--surface)', 
                  borderColor: 'var(--surface-lighter)',
                  color: 'var(--muted)',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                WhatsApp Number *
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 rounded-lg border"
                     style={{ 
                       background: 'var(--surface)', 
                       borderColor: 'var(--surface-lighter)',
                       color: 'var(--muted)'
                     }}>
                  +91
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="flex-1 rounded-lg p-3 border transition-all focus:outline-none focus:ring-2"
                  style={{ 
                    background: 'var(--surface-light)', 
                    borderColor: 'var(--surface-lighter)',
                    color: 'var(--foreground)'
                  }}
                  placeholder="10-digit number"
                  pattern="\d{10}"
                  required
                />
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                Enter the number that has WhatsApp
              </p>
            </div>

            {/* College */}
            <div>
              <label className="block font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                College/University *
              </label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full rounded-lg p-3 border transition-all focus:outline-none focus:ring-2"
                style={{ 
                  background: 'var(--surface-light)', 
                  borderColor: 'var(--surface-lighter)',
                  color: 'var(--foreground)'
                }}
                placeholder="E.g., IIT Delhi, Delhi University"
                required
              />
            </div>

            {/* Graduation Year */}
            <div>
              <label className="block font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Year of Graduation *
              </label>
              <select
                value={graduationYear}
                onChange={(e) => setGraduationYear(parseInt(e.target.value))}
                className="w-full rounded-lg p-3 border transition-all focus:outline-none focus:ring-2"
                style={{ 
                  background: 'var(--surface-light)', 
                  borderColor: 'var(--surface-lighter)',
                  color: 'var(--foreground)'
                }}
                required
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg font-semibold transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ 
                background: submitting ? 'var(--surface-light)' : 'var(--gradient-primary)',
                color: 'var(--foreground)'
              }}
            >
              {submitting ? "Saving..." : "Continue to Dashboard →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
