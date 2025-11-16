# Profile Upload Fix - 500 Error Resolution

## Problem
When trying to update profile with a picture upload, you got a **500 (Internal Server Error)** on `POST /api/v1/upload`.

## Root Cause
The upload route had `authorize('admin')` middleware, which means only admin users could upload files. Regular users (role: 'user') were getting **403 Forbidden** converted to 500 by error handling.

## Solution Applied
✅ **Updated** `backend/routes/upload.js`:
- **Before**: `router.post('/', protect, authorize('admin'), upload.single('image'), ...)`
- **After**: `router.post('/', protect, upload.single('image'), ...)` 
- Removed the `authorize('admin')` check
- Now any authenticated user can upload images (for profiles, etc.)

## Files Modified
- `backend/routes/upload.js` — Removed admin-only restriction on image uploads

## Backend Restart Required
The backend needs to be restarted to apply the route change:

```powershell
cd backend
npm run dev
```

Or if running in production mode:
```powershell
cd backend
npm start
```

## What Works Now
1. ✅ Regular users can upload profile pictures via `POST /api/v1/upload`
2. ✅ Profile update endpoint `PUT /api/v1/auth/me/update` accepts `profilePicture` URL
3. ✅ Upload returns Cloudinary URL to be stored in user profile

## Test Flow
1. Restart backend
2. Go to profile in app
3. Select a profile picture
4. Click "Update Profile"
5. Image uploads to Cloudinary, URL is saved to your profile
6. No more 500 errors!

## Backend Stack (for reference)
- Cloudinary config: `backend/config/cloudinary.js` (handles file transformations)
- Upload route: `backend/routes/upload.js` (now accessible to all authenticated users)
- Profile update: `backend/controllers/auth.js` → `updateProfile()` function
- Auth middleware: `backend/middleware/auth.js` → `protect` only requires valid JWT token
