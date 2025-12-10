"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { useAuth } from "@/app/providers/AuthProvider";
import { db } from "@/lib/firebase";

export default function CompleteProfilePage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [college, setCollege] = useState("");
  const [graduationYear, setGraduationYear] = useState<number>(new Date().getFullYear() + 4);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

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

    // If profile is already completed and we're not showing the modal, redirect to dashboard
    if (userProfile.profileCompleted && !showWhatsAppModal) {
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
  }, [user, userProfile, router, showWhatsAppModal]);

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

      // Refresh the profile in AuthProvider before navigating
      await refreshProfile();
      
      // Show WhatsApp modal instead of navigating directly
      setShowWhatsAppModal(true);
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

  // WhatsApp modal after profile completion
  if (showWhatsAppModal) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
        <div className="w-full max-w-md">
          <div className="glass-card p-8 text-center animate-fadeIn">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
                   style={{ background: 'rgba(37, 211, 102, 0.15)', border: '2px solid rgba(37, 211, 102, 0.3)' }}>
                <svg viewBox="0 0 24 24" fill="#25D366" className="w-12 h-12">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
                One More Step! 🎉
              </h2>
              <p className="text-base mb-2" style={{ color: 'var(--muted)' }}>
                Join our WhatsApp Community to stay connected with fellow ambassadors and get important updates.
              </p>
              <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                ⚠️ This is compulsory to continue
              </p>
            </div>

            <a
              href="https://chat.whatsapp.com/Hy6fJxw9amXIPw4x15k6Jz?mode=hqrc"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 rounded-lg font-bold text-lg transition-all hover:scale-105 mb-3"
              style={{ background: '#25D366', color: 'white' }}
            >
              Join WhatsApp Community
            </a>

            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 rounded-lg font-semibold transition-all hover:scale-105"
              style={{ background: 'var(--surface-light)', color: 'var(--foreground)' }}
            >
              I&apos;ve Joined - Continue to Dashboard →
            </button>
          </div>
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
