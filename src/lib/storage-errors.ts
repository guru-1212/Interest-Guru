import { FirebaseError } from "firebase/app";

export function getStorageErrorMessage(error: unknown): string {
  const code =
    error instanceof FirebaseError
      ? error.code
      : error && typeof error === "object" && "code" in error
        ? String((error as { code: string }).code)
        : "";

  switch (code) {
    case "storage/unauthorized":
      return "Storage permission denied. Ensure you are logged in as the owner who created this member, and that the loan has your user ID as ownerId in Firestore.";
    case "storage/canceled":
      return "Upload was canceled.";
    case "storage/unknown":
      return "Unknown storage error. Try again.";
    default:
      return error instanceof Error ? error.message : "Upload failed.";
  }
}
