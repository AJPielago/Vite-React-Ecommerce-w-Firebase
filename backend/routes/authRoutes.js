const admin = require('firebase-admin');
const express = require('express');
const router = express.Router();
const { getGoogleAuthUrl, handleGoogleCallback, handleFacebookAuth, facebookDataDeletion } = require('../controllers/authController');
const verifyFirebaseIdToken = require('../middleware/firebaseAuth');

// Google OAuth routes
router.get('/google', (req, res) => {
  const url = getGoogleAuthUrl(req);
  res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }
    
    const user = await handleGoogleCallback(code, req);
    const customToken = await admin.auth().createCustomToken(user.uid);
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${customToken}`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Facebook OAuth route
router.post('/facebook', async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }
    
    const user = await handleFacebookAuth(accessToken);
    const customToken = await admin.auth().createCustomToken(user.uid);
    
    res.json({ token: customToken });
  } catch (error) {
    console.error('Facebook auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Facebook data deletion endpoint (called by Facebook when a user revokes access)
router.post('/facebook/data-deletion', async (req, res) => {
  try {
    const result = await facebookDataDeletion(req);
    // Facebook expects a 200 with a url the user can visit
    res.json(result);
  } catch (error) {
    console.error('Facebook data deletion error:', error);
    res.status(500).send('Failed to process data deletion request');
  }
});

// Get current user
router.get('/me', verifyFirebaseIdToken, async (req, res) => {
  try {
    const user = await admin.auth().getUser(req.user.uid);
    res.json({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
    });
  } catch (error) {
    console.error('Error getting user data:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

module.exports = router;
