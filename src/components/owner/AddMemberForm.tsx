"use client";

import { useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UserPlus, Upload } from "lucide-react";
import type { ProofDocumentType } from "@/types";

export function AddMemberForm() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [principal, setPrincipal] = useState("");
  const [shekdaRate, setShekdaRate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [proofFiles, setProofFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const memberRef = await addDoc(collection(db, "members"), {
        ownerId: user.id,
        fullName,
        createdAt: serverTimestamp(),
      });

      const loanRef = await addDoc(collection(db, "loans"), {
        memberId: memberRef.id,
        ownerId: user.id,
        principal: parseFloat(principal),
        shekdaRate: parseFloat(shekdaRate),
        startDate: new Date(startDate),
        proofDocuments: [],
        status: "active",
        createdAt: serverTimestamp(),
      });

      let profilePhotoUrl: string | undefined;

      if (profilePhoto) {
        const photoRef = ref(
          storage,
          `members/${memberRef.id}/profile_${profilePhoto.name}`
        );
        await uploadBytes(photoRef, profilePhoto);
        profilePhotoUrl = await getDownloadURL(photoRef);
        await updateDoc(doc(db, "members", memberRef.id), {
          profilePhotoUrl,
        });
      }

      const proofDocuments: {
        id: string;
        name: string;
        url: string;
        type: ProofDocumentType;
        uploadedAt: Date;
      }[] = [];

      if (proofFiles) {
        for (let i = 0; i < proofFiles.length; i++) {
          const file = proofFiles[i];
          const proofRef = ref(
            storage,
            `loans/${loanRef.id}/proofs/${file.name}`
          );
          await uploadBytes(proofRef, file);
          const url = await getDownloadURL(proofRef);
          const lower = file.name.toLowerCase();
          let type: ProofDocumentType = "other";
          if (lower.includes("aadhar") || lower.includes("aadhaar"))
            type = "aadhar";
          else if (lower.includes("pan")) type = "pan";
          else if (lower.includes("bond")) type = "bond";

          proofDocuments.push({
            id: `${loanRef.id}_${i}`,
            name: file.name,
            url,
            type,
            uploadedAt: new Date(),
          });
        }
        await updateDoc(doc(db, "loans", loanRef.id), { proofDocuments });
      }

      setFullName("");
      setPrincipal("");
      setShekdaRate("");
      setStartDate("");
      setProfilePhoto(null);
      setProofFiles(null);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Add Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Profile Photo
          </label>
          <input
            type="file"
            accept="image/*"
            className="mt-1 block w-full text-sm text-slate-600"
            onChange={(e) => setProfilePhoto(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Principal Amount (₹)"
            type="number"
            min="0"
            step="0.01"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            required
          />
          <Input
            label="Shekda Rate (% per month)"
            type="number"
            min="0"
            step="0.01"
            value={shekdaRate}
            onChange={(e) => setShekdaRate(e.target.value)}
            required
          />
        </div>
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Upload className="h-4 w-4" />
            Proof Documents (Aadhar, PAN, Bond)
          </label>
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            className="mt-1 block w-full text-sm text-slate-600"
            onChange={(e) => setProofFiles(e.target.files)}
          />
          <p className="mt-1 text-xs text-slate-500">
            Stored under loans/&#123;loanId&#125;/proofs/
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <p className="text-sm text-emerald-600">Member added successfully.</p>
        )}
        <Button type="submit" loading={loading}>
          <UserPlus className="h-4 w-4" />
          Add Member
        </Button>
      </form>
    </Card>
  );
}
