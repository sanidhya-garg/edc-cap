"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { useAuth } from "@/app/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { uploadFile } from "@/lib/storage";
import { Task, Submission } from "@/lib/types";

export default function TaskDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch task
        const taskDoc = await getDoc(doc(db, "tasks", id as string));
        if (taskDoc.exists()) {
          setTask({ id: taskDoc.id, ...taskDoc.data() } as Task);
        }

        // Check for existing submission
        const submissionsQuery = query(
          collection(db, "submissions"),
          where("taskId", "==", id),
          where("userId", "==", user.uid)
        );
        const submissionsSnap = await getDocs(submissionsQuery);
        if (!submissionsSnap.empty) {
          setSubmission({
            id: submissionsSnap.docs[0].id,
            ...submissionsSnap.docs[0].data()
          } as Submission);
        }
      } catch (err) {
        console.error("Error fetching task:", err);
        setError("Failed to load task");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user || !task) return;

    setSubmitting(true);
    setError(null);

    try {
      console.log("Starting submission...");
      console.log("File:", file.name, "Size:", file.size);
      console.log("User:", user.uid);
      console.log("Task:", id);

      // Upload file to storage
      console.log("Uploading file...");
      const { url, fileName } = await uploadFile(
        file,
        `submissions/${user.uid}/${id}/${file.name}`
      );
      console.log("File uploaded:", url);

      // Create submission document
      const submissionData: Omit<Submission, "id"> = {
        taskId: id as string,
        userId: user.uid,
        userEmail: user.email || "",
        userName: user.displayName || undefined,
        fileUrl: url,
        fileName,
        comment,
        reviewed: false,
        submittedAt: Timestamp.now(),
      };

      console.log("Creating submission document...");
      await addDoc(collection(db, "submissions"), submissionData);
      console.log("Submission created successfully!");
      router.push("/dashboard");
    } catch (err) {
      console.error("Error submitting:", err);
      setError(`Failed to submit: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin" 
             style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl mb-4" style={{ color: 'var(--danger)' }}>Task not found</p>
          <Link href="/dashboard" 
                className="px-6 py-3 rounded-lg font-medium inline-block"
                style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = task.status === "closed";
  const isExpired = task.deadline && task.deadline.toDate() < new Date();

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--surface-light)', background: 'var(--surface)' }}>
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link href="/dashboard" 
                className="inline-flex items-center gap-2 font-medium transition-all hover:scale-105"
                style={{ color: 'var(--primary)' }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6">
        <div className="glass-card p-8 space-y-6 animate-fadeIn">
          {/* Task Header */}
          <div>
            <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
              {task.title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              {isClosed && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold"
                      style={{ background: 'var(--surface-light)', color: 'var(--muted)' }}>
                  🔒 Closed
                </span>
              )}
              {!isClosed && isExpired && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold"
                      style={{ background: 'var(--danger)', color: 'var(--foreground)' }}>
                  ⏰ Expired
                </span>
              )}
              {!isClosed && !isExpired && !submission && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold animate-pulse"
                      style={{ background: 'var(--success)', color: 'var(--background)' }}>
                  ✓ Available
                </span>
              )}
            </div>
          </div>
          {/* Task Description */}
          <div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
              Description
            </h2>
            <p className="leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--muted)' }}>
              {task.description}
            </p>
          </div>

          {/* Task Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border transition-all hover:scale-[1.02]" 
                 style={{ background: 'var(--surface-light)', borderColor: 'var(--surface-lighter)' }}>
              <div className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Max Points</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                {task.maxPoints} pts
              </div>
            </div>
            {task.deadline && (
              <div className="p-4 rounded-lg border transition-all hover:scale-[1.02]" 
                   style={{ background: 'var(--surface-light)', borderColor: 'var(--surface-lighter)' }}>
                <div className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Deadline</div>
                <div className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  {task.deadline.toDate().toLocaleDateString()} at{" "}
                  {task.deadline.toDate().toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
          {submission ? (
            <div className="border-t pt-6" style={{ borderColor: 'var(--surface-light)' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                Your Submission
              </h2>
              <div className="space-y-3 p-4 rounded-lg" style={{ background: 'var(--surface-light)' }}>
                <div>
                  <span className="font-semibold" style={{ color: 'var(--muted)' }}>File:</span>{" "}
                  <a
                    href={submission.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    style={{ color: 'var(--primary)' }}
                  >
                    {submission.fileName}
                  </a>
                </div>
                {submission.comment && (
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--muted)' }}>Comment:</span>{" "}
                    <span style={{ color: 'var(--foreground)' }}>{submission.comment}</span>
                  </div>
                )}
                <div>
                  <span className="font-semibold" style={{ color: 'var(--muted)' }}>Submitted:</span>{" "}
                  <span style={{ color: 'var(--foreground)' }}>
                    {submission.submittedAt.toDate().toLocaleString()}
                  </span>
                </div>
                {submission.reviewed ? (
                  <div className="mt-4 p-4 border rounded-lg" 
                       style={{ background: 'var(--success-light)', borderColor: 'var(--success)' }}>
                    <p className="font-semibold flex items-center gap-2" style={{ color: 'var(--success)' }}>
                      ✓ Reviewed
                    </p>
                    <p className="text-xl font-bold mt-2" style={{ color: 'var(--accent)' }}>
                      Points Awarded: {submission.pointsAwarded}
                    </p>
                    {submission.reviewedAt && (
                      <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                        Reviewed on {submission.reviewedAt.toDate().toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 p-4 border rounded-lg" 
                       style={{ background: 'var(--warning-light)', borderColor: 'var(--warning)' }}>
                    <p className="flex items-center gap-2" style={{ color: 'var(--warning)' }}>
                      ⏳ Pending review
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {!isClosed && !isExpired ? (
                <div className="border-t pt-6" style={{ borderColor: 'var(--surface-light)' }}>
                  <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                    Submit Your Work
                  </h2>
                  {error && (
                    <div className="mb-4 p-3 rounded-lg border" 
                         style={{ background: 'var(--danger-light)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                        Upload File *
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
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
                        Comment (optional)
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full rounded-lg p-3 border transition-all focus:outline-none focus:ring-2"
                        style={{ 
                          background: 'var(--surface-light)', 
                          borderColor: 'var(--surface-lighter)',
                          color: 'var(--foreground)'
                        }}
                        rows={4}
                        placeholder="Add any notes about your submission..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting || !file}
                      className="w-full py-3 rounded-lg font-semibold transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{ 
                        background: submitting || !file ? 'var(--surface-light)' : 'var(--gradient-primary)',
                        color: 'var(--foreground)'
                      }}
                    >
                      {submitting ? "Submitting..." : "Submit Task"}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="border-t pt-6 text-center p-8" style={{ borderColor: 'var(--surface-light)' }}>
                  <div className="text-5xl mb-3">
                    {isClosed ? "🔒" : "⏰"}
                  </div>
                  <p className="text-lg" style={{ color: 'var(--muted)' }}>
                    {isClosed
                      ? "This task is closed and no longer accepting submissions."
                      : "This task has expired."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
