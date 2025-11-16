# Firebase Registration Error Diagnosis & Setup

## The Error Explained

```
POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyDcMjtaE_MN2jTirCupP1ce3Rr5A8gEmdI 400 (Bad Request)
FirebaseError: Firebase: Error (auth/configuration-not-found)
```

This means:
1. Firebase tried to call Google's identity service with your API key
2. Google responded with 400 (Bad Request) — the request was malformed or the API key doesn't have required permissions
3. Firebase falls back to `auth/configuration-not-found` generic error

## Root Causes & Solutions

### Option A: Firebase Project NOT Properly Set Up (Most Likely)

If you haven't set up authentication in Firebase Console:

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select project**: `ecommerce-102`
3. **Navigate to**: Authentication → Sign-in method
4. **Enable Email/Password provider**:
   - Click "Email/Password"
   - Toggle "Enabled"
   - Save
5. **Enable Google provider** (optional, for Google sign-in):
   - Click "Google"
   - Add project support email and public-facing name
   - Save
6. **Restart frontend dev server**:
   ```powershell
   cd frontend
   npm run dev
   ```

### Option B: Fireb ase API Key Restrictions

The API key may have restrictions preventing email/password auth:

1. **Go to Firebase Console**
2. **Project Settings** → **Service Accounts** (or APIs & Services)
3. **Find your API key**: `AIzaSyDcMjtaE_MN2jTirCupP1ce3Rr5A8gEmdI`
4. **Check if it has restrictions**:
   - If restricted to specific APIs, ensure **Identity Toolkit API** is included
   - If restricted by referrer, ensure it allows your localhost dev server
5. **If needed, create a new unrestricted API key** for development

### Option C: Using Backend-Only Authentication (Recommended)

Instead of Firebase for user auth, use your **Express backend** (already set up):

**Backend already has:**
- ✅ JWT authentication at `/api/v1/auth/register` and `/api/v1/auth/login`
- ✅ User model and password hashing with bcryptjs
- ✅ No Firebase dependency needed

**Your frontend is currently trying to:**
- ❌ Use Firebase for auth, which requires Firebase Console setup
- ❌ Then call backend to sync user — double work

**Better approach:**
- ✅ Remove Firebase auth calls from `AuthContext.jsx`
- ✅ Use only backend `/api/v1/auth` endpoints
- ✅ Keep Firebase for optional features later (storage, real-time db, etc.)

## Immediate Actions

### If You Want to Keep Firebase:

1. ✅ Ensure `frontend/.env` or `frontend/.env.local` has:
   ```
   VITE_FIREBASE_API_KEY=AIzaSyDcMjtaE_MN2jTirCupP1ce3Rr5A8gEmdI
   VITE_FIREBASE_AUTH_DOMAIN=ecommerce-102.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=ecommerce-102
   VITE_FIREBASE_STORAGE_BUCKET=ecommerce-102.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=985864107730
   VITE_FIREBASE_APP_ID=1:985864107730:web:f78632ff0623c9a8c6df0b
   ```
   
2. ✅ Go to Firebase Console and **enable Email/Password** in Authentication

3. ✅ Restart frontend dev server:
   ```powershell
   cd frontend
   npm run dev
   ```

4. ✅ Check browser console (F12) for validation messages

### If You Want to Use Backend Auth Only (Faster):

I can refactor `AuthContext.jsx` to use backend auth endpoints instead of Firebase. This would:
- Remove Firebase auth dependency
- Use your existing backend endpoints
- Still maintain user sessions via JWT cookies
- Let you use Firebase later for other features (storage, etc.)

**Which approach do you prefer?**
- **A)** Set up Firebase Console (keep current code) — requires Firebase project configuration
- **B)** Use backend auth only (no Firebase) — faster, already implemented in backend

Tell me which option, and what account type you want to register with (email/password or OAuth like Google).
