"use client";

import { useState } from "react";
import { FileImage } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { UploadDocumentsForm } from "./UploadDocumentsForm";
import type { ProofDocument } from "@/types";

interface UploadDocumentsModalProps {
  loanId: string;
  existingDocuments: ProofDocument[];
  settled?: boolean;
}

export function UploadDocumentsModal({
  loanId,
  existingDocuments,
  settled = false,
}: UploadDocumentsModalProps) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const openModal = () => {
    setFormKey((k) => k + 1);
    setOpen(true);
  };

  return (
    <>
      <Button type="button" variant="secondary" onClick={openModal}>
        <FileImage className="h-4 w-4" />
        Add Photos & Documents
      </Button>
      {settled && (
        <p className="mt-2 text-xs text-slate-500">
          You can still upload proof documents after the loan is settled.
        </p>
      )}

      {open && (
        <Modal
          open
          onClose={() => setOpen(false)}
          title="Upload Documents"
        >
          <p className="mb-4 text-sm text-slate-600">
            Add Aadhar, PAN, Bond, or other proof photos. Files are stored under
            this member&apos;s loan vault.
          </p>
          <UploadDocumentsForm
            key={formKey}
            loanId={loanId}
            existingDocuments={existingDocuments}
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}
