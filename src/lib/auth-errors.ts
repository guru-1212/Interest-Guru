import { FirebaseError } from "firebase/app";

export function getAuthErrorMessage(error: unknown): string {
  const code =
    error instanceof FirebaseError
      ? error.code
      : error && typeof error === "object" && "code" in error
        ? String((error as { code: string }).code)
        : "";

  switch (code) {
    case "auth/operation-not-allowed":
      return "Email/Password sign-in is not enabled. In Firebase Console go to Authentication → Sign-in method → Email/Password → Enable.";
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    default:
      return error instanceof Error ? error.message : "Authentication failed.";
  }
}
