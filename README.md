# Member Portal & Application System

## System Architecture Rules (For Password Safety & Reset Flows)

### Rule 1: Isolated Overrides Store
The `user_password_overrides` store must strictly store user/admin-created custom passwords. Default placeholder keys (e.g., `"atlanta"`) must never be written to or kept in this store.

### Rule 2: Read-Only Database Initialization (`initDb`)
Server cold-starts and container restarts must treat existing database password hashes as read-only. `initDb()` must never execute `UPDATE users SET password_hash = ...` unless applying an explicitly verified custom credential (`isFirstLogin: 0`).

### Rule 3: Strict Startup Filtering
When syncing overrides from local JSON or Cloud Firestore into server memory on startup, automatically discard any record matching default placeholder criteria (`hash === defaultPasswordHash && isFirstLogin === 1`).

### Rule 4: Non-Destructive Reset Token Generation
Requesting a password reset link must only generate a temporary, single-use token. It must never clear, modify, or overwrite the active password in the database prior to token confirmation.

## Architecture & Development Guardrails

### 1. Production Safety & Data Protection
- All test scripts, mock CRUD operations, and local state modifications MUST target local storage or SQLite endpoints (`server.ts`).
- NEVER execute destructive operations, clear collections, or run bulk updates against live Cloud Firestore production data.

### 2. Dynamic Data Integrity & Fallback Standards
- NEVER rely on a single API endpoint for critical UI tables (e.g., User Directory, Roster Management).
- Always implement multi-channel data fetching: query the REST API, fallback to Cloud Firestore collections, and merge/deduplicate records.
- If an endpoint returns 0 records on server cold-starts, implement automatic hydration from default fallback sets instead of rendering an empty UI.

### 3. Strict & Exact Filtering
- Filtering out test or QA accounts in production MUST use exact string matching (e.g., checking for `qa.*`, `test.*`, or explicit email prefixes).
- NEVER use broad boolean flags (like `is_test_credential === 1`) that can accidentally catch and hide real production user records.

### 4. Mandatory Verification Before GitHub Pushes
- Do NOT output high-level "all audits passed" text summaries when code changes fail runtime execution.
- All async operations in modals and forms MUST utilize `try/catch/finally` blocks to guarantee `loading` state release (`setLoading(false)`).
