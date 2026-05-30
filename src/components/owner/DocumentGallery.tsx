"use client";

import { FileText, ExternalLink } from "lucide-react";
import type { ProofDocument } from "@/types";

interface DocumentGalleryProps {
  documents: ProofDocument[];
}

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.split("?")[0]);
}

export function DocumentGallery({ documents }: DocumentGalleryProps) {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-slate-500">No proof documents uploaded.</p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc) => {
        const isImage = isImageUrl(doc.url) || isImageUrl(doc.name);
        return (
          <a
            key={doc.id}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-emerald-400"
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
              <span className="absolute right-2 top-2 rounded bg-slate-800/80 px-2 py-0.5 text-xs text-white capitalize">
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
        );
      })}
    </div>
  );
}
