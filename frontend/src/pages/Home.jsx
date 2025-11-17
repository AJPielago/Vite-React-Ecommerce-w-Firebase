import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard.jsx';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState('infinite'); // 'infinite' or 'pagination'
  const observerTarget = useRef(null);

  const fetchProducts = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const { data } = await api.get(`/products?page=${pageNum}&limit=12`);
      
      if (append) {
        setProducts(prev => [...prev, ...(data.data || [])]);
      } else {
        setProducts(data.data || []);
      }
      
      setPagination(data.pagination || {});
      setHasMore(!!data.pagination?.next);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(1, false);
  }, [fetchProducts]);

  // Infinite scroll observer
  useEffect(() => {
    if (viewMode !== 'infinite' || !hasMore || loading || loadingMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchProducts(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [viewMode, hasMore, loading, loadingMore, page, fetchProducts]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage !== page) {
      fetchProducts(newPage, false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Welcome to E-Shop
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              Discover amazing products at unbeatable prices
            </p>
            <Link
              to="/products"
              className="inline-block bg-white text-pink-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-pink-50 transition-colors"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('infinite')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'infinite'
                  ? 'bg-pink-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Infinite Scroll
            </button>
            <button
              onClick={() => setViewMode('pagination')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'pagination'
                  ? 'bg-pink-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Pagination
            </button>
          </div>
        </div>

        {loading && products.length === 0 ? (
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

            {/* Infinite Scroll Loading Indicator */}
            {viewMode === 'infinite' && (
              <div ref={observerTarget} className="mt-8">
                {loadingMore && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading more products...</p>
                  </div>
                )}
                {!hasMore && products.length > 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No more products to load</p>
                  </div>
                )}
              </div>
            )}

            {/* Pagination Controls */}
            {viewMode === 'pagination' && pagination && (pagination.prev || pagination.next) && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={!pagination.prev || loading}
                  className={`px-4 py-2 border rounded-l-md text-sm font-medium transition-colors ${
                    !pagination.prev || loading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700 text-sm">
                    Page {page}
                    {pagination.totalPages && ` of ${pagination.totalPages}`}
                  </span>
                </div>
                
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!pagination.next || loading}
                  className={`px-4 py-2 border border-l-0 rounded-r-md text-sm font-medium transition-colors ${
                    !pagination.next || loading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  Next
                </button>
              </div>
            )}

            {/* View All Products Link */}
            <div className="text-center mt-12">
              <Link
                to="/products"
                className="inline-block bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
              >
                View All Products
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Quality Products</h3>
              <p className="text-gray-600">Only the best products for our customers</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Best Prices</h3>
              <p className="text-gray-600">Competitive prices on all items</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Fast Delivery</h3>
              <p className="text-gray-600">Quick and reliable shipping</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
