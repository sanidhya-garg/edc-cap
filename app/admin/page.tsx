"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { collection, query, getDocs, orderBy, doc, updateDoc } from "firebase/firestore";
import { useAdminAuth } from "@/app/providers/AdminAuthProvider";
import { db } from "@/lib/firebase";
import { Task } from "@/lib/types";

function AdminDashboard() {
  const { admin, logout } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!admin) {
      router.replace("/admin/login");
      return;
    }

    fetchTasks();
  }, [admin, router, searchParams]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      console.log("Fetching tasks...");
      const tasksQuery = query(
        collection(db, "tasks"),
        orderBy("createdAt", "desc")
      );
      const tasksSnap = await getDocs(tasksQuery);
      console.log("Tasks snapshot size:", tasksSnap.size);
      console.log("Tasks docs:", tasksSnap.docs.map(d => ({ id: d.id, data: d.data() })));
      const tasksData = tasksSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      console.log("Parsed tasks data:", tasksData);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      alert("Error fetching tasks: " + error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "open" ? "closed" : "open";
      await updateDoc(doc(db, "tasks", taskId), {
        status: newStatus,
        updatedAt: new Date(),
      });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus as "open" | "closed" } : t));
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Failed to update task status");
    }
  };

  if (!admin) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
              Admin Dashboard
            </h1>
            <p className="mt-1" style={{ color: 'var(--muted)' }}>
              Manage tasks and review submissions
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={fetchTasks}
              className="px-4 py-2 rounded-lg border transition-all hover:scale-105"
              style={{ 
                background: 'var(--surface)', 
                borderColor: 'var(--surface-light)',
                color: 'var(--foreground)'
              }}
            >
              🔄 Refresh
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg border transition-all hover:scale-105"
              style={{ 
                background: 'var(--surface)', 
                borderColor: 'var(--surface-light)',
                color: 'var(--foreground)'
              }}
            >
              👤 User Dashboard
            </Link>
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="px-4 py-2 rounded-lg border transition-all hover:scale-105"
              style={{ 
                background: 'var(--surface)', 
                borderColor: 'var(--surface-light)',
                color: 'var(--foreground)'
              }}
            >
              🚪 Sign Out
            </button>
            <Link
              href="/admin/tasks/create"
              className="px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
              style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}
            >
              ➕ Create New Task
            </Link>
          </div>
        </div>

        {/* Tasks List */}
        <div className="glass-card p-6">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            All Tasks
          </h2>
          {loading ? (
            <div className="flex items-center gap-3" style={{ color: 'var(--muted)' }}>
              <div className="inline-block w-5 h-5 border-2 rounded-full animate-spin" 
                   style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No tasks created yet.</p>
          ) : (
            <div className="space-y-4">
              {tasks.map(task => {
                const isExpired = task.deadline && task.deadline.toDate() < new Date();
                return (
                  <div key={task.id} 
                       className="border rounded-lg p-4 transition-all hover:scale-[1.01]"
                       style={{ 
                         background: 'var(--surface-light)', 
                         borderColor: 'var(--surface-lighter)' 
                       }}>
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                            {task.title}
                          </h3>
                          <span
                            className="text-xs px-2 py-1 rounded-full font-semibold"
                            style={{
                              background: task.status === "open" ? 'var(--success)' : 'var(--surface-light)',
                              color: task.status === "open" ? 'var(--background)' : 'var(--muted)'
                            }}
                          >
                            {task.status === "open" ? "✓ Open" : "🔒 Closed"}
                          </span>
                          {isExpired && task.status === "open" && (
                            <span className="text-xs px-2 py-1 rounded-full font-semibold"
                                  style={{ background: 'var(--danger)', color: 'var(--foreground)' }}>
                              ⏰ Expired
                            </span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2" style={{ color: 'var(--muted)' }}>
                          {task.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm flex-wrap" 
                             style={{ color: 'var(--muted)' }}>
                          <span className="flex items-center gap-1">
                            <span style={{ color: 'var(--accent)' }}>⭐</span>
                            Max Points: {task.maxPoints}
                          </span>
                          {task.deadline && (
                            <span className="flex items-center gap-1">
                              <span>⏰</span>
                              Deadline: {task.deadline.toDate().toLocaleDateString()}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <span>📅</span>
                            Created: {task.createdAt.toDate().toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => toggleTaskStatus(task.id, task.status)}
                          className="px-3 py-2 text-sm rounded-lg transition-all hover:scale-105 font-medium"
                          style={{
                            background: task.status === "open" ? 'var(--surface-lighter)' : 'var(--success)',
                            color: task.status === "open" ? 'var(--muted)' : 'var(--background)'
                          }}
                        >
                          {task.status === "open" ? "🔒 Close" : "✓ Open"}
                        </button>
                        <Link
                          href={`/admin/tasks/${task.id}/edit`}
                          className="px-3 py-2 text-sm border rounded-lg transition-all hover:scale-105 font-medium"
                          style={{ 
                            background: 'var(--surface)', 
                            borderColor: 'var(--surface-light)',
                            color: 'var(--foreground)'
                          }}
                        >
                          ✏️ Edit
                        </Link>
                        <Link
                          href={`/admin/tasks/${task.id}/submissions`}
                          className="px-3 py-2 text-sm rounded-lg transition-all hover:scale-105 font-medium"
                          style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}
                        >
                          📝 Submissions
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" 
           style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" 
               style={{ borderColor: 'var(--primary)' }}></div>
          <p className="mt-4" style={{ color: 'var(--muted)' }}>Loading admin dashboard...</p>
        </div>
      </div>
    }>
      <AdminDashboard />
    </Suspense>
  );
}
