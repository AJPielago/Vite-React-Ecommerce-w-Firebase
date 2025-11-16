const admin = require('firebase-admin');

const buildServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (error) {
      console.error('Invalid FIREBASE_SERVICE_ACCOUNT JSON. Falling back to individual env vars.', error);
    }
  }

  const requiredEnvMap = {
    type: process.env.FIREBASE_ADMIN_TYPE,
    project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
    private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
    auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
    token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_ADMIN_UNIVERSE_DOMAIN
  };

  const missingKeys = Object.entries(requiredEnvMap)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length) {
    throw new Error(`Missing Firebase Admin environment variables: ${missingKeys.join(', ')}`);
  }

  return {
    ...requiredEnvMap,
    private_key: requiredEnvMap.private_key.replace(/\\n/g, '\n')
  };
};

// Initialize Firebase Admin with service account
const serviceAccount = buildServiceAccount();

// Initialize Firebase Admin if it hasn't been initialized already
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = admin.auth();

// Middleware to verify Firebase ID token
const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      emailVerified: decodedToken.email_verified,
      signInProvider: decodedToken?.firebase?.sign_in_provider || null,
      name: decodedToken.name || null,
      picture: decodedToken.picture || null
    };
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return null;
  }
};

module.exports = {
  auth,
  verifyFirebaseToken
};
