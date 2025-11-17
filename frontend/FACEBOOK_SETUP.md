# Facebook OAuth Setup (local & production)

This file lists the exact values to add to Facebook Developer Console for the e-commerce project.

App Domains
- ecommerce-102.firebaseapp.com
- your-production-domain.com

Valid OAuth Redirect URIs
- https://ecommerce-102.firebaseapp.com/__/auth/handler
- http://localhost:3000/__/auth/handler

Site URL (Add Website platform)
- http://localhost:3000

Privacy Policy URL
- https://ecommerce-102.firebaseapp.com/privacy

User Data Deletion URL (must return HTTP 200)
- https://ecommerce-102.firebaseapp.com/privacy

Notes:
- If your app is private (development mode), add your Facebook account to Roles → Testers.
- Make sure OAuth login is enabled (Client OAuth Login and Web OAuth Login).
