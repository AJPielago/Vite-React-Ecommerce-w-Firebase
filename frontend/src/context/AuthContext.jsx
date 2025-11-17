import React, { createContext, useState, useEffect, useCallback } from 'react';
import {
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithCustomToken,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  getIdToken,
  GoogleAuthProvider as FirebaseGoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../firebase';
import api from '../utils/api';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingRedirect, setPendingRedirect] = useState(null);
  const googleProvider = new FirebaseGoogleAuthProvider();
  const facebookProvider = new FacebookAuthProvider();
  // Request email scope for Facebook explicitly; ensure app has this permission enabled
  try {
    facebookProvider.addScope('email');
  } catch (err) {
    console.warn('Failed adding email scope to Facebook provider:', err);
  }

  // Handle redirects after state updates
  useEffect(() => {
    if (pendingRedirect) {
      window.location.href = pendingRedirect;
    }
  }, [pendingRedirect]);
  
  // Helper function to handle navigation
  const safeNavigate = useCallback((path) => {
    setPendingRedirect(path);
  }, []);

  // Helper function to format Firebase error messages
  const formatFirebaseError = (error) => {
    if (!error || !error.code) return 'An unknown error occurred.';
    
    const errorMap = {
      'auth/operation-not-allowed': 'This sign-in provider is not enabled. Please enable it under Firebase Console → Authentication → Sign-in method.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/user-not-found': 'Invalid email or password.',
      'auth/wrong-password': 'Invalid email or password.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/requires-recent-login': 'Please log in again to perform this action.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/popup-closed-by-user': 'Sign in was cancelled.',
      'auth/popup-blocked': 'Please allow popups for this website to sign in.',
      'auth/cancelled-popup-request': 'Sign in was cancelled. Please try again.',
    };

    return errorMap[error.code] || error.message || 'An error occurred. Please try again.';
  };

  // Function to set auth token in localStorage and axios headers
  const setAuthToken = useCallback((token) => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  }, []);

  // Function to update user data
  const updateUserData = useCallback(async (firebaseUser) => {
    try {
      if (!firebaseUser) {
        setUser(null);
        setAuthToken(null);
        return null;
      }

      // First, update the local user state with Firebase data
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified
      };

      try {
        // Get a fresh token
        const token = await firebaseUser.getIdToken(true);
        if (!token) {
          throw new Error('No authentication token available');
        }

        // If email is not verified, only block access for email/password sign-ins.
        const providerId = firebaseUser.providerData?.[0]?.providerId || null;
        const socialProviders = ['google.com', 'facebook.com'];
        if (!firebaseUser.emailVerified && !socialProviders.includes(providerId)) {
          console.log('Firebase user has not verified email for password sign-in, signing out.');
          await firebaseSignOut(auth);
          return null;
        }

        console.log('Firebase ID Token (first 50 chars):', token.substring(0, 50) + '...');
        
        // Set the token in both localStorage and axios headers
        setAuthToken(token);

        try {
          // Try to get user data from the backend
          const { data } = await api.get('/v1/auth/me');
          
          if (data?.data) {
            Object.assign(userData, {
              displayName: userData.displayName || data.data.name,
              photoURL: userData.photoURL || data.data.profilePicture,
              ...data.data
            });
            // If firebase says the email is verified but backend doesn't, update backend
            const providerId = firebaseUser.providerData?.[0]?.providerId || null;
            const socialProviders = ['google.com', 'facebook.com'];
            if ((firebaseUser.emailVerified || socialProviders.includes(providerId)) && !data.data.emailVerified) {
              try {
                await api.put('/v1/auth/me/update', { emailVerified: true });
              } catch (err) {
                console.error('Failed to sync emailVerified to backend:', err);
              }
            }
          }
        } catch (apiError) {
          console.error('Error fetching user data:', apiError);
          
          // If we get a 401, the token might be invalid or expired
          if (apiError.response?.status === 401) {
            console.log('Token might be expired, trying to refresh...');
            
            // Force token refresh and retry once
            const newToken = await firebaseUser.getIdToken(true);
            if (newToken && newToken !== token) {
              console.log('Got new token, retrying...');
              setAuthToken(newToken);
              
              try {
                const retryResponse = await api.get('/v1/auth/me');
                if (retryResponse.data?.data) {
                  Object.assign(userData, {
                    displayName: userData.displayName || retryResponse.data.data.name,
                    photoURL: userData.photoURL || retryResponse.data.data.profilePicture,
                    ...retryResponse.data.data
                  });
                }
              } catch (retryError) {
                console.error('Retry failed:', retryError);
                // If we still get 401, the user might not exist in the backend
                // We'll proceed with just the Firebase user data
                console.log('Proceeding with Firebase user data only');
              }
            }
          } else if (apiError.response?.status === 404) {
            // If the user doesn't exist in the backend yet, create them (only if email is verified)
            console.log('User not found in backend, creating user...');
            try {
              if (!firebaseUser.emailVerified) {
                console.log('Skipping backend registration until email is verified.');
              } else {
              const registerResponse = await api.post('/v1/auth/register', {
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                email: firebaseUser.email,
                uid: firebaseUser.uid
              });
              
              if (registerResponse.data?.data) {
                Object.assign(userData, {
                  ...registerResponse.data.data,
                  displayName: userData.displayName || registerResponse.data.data.name,
                  photoURL: userData.photoURL || registerResponse.data.data.profilePicture
                });
              }
            }
            } catch (registerError) {
              console.error('Error registering user in backend:', registerError);
              // Continue with Firebase data if registration fails
            }
          } else {
            console.log('Proceeding with Firebase user data only');
          }
        }
      } catch (err) {
        console.warn('Using Firebase user data only:', err.message);
        // Continue with Firebase data if backend fails
      }
      
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Error updating user data:', err);
      throw err;
    }
  }, []);

  // Handle authentication errors
  const handleAuthError = useCallback((error) => {
    console.error('Authentication error:', error);
    const errorMessage = formatFirebaseError(error);
    setError(errorMessage);
    
    // If token is invalid or expired, clear it
    if (error?.response?.status === 401 || error?.code === 'auth/invalid-user-token') {
      setAuthToken(null);
      setUser(null);
    }
    
    return { success: false, error: errorMessage };
  }, [setAuthToken]);

  // Set up auth state listener
  useEffect(() => {
    const handleAuthStateChange = async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        try {
          // Force refresh the token to ensure it's current
          const token = await firebaseUser.getIdToken(true);
          if (!token) {
            throw new Error('Failed to get authentication token');
          }
          
          // Set the token and update user data
          setAuthToken(token);
          await updateUserData(firebaseUser);
          
          // Set up token refresh before it expires
          const tokenResult = await firebaseUser.getIdTokenResult();
          const expiresInMs = (new Date(tokenResult.expirationTime).getTime() - Date.now()) - (5 * 60 * 1000);
          
          if (expiresInMs > 0) {
            setTimeout(async () => {
              if (auth.currentUser) {
                try {
                  const newToken = await auth.currentUser.getIdToken(true);
                  setAuthToken(newToken);
                } catch (err) {
                  console.error('Error refreshing token:', err);
                  // If refresh fails, log the user out
                  await firebaseSignOut(auth);
                }
              }
            }, expiresInMs);
            
            // Clean up the timeout on component unmount
          }
          
        } catch (err) {
          console.error('Error in auth state change:', err);
          setError('Failed to initialize user session. Please log in again.');
          setUser(null);
          setAuthToken(null);
          
          // Redirect to login if not already there
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      } else {
        // User is signed out
        setUser(null);
        setAuthToken(null);
      }
      
      setLoading(false);
    };
    
    // Set up the auth state listener
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [setAuthToken, updateUserData]);

  // Email/Password Sign Up
  const register = async (name, email, password) => {
    setError('');
    const sanitizedEmail = String(email).replace(/,/g, '.');
    try {
      // Create user in Firebase (sanitized email)
      const userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
      
      // Update Firebase profile with display name
      await updateProfile(userCredential.user, { displayName: name });
      
      // Send verification email to newly registered user and sign them out until verified
      try {
        await sendEmailVerification(userCredential.user);
      } catch (err) {
        console.error('Failed to send verification email:', err);
      }

      // Sign out the firebase user so we don't allow immediate login before verification
      await firebaseSignOut(auth);
      return { success: true, message: 'A verification email was sent. Please verify your email before logging in.' };
    } catch (err) {
      console.error('Registration error:', err);
      return handleAuthError(err);
    }
  };

  // Email/Password Login
  const login = async (email, password) => {
    setError('');
    try {
      const sanitizedEmail = String(email).replace(/,/g, '.');
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
      
      // If the user hasn't verified their email, block login
      if (!userCredential.user.emailVerified) {
        await firebaseSignOut(auth);
        return { success: false, error: 'Please verify your email address before logging in.' };
      }

      // Get the ID token
      const token = await userCredential.user.getIdToken();
      
      // Set the token in localStorage and axios headers
      setAuthToken(token);
      
      // Get user data
      await updateUserData(userCredential.user);
      
      // Set a timer to refresh the token before it expires
      const tokenResult = await userCredential.user.getIdTokenResult();
      const expiresIn = (new Date(tokenResult.expirationTime).getTime() - Date.now()) - (5 * 60 * 1000); // 5 minutes before expiration
      
      if (expiresIn > 0) {
        setTimeout(async () => {
          if (auth.currentUser) {
            const newToken = await auth.currentUser.getIdToken(true);
            setAuthToken(newToken);
          }
        }, expiresIn);
      }
      
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = formatFirebaseError(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Google Sign In
  const signInWithGoogle = async () => {
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Get the ID token
      const token = await result.user.getIdToken();
      // Social providers are trusted for email ownership, skip forced verification for provider sign-in.
      setAuthToken(token);
      
      // Get user data
      await updateUserData(result.user);
      
      // Set a timer to refresh the token before it expires
      const tokenResult = await result.user.getIdTokenResult();
      const expiresIn = (new Date(tokenResult.expirationTime).getTime() - Date.now()) - (5 * 60 * 1000); // 5 minutes before expiration
      
      if (expiresIn > 0) {
        setTimeout(async () => {
          if (auth.currentUser) {
            const newToken = await auth.currentUser.getIdToken(true);
            setAuthToken(newToken);
          }
        }, expiresIn);
      }
      
      return { success: true };
    } catch (err) {
      console.error('[FB] signInWithFacebook error', err);
      // Don't log benign popup-close errors to the console (these are user actions)
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // User closed the popup — not an actionable error; return canceled so UI can ignore it.
        return { success: false, canceled: true };
      }

      console.error('Google sign in error:', err);
      // If popup was blocked, fallback to redirect
      if (err?.code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return { success: false, error: 'Popup blocked. Redirecting to Google sign-in...' };
        } catch (redirectErr) {
          console.error('Google redirect fallback failed:', redirectErr);
          const errorMessage = formatFirebaseError(redirectErr);
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }
      }
      const errorMessage = formatFirebaseError(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Facebook Sign In
  const signInWithFacebook = async () => {
    console.log('[FB] signInWithFacebook called');
    setError('');
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      console.log('[FB] signInWithPopup resolved', result?.user?.uid, result?.user?.email);

      // Get the ID token
      const token = await result.user.getIdToken();
      // Social provider sign-in: accept provider claims and don't require email verification.

      setAuthToken(token);
      // Get user data
      try {
        await updateUserData(result.user);
      } catch (err) {
        // If backend returns 401 (user not created), try creating backend user using server-side Facebook flow
        if (err?.response?.status === 401) {
          console.log('Backend returned 401 on /v1/auth/me after Facebook sign-in. Trying server-side create.');
          try {
            // Extract the provider credential and access token
            const credential = FacebookAuthProvider.credentialFromResult(result);
            const accessToken = credential?.accessToken;
            if (accessToken) {
              // Call server route to exchange accessToken for a custom token and backend user
              const { data: serverData } = await api.post('/auth/facebook', { accessToken });
              console.log('Server response from /auth/facebook:', serverData);
              if (!serverData?.token) {
                toast.error('Failed to create backend user from Facebook login. Check server logs.');
                throw new Error('No token returned from server');
              }
              const customToken = serverData?.token;
              if (customToken) {
                // Sign in the client with the custom token; this ensures Firebase ID token maps to backend user
                await signInWithCustomToken(auth, customToken);
                toast.success('Signed in via Facebook (backend created user)');
                // Get new firebase user and token
                const firebaseUser2 = auth.currentUser;
                if (firebaseUser2) {
                  const newToken = await firebaseUser2.getIdToken(true);
                  setAuthToken(newToken);
                }
                // Server created the user; retry reading user by calling /v1/auth/me
                await updateUserData(auth.currentUser);
              } else {
                // Fallback: still try to update user data
                await updateUserData(result.user);
              }
            }
          } catch (createErr) {
            console.error('Server-side Facebook create failed:', createErr);
            throw createErr;
          }
        } else {
          throw err;
        }
      }

      // Set a timer to refresh the token before it expires
      const tokenResult = await result.user.getIdTokenResult();
      const expiresIn = (new Date(tokenResult.expirationTime).getTime() - Date.now()) - (5 * 60 * 1000);
      if (expiresIn > 0) {
        setTimeout(async () => {
          if (auth.currentUser) {
            const newToken = await auth.currentUser.getIdToken(true);
            setAuthToken(newToken);
          }
        }, expiresIn);
      }

      return { success: true };
    } catch (err) {
      // Don't log benign popup-close errors to the console (these are user actions)
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // User closed the popup — not an actionable error; return canceled so UI can ignore it.
        return { success: false, canceled: true };
      }

      console.error('Facebook sign in error:', err);
      // If popup was blocked by the browser, fallback to redirect flow
      if (err?.code === 'auth/popup-blocked') {
        try {
          // Use redirect as a fallback when popup is blocked
          await signInWithRedirect(auth, facebookProvider);
          return { success: false, error: 'Popup blocked. Redirecting to Facebook sign-in...' };
        } catch (redirectErr) {
          console.error('Redirect fallback failed:', redirectErr);
          const errorMessage = formatFirebaseError(redirectErr);
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }
      }
      const errorMessage = formatFirebaseError(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setAuthToken(null);
      setError('');
      // Redirect to home page after logout
      safeNavigate('/');
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to log out. Please try again.');
    }
  };

  // Reset Password
  const resetPassword = async (email) => {
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err) {
      console.error('Password reset error:', err);
      return handleAuthError(err);
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!auth.currentUser) {
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      // Update Firebase profile if displayName or photoURL is being updated
      const firebaseUpdates = {};
      if (updates.displayName) firebaseUpdates.displayName = updates.displayName;
      if (updates.photoURL) firebaseUpdates.photoURL = updates.photoURL;
      
      if (Object.keys(firebaseUpdates).length > 0) {
        await updateProfile(auth.currentUser, firebaseUpdates);
      }
      
      // Update backend user data
      const { data } = await api.put('/v1/auth/me/update', updates);
      
      // Force token refresh to ensure we have the latest one
      const token = await auth.currentUser.getIdToken(true);
      setAuthToken(token);
      
      // Update local user state with the latest data
      setUser(prev => ({
        ...prev,
        ...updates,
        ...(data.data || {})
      }));
      
      return { success: true, data: data.data };
    } catch (err) {
      console.error('Update profile error:', err);
      
      // If unauthorized, log the user out
      if (err.response?.status === 401) {
        await logout();
      }
      
      return handleAuthError(err);
    }
  };

  // Resend email verification to current Firebase user
  const resendVerification = async () => {
    if (!auth.currentUser) {
      return { success: false, error: 'No authenticated user to resend verification for' };
    }

    try {
      await sendEmailVerification(auth.currentUser);
      return { success: true };
    } catch (err) {
      console.error('Resend verification error:', err);
      return { success: false, error: err.message || 'Failed to resend verification email' };
    }
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    register,
    login,
    signInWithGoogle,
    signInWithFacebook,
    logout,
    resetPassword,
    updateUserProfile,
    resendVerification,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-gray-700 text-lg font-medium">Loading...</div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
