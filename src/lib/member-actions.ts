import { 
  collection, 
  getDocs, 
  writeBatch,
  query,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Marks a member's active loan as a "wrong entry".
 * This keeps the data but excludes it from dashboard totals.
 */
export async function markLoanAsWrongEntry(memberId: string, ownerId: string) {
  // Find the active/settled loan(s) for this member that BELONG to the owner
  const loanQuery = query(
    collection(db, "loans"), 
    where("memberId", "==", memberId),
    where("ownerId", "==", ownerId)
  );
  const loanSnap = await getDocs(loanQuery);

  const batch = writeBatch(db);
  
  loanSnap.forEach((loanDoc) => {
    // Only mark it if it's not already marked
    if (loanDoc.data().status !== "wrong_entry") {
      batch.update(loanDoc.ref, { 
        status: "wrong_entry",
        markedAsWrongAt: new Date()
      });
    }
  });

  await batch.commit();
}

/** 
 * Reverts a "wrong entry" back to "active" (or "settled" if needed)
 */
export async function restoreWrongEntry(memberId: string, targetStatus: "active" | "settled" = "active") {
  const loanQuery = query(
    collection(db, "loans"), 
    where("memberId", "==", memberId),
    where("status", "==", "wrong_entry")
  );
  const loanSnap = await getDocs(loanQuery);

  const batch = writeBatch(db);
  loanSnap.forEach((loanDoc) => {
    batch.update(loanDoc.ref, { 
      status: targetStatus,
      restoredAt: new Date()
    });
  });

  await batch.commit();
}
