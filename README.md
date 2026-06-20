# Cognitus Solutions Staff Portal

This repository contains the Firebase-backed employee operations portal for Cognitus Solutions.

## Current Implementation

- Firebase module wiring
- Firebase Auth session support without collecting employee emails
- Firestore connection
- Founder bootstrap record
- Discord Username + Employee ID entry flow
- Employee directory loading from Firestore
- Audit log writes
- Firestore rules
- Firebase Hosting config
- Rank and department structure

## Founder Bootstrap

On first successful load, the portal attempts to create this account if it does not already exist:

| Field | Value |
| --- | --- |
| Discord Username | `Executive_Eagle` |
| Employee ID | `COG-EXC-001` |
| Rank | Founder / Chief Executive Officer |
| Department | Executive Office |
| Access Level | 8 |
| Status | Active |

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
