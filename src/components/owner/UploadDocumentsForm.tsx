"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, File as FileIcon } from "lucide-react";
import { uploadProofDocuments } from "@/lib/proof-documents";
import { getStorageErrorMessage } from "@/lib/storage-errors";
import { Button } from "@/components/ui/Button";
import type { ProofDocumentType } from "@/types";

interface UploadDocumentsFormProps {
  loanId: string;
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
  onSuccess,
  onCancel,
}: UploadDocumentsFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [docType, setDocType] = useState<ProofDocumentType>("other");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("Select at least one photo or file.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const fileArray = selectedFiles.map((file) => {
        if (docType === "other") return file;
        const ext = file.name.includes(".")
          ? file.name.slice(file.name.lastIndexOf("."))
          : "";
        const base = file.name.replace(/\.[^/.]+$/, "") || "document";
        return new File([file], `${docType}_${base}${ext}`, { type: file.type });
      });

      const dt = new DataTransfer();
      fileArray.forEach((f) => dt.items.add(f));

      await uploadProofDocuments(loanId, dt.files, (progress) => {
        setUploadProgress(progress);
      });
      onSuccess?.();
    } catch (err) {
      setError(getStorageErrorMessage(err));
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-700">
            Select Document Category
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {DOC_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setDocType(t.value)}
                className={`flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                  docType === t.value
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer ${
          isDragging
            ? "border-emerald-500 bg-emerald-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100/80"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          disabled={loading}
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="rounded-full bg-emerald-100 p-3 text-emerald-600 mb-3">
          <Upload className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-slate-900">
          Click to upload or drag and drop
        </p>
        <p className="mt-1 text-xs text-slate-500 text-center">
          SVG, PNG, JPG or PDF (MAX. 10MB)
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Selected Files ({selectedFiles.length})
          </p>
          <div className="max-h-40 overflow-y-auto space-y-2 rounded-lg border border-slate-100 bg-white p-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {file.type.startsWith("image/") ? (
                    <ImageIcon className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <FileIcon className="h-4 w-4 text-blue-500 shrink-0" />
                  )}
                  <span className="truncate font-medium text-slate-700">
                    {file.name}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-slate-600">
            <span>Uploading documents...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button
          type="button"
          onClick={handleUpload}
          loading={loading}
          className="flex-[2]"
        >
          <Upload className="h-4 w-4" />
          Start Upload
        </Button>
      </div>
    </div>
  );
}
