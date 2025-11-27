"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, Timestamp, increment } from "firebase/firestore";
import { useAdminAuth } from "@/app/providers/AdminAuthProvider";
import { db } from "@/lib/firebase";
import { Task, Submission } from "@/lib/types";

export default function SubmissionsPage() {
  const { id } = useParams();
  const { admin } = useAdminAuth();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [points, setPoints] = useState<{ [key: string]: number }>({});
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed">("all");

  useEffect(() => {
    if (!admin) {
      router.replace("/admin/login");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch task
        const taskDoc = await getDoc(doc(db, "tasks", id as string));
        if (taskDoc.exists()) {
          setTask({ id: taskDoc.id, ...taskDoc.data() } as Task);
        }

        // Fetch submissions
        const submissionsQuery = query(
          collection(db, "submissions"),
          where("taskId", "==", id)
        );
        const submissionsSnap = await getDocs(submissionsQuery);
        const submissionsData = submissionsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Submission[];
        setSubmissions(submissionsData);

        // Initialize points state
        const pointsMap: { [key: string]: number } = {};
        submissionsData.forEach(sub => {
          pointsMap[sub.id] = sub.pointsAwarded || 0;
        });
        setPoints(pointsMap);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, admin, router]);

  const handleAwardPoints = async (submissionId: string, userId: string) => {
    if (!admin || !task) return;

    setReviewingId(submissionId);
    try {
      const pointsToAward = points[submissionId] || 0;
      
      console.log("Awarding points...", { submissionId, userId, pointsToAward });

      // Update submission
      console.log("Updating submission...");
      await updateDoc(doc(db, "submissions", submissionId), {
        pointsAwarded: pointsToAward,
        reviewed: true,
        reviewedBy: admin.username,
        reviewedAt: Timestamp.now(),
      });
      console.log("Submission updated!");

      // Update user's total points
      console.log("Updating user points...");
      const userDoc = doc(db, "users", userId);
      const currentSubmission = submissions.find(s => s.id === submissionId);
      const previousPoints = currentSubmission?.pointsAwarded || 0;
      const pointsDelta = pointsToAward - previousPoints;

      console.log("Points delta:", pointsDelta);
      await updateDoc(userDoc, {
        points: increment(pointsDelta),
        updatedAt: Timestamp.now(),
      });
      console.log("User points updated!");

      // Update local state
      setSubmissions(submissions.map(s =>
        s.id === submissionId
          ? { ...s, pointsAwarded: pointsToAward, reviewed: true, reviewedBy: admin.username, reviewedAt: Timestamp.now() }
          : s
      ));

      alert("Points awarded successfully!");
    } catch (error) {
      console.error("Error awarding points:", error);
      alert(`Failed to award points: ${error}`);
    } finally {
      setReviewingId(null);
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

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl mb-4" style={{ color: 'var(--danger)' }}>Task not found</p>
          <Link href="/admin" 
                className="px-6 py-3 rounded-lg font-medium inline-block"
                style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}>
            Back to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === "pending") return !sub.reviewed;
    if (filter === "reviewed") return sub.reviewed;
    return true;
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--surface-light)', background: 'var(--surface)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/admin" 
                className="inline-flex items-center gap-2 font-medium transition-all hover:scale-105"
                style={{ color: 'var(--primary)' }}>
            ← Back to Admin Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Task Info Card */}
        <div className="glass-card p-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            {task.title}
          </h1>
          <p className="mb-4" style={{ color: 'var(--muted)' }}>
            {task.description}
          </p>
          <div className="flex gap-6 flex-wrap text-sm" style={{ color: 'var(--muted)' }}>
            <span className="flex items-center gap-1">
              <span style={{ color: 'var(--accent)' }}>⭐</span>
              Max Points: {task.maxPoints}
            </span>
            <span className="flex items-center gap-1">
              <span className="px-2 py-1 rounded-full text-xs font-semibold"
                    style={{ 
                      background: task.status === "open" ? 'var(--success)' : 'var(--surface-light)',
                      color: task.status === "open" ? 'var(--background)' : 'var(--muted)'
                    }}>
                {task.status === "open" ? "✓ Open" : "🔒 Closed"}
              </span>
            </span>
            {task.deadline && (
              <span className="flex items-center gap-1">
                <span>⏰</span>
                Deadline: {task.deadline.toDate().toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Submissions Section */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
                📝 Submissions ({filteredSubmissions.length})
              </h2>
              <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                Reviewed: {submissions.filter(s => s.reviewed).length} / {submissions.length}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 p-1 rounded-lg" style={{ background: 'var(--surface-light)' }}>
              <button
                onClick={() => setFilter("all")}
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  background: filter === "all" ? 'var(--gradient-primary)' : 'transparent',
                  color: filter === "all" ? 'var(--foreground)' : 'var(--muted)'
                }}
              >
                All ({submissions.length})
              </button>
              <button
                onClick={() => setFilter("pending")}
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  background: filter === "pending" ? 'var(--gradient-primary)' : 'transparent',
                  color: filter === "pending" ? 'var(--foreground)' : 'var(--muted)'
                }}
              >
                Pending ({submissions.filter(s => !s.reviewed).length})
              </button>
              <button
                onClick={() => setFilter("reviewed")}
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  background: filter === "reviewed" ? 'var(--gradient-primary)' : 'transparent',
                  color: filter === "reviewed" ? 'var(--foreground)' : 'var(--muted)'
                }}
              >
                Reviewed ({submissions.filter(s => s.reviewed).length})
              </button>
            </div>
          </div>
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-3">📭</div>
              <p style={{ color: 'var(--muted)' }}>
                {filter === "pending" ? "No pending submissions" : filter === "reviewed" ? "No reviewed submissions" : "No submissions yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredSubmissions.map(submission => (
                <div
                  key={submission.id}
                  className="border rounded-lg p-6 transition-all hover:scale-[1.01]"
                  style={{
                    background: submission.reviewed ? 'var(--success-light)' : 'var(--surface-light)',
                    borderColor: submission.reviewed ? 'var(--success)' : 'var(--surface-lighter)'
                  }}
                >
                  <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
                    <div>
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                        {submission.userName || submission.userEmail}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        {submission.userEmail}
                      </p>
                      <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                        📅 Submitted: {submission.submittedAt.toDate().toLocaleString()}
                      </p>
                    </div>
                    {submission.reviewed && (
                      <span className="px-3 py-1 rounded-full text-sm font-semibold"
                            style={{ background: 'var(--success)', color: 'var(--background)' }}>
                        ✓ Reviewed
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <span className="font-medium" style={{ color: 'var(--muted)' }}>File:</span>{" "}
                      <a
                        href={submission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                        style={{ color: 'var(--primary)' }}
                      >
                        📎 {submission.fileName}
                      </a>
                    </div>
                    {submission.comment && (
                      <div>
                        <span className="font-medium" style={{ color: 'var(--muted)' }}>Comment:</span>
                        <p className="mt-1" style={{ color: 'var(--foreground)' }}>
                          {submission.comment}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4" style={{ borderColor: 'var(--surface-lighter)' }}>
                    <div className="flex items-end gap-4 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                          Award Points (Max: {task.maxPoints})
                        </label>
                        <input
                          type="number"
                          value={points[submission.id] || 0}
                          onChange={(e) =>
                            setPoints({ ...points, [submission.id]: parseInt(e.target.value) || 0 })
                          }
                          min={0}
                          max={task.maxPoints}
                          className="w-full rounded-lg p-3 border transition-all focus:outline-none focus:ring-2"
                          style={{ 
                            background: 'var(--surface)', 
                            borderColor: 'var(--surface-lighter)',
                            color: 'var(--foreground)'
                          }}
                          disabled={reviewingId === submission.id}
                        />
                      </div>
                      <button
                        onClick={() => handleAwardPoints(submission.id, submission.userId)}
                        disabled={reviewingId === submission.id}
                        className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        style={{
                          background: reviewingId === submission.id ? 'var(--surface-light)' : 'var(--gradient-primary)',
                          color: 'var(--foreground)'
                        }}
                      >
                        {reviewingId === submission.id
                          ? "⏳ Saving..."
                          : submission.reviewed
                          ? "🔄 Update Points"
                          : "✓ Award Points"}
                      </button>
                    </div>
                    {submission.reviewed && submission.reviewedAt && (
                      <p className="text-sm mt-3" style={{ color: 'var(--muted)' }}>
                        Last reviewed: {submission.reviewedAt.toDate().toLocaleString()}
                        {submission.reviewedBy && ` by ${submission.reviewedBy}`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
