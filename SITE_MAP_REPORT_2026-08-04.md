# Order of KPI Portal — Comprehensive Site Map & Architecture Report

**Date:** August 4, 2026  
**Module / Scope:** Full Application Navigation & Role-Based Access Control (RBAC) Sitemap  
**Status:** Complete & Verified  

---

## 1. Executive Summary
This sitemap report provides a comprehensive architectural breakdown of all routes, user portals, administrative dashboards, voting & nomination modules, and backup tools within the **Order of KPI Member & Applicant Portal**.

---

## 2. Public & Authentication Routes
| Route Path | Component | Description & Access |
| :--- | :--- | :--- |
| `/` | `Home.aspx` / `Home.tsx` | Public landing page introducing the Order of KPI, historical context, and access portals. |
| `/login` | `Login.tsx` | Member portal authentication entry point (supports email & phone/password credentials). |
| `/applicant-login` | `ApplicantLogin.tsx` | Applicant portal authentication login (pre-provisioned candidate accounts). |
| `/constitution` | `Constitution.tsx` | Public governing code and organizational constitution viewer. |
| `/terms` | `TermsOfService.tsx` | Terms of service and legal notices. |
| `/privacy` | `PrivacyPolicy.tsx` | Data privacy and security policy. |

---

## 3. Applicant Portal & Standalone Backup Form
| Route Path | Component | Description & Access |
| :--- | :--- | :--- |
| `/applicant-portal` | `ApplicantPortal.tsx` | Central hub for prospective members to track application status, view document vaults, and access application forms. |
| `/membership-application` | `Application.tsx` | Multi-step interactive membership application form with real-time draft saving, validation, submission, and **Extract PDF** capabilities. |
| `/standalone-application` | `StandaloneApplication.tsx` | Standalone backup web form with full access link allowing candidates to manually fill out all application fields offline or independently and export as a PDF. |

---

## 4. Member Portal & Core Modules
| Route Path | Component | Description & Access |
| :--- | :--- | :--- |
| `/member-portal` | `MemberPortal.tsx` | Central financial member dashboard providing announcements, event tickers, and navigation links. |
| `/financial-roster` | `FinancialRoster.tsx` | Member financial status roster and dues tracking. |
| `/member-directory` | `MemberDirectory.tsx` | Secure member directory for active Brothers. |
| `/intake-calendar` | `IntakeCalendar.tsx` | Membership intake schedule, key dates, and event markers. |
| `/agenda` | `Agenda.tsx` | Meeting agendas and scheduled brotherhood events. |
| `/conference-portal` | `ConferencePortal.tsx` | National and regional conference registration and itinerary hub. |
| `/classroom-portal` | `ClassroomPortal.tsx` | Educational modules and fraternity orientation curriculum. |

---

## 5. Nominations, Voting & Leadership Modules
| Route Path | Component | Description & Access |
| :--- | :--- | :--- |
| `/dean-nomination` | `DeanNominationForm.tsx` | Nomination submission form for the FY27 Intake Dean position (August 10–12 timeline). |
| `/dean-nomination-dashboard` | `DeanNominationDashboard.tsx` | Anonymized committee review dashboard for nomination tallies with PDF export. |
| `/dean-voting` | `DeanVotingForm.tsx` | Official voting ballot for Intake Dean Team selection (August 17–19 timeline). |
| `/dean-voting-dashboard` | `DeanVotingDashboard.tsx` | Anonymized voting results dashboard with percentage breakdowns and PDF report generation. |
| `/dean-audit-log` | `DeanAuditLogDashboard.tsx` | Admin audit log tracking nomination records with inline CRUD capabilities. |
| `/dean-voting-audit` | `DeanVotingAuditDashboard.tsx` | Admin voting audit dashboard restricted to `admin@orderofkpi.org`. |

---

## 6. Administrative & Committee Dashboards
| Route Path | Component | Description & Access |
| :--- | :--- | :--- |
| `/admin-dashboard` | `AdminDashboard.tsx` | Superadmin control panel for candidate tracking, system settings, and audit logs. |
| `/chair-dashboard` | `CommitteeChairDashboard.tsx` | Committee Chair management portal for evaluating applications and reviewing candidate scores. |
| `/review-applications` | `ReviewApplications.tsx` | Detailed application reviewer workspace for Membership Committee members. |
| `/candidate-tracker` | `CandidateTracker.tsx` | Pipeline tracker for prospective candidates progressing through intake stages. |

---

## 7. Conclusion
The sitemap is fully optimized for responsive single-page navigation, role-based security enforcement, and offline resilience across both local development and production environments.
