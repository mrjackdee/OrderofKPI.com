# Role-Based Access Control (RBAC) Architecture & Member Roster
**Date:** August 21, 2026 (`2026-08-21`)  
**Organization:** Order of KPI — Application Portal & Member Portal  
**Document Status:** Official Configuration Record  

---

## 1. Overview & Security Architecture

The Order of KPI platform enforces strict **Role-Based Access Control (RBAC)** across all web interfaces, server API endpoints, and database interactions. RBAC guarantees principle-of-least-privilege access, ensuring users only access features, sensitive data, and governance actions aligned with their administrative, committee, or organizational status.

### Core RBAC Principles:
1. **Automated Credential Establishment**: When a financial member is added to the official roster, login credentials are automatically established with default role `member`.
2. **Administrative Privilege Elevation**: Admins can grant elevated roles (e.g., `officer`, `Membership Committee Chair`, `Membership Committee`) via the Member Directory management controls.
3. **No Self-Registration**: Public account registration is disabled to maintain portal integrity. All users are authenticated against pre-provisioned roster entries.
4. **Resilient Dual-Store Persistence**: User roles and authentication credentials are mirrored across local persistent stores (`SQLite` / `JSON`) and Cloud Firestore (`users` collection) with automatic background re-hydration.
5. **Role Isolation**: Strict server-side route guards reject unauthorized API requests and prevent non-privileged members or candidate accounts from accessing administrative or committee-only endpoints.

---

## 2. Role Definitions & Permissions Matrix

| Role Identifier | Display Role Name | Scope & Key Permissions |
| :--- | :--- | :--- |
| `admin` | **Administrator** | Full system control. Can update user roles, access audit logs, manage database synchronization, configure intake forms, review elections, and manage all committee assignments. |
| `Membership Committee Chair` | **Committee Chair** | Executive leadership of the Membership Intake Committee. Can review candidate applications, manage voting windows, schedule candidate interviews, and access committee document vaults. |
| `officer` | **Organization Officer** | Executive leadership (Basileus, 1st Anti-Basileus, Tamiouchos, Grammateus, Epistoleus, Hodegos, Historian, Super Committee Chair). Elevated access to governance archives, meeting minutes tools, and executive reporting. |
| `Membership Committee` | **Committee Member** | Active members assigned to the Membership Intake Committee. Authorized to view candidate applications, cast selection votes, and participate in intake evaluation sessions. |
| `member` | **Financial Member** | Standard active financial members. Access to Member Portal, Financial Roster, Intake Dean nominations and voting, member directory, event registration, and general portal features. |
| `prospective` / `candidate` | **Intake Candidate** | Candidates participating in the Membership Intake Process (MIP). Restricted exclusively to the Applicant Portal to submit applications, view schedule milestones, and check submission status. |

---

## 3. Roster of Members by Role

### A. Administrator (`admin`)
*Full administrative and system configuration privileges.*

| Name | Primary Email | Official Title / Role Context |
| :--- | :--- | :--- |
| **System Admin** | `admin@orderofkpi.org` | Primary System Administrator |
| **QA Admin Agent** | `qa.admin@orderofkpi.org` | Automated QA / Test Administrator |

---

### B. Membership Committee Chair (`Membership Committee Chair`)
*Executive leadership for the Membership Intake Committee.*

| Name | Primary Email | Official Title / Role Context |
| :--- | :--- | :--- |
| **James Haywood Jr** | `james.haywood@orderofkpi.org` | 2nd Anti-Basileus / Intake Committee Chair |
| **QA Chair Agent** | `qa.chair@orderofkpi.org` | Automated QA / Test Chair |

---

### C. Executive Officers (`officer`)
*Organization officers with specialized governance duties.*

| Name | Primary Email | Official Title / Role Context |
| :--- | :--- | :--- |
| **Brian Goings** | `brian.goings@orderofkpi.org` | Basileus |
| **Anthony Jones** | `anthony.jones@orderofkpi.org` | 1st Anti-Basileus |
| **Brian Johnson** | `brian.johnson@orderofkpi.org` | Super Committee Chair (Multi-Committee Lead) |
| **Ishmeal Allensworth** | `ishmeal.allensworth@orderofkpi.org` | Tamiouchos |
| **Edward Cook** | `edward.cook@orderofkpi.org` | Epistoleus |
| **Darron Jenkins** | `darron.jenkins@orderofkpi.org` | Hodegos |
| **Brandon Owens** | `brandon.owens@orderofkpi.org` | Historian |
| **Jack Dee** | `jack.dee@orderofkpi.org` | Executive Officer |
| **QA Officer Agent** | `qa.officer@orderofkpi.org` | Automated QA / Test Officer |

---

### D. Membership Committee Members (`Membership Committee`)
*Appointed members responsible for evaluating candidate intake pipelines.*

| Name | Primary Email | Official Title / Role Context |
| :--- | :--- | :--- |
| **DeShaun Safford** | `deshaun.safford@orderofkpi.org` | Intake Committee Member |
| **Jason Pilar** | `jason.pilar@orderofkpi.org` | Intake Committee Member |
| **QA Committee Agent** | `qa.committee@orderofkpi.org` | Automated QA / Test Committee Member |

---

### E. Active Financial Members (`member`)
*Active financial members with default member portal privileges.*

| Name | Primary Email | Financial Status |
| :--- | :--- | :--- |
| **Alejandro Araujo** | `alejandro.araujo@orderofkpi.org` | Active |
| **Brandon Hunter** | `brandon.hunter@orderofkpi.org` | Active |
| **Charles Basham** | `charles.basham@orderofkpi.org` | Active |
| **Churtis Poulson** | `churtis.poulson@orderofkpi.org` | Active |
| **Demetrist Thomas** | `demetrist.thomas@orderofkpi.org` | Active |
| **Denzel Talley** | `denzel.talley@orderofkpi.org` | Active |
| **Donald Mitchell** | `donald.mitchell@orderofkpi.org` | Active |
| **Dominic Goodman** | `dominic.goodman@orderofkpi.org` | Active / Standby |
| **Kameron Whitfield** | `kameron.whitfield@orderofkpi.org` | Active |
| **Keith Woods** | `keith.woods@orderofkpi.org` | Active |
| **Kevin Jennings** | `kevin.jennings@orderofkpi.org` | Active |
| **Sammie Poe** | `sammie.poe@orderofkpi.org` | Active |
| **Terrell Singleton** | `terrell.singleton@orderofkpi.org` | Active |
| **Tobias Bordley** | `tobias.bordley@orderofkpi.org` | Active |
| **John Candidate** | `candidate@gmail.com` | Active / Test Account |
| **QA Member Agent** | `qa.member@orderofkpi.org` | Automated QA / Test Member |

---

### F. Intake Candidates (`prospective` / `candidate`)
*Pre-provisioned prospective candidates scoped exclusively to the Applicant Portal.*

| Candidate Name | Login Email | Initial Credentials |
| :--- | :--- | :--- |
| **Avery Torrence** | `averyt16@gmail.com` | Last 4 digits of phone (`0784`) |
| **H. U. Pirate** | `hupirate90@me.com` | Last 4 digits of phone (`9348`) |
| **Quincy Davis** | `quincyld86@gmail.com` | Last 4 digits of phone (`1326`) |
| **Jabari Smith-Perry** | `jabari.smithperry@gmail.com` | Last 4 digits of phone (`7008`) |
| **L. A. Sennet** | `l.a.sennet@gmail.com` | Last 4 digits of phone (`1774`) |
| **Malines Kid-Russell** | `malineskidrussell@gmail.com` | Last 4 digits of phone (`0011`) |
| **M. A. B. Mykie** | `mabmykie1914@gmail.com` | Last 4 digits of phone (`7119`) |
| **R. Oliver** | `roliver449@gmail.com` | Last 4 digits of phone (`6846`) |
| **Steven Burnette** | `burnettesteven3@gmail.com` | Last 4 digits of phone (`2275`) |
| **Tashaun Benton** | `tashaunbenton233@gmail.com` | Last 4 digits of phone (`1821`) |
| **O. Titus** | `o_titus@yahoo.com` | Last 4 digits of phone (`7713`) |
| **Zion Gates-Norris** | `zgatesnorris@gmail.com` | Last 4 digits of phone (`4876`) |
| **Jamar Amber** | `jaabn2@gmail.com` | Last 4 digits of phone (`3795`) |

---

## 4. Technical Implementation Details

- **Frontend Route Protection**: Implemented via React Context and higher-order route components checking `user.role`. Non-authorized navigation triggers instant redirection back to `/portal`.
- **Backend API Protection**: Endpoints in `server.ts` validate user sessions and roles prior to processing data modifications.
- **Dynamic Role Updates**: When an administrator updates a member's role via the Admin / Member Directory dashboard, a `PUT /api/members/:email` request updates both local storage and Cloud Firestore (`users` collection).
