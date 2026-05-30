"use client";

import { useState } from "react";
import { FileText, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { deleteProofDocument } from "@/lib/proof-documents";
import type { ProofDocument } from "@/types";

interface DocumentGalleryProps {
  loanId: string;
  documents: ProofDocument[];
}

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.split("?")[0]);
}

export function DocumentGallery({ loanId, documents }: DocumentGalleryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to permanently delete this document? This action cannot be undone.")) {
      return;
    }

    setDeletingId(docId);
    try {
      await deleteProofDocument(loanId, docId, documents);
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Failed to delete document. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (documents.length === 0) {
    return (
      <p className="text-sm text-slate-500">No proof documents uploaded.</p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc) => {
        const isImage = isImageUrl(doc.url) || isImageUrl(doc.name);
        const isDeleting = deletingId === doc.id;

        return (
          <div
            key={doc.id}
            className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-emerald-400"
          >
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="relative aspect-video bg-slate-100">
                {isImage ? (
                  <img
                    src={doc.url}
                    alt={doc.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <FileText className="h-12 w-12 text-slate-400" />
                  </div>
                )}
                <span className="absolute left-2 top-2 rounded bg-slate-800/80 px-2 py-0.5 text-xs text-white capitalize">
                  {doc.type}
                </span>
              </div>
              <div className="flex items-center justify-between p-3">
                <p className="truncate text-sm font-medium text-slate-700">
                  {doc.name}
                </p>
                <ExternalLink className="h-4 w-4 shrink-0 text-emerald-600" />
              </div>
            </a>

            <button
              onClick={(e) => handleDelete(e, doc.id)}
              disabled={isDeleting}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 opacity-0 transition-opacity hover:bg-red-100 group-hover:opacity-100 disabled:opacity-100"
              title="Delete document"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
