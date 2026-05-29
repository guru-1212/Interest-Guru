# VyaajBook

Professional Fintech Ledger — Shekda-based monthly interest tracking.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS (Slate / Emerald / White theme)
- Firebase Auth, Firestore, Storage
- date-fns, Lucide React

## Getting started

```bash
cd vyaajbook
npm install
cp .env.example .env.local   # optional: override Firebase config
npm run dev
```

Run unit tests: `npm test`

Open [http://localhost:3000](http://localhost:3000).

## Firebase setup

1. Enable **Email/Password** authentication in Firebase Console.
2. Create Firestore database and Storage bucket.
3. Deploy security rules:

```bash
firebase deploy --only firestore:rules,storage
```

4. Create your first **admin** user:
   - Register any account, then in Firestore `users/{uid}` set `role` to `"admin"` and `isApproved` to `true`.

## Roles

| Role   | Access |
|--------|--------|
| Admin  | Approve owners at `/admin` |
| Owner  | Register → wait for approval → `/owner` dashboard |
| Member | Register with same email/phone as member record → `/member` |

## Shekda formula

- Monthly interest = `(Principal × Shekda%) / 100`
- Daily (partial month) = `Monthly interest / 30`
- Grand total = Principal + accrued interest

## Project structure

```
src/
  app/          # Routes (owner, admin, member, auth)
  components/   # UI, owner, admin, auth
  contexts/     # AuthContext
  hooks/        # useAuth, useMembers, useLoans
  lib/          # Firebase, calculations
  types/        # User, Member, Loan interfaces
```
