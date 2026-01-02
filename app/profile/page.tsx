"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { useAuth } from "@/app/providers/AuthProvider";
import { db } from "@/lib/firebase";

export default function ProfilePage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.displayName || "");
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber?.replace("+91", "") || "");
  const [college, setCollege] = useState(userProfile?.college || "");
  const [graduationYear, setGraduationYear] = useState(userProfile?.graduationYear || new Date().getFullYear() + 4);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (userProfile) {
      setDisplayName(userProfile.displayName || "");
      setPhoneNumber(userProfile.phoneNumber?.replace("+91", "") || "");
      setCollege(userProfile.college || "");
      setGraduationYear(userProfile.graduationYear || new Date().getFullYear() + 4);
    }
  }, [user?.uid, userProfile?.updatedAt, router]);

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
        updatedAt: Timestamp.now(),
      });

      setIsEditing(false);
      window.location.reload(); // Refresh to update userProfile
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || !userProfile) return null;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--surface-light)', background: 'var(--surface)' }}>
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link href="/dashboard"
            className="inline-flex items-center gap-2 font-medium transition-all hover:scale-105"
            style={{ color: 'var(--primary)' }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6">
        <div className="glass-card p-8 animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
              👤 My Profile
            </h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}
              >
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg border"
              style={{ background: 'var(--danger-light)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          {isEditing ? (
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
                    pattern="\d{10}"
                    required
                  />
                </div>
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

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-lg font-semibold transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: submitting ? 'var(--surface-light)' : 'var(--gradient-primary)',
                    color: 'var(--foreground)'
                  }}
                >
                  {submitting ? "Saving..." : "💾 Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setDisplayName(userProfile.displayName || "");
                    setPhoneNumber(userProfile.phoneNumber?.replace("+91", "") || "");
                    setCollege(userProfile.college || "");
                    setGraduationYear(userProfile.graduationYear || new Date().getFullYear() + 4);
                    setError(null);
                  }}
                  className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                  style={{
                    background: 'var(--surface-light)',
                    color: 'var(--foreground)'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Name */}
              <div className="p-4 rounded-lg" style={{ background: 'var(--surface-light)' }}>
                <div className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Full Name</div>
                <div className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  {userProfile.displayName || "Not provided"}
                </div>
              </div>

              {/* Email */}
              <div className="p-4 rounded-lg" style={{ background: 'var(--surface-light)' }}>
                <div className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Email</div>
                <div className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  {userProfile.email}
                </div>
              </div>

              {/* Phone */}
              <div className="p-4 rounded-lg" style={{ background: 'var(--surface-light)' }}>
                <div className="text-sm mb-1" style={{ color: 'var(--muted)' }}>WhatsApp Number</div>
                <div className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  {userProfile.phoneNumber || "Not provided"}
                </div>
              </div>

              {/* College */}
              <div className="p-4 rounded-lg" style={{ background: 'var(--surface-light)' }}>
                <div className="text-sm mb-1" style={{ color: 'var(--muted)' }}>College/University</div>
                <div className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  {userProfile.college || "Not provided"}
                </div>
              </div>

              {/* Graduation Year */}
              <div className="p-4 rounded-lg" style={{ background: 'var(--surface-light)' }}>
                <div className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Year of Graduation</div>
                <div className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  {userProfile.graduationYear || "Not provided"}
                </div>
              </div>

              {/* Points */}
              <div className="p-4 rounded-lg border-2" style={{ background: 'var(--surface-light)', borderColor: 'var(--primary)' }}>
                <div className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Total Points</div>
                <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                  {userProfile.points} pts
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
