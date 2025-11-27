This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Firebase Auth Setup

Create a Firebase project and enable Authentication (Google provider + Email/Password). Add the following environment variables in a `.env.local` file:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

Then run the dev server:

```powershell
npm run dev
```

Auth pages:
- `/auth/login` – Google + Email login
- `/auth/signup` – Email signup + Google
- `/auth/forgot` – Password reset
- `/dashboard` – Protected page (redirects to login if not authenticated)

## Firebase Firestore & Storage Setup

### 1. Enable Firestore Database
In Firebase Console:
- Go to Firestore Database
- Create database in production mode
- Start collection

### 2. Enable Firebase Storage
In Firebase Console:
- Go to Storage
- Get started with default settings

### 3. Firestore Security Rules
Add these rules in Firestore Rules tab:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - Allow all reads and writes
    match /users/{userId} {
      allow read: if true;
      allow write: if true;
    }
    
    // Tasks collection - Allow all reads and writes
    match /tasks/{taskId} {
      allow read: if true;
      allow write: if true;
    }
    
    // Submissions collection - Allow all reads and writes
    match /submissions/{submissionId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

### 4. Storage Security Rules
Add these rules in Storage Rules tab:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /submissions/{userId}/{taskId}/{fileName} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

## Admin Login

Admin credentials are hardcoded in the application:
- **Username**: admin
- **Password**: admin123
- **Login at**: `/admin/login`

To add more admins or change credentials, edit `lib/adminAuth.ts`

**Note**: Admin authentication is completely separate from user authentication. Admins don't use Firebase Auth.

## Features

### User Features
- **Authentication**: Google OAuth and Email/Password
- **Dashboard**: View all tasks and your total points
- **Task Submission**: Upload files for tasks with optional comments
- **Points Tracking**: See points awarded for each submission

### Admin Features
- **Task Management**: Create, edit, open/close tasks
- **Deadline Setting**: Set auto-close deadlines for tasks
- **Submission Review**: View all user submissions
- **Point Allocation**: Award points to submissions (updates user total automatically)
- **Task Status Toggle**: Open/close tasks with one click

## Pages Structure

```
/                           - Homepage
/auth/login                 - Login page
/auth/signup                - Signup page
/auth/forgot                - Password reset
/dashboard                  - User dashboard (protected)
/dashboard/tasks/[id]       - Task detail & submission (protected)
/admin/login                - Admin login (username/password)
/admin                      - Admin dashboard (admin only)
/admin/tasks/create         - Create new task (admin only)
/admin/tasks/[id]/edit      - Edit task (admin only)
/admin/tasks/[id]/submissions - Review submissions & award points (admin only)
```

## Authentication Architecture

This platform uses **dual authentication systems**:

1. **User Authentication** (Firebase Auth)
   - Google OAuth + Email/Password
   - Used for campus ambassadors
   - Access: `/auth/*` and `/dashboard/*`
   - Profile stored in `users` collection with points tracking

2. **Admin Authentication** (Hardcoded)
   - Username/Password only (no Google)
   - Hardcoded credentials in `lib/adminAuth.ts`
   - Access: `/admin/*` routes
   - Completely separate from user auth
   - Default: username: `admin`, password: `admin123`

This separation ensures:
- Admins don't need Firebase Auth accounts
- Admin credentials are managed separately
- Clear separation of concerns
- Simplified admin onboarding
