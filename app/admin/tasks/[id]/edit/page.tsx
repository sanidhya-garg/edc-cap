"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { useAdminAuth } from "@/app/providers/AdminAuthProvider";
import { db } from "@/lib/firebase";
import { Task } from "@/lib/types";

export default function EditTaskPage() {
  const { id } = useParams();
  const { admin } = useAdminAuth();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxPoints, setMaxPoints] = useState(10);
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<"open" | "closed">("open");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!admin) {
      router.replace("/admin/login");
      return;
    }

    const fetchTask = async () => {
      try {
        const taskDoc = await getDoc(doc(db, "tasks", id as string));
        if (taskDoc.exists()) {
          const taskData = { id: taskDoc.id, ...taskDoc.data() } as Task;
          setTask(taskData);
          setTitle(taskData.title);
          setDescription(taskData.description);
          setMaxPoints(taskData.maxPoints);
          setStatus(taskData.status);
          if (taskData.deadline) {
            const deadlineDate = taskData.deadline.toDate();
            setDeadline(deadlineDate.toISOString().slice(0, 16));
          }
        } else {
          setError("Task not found");
        }
      } catch (err) {
        console.error("Error fetching task:", err);
        setError("Failed to load task");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id, admin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin || !task) return;

    setSubmitting(true);
    setError(null);

    try {
      await updateDoc(doc(db, "tasks", id as string), {
        title,
        description,
        maxPoints,
        status,
        deadline: deadline ? Timestamp.fromDate(new Date(deadline)) : null,
        updatedAt: Timestamp.now(),
      });
      router.push("/admin");
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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

  if (!admin) return null;

  if (error && !task) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl mb-4" style={{ color: 'var(--danger)' }}>{error}</p>
          <Link href="/admin" 
                className="px-6 py-3 rounded-lg font-medium inline-block"
                style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}>
            Back to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--surface-light)', background: 'var(--surface)' }}>
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link href="/admin" 
                className="inline-flex items-center gap-2 font-medium transition-all hover:scale-105"
                style={{ color: 'var(--primary)' }}>
            ← Back to Admin Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6">
        <div className="glass-card p-8 animate-fadeIn">
          <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
            ✏️ Edit Task
          </h1>
          
          {error && (
            <div className="mb-6 p-4 rounded-lg border" 
                 style={{ background: 'var(--danger-light)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg p-3 border transition-all focus:outline-none focus:ring-2"
                style={{ 
                  background: 'var(--surface-light)', 
                  borderColor: 'var(--surface-lighter)',
                  color: 'var(--foreground)'
                }}
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg p-3 border transition-all focus:outline-none focus:ring-2"
                style={{ 
                  background: 'var(--surface-light)', 
                  borderColor: 'var(--surface-lighter)',
                  color: 'var(--foreground)'
                }}
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Max Points *
                </label>
                <input
                  type="number"
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(parseInt(e.target.value))}
                  className="w-full rounded-lg p-3 border transition-all focus:outline-none focus:ring-2"
                  style={{ 
                    background: 'var(--surface-light)', 
                    borderColor: 'var(--surface-lighter)',
                    color: 'var(--foreground)'
                  }}
                  min={1}
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "open" | "closed")}
                  className="w-full rounded-lg p-3 border transition-all focus:outline-none focus:ring-2"
                  style={{ 
                    background: 'var(--surface-light)', 
                    borderColor: 'var(--surface-lighter)',
                    color: 'var(--foreground)'
                  }}
                  required
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Deadline (optional)
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-lg p-3 border transition-all focus:outline-none focus:ring-2"
                style={{ 
                  background: 'var(--surface-light)', 
                  borderColor: 'var(--surface-lighter)',
                  color: 'var(--foreground)'
                }}
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 rounded-lg font-semibold transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ 
                  background: submitting ? 'var(--surface-light)' : 'var(--gradient-primary)',
                  color: 'var(--foreground)'
                }}
              >
                {submitting ? "Saving..." : "💾 Save Changes"}
              </button>
              <Link
                href="/admin"
                className="px-8 py-3 border rounded-lg text-center transition-all hover:scale-105 font-medium"
                style={{ 
                  background: 'var(--surface)', 
                  borderColor: 'var(--surface-light)',
                  color: 'var(--foreground)'
                }}
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
