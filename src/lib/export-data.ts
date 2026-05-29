import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { loanFromDoc, memberFromDoc, paymentFromDoc } from "@/lib/firestore-helpers";
import type { Payment } from "@/types";
export interface OwnerExportBundle {
  exportedAt: string;
  members: Record<string, unknown>[];
  loans: Record<string, unknown>[];
  payments: Record<string, Record<string, unknown>[]>;
}

export async function fetchOwnerExportData(
  ownerId: string
): Promise<OwnerExportBundle> {
  const [memberSnap, loanSnap] = await Promise.all([
    getDocs(query(collection(db, "members"), where("ownerId", "==", ownerId))),
    getDocs(query(collection(db, "loans"), where("ownerId", "==", ownerId))),
  ]);

  const members = memberSnap.docs.map((d) => memberFromDoc(d.id, d.data()));
  const loans = loanSnap.docs.map((d) => loanFromDoc(d.id, d.data()));

  const payments: Record<string, Payment[]> = {};
  await Promise.all(
    loans.map(async (loan) => {
      const paySnap = await getDocs(
        collection(db, "loans", loan.id, "payments")
      );
      payments[loan.id] = paySnap.docs.map((d) =>
        paymentFromDoc(d.id, d.data())
      );
    })
  );

  return {
    exportedAt: new Date().toISOString(),
    members: members.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
    loans: loans.map((l) => ({
      ...l,
      startDate: l.startDate.toISOString(),
      settledAt: l.settledAt?.toISOString(),
      proofDocuments: l.proofDocuments.map((p) => ({
        ...p,
        uploadedAt: p.uploadedAt.toISOString(),
      })),
    })),
    payments: Object.fromEntries(
      Object.entries(payments).map(([loanId, list]) => [
        loanId,
        list.map((p) => ({
          ...p,
          paidAt: p.paidAt.toISOString(),
          createdAt: p.createdAt.toISOString(),
        })),
      ])
    ),
  };
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadOwnerJson(ownerId: string) {
  const data = await fetchOwnerExportData(ownerId);
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(
    `vyaajbook-backup-${stamp}.json`,
    JSON.stringify(data, null, 2),
    "application/json"
  );
}

export async function downloadOwnerCsv(ownerId: string) {
  const data = await fetchOwnerExportData(ownerId);
  const rows: string[][] = [
    [
      "memberName",
      "memberEmail",
      "memberPhone",
      "loanId",
      "principal",
      "shekdaRate",
      "startDate",
      "status",
      "settlementAmount",
      "accruedSnapshot",
    ],
  ];

  for (const loan of data.loans) {
    const member = data.members.find(
      (m) => m.id === (loan as { memberId?: string }).memberId
    );
    const l = loan as {
      id: string;
      memberId: string;
      principal: number;
      shekdaRate: number;
      startDate: string;
      status: string;
      settlementAmount?: number;
    };
    const m = member as { fullName?: string; email?: string; phone?: string };
    rows.push([
      m?.fullName ?? "",
      m?.email ?? "",
      m?.phone ?? "",
      l.id,
      String(l.principal),
      String(l.shekdaRate),
      String(l.startDate),
      l.status,
      l.settlementAmount != null ? String(l.settlementAmount) : "",
      "",
    ]);
  }

  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(`vyaajbook-loans-${stamp}.csv`, csv, "text/csv");
}

const BACKUP_REMINDER_KEY = "vyaajbook_last_backup_reminder";

export function shouldShowBackupReminder(): boolean {
  if (typeof window === "undefined") return false;
  const last = localStorage.getItem(BACKUP_REMINDER_KEY);
  if (!last) return true;
  const daysSince =
    (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= 7;
}

export function dismissBackupReminder() {
  localStorage.setItem(BACKUP_REMINDER_KEY, new Date().toISOString());
}
