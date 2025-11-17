import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { AuthContext } from '../context/AuthContext.jsx';
import { toast } from 'react-toastify';
import { CartContext } from '../context/CartContext.jsx';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signInWithGoogle, signInWithFacebook } = useContext(AuthContext);
  const { mergeCarts } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();

  const redirect = new URLSearchParams(location.search).get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const sanitizedEmail = email.trim().replace(/,/g, '.');
      const result = await login(sanitizedEmail, password);
      if (result.success) {
        // Merge guest cart with user cart if items exist
        if (result.guestCart && result.guestCart.length > 0) {
          await mergeCarts(result.guestCart);
        }
        navigate(redirect);
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center z-20"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="flex items-center justify-center space-x-3 mt-4">
            <button
              type="button"
              onClick={async () => {
                setError('');
                setLoading(true);
                try {
                  const result = await signInWithGoogle();
                  if (result?.canceled) {
                    // user closed popup; do not display an error
                    return;
                  }
                  if (result.success) {
                    toast.success('Signed in with Google');
                    navigate(redirect);
                  } else {
                    setError(result.error || 'Failed to sign in with Google');
                  }
                } catch (err) {
                  setError('Google sign-in failed');
                } finally {
                  setLoading(false);
                }
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
            >
              Continue with Google
            </button>

            <button
              type="button"
              onClick={async () => {
                setError('');
                setLoading(true);
                try {
                  const result = await signInWithFacebook();
                  if (result?.canceled) {
                    // user closed popup; do not display an error
                    return;
                  }
                  if (result.success) {
                    toast.success('Signed in with Facebook');
                    navigate(redirect);
                  } else {
                    setError(result.error || 'Failed to sign in with Facebook');
                  }
                } catch (err) {
                  setError('Facebook sign-in failed');
                } finally {
                  setLoading(false);
                }
              }}
              className="px-4 py-2 bg-blue-800 text-white rounded-md text-sm hover:bg-blue-900"
            >
              Continue with Facebook
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
