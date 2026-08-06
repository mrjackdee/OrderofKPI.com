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

## 3. Database Sync & Multi-Environment Persistence Rules
- **Cloud & Local Dual-Write**: Application submissions (`saveApplication`) MUST write to both local server storage (`/api/applications/save` & `./data/applications.json`) AND Cloud Firestore (`membership_applications` collection).
- **Auto-Sync Across Code Updates & Deploys**: In containerized or static deployments (e.g. Cloud Run, GitHub syncs) where local DB files are reset:
  1. Data fetching methods and page initialization hooks across ALL member and applicant views (e.g., `FinancialRoster`, `MemberDirectory`, `SelectionVoting`, `DeanVotingDashboard`, `DeanNominationDashboard`, `DeanAuditLogDashboard`, `DeanVotingAuditDashboard`, `ApplicantPortal`, `MemberPortal`) MUST execute automatic background sync (`syncApplicationsFromFirestore`) on load to re-hydrate local state from Firestore seamlessly.
  2. Roster candidates with submitted applications MUST have their status automatically upgraded from `"Inquiry"` to `"Applied"` in the database without requiring candidate or user intervention.
- **Strict Admin-Only Manual Action Buttons**: Manual "Update Portal Data" action buttons are strictly restricted to Administrative Dashboards (`AdminDashboard`, `CommitteeChairDashboard`, `CandidateTracker`, `ReviewApplications`). General member, committee, candidate, or applicant pages MUST NOT contain individual sync buttons or per-row refresh controls; they rely entirely on automated background synchronization on page load.
- **Zero Data-Loss Client Fallback**: Client application portals MUST check both server APIs and Firestore/localStorage cache so candidates can always view their completed PDF and submission status even during deployment cold-starts.
