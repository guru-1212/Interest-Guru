"use client";

import { useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import { uploadProofDocuments } from "@/lib/proof-documents";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UserPlus, Upload } from "lucide-react";
import { getAuthErrorMessage } from "@/lib/auth-errors";

interface AddMemberFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddMemberForm({ onSuccess, onCancel }: AddMemberFormProps) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
    const ownerId = auth.currentUser?.uid ?? user?.id;
    if (!ownerId) return;
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const memberRef = await addDoc(collection(db, "members"), {
        ownerId,
        fullName,
        email: email || null,
        phone: phone || null,
        createdAt: serverTimestamp(),
      });

      const loanRef = await addDoc(collection(db, "loans"), {
        memberId: memberRef.id,
        ownerId,
        principal: parseFloat(principal),
        shekdaRate: parseFloat(shekdaRate),
        startDate: Timestamp.fromDate(new Date(startDate)),
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

      if (proofFiles?.length) {
        await uploadProofDocuments(loanRef.id, proofFiles);
      }

      setFullName("");
      setEmail("");
      setPhone("");
      setPrincipal("");
      setShekdaRate("");
      setStartDate("");
      setProfilePhoto(null);
      setProofFiles(null);
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Email (for member login)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
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
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={loading} className="flex-1">
            <UserPlus className="h-4 w-4" />
            Save Member
          </Button>
        </div>
      </form>
  );
}
