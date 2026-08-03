# Role-Based Access Control (RBAC) Matrix & User Assignments
**Date:** August 2, 2026  
**Audited Systems:** Candidate Application Portal, Member Portal, and All Administrative Tools

---

## 1. System Role Definitions & Permissions

The following table outlines the system roles, their high-level functional definitions, and the specific Administrative Tools they are authorized to access. 

Note that **Membership Roster (Member Directory)**, **Intake Calendar**, **Financial Status (Dues Verification)**, and **Voting Portal** are core member utility tools that are fully visible and accessible to **all logged-in member roles** (Admin, Membership Committee Chair, Membership Committee, Officer, and Member):

| Role Name | Functional Definition | Authorized Administrative Tools |
| :--- | :--- | :--- |
| **Admin** | System administrators with full read and write access to all configuration layers and administrative modules. | **Admin Dashboard**, Candidate Tracker, Process Timeline, Review Applications, Membership Chair Portal. |
| **Membership Committee Chair** | Primary lead for managing intake candidates, coordinating applications reviews, and auditing administrative/user actions. | Candidate Tracker, Review Applications, Membership Chair Portal, Process Timeline. |
| **Membership Committee** | Committee members responsible for reviewing submitted intake applications and checking status metrics. | Candidate Tracker, Review Applications, Process Timeline. |
| **Officer** | Chapter officers managing overall member directories, schedules, and financial overviews. | Candidate Tracker, Review Applications, Membership Chair Portal, Process Timeline. *(Admin Dashboard restricted strictly to Admin)* |
| **Member** | Standard active fraternity members participating in general events, directories, and viewing the intake process roadmap. | Process Timeline (only). |
| **Prospective / Applicant** | Pre-provisioned applicants going through the intake phase. Isolated entirely from all Member-facing assets. | No Administrative Tools. Access is restricted strictly to the single-screen Candidate Application form and resources. |

---

## 2. Directory of Assigned Users

Below is the live roster of users mapped to their corresponding security groups as registered in the core database:

### A. Admin
* **System Administrator**
  * **Email:** `admin@orderofkpi.org`
  * **Default Access Title:** Administrator

### B. Membership Committee Chair
* **James Haywood Jr**
  * **Email:** `james.haywood@orderofkpi.org`
  * **Title:** 2nd Anti-Basileus / Committee Chair

### C. Membership Committee
* **DeShaun Safford**
  * **Email:** `deshaun.safford@orderofkpi.org`
* **Brian Johnson**
  * **Email:** `brian.johnson@orderofkpi.org`
  * **Title:** Grammateus / Committee Member
* **Jason Pilar**
  * **Email:** `jason.pilar@orderofkpi.org`

### D. Officers
* **Brian Goings**
  * **Email:** `brian.goings@orderofkpi.org`
  * **Title:** Basileus (Chapter President)
* **Ishmeal Allensworth**
  * **Email:** `ishmeal.allensworth@orderofkpi.org`
  * **Title:** Tamiouchos (Treasurer)
* **Edward Cook**
  * **Email:** `edward.cook@orderofkpi.org`
  * **Title:** Epistoleus (Secretary)
* **Darron Jenkins**
  * **Email:** `darron.jenkins@orderofkpi.org`
  * **Title:** Hodegos (Warden/Guide)
* **Brandon Owens**
  * **Email:** `brandon.owens@orderofkpi.org`
  * **Title:** Historian

### E. Standard Members
* **Jack Dee**
  * **Emails:** `jack.dee@orderofkpi.org`, `jack@orderofkpi.org`
* **Keith Woods**
  * **Email:** `keith.woods@orderofkpi.org`
* **Dominic Goodman**
  * **Email:** `dominic.goodman@orderofkpi.org`

### F. Pre-Provisioned Applicants (Prospective / Applicant)
* **John Candidate** (Portal Verification Test Account)
  * **Email:** `candidate@gmail.com`
  * **Initial Password:** `2012`
* **Avery Torrence**
  * **Email:** `averyt16@gmail.com`
* **Charles Miller**
  * **Email:** `hupirate90@me.com`
* **Dennis Test**
  * **Email:** `dennis@gmail.com`
* **Quincy Dinnerson**
  * **Email:** `quincyld86@gmail.com`
* **Jabari Smith-Perry**
  * **Email:** `jabari.smithperry@gmail.com`
* **Lee Sennet**
  * **Email:** `l.a.sennet@gmail.com`
* **Malinski Russell**
  * **Email:** `malineskidrussell@gmail.com`
* **Michael L Coleman**
  * **Email:** `mabmykie1914@gmail.com`
* **Ronald Oliver**
  * **Email:** `roliver449@gmail.com`
* **Steven Burnette**
  * **Email:** `burnettesteven3@gmail.com`
* **Tashaun Najee Benton**
  * **Email:** `tashaunbenton233@gmail.com`
* **Titus Oliver**
  * **Email:** `o_titus@yahoo.com`
* **Zion Gates-Norris**
  * **Email:** `zgatesnorris@gmail.com`
* **Jamar Amber**
  * **Email:** `jaabn2@gmail.com`

---

## 3. Route Security & Layout Protections

1. **Member Portal Filters**:
   * Core tools (Membership Roster, Intake Calendar, Financial Status, Voting Portal) are laid out in a flat 4-column responsive grid, making them easily viewable and accessible to all verified members.
   * Google Drive/Archives card has been completely decommissioned.
   * The Administrative Tools container automatically maps active user roles and filters out links dynamically according to Section 1 rules.
   * If a user role has no matching visible tools, the entire section title and grid is omitted.

2. **React Router Level Guarding (`ProtectedRoute`)**:
   * All administrative sub-routes (e.g., `/admin-dashboard`, `/candidate-tracker`, `/gantt-chart`, `/review-applications`, `/chair-dashboard`) are guarded with the `allowedRoles` configuration attribute.
   * The `/admin-dashboard` route is restricted strictly to `'admin'`.
   * Direct manual URL entry of restricted links triggers an immediate redirect to `/member-portal`.
