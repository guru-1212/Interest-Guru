"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { uploadProofDocuments } from "@/lib/proof-documents";
import { getStorageErrorMessage } from "@/lib/storage-errors";
import { Button } from "@/components/ui/Button";
import type { ProofDocument, ProofDocumentType } from "@/types";

interface UploadDocumentsFormProps {
  loanId: string;
  existingDocuments: ProofDocument[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

const DOC_TYPES: { value: ProofDocumentType; label: string }[] = [
  { value: "aadhar", label: "Aadhar" },
  { value: "pan", label: "PAN" },
  { value: "bond", label: "Bond" },
  { value: "other", label: "Other" },
];

export function UploadDocumentsForm({
  loanId,
  existingDocuments,
  onSuccess,
  onCancel,
}: UploadDocumentsFormProps) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [docType, setDocType] = useState<ProofDocumentType>("other");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!files?.length) {
      setError("Select at least one photo or file.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const fileArray = Array.from(files).map((file) => {
        if (docType === "other") return file;
        const ext = file.name.includes(".")
          ? file.name.slice(file.name.lastIndexOf("."))
          : "";
        const base = file.name.replace(/\.[^/.]+$/, "") || "document";
        return new File([file], `${docType}_${base}${ext}`, { type: file.type });
      });

      const dt = new DataTransfer();
      fileArray.forEach((f) => dt.items.add(f));

      await uploadProofDocuments(loanId, dt.files, existingDocuments);
      onSuccess?.();
    } catch (err) {
      setError(getStorageErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Document type
        </label>
        <select
          value={docType}
          onChange={(e) =>
            setDocType(e.target.value as ProofDocumentType)
          }
          disabled={loading}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          {DOC_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Photos / files
        </label>
        <input
          type="file"
          multiple
          accept="image/*,.pdf"
          disabled={loading}
          className="mt-1 block w-full text-sm text-slate-600"
          onChange={(e) => setFiles(e.target.files)}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="button"
          onClick={handleUpload}
          loading={loading}
          className="flex-1"
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>
    </div>
  );
}
