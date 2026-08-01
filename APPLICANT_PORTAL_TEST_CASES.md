# Kappa Pi Application Portal - User Acceptance Test (UAT) Cases

This document details the comprehensive, step-by-step test cases designed to validate the core applicant portal use cases for **Role 1: Kappa Pi Applicant**. 

Use these test cases to perform manual quality assurance or as a blueprint for automated regression testing.

---

## Roster & Portal Authentication Test Accounts

Per project guidelines and configuration, the following pre-provisioned test credentials are used:

| Name | Role / Profile | Email Username | Default / Initial Password | Auth Fallback Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **John Candidate** | Official Test Account | `candidate@gmail.com` | `2012` | Firestore / Firebase Auth / Client Fallback |
| **Avery Torrence** | Pre-provisioned Candidate | `averyt16@gmail.com` | `0784` | Last 4 digits of candidate's phone |

---

## Test Suite 1: Authentication & Applicant Login

### Test Case 1.1: Standard Successful Applicant Login
* **Objective**: Verify that a pre-provisioned applicant can log in successfully using valid credentials.
* **Prerequisites**: 
  * Browser is at the home screen.
  * User is not currently logged in.
* **Test Steps**:
  1. Click on the **Join/Login** or navigate directly to `/applicant-login`.
  2. Verify the screen header is titled **"Application Portal"** (and contains no self-registration options per rules).
  3. Enter email: `candidate@gmail.com`.
  4. Enter password: `2012`.
  5. Click **"Access Portal"**.
* **Expected Result**:
  * User is successfully authenticated.
  * Browser redirects to the **Applicant Dashboard / Portal** page (`/applicant-portal`).
  * A greeting header displays: *"Welcome, John Candidate"*.

### Test Case 1.2: Login Resilient Fallback Validation
* **Objective**: Verify that login succeeds even if Firebase Auth encounters network blockages or `auth/operation-not-allowed` errors, utilizing the fallback Firestore or client roster checks.
* **Test Steps**:
  1. Navigate to `/applicant-login`.
  2. Enter pre-provisioned email: `averyt16@gmail.com`.
  3. Enter password: `0784` (last 4 digits of Avery's registered phone number).
  4. Click **"Access Portal"**.
* **Expected Result**:
  * Authentication system executes primary Firebase Auth. If blocked or restricted, it seamlessly falls back to verify credentials against the Firestore database (`candidate_accounts` collection) or local memory directory (`prospectiveMembers`).
  * Access is successfully granted.
  * User is navigated to `/applicant-portal`.

### Test Case 1.3: Invalid Credentials Rejection
* **Objective**: Verify that incorrect or unauthorized credentials block access and show a clear error.
* **Test Steps**:
  1. Navigate to `/applicant-login`.
  2. Enter email: `candidate@gmail.com`.
  3. Enter password: `wrongpassword123`.
  4. Click **"Access Portal"**.
* **Expected Result**:
  * Access is denied.
  * A warning message is shown: *"Invalid email or password. Please use pre-authorized roster credentials."*
  * User remains on the login page.

---

## Test Suite 2: Application Composition & Validation

### Test Case 2.1: Default Unselected Radio Options (Anti-Bias Check)
* **Objective**: Verify that optional/conditional questions are *not* automatically selected as "No" by default, ensuring candidates intentionally choose their answers.
* **Prerequisites**: Logged in as `candidate@gmail.com` and navigated to the **Member Application** tab.
* **Test Steps**:
  1. Scroll down to the **Additional Disclosures & Information** section.
  2. Examine the radio options for:
     * *“Are you a member of any other Greek-letter organization?”*
     * *“Do you have immediate family members in Alpha Kappa Alpha Sorority, Inc.?”*
     * *“Have you previously applied for membership into Kappa Pi?”*
* **Expected Result**:
  * All three questions have **no selected options** (neither "Yes" nor "No" is pre-ticked).
  * Red asterisks `*` are displayed to indicate that making a selection is strictly mandatory.

### Test Case 2.2: Mandatory Fields & Submission Guardrails
* **Objective**: Verify that missing required conditional inputs prevents submission and shows validation alerts.
* **Test Steps**:
  1. Under **Additional Disclosures**, click **"Yes"** for *“Have you previously applied for membership into Kappa Pi?”*.
  2. Leave the detail input text area completely empty.
  3. Attempt to submit the application.
* **Expected Result**:
  * Application is prevented from submitting.
  * Validation alert is rendered at the top/bottom: *"Please complete all required fields and questions before submitting."*
  * Highlighting displays on the missing conditional details textbox.

### Test Case 2.3: Updated Question Verbiage Match
* **Objective**: Ensure that the specific question text matches the official requirements.
* **Test Steps**:
  1. Locate the prior history question under the disclosures block.
* **Expected Result**:
  * The question text reads exactly: **“Have you previously applied for membership into Kappa Pi?”** (verifying that old references to *"pledged"* have been fully removed).

---

## Test Suite 3: Draft Persistence & "Save As You Go"

### Test Case 3.1: Explicit Manual Progress Saving
* **Objective**: Verify that the "Save Draft" option synchronizes progress securely and displays the updated feedback bar.
* **Test Steps**:
  1. Enter text in the **Personal Statement** (Essay Section 1).
  2. Scroll down to the floating footer bar.
  3. Click **"Save Draft"**.
* **Expected Result**:
  * A dynamic toast/icon feedback triggers.
  * The info check icon changes color to green (`bg-green-600`) with a subtle bounce animation.
  * The banner text updates to: **"Draft Saved Successfully!"**.
  * The subtitle text says: **"Changes written to secure cloud storage"**.

### Test Case 3.2: Session Resiliency (Refresh Check)
* **Objective**: Verify that saved drafts are preserved across page refreshes.
* **Test Steps**:
1. Complete the *Personal Information* section (First name: `John`, Last name: `Candidate`).
2. Click **"Save Draft"** to commit the changes.
3. Refresh the browser page (`F5`).
4. Navigate back to the **Member Application** form tab.
* **Expected Result**:
* All filled-out inputs (First Name, Last Name, Essay inputs) are automatically restored from the server/session draft.
* The layout does not display any premature "Section Completed" green checkboxes on the form tabs.

### Test Case 3.3: Automatic Background Progress Saving (Debounced Auto-Save)
* **Objective**: Verify that user inputs are automatically saved in the background after they stop typing.
* **Test Steps**:
1. Navigate to the **Member Application** tab.
2. Enter text inside the first essay text box: *"My personal philosophy centers on leadership..."*
3. Pause typing and wait for **1.5 seconds**.
4. Examine the sticky bottom status bar.
* **Expected Result**:
* As soon as typing starts, the sticky status bar pulses amber (`bg-amber-500`) with text *"Unsaved Draft Changes"* and subtitle *"Auto-saving soon or click Save Draft..."*.
* 1.5 seconds after typing pauses, a background save is automatically initiated.
* The status bar checkmark transitions to green (`bg-green-600`), and a toast message confirms *"Draft Saved Successfully!"*.
* The last saved timestamp updates to the current time.

### Test Case 3.4: Custom Save-Before-Exit Interception (Tab Switching / Log Out)
* **Objective**: Verify that trying to change tabs or log out with unsaved changes prompts the user to save or discard.
* **Test Steps**:
1. Type new text inside any input field (e.g., *Degrees* under Educational Details).
2. Confirm the bottom status bar transitions to *"Unsaved Draft Changes"*.
3. Try clicking on **"Intake Timeline & Process"** tab in the sub-header.
4. Verify the modal dialog triggers.
5. Click **"Cancel / Keep Editing"**. Verify you remain on the application form and the modal closes.
6. Click **"Intake Timeline & Process"** tab again to open the modal.
7. Click **"Save and Continue"**.
* **Expected Result**:
* Clicking another tab or the "Log Out" button with unsaved changes immediately triggers the custom modal *"Unsaved Draft Changes"*.
* Clicking "Save and Continue" executes a full background save, clears the unsaved status, closes the modal, and seamlessly performs the navigation action (navigating to the timeline tab).

### Test Case 3.5: Browser Native Exit Confirmation
* **Objective**: Verify that browser-level window close or reload commands warn the user of unsaved changes.
* **Test Steps**:
1. Edit any field on the form to trigger the *"Unsaved Draft Changes"* state.
2. Attempt to press the browser refresh button (`F5` or `Ctrl+R`) or close the browser tab.
* **Expected Result**:
* The browser intercepts the action and displays its native confirmation dialog: *"You have unsaved changes. Are you sure you want to leave?"*
* If the user cancels, they remain on the current page with their inputs fully intact.

---

## Test Suite 4: Form Submission & Confirmation

### Test Case 4.1: Final Successful Application Submission
* **Objective**: Verify that a fully completed application submits successfully.
* **Prerequisites**: All general fields, essays, and disclosures are completely populated.
* **Test Steps**:
  1. Click **"Submit Final Application"** at the bottom of the portal.
* **Expected Result**:
  * The application is processed.
  * The page renders a prominent, visually polished confirmation on screen:
    * **"Application Submitted Successfully!"** header with an elegant gold badge.
    * Display details thanking the candidate for their submission and outlining next steps (Phase 2 Committee Review).
    * Access to edit inputs is safely locked to preserve submitted integrity.
