# Project Instructions & Permanent Rules

## 1. Candidate Roster & Portal Authentication
- **Candidate Roster**: The applicant/candidate portal authenticates candidate logins using their email address as the username and the **last 4 digits of their phone number** as their default initial password (e.g. Avery Torrence `averyt16@gmail.com` / `0784`).
- **Test Account**: Always maintain `candidate@gmail.com` (password: `2012`, Name: "John Candidate") for portal testing.
- **Production & Local Resilience**: Candidate authentication MUST always support a resilient hybrid fallback strategy:
  1. Primary authentication via **Firebase Auth** (`signInWithEmailAndPassword`).
  2. Database-backed authentication via **Firestore** (`candidate_accounts` collection) to handle hosted static environments (e.g., Hostinger, GitHub Pages) or environments where Firebase Auth provider settings like `auth/operation-not-allowed` may occur.
  3. Client-side candidate directory fallback (`prospectiveMembers` roster) for zero-downtime offline or isolated client execution.

## 2. Application Portal Layout Rules
- **Header Title**: The login screen must be titled **"Application Portal"**.
- **No Self-Registration**: Public self-registration is strictly disabled to prevent unauthorized account creation. Candidates are pre-provisioned via the official roster.
- **Clean UI**: Maintain a focused, uncluttered login interface without extra promotional text or unnecessary cross-links to member portals.
