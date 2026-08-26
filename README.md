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
