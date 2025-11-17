import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard.jsx';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchProducts();
  }, [category, sort, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Use the API URL from environment variables, defaulting to empty string if not set
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      // Remove any trailing slash from baseUrl and append /api if not already present
      const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/api`;
      let url = `${apiBase}/products?page=${page}&sort=${sort}`;
      if (category) {
        url += `&category=${category}`;
      }
      console.log('Fetching products from:', url);
      const { data } = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      console.log('Products data:', data);
      setProducts(data.data || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error('Error fetching products:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      setProducts([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Electronics', 'Books', 'Clothing', 'Home', 'Sports', 'Other'];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">All Products</h1>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-md"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="-createdAt">Newest First</option>
                <option value="createdAt">Oldest First</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
                <option value="-name">Name: Z to A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {(pagination.prev || pagination.next) && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className={`px-4 py-2 border rounded-l-md ${page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`}
                >
                  Previous
                </button>
                <span className="text-gray-700">Page {page}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.next}
                  className={`px-4 py-2 border border-l-0 rounded-r-md ${!pagination.next ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Products;
