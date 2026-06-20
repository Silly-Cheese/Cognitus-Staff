# Production Deployment Checklist

## Firebase Console

Enable these services before deploying:

1. Firestore Database
2. Authentication
3. Anonymous sign-in provider
4. Firebase Hosting, if using Firebase Hosting

## Local Settings File

Create a file named `firebase-settings.js` in the root of the project.

Use `firebase-settings.sample.js` as the template.

This project intentionally does not collect employee emails.

## First Launch Bootstrap

On first successful portal load, the app attempts to create the founder record if it does not already exist.

Founder record:

- Discord Username: `Executive_Eagle`
- Employee ID: `COG-EXC-001`
- Rank: Founder / Chief Executive Officer
- Department: Executive Office
- Access Level: 8

After the founder record exists, sign in with:

- Discord Username: `Executive_Eagle`
- Employee ID: `COG-EXC-001`

## Firestore Collections

The app uses these collections:

- `employees`
- `tasks`
- `tickets`
- `auditLogs`

## Deploy Rules

Install Firebase CLI, then run:

```bash
firebase login
firebase use cognitus-staff
firebase deploy --only firestore:rules
```

## Deploy Hosting

```bash
firebase deploy --only hosting
```

## Security Note

This build avoids collecting emails and uses Firebase Auth sessions under the hood. It is appropriate for an early staff portal, but the best long-term security upgrade is Discord OAuth so the portal can verify actual Discord identity rather than relying only on a typed username.
