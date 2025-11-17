import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../utils/api';
import SalesAnalytics from '../components/admin/SalesAnalytics';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    isActive: true
  });
  const [userError, setUserError] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    category: 'Electronics',
    stock: '',
    images: []
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [orderStatusChanges, setOrderStatusChanges] = useState({});
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        api.get('/products?limit=100'),
        api.get('/orders'),
        api.get('/users')
      ]);
      setProducts(productsRes.data.data);
      setOrders(ordersRes.data.data);
      setUsers(usersRes.data.data);
      setOrderStatusChanges({});
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setImageError('');
    setUploadingImage(true);

    try {
      const uploadedImages = [];

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          setImageError('One or more files are not valid images.');
          continue;
        }

        if (file.size > 5000000) {
          setImageError('Each image must be smaller than 5MB.');
          continue;
        }

        const formData = new FormData();
        formData.append('image', file);

        const { data } = await api.post('/v1/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (data?.data) {
          uploadedImages.push(data.data);
        }
      }

      if (uploadedImages.length) {
        setNewProduct((prev) => ({
          ...prev,
          images: [...prev.images, ...uploadedImages]
        }));
      }
    } catch (error) {
      setImageError(error.response?.data?.error || 'Error uploading image(s)');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    setNewProduct({
      ...newProduct,
      images: newProduct.images.filter((_, i) => i !== index)
    });
  };

  const toggleSelectProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAllProducts = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((product) => product._id));
    }
  };

  const handleBulkDeleteProducts = async () => {
    if (!selectedProducts.length) return;
    if (!window.confirm(`Delete ${selectedProducts.length} selected product(s)?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedProducts.map((productId) => api.delete(`/products/${productId}`))
      );
      setSelectedProducts([]);
      fetchData();
      alert('Selected products deleted successfully!');
    } catch (error) {
      alert('Error deleting selected products: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    // Validate images
    if (!newProduct.images || newProduct.images.length === 0) {
      alert('Please add at least one product image');
      return;
    }

    try {
      const payload = {
        ...newProduct,
        // Ensure numeric fields are numbers
        price: Number(newProduct.price),
        stock: Number(newProduct.stock)
      };

      await api.post('/products', payload);
      setShowAddProduct(false);
      setNewProduct({
        name: '',
        price: '',
        description: '',
        category: 'Electronics',
        stock: '',
        images: []
      });
      setImageError('');
      fetchData();
      alert('Product added successfully!');
    } catch (error) {
      console.error('Error adding product:', error?.response?.data || error);
      const message = error.response?.data?.error || error.response?.data?.message || 'Unknown error';
      alert('Error adding product: ' + message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchData();
        alert('Product deleted successfully!');
      } catch (error) {
        alert('Error deleting product: ' + (error.response?.data?.error || 'Unknown error'));
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId, nextStatus) => {
    if (!nextStatus) {
      alert('Please select a status before updating.');
      return;
    }

    try {
      setUpdatingOrderId(orderId);
      await api.put(`/orders/${orderId}/status`, { status: nextStatus });
      setOrderStatusChanges((prev) => ({ ...prev, [orderId]: undefined }));
      fetchData();
      alert('Order status updated and customer notified via email.');
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Unknown error';
      alert('Error updating order: ' + errorMessage);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        await api.put(`/users/${userId}/${action}`);
        fetchData();
        alert(`User ${action}d successfully!`);
      } catch (error) {
        alert('Error updating user: ' + (error.response?.data?.error || 'Unknown error'));
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${userId}`);
        setUsers(users.filter(user => user._id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setUserError('');

    // Validate passwords match
    if (newUser.password !== newUser.confirmPassword) {
      setUserError('Passwords do not match');
      return;
    }

    try {
      const { data } = await api.post('/v1/auth/register', {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        isActive: newUser.isActive
      });

      setUsers([...users, data.data]);
      setShowAddUser(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        isActive: true
      });
    } catch (error) {
      setUserError(error.response?.data?.error || 'Error creating user');
      console.error('Error creating user:', error);
    }
  };

  const handleUserInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewUser({
      ...newUser,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Products</h3>
            <p className="text-3xl font-bold text-indigo-600">{products.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
            <p className="text-3xl font-bold text-green-600">{orders.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">{users.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
            <p className="text-3xl font-bold text-purple-600">
              ${orders.reduce((sum, order) => sum + order.totalPrice, 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-6 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-6 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-6 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-6 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sales Analytics
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'analytics' && (
              <div className="p-6">
                <SalesAnalytics />
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Manage Users</h2>
                  <button
                    onClick={() => setShowAddUser(!showAddUser)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    {showAddUser ? 'Cancel' : 'Add User'}
                  </button>
                </div>

                {showAddUser && (
                  <form onSubmit={handleAddUser} className="bg-gray-50 p-6 rounded-lg mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Name"
                        value={newUser.name}
                        onChange={handleUserInputChange}
                        className="px-4 py-2 border border-gray-300 rounded-md"
                        required
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={newUser.email}
                        onChange={handleUserInputChange}
                        className="px-4 py-2 border border-gray-300 rounded-md"
                        required
                      />
                      <input
                        type="password"
                        placeholder="Password"
                        value={newUser.password}
                        onChange={handleUserInputChange}
                        className="px-4 py-2 border border-gray-300 rounded-md"
                        required
                      />
                      <input
                        type="password"
                        placeholder="Confirm Password"
                        value={newUser.confirmPassword}
                        onChange={handleUserInputChange}
                        className="px-4 py-2 border border-gray-300 rounded-md"
                        required
                      />
                      <select
                        value={newUser.role}
                        onChange={handleUserInputChange}
                        className="px-4 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newUser.isActive}
                          onChange={handleUserInputChange}
                          className="mr-2"
                        />
                        <label>Active</label>
                      </div>
                    </div>
                    {userError && (
                      <p className="mt-2 text-sm text-red-600">{userError}</p>
                    )}
                    <button
                      type="submit"
                      className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Add User
                    </button>
                  </form>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user._id}>
                          <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{user.isActive ? 'Yes' : 'No'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div>
                <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Manage Products</h2>
                  <div className="flex flex-wrap gap-3">
                    {selectedProducts.length > 0 && (
                      <button
                        onClick={handleBulkDeleteProducts}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                      >
                        Delete Selected ({selectedProducts.length})
                      </button>
                    )}
                    <button
                      onClick={() => setShowAddProduct(!showAddProduct)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      {showAddProduct ? 'Cancel' : 'Add Product'}
                    </button>
                  </div>
                </div>

                {showAddProduct && (
                  <form onSubmit={handleAddProduct} className="bg-gray-50 p-6 rounded-lg mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Product Name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-md"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-md"
                        required
                      />
                      <select
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-md"
                      >
                        <option>Electronics</option>
                        <option>Books</option>
                        <option>Clothing</option>
                        <option>Home</option>
                        <option>Sports</option>
                        <option>Other</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Stock"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <textarea
                      placeholder="Description"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-md"
                      rows="3"
                      required
                    />
                    
                    {/* Image Upload Section */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Images <span className="text-red-500">*</span>
                      </label>
                      
                      <div className="flex items-center space-x-4">
                        <label className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 inline-flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {uploadingImage ? 'Uploading...' : 'Upload Image'}
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploadingImage}
                          />
                        </label>
                        <span className="text-sm text-gray-500">
                          {newProduct.images.length} image(s) uploaded
                        </span>
                      </div>
                      
                      {imageError && (
                        <p className="mt-2 text-sm text-red-600">{imageError}</p>
                      )}
                      
                      {/* Image Preview */}
                      {newProduct.images.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                          {newProduct.images.map((image, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={image}
                                alt={`Product ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <p className="mt-2 text-xs text-gray-500">
                        Upload at least one image. Max size: 5MB. Formats: JPG, PNG, GIF, WEBP
                      </p>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={uploadingImage}
                      className={`mt-4 px-6 py-2 rounded-md text-white ${
                        uploadingImage
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {uploadingImage ? 'Please wait...' : 'Add Product'}
                    </button>
                  </form>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3">
                          <input
                            type="checkbox"
                            checked={products.length > 0 && selectedProducts.length === products.length}
                            onChange={toggleSelectAllProducts}
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product._id}>
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product._id)}
                              onChange={() => toggleSelectProduct(product._id)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">${product.price}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{product.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{product.stock}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteProduct(product._id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Manage Orders</h2>
                <div className="space-y-4">
                  {orders.map((order) => {
                    const selectedStatus = orderStatusChanges[order._id] ?? order.status;
                    return (
                      <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-semibold">Order ID: {order._id}</p>
                            <p className="text-sm text-gray-600">Customer: {order.user?.name}</p>
                            <p className="text-sm text-gray-600">Total: ${order.totalPrice.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">Placed: {new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex flex-col gap-2 md:items-end">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                order.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {order.isPaid ? 'Paid' : 'Payment Pending'}
                            </span>
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                order.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              Status: {order.status}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                            <select
                              value={selectedStatus}
                              onChange={(e) =>
                                setOrderStatusChanges((prev) => ({
                                  ...prev,
                                  [order._id]: e.target.value
                                }))
                              }
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                                <option key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-end">
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, selectedStatus)}
                              disabled={updatingOrderId === order._id || selectedStatus === order.status}
                              className={`w-full px-4 py-2 rounded-md text-white text-sm font-medium ${
                                updatingOrderId === order._id || selectedStatus === order.status
                                  ? 'bg-gray-300 cursor-not-allowed'
                                  : 'bg-indigo-600 hover:bg-indigo-700'
                              }`}
                            >
                              {updatingOrderId === order._id ? 'Updating...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Manage Users</h2>
                  <button
                    onClick={() => setShowAddUser(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
                  >
                    Add New User
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((userItem) => (
                        <tr key={userItem._id} className={!userItem.isActive ? 'bg-gray-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {userItem.name}
                                {userItem._id === user.id && (
                                  <span className="ml-2 text-xs text-indigo-600">(You)</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{userItem.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              userItem.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {userItem.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              userItem.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {userItem.isActive ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(userItem.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {userItem._id !== user.id && (
                              <>
                                <button
                                  onClick={() => handleToggleUserStatus(userItem._id, userItem.isActive)}
                                  className={`${
                                    userItem.isActive 
                                      ? 'text-orange-600 hover:text-orange-800' 
                                      : 'text-green-600 hover:text-green-800'
                                  }`}
                                >
                                  {userItem.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(userItem._id)}
                                  className="text-red-600 hover:text-red-800 ml-4"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {users.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New User</h3>
              <button onClick={() => setShowAddUser(false)} className="text-gray-500 hover:text-gray-700">
                &times;
              </button>
            </div>
            
            {userError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {userError}
              </div>
            )}

            <form onSubmit={handleAddUser}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="name">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newUser.name}
                  onChange={handleUserInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="email">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleUserInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleUserInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  minLength="6"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="confirmPassword">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={newUser.confirmPassword}
                  onChange={handleUserInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  minLength="6"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="role">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={newUser.role}
                  onChange={handleUserInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center mb-6">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={newUser.isActive}
                  onChange={handleUserInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active Account
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
