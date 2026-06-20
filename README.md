# Cognitus Solutions Staff Portal

This repository contains the Firebase-backed employee operations portal for Cognitus Solutions.

## Current Implementation

- Firebase module wiring
- Firebase Auth session support without collecting employee emails
- Firestore connection
- Discord Username plus Employee ID entry flow
- Employee directory loading from Firestore
- Task management
- Internal ticket management
- Employee management
- Employee login-link reset
- Audit log writes
- Firestore rules
- Firebase Hosting config
- Black and white production theme
- Rank and department structure

## Login Privacy

The public login page does not display default credentials.

Employees should receive their assigned Discord Username and Employee ID from Cognitus leadership. Employee records should be created by leadership through the portal or directly in Firestore during first setup.

## First Owner Setup

For first setup, create one owner employee document in the `employees` collection before onboarding staff. The document ID should be the employee ID. That owner record should have:

- accessLevel: 8
- status: Active
- department: Executive Office
- rank: Founder / Chief Executive Officer
- authUid: null

After the owner record exists, the owner can log in with the assigned Discord Username and Employee ID. The first successful login links that browser's Firebase Auth session to the employee record.

## Rank Structure

| Level | Category | Example Titles |
| --- | --- | --- |
| 8 | Ownership | Founder / Chief Executive Officer |
| 7 | Executive | Chief Operating Officer, Chief Compliance Officer |
| 6 | Department Leadership | Department Director, Deputy Director |
| 5 | Management | Division Manager |
| 4 | Supervision | Supervisor |
| 3 | Senior Staff | Senior Specialist |
| 2 | Staff | Specialist, Associate |
| 1 | Trainee | Trainee |
| 0 | Restricted | Suspended, Former, Archived |

## Departments

- Executive Office
- Human Resources
- Accreditation Services
- Records & Intelligence
- Investigations
- Operations
- Technology
- Public Relations

## Firebase Setup

1. Enable Firestore Database.
2. Enable Authentication.
3. Enable Anonymous Authentication.
4. Copy `firebase-settings.sample.js` to `firebase-settings.js`.
5. Paste your Firebase web app settings into `firebase-settings.js`.
6. Deploy Firestore rules.
7. Deploy Hosting.

## Deploy Commands

```bash
firebase login
firebase use cognitus-staff
firebase deploy --only firestore:rules
firebase deploy --only hosting
```

## Collections

- `employees`
- `tasks`
- `tickets`
- `auditLogs`

## Security Direction

This build does not collect emails. It uses a Firebase Auth session underneath the Discord Username and Employee ID flow so Firestore rules have a user session to evaluate.

For a stronger future release, upgrade to Discord OAuth and match verified Discord account IDs to employee records.
