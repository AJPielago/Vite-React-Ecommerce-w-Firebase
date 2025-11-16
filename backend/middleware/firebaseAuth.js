const { verifyFirebaseToken } = require('../config/firebase');

// Middleware to verify Firebase ID token from Authorization header or cookies
const verifyFirebaseIdToken = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = await verifyFirebaseToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // Attach to request as expected by other code
    req.user = decoded;
    return next();
  } catch (err) {
    console.error('Firebase token verification middleware error:', err);
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

module.exports = verifyFirebaseIdToken;
