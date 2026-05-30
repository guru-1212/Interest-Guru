# VyaajBook Coding Standards

This document outlines the foundational mandates and standards for all development within this repository. Adhere to these rules to ensure build stability and code quality.

## 1. Efficient Development Lifecycle
To optimize for speed and token usage, follow a tiered validation approach:

### Phase A: Implementation (Fast & Surgical)
During the "Act" phase of a task, use targeted tools instead of full project checks:
- **Targeted Linting:** Run `npx eslint path/to/changed-file.tsx` to verify only the affected file.
- **Fast Type-Checking:** Use `npx tsc --noEmit` for a significantly faster TypeScript check than a full `next build`.

### Phase B: Final Validation (Comprehensive)
ONLY run the full suite once implementation is complete and surgical checks pass:
- `npm run lint` - Full project style/best-practice check.
- `npm run build` - Final production-ready compilation check.
- `npm run test` - Verify business logic.

## 2. React & Hook Best Practices (React 19+)
- **Avoid Cascading Renders:** NEVER call `setState` (e.g., `setLoading`, `setData`) synchronously inside the body of a `useEffect` if it depends solely on props. Instead:
  - **Derive State:** If the state can be calculated from props, do it during render.
  - **Adjust State During Render:** Use the "prevProps" pattern:
    ```tsx
    const [data, setData] = useState(initialData);
    const [prevId, setPrevId] = useState(id);
    if (id !== prevId) {
      setPrevId(id);
      setData(newData);
    }
    ```
- **Hook Dependencies:** Always include all variables used inside `useEffect`, `useMemo`, and `useCallback` in their respective dependency arrays.

## 3. UI Components & Type Safety
- **Component Extensions:** If a UI component (in `src/components/ui/`) is missing a required variant or prop (like an `icon` or a new `Button` variant), update the base component and its TypeScript interface first. NEVER use `any` or bypass the type system.
- **JSX Integrity:** Ensure all JSX tags are properly closed and fragments are used when returning multiple top-level elements.

## 4. Code Hygiene
- **Unused Code:** Remove all unused imports, variables, and commented-out code blocks before finalizing changes.
- **Consistency:** Follow the existing project structure (App Router, Tailwind CSS, Lucide icons, Firebase/Firestore).
