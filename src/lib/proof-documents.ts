import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import type { ProofDocument, ProofDocumentType } from "@/types";

function safeStorageFileName(original: string): string {
  return original.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function inferProofType(fileName: string): ProofDocumentType {
  const lower = fileName.toLowerCase();
  if (lower.includes("aadhar") || lower.includes("aadhaar")) return "aadhar";
  if (lower.includes("pan")) return "pan";
  if (lower.includes("bond")) return "bond";
  return "other";
}

export async function uploadProofDocuments(
  loanId: string,
  files: FileList | File[],
  existing: ProofDocument[] = []
): Promise<ProofDocument[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to upload documents.");

  const fileArray = Array.from(files);
  const newDocs: ProofDocument[] = [];

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    const uniqueName = `${Date.now()}_${safeStorageFileName(file.name)}`;
    const proofRef = ref(storage, `loans/${loanId}/proofs/${uniqueName}`);
    await uploadBytes(proofRef, file);
    const url = await getDownloadURL(proofRef);

    newDocs.push({
      id: `${loanId}_${uniqueName}`,
      name: file.name,
      url,
      type: inferProofType(file.name),
      uploadedAt: new Date(),
    });
  }

  const merged = [...existing, ...newDocs];
  await updateDoc(doc(db, "loans", loanId), { proofDocuments: merged });
  return merged;
}
