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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [proofFiles, setProofFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setProfilePhoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

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
          `members/${memberRef.id}/profile_${Date.now()}_${profilePhoto.name}`
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
      setPhotoPreview(null);
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
          <div className="mt-1 flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100 border border-slate-200">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserPlus className="h-8 w-8 text-slate-300" />
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              onChange={handlePhotoChange}
            />
          </div>
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
