import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { StarIcon } from '@heroicons/react/20/solid';
import api from '../utils/api';
import { CartContext } from '../context/CartContext.jsx';
import ReviewList from '../components/reviews/ReviewList';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product:', error);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    addToCart(product, qty);
    alert('Product added to cart!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-500">Product not found</p>
      </div>
    );
  }

  // Calculate average rating
  const averageRating = product.averageRating || 0;
  const reviewCount = product.reviewCount || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Product Image */}
            <div className="bg-white p-4 rounded-lg border border-gray-100">
              <img
                src={product.images && product.images[0] !== 'no-photo.jpg'
                  ? product.images[0]
                  : 'https://via.placeholder.com/500x500?text=No+Image'}
                alt={product.name}
                className="w-full h-96 object-contain rounded-lg"
              />
            </div>

            {/* Product Info */}
            <div>
              <div className="mt-4">
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                
                {/* Rating display */}
                <div className="mt-2 flex items-center">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`h-5 w-5 ${
                          star <= Math.round(averageRating) 
                            ? 'text-yellow-400' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {averageRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                </div>
              </div>

              {product.stock > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <select
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-32 px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                  >
                    {[...Array(Math.min(product.stock, 10)).keys()].map((x) => (
                      <option key={x + 1} value={x + 1}>
                        {x + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-colors ${
                  product.stock > 0
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ReviewList productId={product._id} />
      </div>
    </div>
  );
};

export default ProductDetail;
