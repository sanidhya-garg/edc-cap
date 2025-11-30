"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useAuth } from "@/app/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { Task, Submission } from "@/lib/types";

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
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCarouselIndex((prev) => (prev + 1) % 2); // 2 items in carousel
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, []);

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
        // Fetch all tasks (including closed ones for display)
        const tasksQuery = query(
          collection(db, "tasks"),
          orderBy("createdAt", "desc")
        );
        const tasksSnap = await getDocs(tasksQuery);
        const tasksData = tasksSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Task[];
        setTasks(tasksData);

        // Fetch user's submissions
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

        // Calculate user rank
        const allUsersQuery = query(
          collection(db, "users"),
          orderBy("points", "desc")
        );
        const allUsersSnap = await getDocs(allUsersQuery);
        const rank = allUsersSnap.docs.findIndex(doc => doc.id === user.uid) + 1;
        setUserRank(rank || 0);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, userProfile, router]);

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
    const isExpired = task.deadline && task.deadline.toDate() < new Date();
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
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                🎯 Ambassador Hub
              </h1>
              <p style={{ color: 'var(--muted)' }} className="text-sm mt-1">
                Welcome back, {userProfile.displayName || user.email}!
              </p>
            </div>
            
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

          {/* Mobile Layout */}
          <div className="md:hidden space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                  🎯 Ambassador Hub
                </h1>
                <p style={{ color: 'var(--muted)' }} className="text-xs mt-0.5">
                  Welcome back!
                </p>
              </div>
              
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
        {/* Carousel Container */}
        <div className="relative overflow-hidden rounded-2xl" style={{ minHeight: '280px' }}>
          {/* Carousel Track */}
          <div 
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentCarouselIndex * 100}%)` }}
          >
            {/* Slide 1: Level Progress */}
            <div className="w-full flex-shrink-0 px-1">
              <div 
                className="glass-card p-6 sm:p-8 cursor-pointer transition-all hover:scale-[1.01] h-full"
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
            </div>

            {/* Slide 2: CAP Store */}
            <div className="w-full flex-shrink-0 px-1">
              <Link href="/store">
                <div 
                  className="glass-card p-6 sm:p-8 cursor-pointer transition-all hover:scale-[1.01] relative overflow-hidden group h-full"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                    border: '2px solid rgba(99, 102, 241, 0.3)'
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                    style={{ background: 'var(--gradient-primary)' }}
                  ></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                        <span className="text-4xl sm:text-5xl">🏪</span>
                        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                          NO CAP Store
                        </h2>
                      <span className="px-3 py-1 rounded-full text-xs font-bold animate-pulse"
                            style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}>
                        COMING SOON
                      </span>
                    </div>
                    <p className="text-sm sm:text-base mb-4" style={{ color: 'var(--muted)' }}>
                      Redeem your hard-earned points for exclusive rewards, merchandise, and amazing perks!
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--surface)' }}>
                        <span className="text-lg">🎁</span>
                        <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>Exclusive Merch</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--surface)' }}>
                        <span className="text-lg">🎟️</span>
                        <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>Event Tickets</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--surface)' }}>
                        <span className="text-lg">💎</span>
                        <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>Premium Rewards</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative flex-shrink-0 hidden md:block">
                    <div className="text-8xl sm:text-9xl opacity-90 transform group-hover:scale-110 transition-transform duration-500">
                      🎁
                    </div>
                    <div className="absolute -top-2 -right-2 text-3xl animate-bounce">✨</div>
                    <div className="absolute -bottom-2 -left-2 text-3xl animate-bounce delay-100">⭐</div>
                  </div>
                </div>
                
                <div className="relative z-10 mt-4 text-center">
                  <p className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                    💡 Click to learn more • Your Points: {userPoints}
                  </p>
                </div>
              </div>
              </Link>
            </div>
          </div>

          {/* Carousel Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
            <button
              onClick={() => setCurrentCarouselIndex(0)}
              className="w-2 h-2 rounded-full transition-all"
              style={{ 
                background: currentCarouselIndex === 0 ? 'var(--primary)' : 'var(--surface-light)',
                width: currentCarouselIndex === 0 ? '24px' : '8px'
              }}
              aria-label="Slide 1"
            />
            <button
              onClick={() => setCurrentCarouselIndex(1)}
              className="w-2 h-2 rounded-full transition-all"
              style={{ 
                background: currentCarouselIndex === 1 ? 'var(--primary)' : 'var(--surface-light)',
                width: currentCarouselIndex === 1 ? '24px' : '8px'
              }}
              aria-label="Slide 2"
            />
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
                const notExpired = !t.deadline || t.deadline.toDate() >= new Date();
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
              🔥 Active ({tasks.filter(t => !hasSubmitted(t.id) && t.status === 'open' && (!t.deadline || t.deadline.toDate() >= new Date())).length})
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
                const isExpired = task.deadline && task.deadline.toDate() < new Date();

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
                            <span className="px-3 py-1 rounded-full text-xs font-semibold animate-pulse"
                                  style={{ background: 'var(--primary)', color: 'var(--foreground)' }}>
                              🔥 Active
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
                                {task.deadline.toDate().toLocaleDateString()}
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
