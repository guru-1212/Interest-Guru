"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { AddMemberForm } from "./AddMemberForm";

export function AddMemberModal() {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const openModal = () => {
    setFormKey((k) => k + 1);
    setOpen(true);
  };

  return (
    <>
      <Button onClick={openModal}>
        <UserPlus className="h-4 w-4" />
        Add Member
      </Button>

      {open && (
        <Modal open onClose={() => setOpen(false)} title="Add Member">
          <AddMemberForm
            key={formKey}
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}
