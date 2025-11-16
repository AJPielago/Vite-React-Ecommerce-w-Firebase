const { auth } = require('../config/firebase');
const admin = require('firebase-admin');

// Google OAuth configuration
const googleOAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
};

// Facebook OAuth configuration
const facebookOAuthConfig = {
  appId: process.env.FACEBOOK_APP_ID,
  appSecret: process.env.FACEBOOK_APP_SECRET,
};

// Generate OAuth redirect URL for Google
const getGoogleAuthUrl = (req) => {
  const { OAuth2Client } = require('google-auth-library');
  const oauth2Client = new OAuth2Client(
    googleOAuthConfig.clientId,
    googleOAuthConfig.clientSecret,
    `${req.protocol}://${req.get('host')}/api/auth/google/callback`
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  });

  return url;
};

// Handle Google OAuth callback
const handleGoogleCallback = async (code, req) => {
  const { OAuth2Client } = require('google-auth-library');
  const oauth2Client = new OAuth2Client(
    googleOAuthConfig.clientId,
    googleOAuthConfig.clientSecret,
    `${req.protocol}://${req.get('host')}/api/auth/google/callback`
  );

  const { tokens } = await oauth2Client.getToken(code);
  const ticket = await oauth2Client.verifyIdToken({
    idToken: tokens.id_token,
    audience: googleOAuthConfig.clientId,
  });

  const payload = ticket.getPayload();
  
  // Create or get the user in Firebase
  try {
    const userRecord = await admin.auth().getUserByEmail(payload.email);
    return userRecord;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      // Create new Firebase user
      const newUserRecord = await admin.auth().createUser({
        email: payload.email,
        emailVerified: true,
        displayName: payload.name,
        photoURL: payload.picture,
        disabled: false,
      });

      // Create backend Mongo user too
      try {
        const existing = await User.findOne({ uid: newUserRecord.uid });
        if (!existing) {
          await User.create({
            uid: newUserRecord.uid,
            name: payload.name,
            email: payload.email,
            emailVerified: true,
            authProvider: 'google.com'
          });
          console.log('Created MongoDB user for Google id:', newUserRecord.uid);
        }
      } catch (mongoErr) {
        console.error('Failed to create Mongo user for Google:', mongoErr);
      }

      return newUserRecord;
    }
    throw error;
  }
};

// Handle Facebook OAuth
const User = require('../models/User');

const handleFacebookAuth = async (accessToken) => {
  const axios = require('axios');
  
  try {
    // Get user data from Facebook
    const { data } = await axios.get(
      `https://graph.facebook.com/v12.0/me?fields=id,name,email,picture&access_token=${accessToken}`
    );
    console.log('Facebook Graph API returned for access token:', data);

    // Create or get the user in Firebase
    try {
      const userRecord = await admin.auth().getUserByEmail(data.email);
      return userRecord;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new Firebase user
        const newUser = await admin.auth().createUser({
          email: data.email,
          emailVerified: true,
          displayName: data.name,
          photoURL: data.picture?.data?.url,
          disabled: false,
        });

        // Also create corresponding backend user in MongoDB
        try {
          const existing = await User.findOne({ uid: newUser.uid });
          if (!existing) {
            await User.create({
              uid: newUser.uid,
              name: data.name || newUser.displayName || newUser.email.split('@')[0],
              email: newUser.email,
              emailVerified: true,
              authProvider: 'facebook.com'
            });
              console.log('Created MongoDB user for Facebook id:', newUser.uid);
          }
        } catch (mongoErr) {
          // Log but don't fail the auth flow
          console.error('Failed to create Mongo user for Facebook:', mongoErr);
        }

        return newUser;
      }
      throw error;
    }
  } catch (error) {
    console.error('Facebook auth error:', error);
    throw new Error('Failed to authenticate with Facebook');
  }
};

// Handle Facebook data deletion callback
const verifySignedRequest = (signedRequest) => {
  const crypto = require('crypto');

  const [encodedSig, payload] = signedRequest.split('.');
  if (!encodedSig || !payload) return null;

  const base64UrlDecode = (str) => {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return Buffer.from(str, 'base64').toString('utf8');
  };

  const sig = Buffer.from(base64UrlDecode(encodedSig), 'utf8');
  const data = JSON.parse(base64UrlDecode(payload));

  const expectedSig = crypto.createHmac('sha256', facebookOAuthConfig.appSecret)
    .update(payload)
    .digest();

  try {
    if (!crypto.timingSafeEqual(sig, expectedSig)) {
      return null;
    }
  } catch (e) {
    return null;
  }

  return data;
};

const facebookDataDeletion = async (req) => {
  const { signed_request } = req.body;
  if (!signed_request) {
    throw new Error('signed_request missing');
  }

  const decoded = verifySignedRequest(signed_request);
  if (!decoded) {
    throw new Error('Invalid signed_request');
  }

  // The decoded object normally contains user_id and expires fields
  // In production you would lookup the user by their FB id or email and delete/anonymize data.
  console.log('Facebook data deletion callback received for:', decoded.user_id);

  // Return the confirmation page URL that Facebook should display to the user
  const confirmUrl = (process.env.FRONTEND_URL || `https://${process.env.VITE_FIREBASE_AUTH_DOMAIN || 'ecommerce-102.firebaseapp.com'}`) + '/privacy#delete-account';

  return { url: confirmUrl };
};

module.exports = {
  getGoogleAuthUrl,
  handleGoogleCallback,
  handleFacebookAuth,
  facebookDataDeletion
};
