# The Order of KPI - Test Credentials & Access Guide

This document contains all test credentials, usernames, and passwords for both the **Member Portal** and **Applicant Portal**, along with instructions on self-service password changes and password reset links.

---

## 1. Member Portal (Active Members, Officers & Committee Chairs)
Access URL: `/login` (or click "Member Portal")
Default Password for Members/Officers (unless specified): `atlanta`

| Name | Role / Title | Email Address | Initial Password / Notes |
| :--- | :--- | :--- | :--- |
| **Admin** | Administrator | `admin@orderofkpi.org` | `atlanta` |
| **James Haywood Jr** | Membership Committee Chair / 2nd Anti-Basileus | `james.haywood@orderofkpi.org` | `2012` |
| **Brian Johnson** | Membership Committee / Grammateus | `brian.johnson@orderofkpi.org` | `atlanta` |
| **DeShaun Safford** | Membership Committee | `deshaun.safford@orderofkpi.org` | `atlanta` |
| **Jason Pilar** | Membership Committee | `jason.pilar@orderofkpi.org` | `atlanta` |
| **Jack Dee** | Member / Committee Member | `jack.dee@orderofkpi.org` / `jack@orderofkpi.org` | `atlanta` |
| **Brian Goings** | Basileus (President) | `brian.goings@orderofkpi.org` | `atlanta` |
| **Ishmeal Allensworth** | Tamiouchos (Treasurer) | `ishmeal.allensworth@orderofkpi.org` | `atlanta` |
| **Edward Cook** | Epistoleus (Secretary) | `edward.cook@orderofkpi.org` | `atlanta` |
| **Darron Jenkins** | Hodegos | `darron.jenkins@orderofkpi.org` | `atlanta` |
| **Brandon Owens** | Historian | `brandon.owens@orderofkpi.org` | `atlanta` |
| **Keith Woods** | Financial Member | `keith.woods@orderofkpi.org` | `atlanta` |

---

## 2. Applicant Portal & Candidate Accounts
Access URL: `/applicant-login` (or via Applicant Portal)
**Password Rule**: Candidates log in using their registered email address and the **last 4 digits of their phone number** as their default initial password.

| Candidate Name | Email Address | Phone Number | Initial Password (Last 4 Digits) |
| :--- | :--- | :--- | :--- |
| **John Candidate (Primary Test)** | `candidate@gmail.com` | `2012` | `2012` |
| **Avery Torrence** | `averyt16@gmail.com` | `770-873-0784` | `0784` |
| **Charles Miller** | `hupirate90@me.com` | `301-602-9348` | `9348` |
| **Dennis Test** | `dennis@gmail.com` | `252-883-0844` | `0844` |
| **Quincy Dinnerson** | `quincyld86@gmail.com` | `336-420-1326` | `1326` |
| **Jabari Smith-Perry** | `jabari.smithperry@gmail.com` | `404-784-7008` | `7008` |
| **Lee Sennet** | `l.a.sennet@gmail.com` | `281-740-1774` | `1774` |
| **Malinski Russell** | `malineskidrussell@gmail.com` | `731-273-0011` | `0011` |
| **Michael L Coleman** | `mabmykie1914@gmail.com` | `917-283-7119` | `7119` |
| **Ronald Oliver** | `roliver449@gmail.com` | `773-842-6846` | `6846` |
| **Steven Burnette** | `burnettesteven3@gmail.com` | `336-437-2275` | `2275` |
| **Tashaun Najee Benton** | `tashaunbenton233@gmail.com` | `973-592-1821` | `1821` |
| **Titus Oliver** | `o_titus@yahoo.com` | `662-654-7713` | `7713` |
| **Zion Gates-Norris** | `zgatesnorris@gmail.com` | `954-234-4876` | `4876` |
| **Jamar Amber** | `jaabn2@gmail.com` | `410-443-3795` | `3795` |

---

## 3. Self-Service Password Management Features
- **Password Reset Link**: Both login screens feature a **"Forgot Password?"** or **"Password Reset"** option where users can enter their registered email address to receive a secure password reset dispatch notice.
- **Self-Service Password Change**: Once logged in, members and applicants can access their profile settings or security panel to update their password securely at any time.
- **Hybrid Auth Resilience**: The system supports Firebase Authentication as well as local database fallback (`candidate_accounts` and `users` tables) to ensure uninterrupted access across all hosting environments.
