# Cognitus Solutions Staff Portal

This repository contains the starter interface for the Cognitus Solutions employee operations portal.

## Included

- Static portal shell
- Portal styling
- Firebase settings sample file
- Rank and department planning notes

## Intended Portal Areas

- Command dashboard
- Employee directory
- Task center
- Internal ticket center
- Employee management area
- Audit log viewer
- Rank structure page

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

## Setup

1. Enable Firestore in Firebase.
2. Copy the sample settings file to a local settings file.
3. Add your Firebase web app settings to that local file.
4. Deploy with Firebase Hosting or GitHub Pages.

## Security Direction

Use a real identity provider before storing sensitive employee information. The cleanest later upgrade is Discord OAuth connected to approved employee records.
