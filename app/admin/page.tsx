"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  collection,
  query,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { useAdminAuth } from "@/app/providers/AdminAuthProvider";
import { db } from "@/lib/firebase";
import { Task } from "@/lib/types";

type TaskWithStats = Task & {
  pendingCount: number;
  totalSubmissions: number;
};

function AdminDashboard() {
  const { admin, logout } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<TaskWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{
    id: string;
    status: "open" | "closed";
    title: string;
  } | null>(null);

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

      // OPTIMIZATION: Use counters stored on task documents instead of fetching all submissions
      // pendingCount and totalSubmissions are now stored directly on each task document
      // and updated when submissions are created/reviewed
      const tasksData = tasksSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          pendingCount: data.pendingCount || 0,
          totalSubmissions: data.totalSubmissions || 0,
        };
      }) as TaskWithStats[];

      // Calculate total pending across all tasks
      const total = tasksData.reduce(
        (sum, task) => sum + (task.pendingCount || 0),
        0
      );
      setTotalPending(total);

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
      setTasks(
        tasks.map((t) =>
          t.id === taskId ? { ...t, status: newStatus as "open" | "closed" } : t
        )
      );
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Failed to update task status");
    }
  };

  const deleteTask = async (taskId: string, taskTitle: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the task "${taskTitle}"?\n\nThis action cannot be undone and will also delete all submissions for this task.`
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "tasks", taskId));
      setTasks(tasks.filter((t) => t.id !== taskId));
      alert("Task deleted successfully!");
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task: " + error);
    }
  };

  if (!admin) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ color: "var(--foreground)" }}
            >
              Admin Dashboard
            </h1>
            <p className="mt-1" style={{ color: "var(--muted)" }}>
              Manage tasks and review submissions
            </p>
            {totalPending > 0 && (
              <div
                className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold"
                style={{
                  background: "var(--accent)",
                  color: "var(--background)",
                }}
              >
                <span className="animate-pulse">🔔</span>
                {totalPending} Pending Review{totalPending !== 1 ? "s" : ""}
              </div>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={fetchTasks}
              className="px-4 py-2 rounded-lg border transition-all hover:scale-105"
              style={{
                background: "var(--surface)",
                borderColor: "var(--surface-light)",
                color: "var(--foreground)",
              }}
            >
              🔄 Refresh
            </button>
            <Link
              href="/admin/store"
              className="px-4 py-2 rounded-lg border transition-all hover:scale-105"
              style={{
                background: "var(--surface)",
                borderColor: "var(--surface-light)",
                color: "var(--foreground)",
              }}
            >
              🏪 Store Management
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg border transition-all hover:scale-105"
              style={{
                background: "var(--surface)",
                borderColor: "var(--surface-light)",
                color: "var(--foreground)",
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
                background: "var(--surface)",
                borderColor: "var(--surface-light)",
                color: "var(--foreground)",
              }}
            >
              🚪 Sign Out
            </button>
            <Link
              href="/admin/tasks/create"
              className="px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
              style={{
                background: "var(--gradient-primary)",
                color: "var(--foreground)",
              }}
            >
              ➕ Create New Task
            </Link>
          </div>
        </div>

        {/* Tasks List */}
        <div className="glass-card p-6">
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ color: "var(--foreground)" }}
          >
            All Tasks
          </h2>
          {loading ? (
            <div
              className="flex items-center gap-3"
              style={{ color: "var(--muted)" }}
            >
              <div
                className="inline-block w-5 h-5 border-2 rounded-full animate-spin"
                style={{
                  borderColor: "var(--primary)",
                  borderTopColor: "transparent",
                }}
              ></div>
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No tasks created yet.</p>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => {
                const isExpired =
                  task.deadline && task.deadline.toDate() < new Date();
                return (
                  <div
                    key={task.id}
                    className="border rounded-lg p-4 transition-all hover:scale-[1.01]"
                    style={{
                      background: "var(--surface-light)",
                      borderColor: "var(--surface-lighter)",
                    }}
                  >
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className="text-lg font-semibold"
                            style={{ color: "var(--foreground)" }}
                          >
                            {task.title}
                          </h3>
                          <span
                            className="text-xs px-2 py-1 rounded-full font-semibold"
                            style={{
                              background:
                                task.status === "open"
                                  ? "var(--success)"
                                  : "var(--surface-light)",
                              color:
                                task.status === "open"
                                  ? "var(--background)"
                                  : "var(--muted)",
                            }}
                          >
                            {task.status === "open" ? "✓ Open" : "🔒 Closed"}
                          </span>
                          {isExpired && task.status === "open" && (
                            <span
                              className="text-xs px-2 py-1 rounded-full font-semibold"
                              style={{
                                background: "var(--danger)",
                                color: "var(--foreground)",
                              }}
                            >
                              ⏰ Expired
                            </span>
                          )}
                          {task.pendingCount > 0 && (
                            <span
                              className="text-xs px-2 py-1 rounded-full font-semibold animate-pulse"
                              style={{
                                background: "var(--accent)",
                                color: "var(--background)",
                              }}
                            >
                              🔔 {task.pendingCount} Pending
                            </span>
                          )}
                        </div>
                        <p
                          className="mt-1 line-clamp-2"
                          style={{ color: "var(--muted)" }}
                        >
                          {task.description}
                        </p>
                        <div
                          className="flex items-center gap-4 mt-2 text-sm flex-wrap"
                          style={{ color: "var(--muted)" }}
                        >
                          <span className="flex items-center gap-1">
                            <span style={{ color: "var(--accent)" }}>⭐</span>
                            Max Points: {task.maxPoints}
                          </span>
                          {task.deadline && (
                            <span className="flex items-center gap-1">
                              <span>⏰</span>
                              Deadline:{" "}
                              {task.deadline.toDate().toLocaleDateString()}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <span>📅</span>
                            Created:{" "}
                            {task.createdAt.toDate().toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <span>📝</span>
                            Submissions: {task.totalSubmissions}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedTask({
                              id: task.id,
                              status: task.status,
                              title: task.title,
                            });
                            setConfirmOpen(true);
                          }}
                          className="px-3 py-2 text-sm rounded-lg transition-all hover:scale-105 font-medium"
                          style={{
                            background:
                              task.status === "open"
                                ? "var(--surface-lighter)"
                                : "var(--success)",
                            color:
                              task.status === "open"
                                ? "var(--muted)"
                                : "var(--background)",
                          }}
                        >
                          {task.status === "open" ? "🔒 Close" : "✓ Open"}
                        </button>
                        <Link
                          href={`/admin/tasks/${task.id}/edit`}
                          className="px-3 py-2 text-sm border rounded-lg transition-all hover:scale-105 font-medium"
                          style={{
                            background: "var(--surface)",
                            borderColor: "var(--surface-light)",
                            color: "var(--foreground)",
                          }}
                        >
                          ✏️ Edit
                        </Link>
                        <Link
                          href={`/admin/tasks/${task.id}/submissions`}
                          className="px-3 py-2 text-sm rounded-lg transition-all hover:scale-105 font-medium"
                          style={{
                            background: "var(--gradient-primary)",
                            color: "var(--foreground)",
                          }}
                        >
                          📝 Submissions
                        </Link>
                        <button
                          onClick={() => deleteTask(task.id, task.title)}
                          className="px-3 py-2 text-sm rounded-lg transition-all hover:scale-105 font-medium"
                          style={{
                            background: "var(--danger)",
                            color: "var(--foreground)",
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {confirmOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmOpen(false)}
          />

          {/* Dialog */}
          <div
            className="relative w-full max-w-md rounded-2xl p-6 shadow-xl border animate-scaleIn"
            style={{
              background: "var(--surface)",
              borderColor: "var(--surface-light)",
              color: "var(--foreground)",
            }}
          >
            <h3 className="text-xl font-semibold mb-2">
              Confirm Status Change
            </h3>

            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
              Are you sure you want to{" "}
              <span
                className="font-semibold"
                style={{ color: "var(--accent)" }}
              >
                {selectedTask.status === "open" ? "close" : "open"}
              </span>{" "}
              the task:
            </p>

            <div
              className="mb-4 px-3 py-2 rounded-lg text-sm font-medium"
              style={{
                background: "var(--surface-light)",
                border: "1px solid var(--surface-lighter)",
              }}
            >
              {selectedTask.title}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              {/* Cancel */}
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-lg transition-all hover:scale-105"
                style={{
                  background: "var(--surface-light)",
                  color: "var(--muted)",
                }}
              >
                Cancel
              </button>

              {/* Confirm */}
              <button
                onClick={async () => {
                  await toggleTaskStatus(selectedTask.id, selectedTask.status);
                  setConfirmOpen(false);
                  setSelectedTask(null);
                }}
                className="px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
                style={{
                  background: "var(--gradient-primary)",
                  color: "var(--foreground)",
                }}
              >
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "var(--background)" }}
        >
          <div className="text-center">
            <div
              className="inline-block animate-spin rounded-full h-12 w-12 border-b-2"
              style={{ borderColor: "var(--primary)" }}
            ></div>
            <p className="mt-4" style={{ color: "var(--muted)" }}>
              Loading admin dashboard...
            </p>
          </div>
        </div>
      }
    >
      <AdminDashboard />
    </Suspense>
  );
}
