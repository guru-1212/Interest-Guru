import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
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
  onProgress?: (progress: number) => void
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to upload documents.");

  const fileArray = Array.from(files);
  const totalFiles = fileArray.length;
  const newDocs: ProofDocument[] = [];
  
  const progressMap = new Map<number, number>();

  const uploadFile = (file: File, index: number): Promise<ProofDocument> => {
    return new Promise((resolve, reject) => {
      const uniqueName = `${Date.now()}_${safeStorageFileName(file.name)}`;
      const storagePath = `loans/${loanId}/proofs/${uniqueName}`;
      const proofRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(proofRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          progressMap.set(index, progress);
          
          if (onProgress) {
            const totalProgress = Array.from(progressMap.values()).reduce((a, b) => a + b, 0) / totalFiles;
            onProgress(Math.round(totalProgress));
          }
        },
        (error) => reject(error),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            id: `${loanId}_${uniqueName}`,
            name: file.name,
            url,
            storagePath,
            type: inferProofType(file.name),
            uploadedAt: new Date(),
          });
        }
      );
    });
  };

  for (let i = 0; i < fileArray.length; i++) {
    const doc = await uploadFile(fileArray[i], i);
    newDocs.push(doc);
  }

  // Use arrayUnion for atomic update and immediate real-time reflection
  await updateDoc(doc(db, "loans", loanId), { 
    proofDocuments: arrayUnion(...newDocs) 
  });
}

export async function deleteProofDocument(
  loanId: string,
  docId: string,
  existing: ProofDocument[]
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to delete documents.");

  const docToDelete = existing.find((d) => d.id === docId);
  if (!docToDelete) throw new Error("Document not found.");

  // 1. Delete from Storage
  let path = docToDelete.storagePath;
  if (!path) {
    const uniqueName = docId.replace(`${loanId}_`, "");
    path = `loans/${loanId}/proofs/${uniqueName}`;
  }

  const proofRef = ref(storage, path);
  try {
    await deleteObject(proofRef);
  } catch (error: unknown) {
    console.error("Error deleting from storage:", error);
    if (error && typeof error === "object" && "code" in error && error.code !== "storage/object-not-found") {
      throw error;
    }
  }

  // 2. Remove from Firestore using arrayRemove for atomic update
  await updateDoc(doc(db, "loans", loanId), { 
    proofDocuments: arrayRemove(docToDelete) 
  });
}
