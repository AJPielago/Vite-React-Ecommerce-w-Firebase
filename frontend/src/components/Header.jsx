import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCartIcon, 
  UserIcon, 
  ArrowLeftOnRectangleIcon, 
  UserCircleIcon, 
  PhotoIcon 
} from '@heroicons/react/24/outline';
import { AuthContext } from '../context/AuthContext.jsx';
import { CartContext } from '../context/CartContext.jsx';
import { auth } from '../firebase';
import axios from 'axios';
import api from '../utils/api';

const Header = () => {
  const { user, logout, updateUserProfile } = useContext(AuthContext);
  const { getCartCount } = useContext(CartContext);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profilePicture: user?.profilePicture || ''
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (uploading) {
      console.log('Already uploading, ignoring submit');
      return;
    }
    
    try {
      console.log('Starting profile update with data:', profileData);
      setUploading(true);
      
      // Prepare the update data
      const updateData = {
        name: profileData.name,
        email: profileData.email
      };
      
      // If there's a new image file, upload it first
      if (profileData.newImageFile) {
        console.log('Uploading new profile picture...');
        const imageUrl = await uploadProfilePicture(profileData.newImageFile);
        updateData.profilePicture = imageUrl;
      }
      
      console.log('Sending update request with data:', updateData);
      
      // Delegate profile update to AuthContext so it refreshes user state
      const result = await updateUserProfile(updateData);

      if (!result?.success) {
        throw new Error(result?.error || 'Error updating profile');
      }

      console.log('Update successful, new data:', result.data || updateData);
      setShowProfileModal(false);
      setError('');
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.error || 'Error updating profile');
      
      // If unauthorized, log the user out
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image size should be less than 2MB');
      return;
    }

    // Create a preview URL for the selected image
    const previewUrl = URL.createObjectURL(file);
    
    // Update the profile data with the preview URL
    // The actual upload will happen when the form is submitted
    setProfileData(prev => ({
      ...prev,
      profilePicture: previewUrl,
      newImageFile: file  // Store the file for later upload
    }));
    
    // Reset the file input to allow selecting the same file again if needed
    e.target.value = '';
  };

  // Handle the actual file upload when the form is submitted
  const uploadProfilePicture = async (file) => {
    if (!file) return null;
    
    setUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      // Get the current user's token with force refresh
      const token = await auth.currentUser?.getIdToken(true);
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Use the central `api` helper which adds the bearer token and base URL
      const uploadRes = await api.post('/v1/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Upload response data:', uploadRes.data);

      const imageUrl =
        uploadRes.data?.data ||
        uploadRes.data?.url ||
        uploadRes.data?.secure_url ||
        uploadRes.data?.path;

      if (!imageUrl) {
        throw new Error('Invalid response from server');
      }

      return imageUrl; // Return the image URL
    } catch (err) {
      console.error('File upload error:', err);
      if (err.response?.status === 401) {
        // If unauthorized, log the user out
        logout();
        navigate('/login');
      }
      throw err; // Re-throw to be handled by the form submission
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed - ${name}: ${value}`);
    setProfileData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      console.log('New profile data:', newData);
      return newData;
    });
  };

  // Initialize profile data when modal opens
  useEffect(() => {
    if (showProfileModal) {
      console.log('Modal opened, initializing with user data:', user);
      const initialData = {
        name: user?.name || '',
        email: user?.email || '',
        profilePicture: user?.profilePicture || ''
      };
      console.log('Setting initial profile data:', initialData);
      setProfileData(initialData);
    }
  }, [showProfileModal, user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCancel = (e) => {
    console.log('Cancel button clicked');
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Reset to original user data
    const resetData = {
      name: user?.name || '',
      email: user?.email || '',
      profilePicture: user?.profilePicture || ''
    };
    console.log('Resetting form data to:', resetData);
    setProfileData(resetData);
    setError('');
    setShowProfileModal(false);
  };

  return (
    <header className="bg-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-indigo-600">
              E-Shop
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/home"
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Home
            </Link>
            <Link
              to="/products"
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Products
            </Link>

            <Link to="/cart" className="relative p-2 text-gray-700 hover:text-indigo-600">
              <ShoppingCartIcon className="h-6 w-6" />
              {getCartCount() > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {getCartCount()}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span className="sr-only">Open user menu</span>
                  {user.profilePicture ? (
                    <img
                      className="h-8 w-8 rounded-full object-cover"
                      src={user.profilePicture}
                      alt={user.name}
                    />
                  ) : (
                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  )}
                  <span className="ml-2 text-sm font-medium text-gray-700">{user.name}</span>
                  <svg
                    className={`ml-1 h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {isDropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          setShowProfileModal(true);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        role="menuitem"
                      >
                        <UserIcon className="h-4 w-4 mr-2" />
                        Edit Profile
                      </button>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                        role="menuitem"
                      >
                        <ArrowLeftOnRectangleIcon className="h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Profile Update Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Update Profile</h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
                  {error}
                </div>
              )}

              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  {profileData.profilePicture ? (
                    <img
                      src={profileData.profilePicture}
                      alt={profileData.name}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="h-24 w-24 text-gray-400" />
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md hover:bg-gray-100 focus:outline-none"
                    disabled={uploading}
                    type="button"
                  >
                    <PhotoIcon className="h-5 w-5 text-indigo-600" />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*"
                    />
                  </button>
                </div>
                <span className="mt-2 text-xs text-gray-500">
                  {uploading ? 'Uploading...' : 'Click to change photo'}
                </span>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleProfileUpdate(e);
              }}>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={profileData.name || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/profile');
                      setShowProfileModal(false);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 mr-2"
                  >
                    View Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                    disabled={uploading}
                  >
                    {uploading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
