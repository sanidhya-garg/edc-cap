"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { useAuth } from "@/app/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/lib/types";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    const fetchLeaderboard = async () => {
      try {
        // Fetch top 10 users
        const topUsersQuery = query(
          collection(db, "users"),
          orderBy("points", "desc"),
          limit(10)
        );
        const topUsersSnap = await getDocs(topUsersQuery);
        const topUsersData = topUsersSnap.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as UserProfile[];
        setTopUsers(topUsersData);

        // Fetch current user data
        const userQuery = query(
          collection(db, "users"),
          where("uid", "==", user.uid)
        );
        const userSnap = await getDocs(userQuery);
        if (!userSnap.empty) {
          const userData = {
            uid: userSnap.docs[0].id,
            ...userSnap.docs[0].data()
          } as UserProfile;
          setCurrentUser(userData);

          // Calculate rank
          const allUsersQuery = query(
            collection(db, "users"),
            orderBy("points", "desc")
          );
          const allUsersSnap = await getDocs(allUsersQuery);
          const rank = allUsersSnap.docs.findIndex(doc => doc.id === user.uid) + 1;
          setUserRank(rank);
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin" 
             style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--surface-light)', background: 'var(--surface)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                🏆 Leaderboard
              </h1>
              <p style={{ color: 'var(--muted)' }} className="text-sm mt-1">
                Top Campus Ambassadors
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
              style={{ background: 'var(--surface-light)', color: 'var(--foreground)' }}
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Current User Rank Card */}
        {currentUser && userRank && (
          <div className="p-6 rounded-xl border animate-fadeIn" 
               style={{ 
                 background: 'var(--gradient-primary)',
                 borderColor: 'transparent'
               }}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90" style={{ color: 'var(--foreground)' }}>Your Rank</p>
                <h2 className="text-5xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>
                  #{userRank}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90" style={{ color: 'var(--foreground)' }}>Your Points</p>
                <h2 className="text-5xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>
                  {currentUser.points || 0}
                </h2>
              </div>
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                {currentUser.displayName || currentUser.email}
              </p>
            </div>
          </div>
        )}

        {/* Top 10 Leaderboard */}
        <div className="glass-card rounded-xl overflow-hidden animate-slideIn">
          <div className="p-6 border-b" style={{ borderColor: 'var(--surface-light)' }}>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
              👑 Top 10 Ambassadors
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--surface-light)' }}>
            {topUsers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">🏆</div>
                <p style={{ color: 'var(--muted)' }}>No users yet</p>
              </div>
            ) : (
              topUsers.map((u, index) => {
                const isCurrentUser = u.uid === user?.uid;
                const rankEmoji = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";
                
                return (
                  <div
                    key={u.uid}
                    className="p-5 flex items-center gap-4 transition-all hover:scale-[1.02]"
                    style={{
                      background: isCurrentUser ? 'var(--surface-light)' : 'transparent',
                      borderLeft: isCurrentUser ? '4px solid var(--primary)' : 'none'
                    }}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-16 h-16 rounded-full font-bold text-xl"
                         style={{ background: 'var(--surface)' }}>
                      <span style={{ color: index < 3 ? 'var(--warning)' : 'var(--foreground)' }}>
                        {rankEmoji || `#${index + 1}`}
                      </span>
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>
                          {u.displayName || u.email}
                        </p>
                        {isCurrentUser && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold"
                                style={{ background: 'var(--primary)', color: 'var(--background)' }}>
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>{u.email}</p>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <p className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>
                        {u.points || 0}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>points</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="p-5 rounded-xl" style={{ background: 'var(--surface)', borderLeft: '4px solid var(--primary)' }}>
          <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <span className="text-xl">💡</span>
            How to Earn Points
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--muted)' }}>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--primary)' }}>→</span>
              Complete tasks assigned by the admin
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--primary)' }}>→</span>
              Submit high-quality work on time
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--primary)' }}>→</span>
              Points are awarded by admin after review
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--primary)' }}>→</span>
              Check the dashboard regularly for new tasks
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
