import { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "user";

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  college?: string;
  graduationYear?: number;
  profileCompleted?: boolean;
  role: UserRole;
  points: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type TaskStatus = "open" | "closed";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  maxPoints: number;
  deadline?: Timestamp;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Submission {
  id: string;
  taskId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  fileUrl: string;
  fileName: string;
  comment?: string;
  pointsAwarded?: number;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  submittedAt: Timestamp;
}
