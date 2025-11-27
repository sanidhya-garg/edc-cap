"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import { UserProfile } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = React.useCallback(async (uid: string, authUser: User | null) => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setUserProfile(docSnap.data() as UserProfile);
    } else {
      // Create default user profile
      const profile: UserProfile = {
        uid,
        email: authUser?.email || "",
        displayName: authUser?.displayName || undefined,
        role: "user",
        points: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await setDoc(docRef, profile);
      setUserProfile(profile);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await fetchUserProfile(u.uid, u);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [fetchUserProfile]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    userProfile,
    loading,
    async signInWithGoogle() {
      await signInWithPopup(auth, googleProvider);
    },
    async signInWithEmail(email, password) {
      await signInWithEmailAndPassword(auth, email, password);
    },
    async signUpWithEmail(email, password) {
      await createUserWithEmailAndPassword(auth, email, password);
    },
    async resetPassword(email) {
      await sendPasswordResetEmail(auth, email);
    },
    async logout() {
      await signOut(auth);
    },
    async refreshProfile() {
      if (user) await fetchUserProfile(user.uid, user);
    },
  }), [user, userProfile, loading, fetchUserProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

