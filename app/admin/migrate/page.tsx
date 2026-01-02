"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, query, orderBy, getDocs, updateDoc, doc, increment } from "firebase/firestore";
import { useAdminAuth } from "@/app/providers/AdminAuthProvider";
import { db } from "@/lib/firebase";

export default function MigratePage() {
    const { admin } = useAdminAuth();
    const router = useRouter();
    const [running, setRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const migrateRanks = async () => {
        setRunning(true);
        addLog("Starting user rank migration...");

        try {
            const usersRef = collection(db, "users");
            const snapshot = await getDocs(query(usersRef, orderBy("points", "desc")));
            addLog(`Found ${snapshot.size} users`);

            let rank = 1;
            let prevPoints: number | null = null;
            let sameRankCount = 0;
            let updated = 0;

            for (const docSnap of snapshot.docs) {
                const points = docSnap.data().points || 0;

                if (prevPoints !== null && points < prevPoints) {
                    rank += sameRankCount;
                    sameRankCount = 1;
                } else {
                    sameRankCount++;
                }

                await updateDoc(doc(db, "users", docSnap.id), { rank });
                updated++;

                if (updated % 10 === 0) {
                    addLog(`Updated ${updated}/${snapshot.size} users...`);
                }

                prevPoints = points;
            }

            addLog(`✅ Done! Updated ${updated} users with ranks.`);
        } catch (error) {
            addLog(`❌ Error: ${error}`);
        }

        setRunning(false);
    };

    const migrateTaskCounters = async () => {
        setRunning(true);
        addLog("Starting task counter migration...");

        try {
            const tasksSnap = await getDocs(collection(db, "tasks"));
            const submissionsSnap = await getDocs(collection(db, "submissions"));
            addLog(`Found ${tasksSnap.size} tasks, ${submissionsSnap.size} submissions`);

            // Count submissions per task
            const stats: Record<string, { pending: number; total: number }> = {};
            submissionsSnap.docs.forEach(d => {
                const taskId = d.data().taskId;
                if (!stats[taskId]) stats[taskId] = { pending: 0, total: 0 };
                stats[taskId].total++;
                if (!d.data().reviewed) stats[taskId].pending++;
            });

            // Update each task
            let updated = 0;
            for (const taskDoc of tasksSnap.docs) {
                const s = stats[taskDoc.id] || { pending: 0, total: 0 };
                await updateDoc(doc(db, "tasks", taskDoc.id), {
                    pendingCount: s.pending,
                    totalSubmissions: s.total
                });
                updated++;
                addLog(`Task "${taskDoc.data().title}": ${s.pending} pending / ${s.total} total`);
            }

            addLog(`✅ Done! Updated ${updated} tasks with counters.`);
        } catch (error) {
            addLog(`❌ Error: ${error}`);
        }

        setRunning(false);
    };

    if (!admin) {
        router.replace("/admin/login");
        return null;
    }

    return (
        <div className="min-h-screen p-6" style={{ background: 'var(--background)' }}>
            <div className="max-w-3xl mx-auto">
                <Link href="/admin" className="text-blue-500 hover:underline mb-6 inline-block">
                    ← Back to Admin
                </Link>

                <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
                    🔧 Database Migration
                </h1>

                <div className="space-y-4 mb-8">
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-semibold mb-2">1. Populate User Ranks</h2>
                        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                            Calculates and sets the `rank` field for all users based on their points.
                        </p>
                        <button
                            onClick={migrateRanks}
                            disabled={running}
                            className="px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
                            style={{ background: 'var(--gradient-primary)', color: 'white' }}
                        >
                            {running ? "Running..." : "Run Rank Migration"}
                        </button>
                    </div>

                    <div className="glass-card p-6">
                        <h2 className="text-xl font-semibold mb-2">2. Populate Task Counters</h2>
                        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                            Calculates `pendingCount` and `totalSubmissions` for all tasks.
                        </p>
                        <button
                            onClick={migrateTaskCounters}
                            disabled={running}
                            className="px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
                            style={{ background: 'var(--gradient-secondary)', color: 'white' }}
                        >
                            {running ? "Running..." : "Run Task Counter Migration"}
                        </button>
                    </div>
                </div>

                {/* Log Output */}
                <div className="glass-card p-4">
                    <h3 className="font-semibold mb-2">Log Output:</h3>
                    <div
                        className="font-mono text-sm h-64 overflow-y-auto p-3 rounded"
                        style={{ background: 'var(--surface-light)', color: 'var(--foreground)' }}
                    >
                        {logs.length === 0 ? (
                            <span style={{ color: 'var(--muted)' }}>Click a button above to start...</span>
                        ) : (
                            logs.map((log, i) => <div key={i}>{log}</div>)
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
