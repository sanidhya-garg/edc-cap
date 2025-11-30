"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useAdminAuth } from "@/app/providers/AdminAuthProvider";
import { db } from "@/lib/firebase";
import { Task } from "@/lib/types";

export default function CreateTaskPage() {
  const { admin } = useAdminAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxPoints, setMaxPoints] = useState(10);
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (!admin) {
      router.replace("/admin/login");
    }
  }, [admin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;

    setSubmitting(true);
    setError(null);

    try {
      const taskData: Omit<Task, "id"> = {
        title,
        description,
        status: "open",
        maxPoints,
        deadline: deadline ? Timestamp.fromDate(new Date(deadline)) : undefined,
        createdBy: admin.username,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, "tasks"), taskData);
      router.push("/admin?refresh=" + Date.now());
    } catch (err) {
      console.error("Error creating task:", err);
      setError("Failed to create task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!admin) return null;

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
            ➕ Create New Task
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
                placeholder="E.g., Social Media Campaign"
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
                placeholder="Describe the task requirements, deliverables, and any specific instructions..."
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
                  Deadline 
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full rounded-lg p-3 border transition-all focus:outline-none focus:ring-2"
                  style={{ 
                    background: 'var(--surface-light)', 
                    borderColor: 'var(--surface-lighter)',
                    color: 'var(--foreground)'
                  }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Deadline must be in the future
                </p>
              </div>
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
                {submitting ? "Creating..." : "✓ Create Task"}
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
