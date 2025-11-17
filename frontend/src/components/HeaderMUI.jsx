import React, { useContext, useState, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { CartContext } from '../context/CartContext.jsx';
import { auth } from '../firebase';
import api from '../utils/api';

// MUI Components
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Tooltip,
  Container
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Person as UserIcon,
  Logout as LogoutIcon,
  AccountCircle,
  PhotoCamera,
  Dashboard as DashboardIcon
} from '@mui/icons-material';

const HeaderMUI = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const { getCartCount } = useContext(CartContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profilePicture: user?.profilePicture || ''
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  
  const isMenuOpen = Boolean(anchorEl);
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);
      const { data } = await api.put('/v1/auth/me/update', profileData);
      updateUser(data.user);
      setShowProfileModal(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating profile');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      
      const { data } = await api.post('/v1/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setProfileData(prev => ({
        ...prev,
        profilePicture: data.url
      }));
    } catch (err) {
      setError('Failed to upload image');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogout = async () => {
    handleMenuClose();
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  const handleProfileClick = () => {
    handleMenuClose();
    setShowProfileModal(true);
  };

  return (
    <AppBar position="sticky" color="default" elevation={1} sx={{ bgcolor: 'background.paper' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {/* Logo */}
          <Box 
            component={RouterLink} 
            to="/" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none', 
              color: 'inherit' 
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="Logo"
              sx={{ height: 32, width: 'auto' }}
            />
            <Typography 
              variant="h6" 
              component="span" 
              sx={{ 
                ml: 1, 
                fontWeight: 700, 
                display: { xs: 'none', sm: 'block' } 
              }}
            >
              eCommerce
            </Typography>
          </Box>

          {/* Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Products Link */}
            <Button 
              component={RouterLink} 
              to="/products" 
              color="inherit"
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Products
            </Button>

            {/* Cart */}
            <Tooltip title="Cart">
              <IconButton component={RouterLink} to="/cart" color="inherit" size="large">
                <Badge badgeContent={getCartCount()} color="error">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {user ? (
              <>
                {/* User Menu */}
                <Tooltip title="Account settings">
                  <IconButton
                    onClick={handleProfileMenuOpen}
                    size="small"
                    aria-controls={isMenuOpen ? 'account-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen ? 'true' : undefined}
                  >
                    {user.profilePicture ? (
                      <Avatar 
                        src={user.profilePicture} 
                        alt={user.name || 'User'} 
                        sx={{ width: 32, height: 32 }}
                      />
                    ) : (
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon />}
                      </Avatar>
                    )}
                  </IconButton>
                </Tooltip>

                {/* User Menu Dropdown */}
                <Menu
                  anchorEl={anchorEl}
                  id="account-menu"
                  open={isMenuOpen}
                  onClose={handleMenuClose}
                  onClick={handleMenuClose}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      overflow: 'visible',
                      filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                      mt: 1.5,
                      '& .MuiAvatar-root': {
                        width: 32,
                        height: 32,
                        ml: -0.5,
                        mr: 1,
                      },
                      '&:before': {
                        content: '""',
                        display: 'block',
                        position: 'absolute',
                        top: 0,
                        right: 14,
                        width: 10,
                        height: 10,
                        bgcolor: 'background.paper',
                        transform: 'translateY(-50%) rotate(45deg)',
                        zIndex: 0,
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle2" noWrap>{user.name}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>{user.email}</Typography>
                  </Box>
                  <Divider />
                  <MenuItem onClick={handleProfileClick}>
                    <ListItemIcon>
                      <AccountCircle fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Profile</ListItemText>
                  </MenuItem>
                  {user.isAdmin && (
                    <MenuItem component={RouterLink} to="/admin/dashboard">
                      <ListItemIcon>
                        <DashboardIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Admin Dashboard</ListItemText>
                    </MenuItem>
                  )}
                  <MenuItem component={RouterLink} to="/orders">
                    <ListItemIcon>
                      <ShoppingCartIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>My Orders</ListItemText>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button 
                  component={RouterLink} 
                  to="/login" 
                  color="inherit"
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  Sign In
                </Button>
                <Button 
                  component={RouterLink} 
                  to="/register" 
                  variant="contained" 
                  color="primary"
                  sx={{ ml: 1 }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>

      {/* Profile Update Dialog */}
      <Dialog open={showProfileModal} onClose={() => !uploading && setShowProfileModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleProfileUpdate}>
          <DialogTitle>Update Profile</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar 
                    src={profileData.profilePicture} 
                    sx={{ width: 100, height: 100, cursor: 'pointer' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {!profileData.profilePicture && <AccountCircle sx={{ fontSize: 100 }} />}
                  </Avatar>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <IconButton
                    color="primary"
                    aria-label="upload picture"
                    component="span"
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: 'background.paper',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <PhotoCamera />
                  </IconButton>
                </Box>
              </Box>
              
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={profileData.name}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
                required
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
                required
              />
              
              {error && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setShowProfileModal(false)} 
              color="inherit"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : null}
            >
              {uploading ? 'Updating...' : 'Update Profile'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </AppBar>
  );
};

export default HeaderMUI;
