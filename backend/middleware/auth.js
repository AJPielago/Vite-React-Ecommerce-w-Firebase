const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { verifyFirebaseToken } = require('../config/firebase');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Get token from header or cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Get token from cookie
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. No token provided.'
    });
  }

  try {
    // First try to verify as JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found with this token.'
      });
    }
    
    req.user = user;
    return next();
  } catch (jwtError) {
    console.warn('JWT verification failed, attempting Firebase token verification:', jwtError.message);

    try {
      const firebaseUser = await verifyFirebaseToken(token);
      
      if (!firebaseUser) {
        throw new Error('Invalid or expired token');
      }
      
      // Find or create user based on Firebase UID
      let user = await User.findOne({ uid: firebaseUser.uid });
      
      if (!user) {
        // Handle social logins that don't provide an email
        let email = firebaseUser.email;
        const socialProviders = ['facebook.com', 'google.com'];
        
        if (!email && firebaseUser.signInProvider && socialProviders.includes(firebaseUser.signInProvider)) {
          // Generate a valid placeholder email for social logins without email
          const providerPrefix = firebaseUser.signInProvider.replace(/\./g, '-');
          email = `user-${uuidv4().substring(0, 8)}@${providerPrefix}.example.com`;
          console.log('Generated placeholder email for social login:', email);
        } else if (!email) {
          console.error('No email provided and not a social login');
          return res.status(400).json({
            success: false,
            message: 'Email is required to create an account.'
          });
        }
        
        // Generate a username from email or use the UID as fallback
        const username = firebaseUser.name || 
                        (email ? email.split('@')[0] : `user-${firebaseUser.uid}`);
          
        user = await User.create({
          uid: firebaseUser.uid,
          email: email,
          name: username,
          emailVerified: firebaseUser.signInProvider ? true : (firebaseUser.emailVerified || false),
          authProvider: firebaseUser.signInProvider || 'email',
          picture: firebaseUser.picture || null
        });
        
        console.log('Created new user from social login:', { 
          uid: user.uid, 
          email: user.email,
          authProvider: user.authProvider
        });
      }
      
      req.user = user;
      req.firebaseClaims = firebaseUser;
      return next();
    } catch (firebaseError) {
      console.error('Firebase token verification failed:', firebaseError);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. ' + (firebaseError.message || 'Invalid token.')
      });
    }
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
