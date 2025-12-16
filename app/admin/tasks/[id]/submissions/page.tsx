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
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'submitted' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 10;

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

      // Fetch the current submission from database to get accurate previous points
      console.log("Fetching current submission data...");
      const submissionDoc = await getDoc(doc(db, "submissions", submissionId));
      const previousPoints = submissionDoc.exists() ? (submissionDoc.data().pointsAwarded || 0) : 0;
      const pointsDelta = pointsToAward - previousPoints;

      console.log("Previous points:", previousPoints, "New points:", pointsToAward, "Delta:", pointsDelta);

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

  const toggleSort = (by: 'name' | 'submitted') => {
    if (sortBy === by) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(by);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };
  // Reset to page 1 when filters change (must be before any early returns)
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  // Filter, sort and paginate - must be defined before any early returns (stable hooks/order)
  const filteredSubmissions = submissions.filter(sub => {
    // Filter by status
    if (filter === "pending" && sub.reviewed) return false;
    if (filter === "reviewed" && !sub.reviewed) return false;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = sub.userName?.toLowerCase().includes(query);
      const matchesEmail = sub.userEmail.toLowerCase().includes(query);
      const matchesFile = sub.fileName.toLowerCase().includes(query);
      return matchesName || matchesEmail || matchesFile;
    }
    
    return true;
  });

  // Sorting
  const sortedSubmissions = React.useMemo(() => {
    const copy = [...filteredSubmissions];
    if (!sortBy) return copy;

    return copy.sort((a, b) => {
      if (sortBy === 'name') {
        const an = (a.userName || '').toLowerCase();
        const bn = (b.userName || '').toLowerCase();
        if (an < bn) return sortOrder === 'asc' ? -1 : 1;
        if (an > bn) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }

      // submitted
      const at = a.submittedAt ? a.submittedAt.toDate().getTime() : 0;
      const bt = b.submittedAt ? b.submittedAt.toDate().getTime() : 0;
      if (at < bt) return sortOrder === 'asc' ? -1 : 1;
      if (at > bt) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredSubmissions, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubmissions = sortedSubmissions.slice(startIndex, endIndex);

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
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              📝 Submissions ({submissions.length})
            </h2>
            
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="🔍 Search by name, email, or file..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-10 rounded-lg border-2 transition-all focus:outline-none focus:ring-2"
                    style={{ 
                      background: 'var(--surface)', 
                      borderColor: 'var(--surface-light)',
                      color: 'var(--foreground)'
                    }}
                  />
                  <span className="absolute left-3 top-3.5 text-xl">🔍</span>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 p-1 rounded-lg" style={{ background: 'var(--surface-light)' }}>
                <button
                  onClick={() => setFilter("all")}
                  className="px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap"
                  style={{
                    background: filter === "all" ? 'var(--gradient-primary)' : 'transparent',
                    color: filter === "all" ? 'var(--foreground)' : 'var(--muted)'
                  }}
                >
                  All ({submissions.length})
                </button>
                <button
                  onClick={() => setFilter("pending")}
                  className="px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap"
                  style={{
                    background: filter === "pending" ? 'var(--gradient-primary)' : 'transparent',
                    color: filter === "pending" ? 'var(--foreground)' : 'var(--muted)'
                  }}
                >
                  Pending ({submissions.filter(s => !s.reviewed).length})
                </button>
                <button
                  onClick={() => setFilter("reviewed")}
                  className="px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap"
                  style={{
                    background: filter === "reviewed" ? 'var(--gradient-primary)' : 'transparent',
                    color: filter === "reviewed" ? 'var(--foreground)' : 'var(--muted)'
                  }}
                >
                  Reviewed ({submissions.filter(s => s.reviewed).length})
                </button>
              </div>
            </div>

            {/* Results Info */}
            <div className="text-sm" style={{ color: 'var(--muted)' }}>
              Showing {sortedSubmissions.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, sortedSubmissions.length)} of {sortedSubmissions.length} submissions
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-3">📭</div>
              <p style={{ color: 'var(--muted)' }}>
                {searchQuery ? "No submissions match your search" : 
                 filter === "pending" ? "No pending submissions" : 
                 filter === "reviewed" ? "No reviewed submissions" : "No submissions yet"}
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--surface-light)' }}>
                      <th className="text-left p-4 font-semibold" style={{ color: 'var(--foreground)' }}>
                        <div className="flex items-center gap-2">
                          Student
                          <button
                            onClick={() => toggleSort('name')}
                            className="text-xs opacity-75 hover:opacity-100"
                            aria-label="Sort by student name"
                          >
                            ⇅{sortBy === 'name' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                          </button>
                        </div>
                      </th>
                      <th className="text-left p-4 font-semibold" style={{ color: 'var(--foreground)' }}>File</th>
                      <th className="text-left p-4 font-semibold" style={{ color: 'var(--foreground)' }}>
                        <div className="flex items-center gap-2">
                          Submitted
                          <button
                            onClick={() => toggleSort('submitted')}
                            className="text-xs opacity-75 hover:opacity-100"
                            aria-label="Sort by submitted date"
                          >
                            ⇅{sortBy === 'submitted' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                          </button>
                        </div>
                      </th>
                      <th className="text-center p-4 font-semibold" style={{ color: 'var(--foreground)' }}>Status</th>
                      <th className="text-center p-4 font-semibold" style={{ color: 'var(--foreground)' }}>Points</th>
                      <th className="text-center p-4 font-semibold" style={{ color: 'var(--foreground)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSubmissions.map((submission, index) => (
                      <tr
                        key={submission.id}
                        className="transition-colors hover:bg-opacity-50"
                        style={{
                          borderBottom: '1px solid var(--surface-light)',
                          background: index % 2 === 0 ? 'transparent' : 'var(--surface-light)'
                        }}
                      >
                        {/* Student Info */}
                        <td className="p-4">
                          <div>
                            <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                              {submission.userName || 'No Name'}
                            </div>
                            <div className="text-sm" style={{ color: 'var(--muted)' }}>
                              {submission.userEmail}
                            </div>
                          </div>
                        </td>

                        {/* File */}
                        <td className="p-4">
                          <a
                            href={submission.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm hover:underline flex items-center gap-1"
                            style={{ color: 'var(--primary)' }}
                          >
                            📎 {submission.fileName.length > 25 ? submission.fileName.substring(0, 25) + '...' : submission.fileName}
                          </a>
                        </td>

                        {/* Submitted Date */}
                        <td className="p-4">
                          <div className="text-sm" style={{ color: 'var(--foreground)' }}>
                            {submission.submittedAt.toDate().toLocaleDateString()}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--muted)' }}>
                            {submission.submittedAt.toDate().toLocaleTimeString()}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4 text-center">
                          {submission.reviewed ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold inline-block"
                                  style={{ background: '#10B981', color: 'white' }}>
                              ✓ Reviewed
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold inline-block"
                                  style={{ background: '#FFA500', color: 'white' }}>
                              ⏳ Pending
                            </span>
                          )}
                        </td>

                        {/* Points */}
                        <td className="p-4 text-center">
                          <div className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                            {submission.pointsAwarded || 0} / {task.maxPoints}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setSelectedSubmission(submission)}
                            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105"
                            style={{ background: 'var(--gradient-primary)', color: 'var(--foreground)' }}
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid var(--surface-light)' }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ background: 'var(--surface-light)', color: 'var(--foreground)' }}
                  >
                    ← Previous
                  </button>

                  <div className="flex-1 mx-4">
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <nav aria-label="Pagination" style={{ display: 'inline-flex', gap: 8 }}>
                        {/** compact pagination with ellipses **/}
                        {(() => {
                          const items: (number | string)[] = [];
                          const total = totalPages;
                          const current = currentPage;
                          const delta = 2; // neighbors

                          if (total <= 7) {
                            for (let i = 1; i <= total; i++) items.push(i);
                          } else {
                            const left = Math.max(2, current - delta);
                            const right = Math.min(total - 1, current + delta);

                            items.push(1);
                            if (left > 2) items.push('...');
                            for (let i = left; i <= right; i++) items.push(i);
                            if (right < total - 1) items.push('...');
                            items.push(total);
                          }

                          return items.map((it, idx) => {
                            if (it === '...') {
                              return (
                                <span key={`e-${idx}`} className="px-3 py-2 text-sm" style={{ color: 'var(--muted)' }}>…</span>
                              );
                            }

                            const pageNum = it as number;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-10 h-10 rounded-lg font-semibold transition-all hover:scale-105"
                                style={{
                                  background: currentPage === pageNum ? 'var(--gradient-primary)' : 'var(--surface-light)',
                                  color: 'var(--foreground)'
                                }}
                              >
                                {pageNum}
                              </button>
                            );
                          });
                        })()}
                      </nav>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ background: 'var(--surface-light)', color: 'var(--foreground)' }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: 'var(--surface)' }}>
            <div className="sticky top-0 z-10 px-6 py-4 border-b backdrop-blur-lg flex justify-between items-center"
                 style={{ borderColor: 'var(--surface-light)', background: 'rgba(var(--surface-rgb), 0.95)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                📝 Review Submission
              </h2>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-all"
                style={{ background: 'var(--surface-light)', color: 'var(--foreground)' }}
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Info */}
              <div className="p-4 rounded-xl" style={{ background: 'var(--surface-light)' }}>
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--foreground)' }}>Student Information</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {selectedSubmission.userName || 'No Name'}</p>
                  <p><strong>Email:</strong> {selectedSubmission.userEmail}</p>
                  <p><strong>Submitted:</strong> {selectedSubmission.submittedAt.toDate().toLocaleString()}</p>
                </div>
              </div>

              {/* File */}
              <div className="p-4 rounded-xl" style={{ background: 'var(--surface-light)' }}>
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--foreground)' }}>Submission File</h3>
                <a
                  href={selectedSubmission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg hover:underline flex items-center gap-2"
                  style={{ color: 'var(--primary)' }}
                >
                  📎 {selectedSubmission.fileName}
                </a>
              </div>

              {/* Comment */}
              {selectedSubmission.comment && (
                <div className="p-4 rounded-xl" style={{ background: 'var(--surface-light)' }}>
                  <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--foreground)' }}>Comment</h3>
                  <p style={{ color: 'var(--foreground)' }}>{selectedSubmission.comment}</p>
                </div>
              )}

              {/* Award Points */}
              <div className="p-4 rounded-xl" style={{ background: 'var(--surface-light)' }}>
                <h3 className="font-bold text-lg mb-3" style={{ color: 'var(--foreground)' }}>Award Points</h3>
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                      Points (Max: {task.maxPoints})
                    </label>
                    <input
                      type="number"
                      value={points[selectedSubmission.id] || 0}
                      onChange={(e) => setPoints({ ...points, [selectedSubmission.id]: parseInt(e.target.value) || 0 })}
                      min={0}
                      max={task.maxPoints}
                      className="w-full rounded-lg p-3 border-2 transition-all focus:outline-none focus:ring-2"
                      style={{ 
                        background: 'var(--surface)', 
                        borderColor: 'var(--surface-lighter)',
                        color: 'var(--foreground)'
                      }}
                      disabled={reviewingId === selectedSubmission.id}
                    />
                  </div>
                  <button
                    onClick={() => {
                      handleAwardPoints(selectedSubmission.id, selectedSubmission.userId);
                      setTimeout(() => setSelectedSubmission(null), 1500);
                    }}
                    disabled={reviewingId === selectedSubmission.id}
                    className="px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{
                      background: reviewingId === selectedSubmission.id ? 'var(--surface-light)' : 'var(--gradient-primary)',
                      color: 'var(--foreground)'
                    }}
                  >
                    {reviewingId === selectedSubmission.id
                      ? "⏳ Saving..."
                      : selectedSubmission.reviewed
                      ? "🔄 Update Points"
                      : "✓ Award Points"}
                  </button>
                </div>
                {selectedSubmission.reviewed && selectedSubmission.reviewedAt && (
                  <p className="text-sm mt-3" style={{ color: 'var(--muted)' }}>
                    Last reviewed: {selectedSubmission.reviewedAt.toDate().toLocaleString()}
                    {selectedSubmission.reviewedBy && ` by ${selectedSubmission.reviewedBy}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
