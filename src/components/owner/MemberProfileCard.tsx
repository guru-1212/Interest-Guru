"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Camera, User } from "lucide-react";
import { auth, db, storage } from "@/lib/firebase";
import { Card } from "@/components/ui/Card";
import type { Member } from "@/types";

interface MemberProfileCardProps {
  member: Member;
  loanStatus?: "active" | "settled";
}

export function MemberProfileCard({ member, loanStatus }: MemberProfileCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [photoUrl, setPhotoUrl] = useState(member.profilePhotoUrl);

  useEffect(() => {
    setPhotoUrl(member.profilePhotoUrl);
  }, [member.profilePhotoUrl, member.id]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!auth.currentUser?.uid) {
      setError("You must be signed in to upload a photo.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const photoRef = ref(
        storage,
        `members/${member.id}/profile_${Date.now()}_${safeName}`
      );
      await uploadBytes(photoRef, file);
      const url = await getDownloadURL(photoRef);
      await updateDoc(doc(db, "members", member.id), {
        profilePhotoUrl: url,
      });
      setPhotoUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Card title="Member Profile">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-100 transition hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          title="Click to add or change profile photo"
        >
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={member.fullName}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-12 w-12 text-slate-400" />
            </div>
          )}
          <span className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/0 transition group-hover:bg-slate-900/50">
            <Camera className="h-8 w-8 text-white opacity-0 transition group-hover:opacity-100" />
          </span>
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs font-medium text-slate-600">
              Uploading…
            </span>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelect}
        />

        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold text-slate-900">{member.fullName}</h2>
          {member.email && (
            <p className="mt-1 text-sm text-slate-600">{member.email}</p>
          )}
          {member.phone && (
            <p className="text-sm text-slate-600">{member.phone}</p>
          )}
          {loanStatus && (
            <span
              className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                loanStatus === "active"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              Loan {loanStatus === "active" ? "Active" : "Settled"}
            </span>
          )}
          <p className="mt-3 text-sm text-emerald-700">
            Click the photo to add or update profile picture
            {loanStatus === "settled" ? " (available after settle)" : ""}
          </p>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Card>
  );
}
