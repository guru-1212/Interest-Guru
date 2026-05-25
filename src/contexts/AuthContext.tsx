"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { userFromDoc } from "@/lib/firestore-helpers";
import type { User, UserRole } from "@/types";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    role: UserRole
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (uid: string) => {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) {
      setUser(null);
      return;
    }
    setUser(userFromDoc(snap.id, snap.data()));
  }, []);

  const refreshUser = useCallback(async () => {
    if (firebaseUser) await fetchUserProfile(firebaseUser.uid);
  }, [firebaseUser, fetchUserProfile]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await fetchUserProfile(fbUser.uid);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [fetchUserProfile]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const isApproved = role === "admin";
    await setDoc(doc(db, "users", cred.user.uid), {
      email,
      displayName,
      role,
      isApproved,
      createdAt: serverTimestamp(),
    });
    await fetchUserProfile(cred.user.uid);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      firebaseUser,
      user,
      loading,
      signIn,
      signUp,
      signOut,
      refreshUser,
    }),
    [firebaseUser, user, loading, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
