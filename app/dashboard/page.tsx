"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy, Timestamp, limit } from "firebase/firestore";
import { useAuth } from "@/app/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { Task, Submission, UserProfile } from "@/lib/types";
import { getCached, setCache } from "@/lib/cache";

// Helper to safely convert Timestamp or cached object to Date
// When data is cached in sessionStorage, Timestamps become plain objects
const toDate = (ts: Timestamp | { seconds: number; nanoseconds: number } | undefined): Date | null => {
  if (!ts) return null;
  // If it's a Firestore Timestamp with toDate method
  if ('toDate' in ts && typeof ts.toDate === 'function') {
    return ts.toDate();
  }
  // If it's a serialized timestamp object from cache
  if ('seconds' in ts) {
    return new Date(ts.seconds * 1000);
  }
  return null;
};

// Level tiers configuration
const LEVEL_TIERS = [
  {
    level: 'Bronze',
    minPoints: 0,
    maxPoints: 99,
    icon: '🥉',
    color: '#cd7f32',
    criteria: 'Initial onboarding',
    rewards: ['Certificate of participation']
  },
  {
    level: 'Silver',
    minPoints: 100,
    maxPoints: 499,
    icon: '🥈',
    color: '#c0c0c0',
    criteria: 'Mid-level performance',
    rewards: [
      'Certificate of participation',
      'Passes to attend BECon\'26',
      'eDC IIT D goodies',
      'Discount Coupons'
    ]
  },
  {
    level: 'Gold',
    minPoints: 500,
    maxPoints: 999,
    icon: '🥇',
    color: '#ffd700',
    criteria: 'Top 10% in leaderboard',
    rewards: [
      'Certificate of participation',
      'Passes to attend BECon\'26',
      'eDC IIT D goodies',
      'LOR from eDC IIT Delhi',
      'Access to exclusive eDC\'s workshops, webinars etc',
      'Discount Coupons'
    ]
  },
  {
    level: 'Top Performer',
    minPoints: 1000,
    maxPoints: Infinity,
    icon: '💎',
    color: '#b9f2ff',
    criteria: 'Top 1% in leaderboard',
    rewards: [
      'Cash prize',
      'Certificate and LOR',
      'Front row seats in BECon\'26 exclusive events',
      'Internship Opportunity with a startup',
      '1-on-1 mentorship session with a startup founder or VC'
    ]
  }
];

function getCurrentLevel(points: number) {
  return LEVEL_TIERS.find(tier => points >= tier.minPoints && points <= tier.maxPoints) || LEVEL_TIERS[0];
}

function getNextLevel(points: number) {
  const currentIndex = LEVEL_TIERS.findIndex(tier => points >= tier.minPoints && points <= tier.maxPoints);
  return LEVEL_TIERS[currentIndex + 1] || null;
}

export default function DashboardPage() {
  const { user, userProfile, logout } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number>(0);
  const [filter, setFilter] = useState<'unattempted' | 'completed' | 'all'>('unattempted');
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Auto-rotate carousel
  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // Check if profile is completed
    if (userProfile && !userProfile.profileCompleted) {
      router.replace("/complete-profile");
      return;
    }

    const fetchData = async () => {
      try {
        // Use cached rank from userProfile instead of fetching all 25K users!
        // This is the main optimization - saves 25,000 reads per page load
        if (userProfile?.rank) {
          setUserRank(userProfile.rank);
        }

        // Check for cached tasks first
        // IMPORTANT: Skip cache temporarily to fix stale Timestamp data
        // TODO: Remove this cache clear after users have refreshed with new code
        const cachedTasks = getCached<Task[]>('dashboard_tasks');
        if (cachedTasks) {
          setTasks(cachedTasks);
        } else {
          // Fetch all tasks (including closed ones for display)
          // Limit to 50 most recent tasks to prevent unbound growth
          const tasksQuery = query(
            collection(db, "tasks"),
            orderBy("createdAt", "desc"),
            limit(50)
          );
          const tasksSnap = await getDocs(tasksQuery);
          const tasksData = tasksSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Task[];
          setTasks(tasksData);
          setCache('dashboard_tasks', tasksData, 5 * 60 * 1000); // Cache for 5 minutes
        }

        // PATCH: Fetch Top 10 to correct rank for top users (Fixes #2541 vs #1 discrepancy)
        try {
          let top10 = getCached<UserProfile[]>('leaderboard_top10');
          if (!top10) {
            const topUsersQuery = query(collection(db, "users"), orderBy("points", "desc"), limit(10));
            const snap = await getDocs(topUsersQuery);
            top10 = snap.docs.map(d => ({ uid: d.id, ...d.data() })) as UserProfile[];
            setCache('leaderboard_top10', top10, 2 * 60 * 1000);
          }

          if (top10 && user.uid) {
            const inTop = top10.find(u => u.uid === user.uid);
            if (inTop) {
              const better = top10.filter(u => (u.points || 0) > (inTop.points || 0));
              setUserRank(better.length + 1);
            }
          }
        } catch (e) {
          console.error("Error fetching top 10 for rank patch:", e);
        }

        // Fetch user's submissions (these change more frequently, shorter cache)
        const cachedSubmissions = getCached<Submission[]>(`submissions_${user.uid}`);
        if (cachedSubmissions) {
          setSubmissions(cachedSubmissions);
        } else {
          const submissionsQuery = query(
            collection(db, "submissions"),
            where("userId", "==", user.uid)
          );
          const submissionsSnap = await getDocs(submissionsQuery);
          const submissionsData = submissionsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Submission[];
          setSubmissions(submissionsData);
          setCache(`submissions_${user.uid}`, submissionsData, 2 * 60 * 1000); // Cache for 2 minutes
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user?.uid, userProfile?.rank, router]);

  if (!user || !userProfile) return null;

  const userPoints = userProfile.points || 0;
  const currentLevel = getCurrentLevel(userPoints);
  const nextLevel = getNextLevel(userPoints);
  const progressToNext = nextLevel
    ? ((userPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100;

  const hasSubmitted = (taskId: string) => {
    return submissions.some(s => s.taskId === taskId);
  };

  const getSubmissionPoints = (taskId: string) => {
    const sub = submissions.find(s => s.taskId === taskId);
    return sub?.pointsAwarded;
  };

  const completedTasks = submissions.filter(s => s.reviewed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter(task => {
    const submitted = hasSubmitted(task.id);
    const isClosed = task.status === 'closed';
    const isExpired = task.deadline && toDate(task.deadline)! < new Date();
    // Task is active only if it's explicitly open AND not expired
    const isActive = task.status === 'open' && !isExpired;

    if (filter === 'unattempted') {
      return !submitted && isActive;
    } else if (filter === 'completed') {
      return submitted;
    }
    return true; // 'all' filter
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="border-b sticky top-0 z-50" style={{ borderColor: 'var(--surface-light)', background: 'var(--surface)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          {/* Desktop Layout */}
          <div className="hidden md:flex justify-between items-center gap-6">
            <div className="flex items-center gap-6 flex-shrink-0">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                  Ambassador Hub
                </h1>
                <p style={{ color: 'var(--muted)' }} className="text-sm mt-1">
                  Welcome back, {userProfile.displayName || user.email}!
                </p>
              </div>

              {/* Store Link */}
              <Link
                href="/store"
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
                style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)' }}
                title="NO CAP Store"
              >
                <span className="text-xl">🏪</span>
                <span className="text-sm font-medium" style={{ color: '#8B5CF6' }}>Store</span>
              </Link>

              {/* WhatsApp Community Link */}
              <a
                href="https://chat.whatsapp.com/JPIf86cf4jHCHqi7wwjJcV"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
                style={{ background: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.3)' }}
                title="Join WhatsApp Community"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="#25D366"
                  className="w-5 h-5"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                <span className="text-sm font-medium" style={{ color: '#25D366' }}>Community</span>
              </a>
            </div>

            <div className="flex items-center gap-4">
              {/* Gamified Rank Card */}
              <Link
                href="/leaderboard"
                className="flex items-center gap-3 px-5 py-2 rounded-full transition-all hover:scale-105 cursor-pointer border-2 flex-shrink-0"
                style={{
                  background: 'var(--gradient-primary)',
                  borderColor: userRank <= 3 ? '#FFD700' : 'transparent',
                  boxShadow: userRank <= 3 ? '0 0 20px rgba(255, 215, 0, 0.3)' : 'none'
                }}
              >
                <div className="text-2xl">
                  {userRank === 1 ? '🥇' : userRank === 2 ? '🥈' : userRank === 3 ? '🥉' : '🏅'}
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-[10px] font-medium opacity-80" style={{ color: 'var(--foreground)' }}>
                      Your Rank
                    </div>
                    <div className="text-lg font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
                      #{userRank || '-'}
                    </div>
                  </div>
                  <div className="border-l-2 border-white/20 pl-4">
                    <div className="text-[10px] font-medium opacity-80" style={{ color: 'var(--foreground)' }}>
                      Points
                    </div>
                    <div className="text-lg font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
                      {userPoints}
                    </div>
                  </div>
                </div>
              </Link>

              {/* Profile Dropdown */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 border-2"
                  style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)', borderColor: 'transparent' }}
                >
                  👤
                </button>

                {profileDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div
                      className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg overflow-hidden z-50"
                      style={{ background: 'var(--surface)', border: '1px solid var(--surface-light)' }}
                    >
                      <Link
                        href="/profile"
                        className="block px-4 py-3 transition-all hover:bg-opacity-80"
                        style={{ color: 'var(--foreground)' }}
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-3 transition-all hover:bg-opacity-80"
                        style={{ color: 'var(--danger)' }}
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                  Ambassador Hub
                </h1>
                <p style={{ color: 'var(--muted)' }} className="text-xs mt-0.5">
                  Welcome back!
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Store Button - Mobile */}
                <Link
                  href="/store"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
                  style={{ background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.4)' }}
                  title="NO CAP Store"
                >
                  <span className="text-xl">🏪</span>
                </Link>

                {/* WhatsApp Community Button - Mobile */}
                <a
                  href="https://chat.whatsapp.com/JPIf86cf4jHCHqi7wwjJcV"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
                  style={{ background: 'rgba(37, 211, 102, 0.15)', border: '1px solid rgba(37, 211, 102, 0.4)' }}
                  title="Join WhatsApp Community"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="#25D366"
                    className="w-5 h-5"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </a>

                {/* Profile Dropdown - Mobile */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 border-2"
                    style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)', borderColor: 'transparent' }}
                  >
                    👤
                  </button>

                  {profileDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setProfileDropdownOpen(false)}
                      />
                      <div
                        className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg overflow-hidden z-50"
                        style={{ background: 'var(--surface)', border: '1px solid var(--surface-light)' }}
                      >
                        <Link
                          href="/profile"
                          className="block px-4 py-3 transition-all hover:bg-opacity-80"
                          style={{ color: 'var(--foreground)' }}
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          Profile
                        </Link>
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-4 py-3 transition-all hover:bg-opacity-80"
                          style={{ color: 'var(--danger)' }}
                        >
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Rank Card - Mobile (Full Width) */}
            <Link
              href="/leaderboard"
              className="flex items-center justify-between px-4 py-2.5 rounded-full transition-all active:scale-95 border-2 w-full"
              style={{
                background: 'var(--gradient-primary)',
                borderColor: userRank <= 3 ? '#FFD700' : 'transparent',
                boxShadow: userRank <= 3 ? '0 0 20px rgba(255, 215, 0, 0.3)' : 'none'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {userRank === 1 ? '🥇' : userRank === 2 ? '🥈' : userRank === 3 ? '🥉' : '🏅'}
                </div>
                <div>
                  <div className="text-[10px] font-medium opacity-80" style={{ color: 'var(--foreground)' }}>
                    Your Rank
                  </div>
                  <div className="text-lg font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
                    #{userRank || '-'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-medium opacity-80" style={{ color: 'var(--foreground)' }}>
                  Points
                </div>
                <div className="text-lg font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
                  {userPoints}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Level Progress */}
        <div
          className="glass-card p-6 sm:p-8 cursor-pointer transition-all hover:scale-[1.01]"
          onClick={() => setShowLevelsModal(true)}
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{ background: `linear-gradient(135deg, ${currentLevel.color} 0%, transparent 100%)` }}></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="text-5xl sm:text-6xl">{currentLevel.icon}</div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold" style={{ color: currentLevel.color }}>
                    {currentLevel.level} Tier
                  </h3>
                  <p className="text-sm sm:text-base mt-1" style={{ color: 'var(--muted)' }}>
                    {currentLevel.criteria}
                  </p>
                </div>
              </div>
              {nextLevel && (
                <div className="text-right hidden sm:block">
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>Next Tier</p>
                  <p className="text-xl font-bold" style={{ color: nextLevel.color }}>
                    {nextLevel.level}
                  </p>
                  <p className="text-sm font-semibold mt-1" style={{ color: 'var(--foreground)' }}>
                    {nextLevel.minPoints - userPoints} pts to go
                  </p>
                </div>
              )}
              {!nextLevel && (
                <div className="text-right hidden sm:block">
                  <p className="text-xl font-bold" style={{ color: currentLevel.color }}>
                    🏆 Max Tier
                  </p>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="h-4 rounded-full overflow-hidden" style={{ background: 'var(--surface-light)' }}>
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${progressToNext}%`,
                    background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel?.color || currentLevel.color})`
                  }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-3">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Current</p>
                  <span className="text-sm font-bold" style={{ color: currentLevel.color }}>
                    {currentLevel.minPoints} pts
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Progress</p>
                  <span className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
                    {userPoints} / {nextLevel ? nextLevel.minPoints : currentLevel.maxPoints}
                  </span>
                </div>
                {nextLevel && (
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Next</p>
                    <span className="text-sm font-bold" style={{ color: nextLevel.color }}>
                      {nextLevel.minPoints} pts
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                💡 Click to view all tiers and rewards
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-fadeIn">
          {/* Total Points */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: 'var(--muted)' }} className="text-xs sm:text-sm font-medium">Total Points</span>
              <span className="text-xl sm:text-2xl">⭐</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--primary)' }}>
              {userProfile.points || 0}
            </div>
            <div className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--success)' }}>
              +{submissions.filter(s => s.reviewed && s.pointsAwarded).reduce((acc, s) => acc + (s.pointsAwarded || 0), 0)} earned
            </div>
          </div>

          {/* Rank */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: 'var(--muted)' }} className="text-xs sm:text-sm font-medium">Your Rank</span>
              <span className="text-xl sm:text-2xl">🏅</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--accent)' }}>
              #{userRank || '-'}
            </div>
            <div className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Global ranking
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: 'var(--muted)' }} className="text-xs sm:text-sm font-medium">Completed</span>
              <span className="text-xl sm:text-2xl">✅</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--success)' }}>
              {completedTasks}/{totalTasks}
            </div>
            <div className="progress-bar mt-2">
              <div className="progress-fill" style={{ width: `${completionRate}%` }}></div>
            </div>
          </div>

          {/* Active Tasks */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: 'var(--muted)' }} className="text-xs sm:text-sm font-medium">Active Tasks</span>
              <span className="text-xl sm:text-2xl">🎯</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--warning)' }}>
              {tasks.filter(t => {
                const isOpen = t.status === 'open';
                const notExpired = !t.deadline || toDate(t.deadline)! >= new Date();
                const notCompleted = !hasSubmitted(t.id);
                // Task is active only if explicitly open AND not expired
                return isOpen && notExpired && notCompleted;
              }).length}
            </div>
            <div className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Available now
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="glass-card p-4 sm:p-6 animate-slideIn">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
              📋 Available Tasks
            </h2>
            <div className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
              {filteredTasks.length} tasks
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
            <button
              onClick={() => setFilter('unattempted')}
              className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filter === 'unattempted' ? 'var(--gradient-primary)' : 'var(--surface)',
                color: 'var(--foreground)',
                border: filter === 'unattempted' ? 'none' : '1px solid var(--surface-light)'
              }}
            >
              🔥 Active ({tasks.filter(t => !hasSubmitted(t.id) && t.status === 'open' && (!t.deadline || toDate(t.deadline)! >= new Date())).length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filter === 'completed' ? 'var(--gradient-primary)' : 'var(--surface)',
                color: 'var(--foreground)',
                border: filter === 'completed' ? 'none' : '1px solid var(--surface-light)'
              }}
            >
              ✅ Completed ({submissions.length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filter === 'all' ? 'var(--gradient-primary)' : 'var(--surface)',
                color: 'var(--foreground)',
                border: filter === 'all' ? 'none' : '1px solid var(--surface-light)'
              }}
            >
              📋 All ({tasks.length})
            </button>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin"
                style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
              <p style={{ color: 'var(--muted)' }} className="mt-4">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">
                {filter === 'unattempted' ? '🎯' : filter === 'completed' ? '✅' : '📭'}
              </div>
              <p style={{ color: 'var(--muted)' }}>
                {filter === 'unattempted'
                  ? 'No active tasks available. Check back soon!'
                  : filter === 'completed'
                    ? 'No completed tasks yet. Start completing tasks to see them here!'
                    : 'No tasks available yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => {
                const submitted = hasSubmitted(task.id);
                const points = getSubmissionPoints(task.id);
                const isClosed = task.status === "closed";
                const isExpired = task.deadline && toDate(task.deadline)! < new Date();

                return (
                  <div
                    key={task.id}
                    className="p-4 sm:p-5 rounded-xl transition-all hover:scale-[1.02] border"
                    style={{
                      background: submitted ? 'var(--surface)' : 'var(--surface-light)',
                      borderColor: submitted ? 'var(--success)' : 'var(--surface-light)'
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-2">
                          <h3 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                            {task.title}
                          </h3>

                          {isClosed && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold"
                              style={{ background: 'var(--surface-light)', color: 'var(--muted)' }}>
                              🔒 Closed
                            </span>
                          )}
                          {submitted && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold"
                              style={{ background: 'var(--success)', color: 'var(--background)' }}>
                              ✓ Submitted
                            </span>
                          )}
                          {isExpired && !isClosed && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold"
                              style={{ background: 'var(--danger)', color: 'var(--foreground)' }}>
                              ⏰ Expired
                            </span>
                          )}
                          {!submitted && !isClosed && !isExpired && (
                            <span className="px-3 py-1 rounded-full text-sm font-semibold animate-pulse"
                              style={{ background: 'var(--success)', color: 'var(--background)' }}>
                              ✓ Open
                            </span>
                          )}
                        </div>

                        <p style={{ color: 'var(--muted)' }} className="text-xs sm:text-sm line-clamp-2 mb-2 sm:mb-3">
                          {task.description}
                        </p>

                        <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs sm:text-sm">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="text-base sm:text-lg">💎</span>
                            <span style={{ color: 'var(--primary)' }} className="font-bold">
                              {task.maxPoints} pts
                            </span>
                          </div>
                          {task.deadline && (
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className="text-base sm:text-lg">📅</span>
                              <span style={{ color: 'var(--muted)' }}>
                                {toDate(task.deadline)?.toLocaleDateString()} at {toDate(task.deadline)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                          {submitted && points !== undefined && (
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className="text-base sm:text-lg">⭐</span>
                              <span style={{ color: 'var(--success)' }} className="font-bold">
                                +{points} earned
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                        {!isClosed && !isExpired && !submitted && (
                          <Link
                            href={`/dashboard/tasks/${task.id}`}
                            className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-center text-sm font-medium transition-all hover:scale-105 whitespace-nowrap flex-1 sm:flex-none"
                            style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}
                          >
                            Start Task →
                          </Link>
                        )}
                        {submitted && (
                          <Link
                            href={`/dashboard/tasks/${task.id}`}
                            className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-center text-sm font-medium border transition-all hover:scale-105 whitespace-nowrap flex-1 sm:flex-none"
                            style={{ borderColor: 'var(--success)', color: 'var(--success)' }}
                          >
                            View Details
                          </Link>
                        )}
                        {(isClosed || isExpired) && !submitted && (
                          <div className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-center text-sm font-medium whitespace-nowrap flex-1 sm:flex-none"
                            style={{ background: 'var(--surface)', color: 'var(--muted)' }}>
                            Unavailable
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Levels Modal */}
        {showLevelsModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.8)' }}
            onClick={() => setShowLevelsModal(false)}
          >
            <div
              className="glass-card max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                  🏆 Ambassador Tiers & Rewards
                </h2>
                <button
                  onClick={() => setShowLevelsModal(false)}
                  className="text-2xl w-10 h-10 rounded-lg transition-all hover:scale-110"
                  style={{ background: 'var(--surface-light)', color: 'var(--foreground)' }}
                >
                  ✕
                </button>
              </div>

              <p className="mb-6" style={{ color: 'var(--muted)' }}>
                Complete tasks and earn points to unlock exclusive rewards and benefits!
              </p>

              <div className="space-y-4">
                {LEVEL_TIERS.map((tier, index) => {
                  const isCurrentTier = tier.level === currentLevel.level;
                  const isUnlocked = userPoints >= tier.minPoints;

                  return (
                    <div
                      key={tier.level}
                      className={`p-6 rounded-xl border-2 transition-all ${isCurrentTier ? 'scale-105' : ''}`}
                      style={{
                        borderColor: isCurrentTier ? tier.color : 'var(--surface-light)',
                        background: isCurrentTier ? `linear-gradient(135deg, ${tier.color}15, transparent)` : 'var(--surface)',
                        opacity: isUnlocked ? 1 : 0.6
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <span className="text-5xl">{tier.icon}</span>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-2xl font-bold" style={{ color: tier.color }}>
                                {tier.level}
                              </h3>
                              {isCurrentTier && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold animate-pulse"
                                  style={{ background: tier.color, color: '#000' }}>
                                  CURRENT TIER
                                </span>
                              )}
                              {!isUnlocked && (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold"
                                  style={{ background: 'var(--surface-light)', color: 'var(--muted)' }}>
                                  🔒 Locked
                                </span>
                              )}
                            </div>
                            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                              <strong>Criteria:</strong> {tier.criteria}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm" style={{ color: 'var(--muted)' }}>Points Required</p>
                          <p className="text-xl font-bold" style={{ color: tier.color }}>
                            {tier.minPoints}
                            {tier.maxPoints !== Infinity && ` - ${tier.maxPoints}`}
                            {tier.maxPoints === Infinity && '+'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                          🎁 Rewards & Benefits:
                        </h4>
                        <ul className="space-y-1">
                          {tier.rewards.map((reward, i) => (
                            <li
                              key={i}
                              className="text-sm flex items-start gap-2"
                              style={{ color: 'var(--muted)' }}
                            >
                              <span style={{ color: tier.color }}>✓</span>
                              <span>{reward}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {!isUnlocked && index > 0 && (
                        <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--surface-light)' }}>
                          <p className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>
                            💪 {tier.minPoints - userPoints} more points needed to unlock!
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 p-6 rounded-xl" style={{ background: 'var(--gradient-primary)' }}>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                  💡 How to Earn More Points?
                </h3>
                <ul className="space-y-2" style={{ color: 'var(--foreground)' }}>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Complete available tasks and submit quality work</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Submit before deadlines to maximize your points</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Check dashboard regularly for new tasks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Aim for excellence - better submissions earn more points!</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
