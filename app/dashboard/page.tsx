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

  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
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
  }, [user, router]);

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
      <div className="border-b" style={{ borderColor: 'var(--surface-light)', background: 'var(--surface)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                🎯 Ambassador Hub
              </h1>
              <p style={{ color: 'var(--muted)' }} className="text-sm mt-1">
                Welcome back, {userProfile.displayName || user.email}!
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/leaderboard"
                className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}
              >
                🏆 Leaderboard
              </Link>
              <button 
                className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                style={{ background: 'var(--surface-light)', color: 'var(--foreground)' }}
                onClick={() => logout()}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Level Progress Bar */}
        <div 
          className="glass-card p-6 cursor-pointer transition-all hover:scale-[1.01] animate-fadeIn"
          onClick={() => setShowLevelsModal(true)}
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          <div className="absolute inset-0 opacity-10"
               style={{ background: `linear-gradient(135deg, ${currentLevel.color} 0%, transparent 100%)` }}></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{currentLevel.icon}</span>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: currentLevel.color }}>
                    {currentLevel.level} Tier
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    {currentLevel.criteria}
                  </p>
                </div>
              </div>
              {nextLevel && (
                <div className="text-right">
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>Next: {nextLevel.level}</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                    {nextLevel.minPoints - userPoints} points to go
                  </p>
                </div>
              )}
              {!nextLevel && (
                <div className="text-right">
                  <p className="text-lg font-bold" style={{ color: currentLevel.color }}>
                    🏆 Max Level Reached!
                  </p>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--surface-light)' }}>
                <div 
                  className="h-full transition-all duration-500 rounded-full"
                  style={{ 
                    width: `${progressToNext}%`,
                    background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel?.color || currentLevel.color})`
                  }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs font-semibold" style={{ color: currentLevel.color }}>
                  {currentLevel.minPoints} pts
                </span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {userPoints} / {nextLevel ? nextLevel.minPoints : currentLevel.maxPoints} pts
                </span>
                {nextLevel && (
                  <span className="text-xs font-semibold" style={{ color: nextLevel.color }}>
                    {nextLevel.minPoints} pts
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-center mt-3" style={{ color: 'var(--muted)' }}>
              💡 Click to view all tiers and rewards
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
          {/* Total Points */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: 'var(--muted)' }} className="text-sm font-medium">Total Points</span>
              <span className="text-2xl">⭐</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>
              {userProfile.points || 0}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--success)' }}>
              +{submissions.filter(s => s.reviewed && s.pointsAwarded).reduce((acc, s) => acc + (s.pointsAwarded || 0), 0)} earned
            </div>
          </div>

          {/* Rank */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: 'var(--muted)' }} className="text-sm font-medium">Your Rank</span>
              <span className="text-2xl">🏅</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>
              #{userRank || '-'}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Global ranking
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: 'var(--muted)' }} className="text-sm font-medium">Completed</span>
              <span className="text-2xl">✅</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: 'var(--success)' }}>
              {completedTasks}/{totalTasks}
            </div>
            <div className="progress-bar mt-2">
              <div className="progress-fill" style={{ width: `${completionRate}%` }}></div>
            </div>
          </div>

          {/* Active Tasks */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: 'var(--muted)' }} className="text-sm font-medium">Active Tasks</span>
              <span className="text-2xl">🎯</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: 'var(--warning)' }}>
              {tasks.filter(t => {
                const isOpen = t.status === 'open';
                const notExpired = !t.deadline || t.deadline.toDate() >= new Date();
                const notCompleted = !hasSubmitted(t.id);
                // Task is active only if explicitly open AND not expired
                return isOpen && notExpired && notCompleted;
              }).length}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Available now
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="glass-card p-6 animate-slideIn">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
              📋 Available Tasks
            </h2>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>
              {filteredTasks.length} tasks
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <button
              onClick={() => setFilter('unattempted')}
              className="px-4 py-2 rounded-lg font-medium transition-all"
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
              className="px-4 py-2 rounded-lg font-medium transition-all"
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
              className="px-4 py-2 rounded-lg font-medium transition-all"
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
                    className="p-5 rounded-xl transition-all hover:scale-[1.02] border"
                    style={{ 
                      background: submitted ? 'var(--surface)' : 'var(--surface-light)',
                      borderColor: submitted ? 'var(--success)' : 'var(--surface-light)'
                    }}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <h3 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
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

                        <p style={{ color: 'var(--muted)' }} className="text-sm line-clamp-2 mb-3">
                          {task.description}
                        </p>

                        <div className="flex items-center gap-4 flex-wrap text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">💎</span>
                            <span style={{ color: 'var(--primary)' }} className="font-bold">
                              {task.maxPoints} pts
                            </span>
                          </div>
                          {task.deadline && (
                            <div className="flex items-center gap-2">
                              <span className="text-lg">📅</span>
                              <span style={{ color: 'var(--muted)' }}>
                                {task.deadline.toDate().toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {submitted && points !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="text-lg">⭐</span>
                              <span style={{ color: 'var(--success)' }} className="font-bold">
                                +{points} earned
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {!isClosed && !isExpired && !submitted && (
                          <Link
                            href={`/dashboard/tasks/${task.id}`}
                            className="px-6 py-3 rounded-lg text-center font-medium transition-all hover:scale-105 whitespace-nowrap"
                            style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}
                          >
                            Start Task →
                          </Link>
                        )}
                        {submitted && (
                          <Link
                            href={`/dashboard/tasks/${task.id}`}
                            className="px-6 py-3 rounded-lg text-center font-medium border transition-all hover:scale-105 whitespace-nowrap"
                            style={{ borderColor: 'var(--success)', color: 'var(--success)' }}
                          >
                            View Details
                          </Link>
                        )}
                        {(isClosed || isExpired) && !submitted && (
                          <div className="px-6 py-3 rounded-lg text-center font-medium whitespace-nowrap"
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
