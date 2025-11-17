import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext.jsx';

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:shadow-pink-100">
      <Link to={`/products/${product._id}`}>
        <img
          src={product.images && product.images[0] !== 'no-photo.jpg' 
            ? product.images[0] 
            : 'https://via.placeholder.com/300x300?text=No+Image'}
          alt={product.name}
          className="w-full h-64 object-cover hover:opacity-90 transition-opacity"
        />
      </Link>
      <div className="p-4">
        <Link to={`/products/${product._id}`}>
          <h3 className="text-lg font-semibold text-gray-900 hover:text-pink-600 transition-colors mb-2">
            {product.name}
          </h3>
        </Link>
        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-pink-600">
            ${product.price ? product.price.toFixed(2) : '0.00'}
          </span>
          <span className="text-sm text-muted-foreground">
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </span>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            product.stock > 0
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
