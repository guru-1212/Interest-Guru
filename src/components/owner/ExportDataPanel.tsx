"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  dismissBackupReminder,
  downloadOwnerCsv,
  downloadOwnerJson,
  shouldShowBackupReminder,
} from "@/lib/export-data";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function ExportDataPanel() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<"json" | "csv" | null>(null);
  const [showReminder, setShowReminder] = useState(shouldShowBackupReminder);

  if (!user?.id) return null;

  const handleJson = async () => {
    setLoading("json");
    try {
      await downloadOwnerJson(user.id);
      dismissBackupReminder();
      setShowReminder(false);
    } finally {
      setLoading(null);
    }
  };

  const handleCsv = async () => {
    setLoading("csv");
    try {
      await downloadOwnerCsv(user.id);
      dismissBackupReminder();
      setShowReminder(false);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card title="Backup & export" className="mb-8">
      {showReminder && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p>
            Tip: export your ledger weekly so you have a local copy of members,
            loans, and payments.
          </p>
          <button
            type="button"
            onClick={() => {
              dismissBackupReminder();
              setShowReminder(false);
            }}
            className="shrink-0 text-amber-700 hover:text-amber-900"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <p className="mb-4 text-sm text-slate-600">
        Download all your data for personal archive (JSON includes payments).
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={handleJson}
          loading={loading === "json"}
        >
          <Download className="h-4 w-4" />
          Export JSON
        </Button>
        <Button
          variant="secondary"
          onClick={handleCsv}
          loading={loading === "csv"}
        >
          <Download className="h-4 w-4" />
          Export CSV (loans)
        </Button>
      </div>
    </Card>
  );
}
