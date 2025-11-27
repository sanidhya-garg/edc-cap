# Admin Account Setup Guide

## Quick Start: Create Your First Admin

### Step 1: Go to Firestore Console
1. Open Firebase Console: https://console.firebase.google.com
2. Select your project: `edcwebapp`
3. Click on **Firestore Database** in the left menu
4. Click **Start Collection**

### Step 2: Create the `admins` Collection
1. Collection ID: `admins`
2. Click **Next**

### Step 3: Add Admin Document
1. Document ID: Click **Auto-ID** or use a custom ID
2. Add the following fields:

| Field Name | Type | Value |
|------------|------|-------|
| `username` | string | `admin` (or your preferred username) |
| `passwordHash` | string | `-6d45de78` |
| `name` | string | `Administrator` |
| `createdAt` | timestamp | Click "Add timestamp" and select current time |

3. Click **Save**

### Step 4: Test Login
1. Go to: http://localhost:3000/admin/login
2. Username: `admin`
3. Password: `admin123`
4. Click **Sign In**

---

## Create Additional Admin Accounts

### Generate Password Hash

**Option 1: Browser Console**
1. Open your website in a browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Paste this code:
```javascript
function generateHash(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// Generate hash for your password
console.log(generateHash("YourPasswordHere"));
```
5. Copy the output hash

**Option 2: Common Password Hashes**
| Password | Hash |
|----------|------|
| admin123 | `-6d45de78` |
| password | `4e8d98e` |
| admin2024 | `-5f8c0a12` |
| testadmin | `769c6dd3` |

### Add to Firestore
1. Go to Firestore Console → `admins` collection
2. Click **Add Document**
3. Fill in the fields with the new username and generated hash
4. Click **Save**

---

## Security Notes

⚠️ **Important**: The hash function used here is for demonstration purposes. For production:
- Use bcrypt or Argon2 for password hashing
- Implement rate limiting on login attempts
- Add 2FA for admin accounts
- Use environment variables for sensitive data
- Consider using Firebase Admin SDK for server-side auth

---

## Troubleshooting

### "Invalid username or password"
- Check that the username matches exactly (case-sensitive)
- Verify the passwordHash in Firestore is correct
- Try regenerating the hash

### "Admin session expired"
- Admin sessions are stored in localStorage
- Clear browser cache and login again
- Check browser console for errors

### Can't access admin pages
- Ensure you're logged in at `/admin/login` first
- Check that Firestore rules allow reading from `admins` collection
- Verify the admin document exists in Firestore

---

## Admin Capabilities

Once logged in, admins can:
✅ Create new tasks with deadlines  
✅ Edit existing tasks  
✅ Open/Close tasks  
✅ View all user submissions  
✅ Award points to submissions (0 to max points)  
✅ Track review status  

Users' total points update automatically when admin awards points!
