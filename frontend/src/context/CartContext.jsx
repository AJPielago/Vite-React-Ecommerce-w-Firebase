import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import api from '../utils/api';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const isSyncing = useRef(false);
  const lastSyncedSignature = useRef(null);

  // Load cart from backend when user logs in or on initial load
  const fetchCart = useCallback(async () => {
    if (user) {
    try {
      const { data } = await api.get('/cart');
      const serverItems = data.data?.cartItems || [];
      setCartItems(serverItems);
      // Remember that this is the source of truth we just pulled from the server
      lastSyncedSignature.current = getItemsSignature(serverItems);
      } catch (error) {
        console.error('Error fetching cart:', error);
        // If cart doesn't exist, it will be created on first add
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback to local storage for guests
      const items = localStorage.getItem('cartItems');
      if (items) {
        setCartItems(JSON.parse(items));
      }
      setLoading(false);
    }
  }, [user]);

  // Load cart when user changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Sync cart to backend when it changes (for logged-in users)
  const syncCartToBackend = useCallback(async (items) => {
    if (!user || isSyncing.current) return;
    isSyncing.current = true;

    try {
      // Convert items to the format expected by the backend
      const cartItems = items.map(item => {
        // If item has a product object, use its properties
        if (item.product && typeof item.product === 'object') {
          return {
            product: item.product._id,
            name: item.product.name,
            image: item.product.images?.[0] || '',
            price: item.product.price,
            countInStock: item.product.stock,
            qty: item.qty
          };
        }
        // Otherwise, use the item properties directly
        return {
          product: item._id,
          name: item.name,
          image: item.image || '',
          price: item.price,
          countInStock: item.countInStock,
          qty: item.qty
        };
      });

  // Deduplicate items by product id and sum their quantities. This prevents
      // sending duplicate lines which can cause backend stock validation to fail
      // when the same product appears multiple times (e.g., merge of guest and user carts).
      const itemsById = {};
      cartItems.forEach(i => {
        const id = i.product?._id || i._id || i.product;
        if (!id) return;
        if (!itemsById[id]) {
          itemsById[id] = { ...i, product: id, qty: Number(i.qty) };
        } else {
          itemsById[id].qty += Number(i.qty);
        }
      });
      const dedupedItems = Object.values(itemsById).map(i => ({
        product: i.product,
        name: i.name,
        image: i.image || (i.product?.images?.[0] ?? ''),
        price: i.price,
        countInStock: i.countInStock,
        qty: i.qty
      }));

  console.log('Sending cart update:', { items: dedupedItems });

      // Send a single batch update to the server
      const { data } = await api.put('/cart', { items: dedupedItems });
      
  // Update local state with the server's response
  const serverItems = data.data?.cartItems || [];
  setCartItems(serverItems);
  // Record that we just successfully synced this signature to avoid looping
  lastSyncedSignature.current = getItemsSignature(dedupedItems);
      return data;
    } catch (error) {
      console.error('Error syncing cart to backend:', error);
      // Log server response body for easier debugging of 400 errors
      if (error.response?.data) {
        console.error('Sync error response body:', error.response.data);
      }
      if (error.response?.status === 401) {
        // Token might be expired, let the interceptor handle it
        return;
      }
      // Refresh the cart to ensure we're in sync with the server
      await fetchCart();
      throw error;
    } finally {
      isSyncing.current = false;
    }
  }, [user, fetchCart]);

  // Save to local storage when cart changes (for guests) or sync with backend (for logged-in users)
  useEffect(() => {
    if (!user) {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    } else if (cartItems.length > 0 && !isSyncing.current) {
      // Fast-path: don't attempt to sync if the cart items equal the last
      // signature we just pulled from the server or wrote to the server.
      const sig = getItemsSignature(cartItems);
      if (sig && sig === lastSyncedSignature.current) {
        // No changes since last sync; do not call API
        return;
      }
      const sync = async () => {
        try {
          await syncCartToBackend(cartItems);
        } catch (error) {
          console.error('Failed to sync cart:', error);
        }
      };
      sync();
    }
  }, [JSON.stringify(cartItems), user, syncCartToBackend]);

  // Build a small stable signature for cart state so we can detect when
  // the server and client are in sync. Use product id + qty and sort by
  // product id so order changes don't trigger a sync.
  function getItemsSignature(items = []) {
    try {
      const mapped = items.map(i => ({
        product: i.product?._id || i.product || i._id,
        qty: Number(i.qty) || 0
      }));

      return JSON.stringify(mapped.sort((a, b) => String(a.product).localeCompare(String(b.product))));
    } catch (err) {
      return null;
    }
  }

  const addToCart = async (product, qty = 1) => {
    const existItem = cartItems.find(item => item.product?._id === product._id || item._id === product._id);
    let updatedItems;

    if (existItem) {
      updatedItems = cartItems.map(item =>
        (item.product?._id === product._id || item._id === product._id)
          ? { 
              ...item, 
              qty: item.qty + qty,
              // Ensure we have the full product details
              ...(item.product ? {} : { product })
            } 
          : item
      );
    } else {
      updatedItems = [...cartItems, { 
        product, 
        qty,
        _id: product._id // For backward compatibility
      }];
    }

    setCartItems(updatedItems);
  };

  const removeFromCart = async (id) => {
    if (user) {
      try {
        // If we have the cart item ID, use it, otherwise use the product ID
        const itemToRemove = cartItems.find(item => item._id === id || item.product?._id === id);
        if (itemToRemove?._id) {
          // Correct route is DELETE /api/cart/:id
          await api.delete(`/cart/${itemToRemove._id}`);
        } else {
          // Fallback: Update the entire cart
          await syncCartToBackend(cartItems.filter(item => item._id !== id && item.product?._id !== id));
        }
      } catch (error) {
        console.error('Error removing item from cart:', error);
        // Continue with local state update even if API call fails
      }
    }
    setCartItems(prevItems => prevItems.filter(item => item._id !== id && item.product?._id !== id));
  };

  const updateCartQty = async (id, qty) => {
    const updatedItems = cartItems.map(item =>
      item._id === id ? { ...item, qty: Number(qty) } : item
    );

    if (user) {
      try {
        await api.put(`/cart/${id}`, { qty });
      } catch (error) {
        console.error('Error updating cart item quantity:', error);
      }
    }

    setCartItems(updatedItems);
  };

  const clearCart = async () => {
    if (user) {
      try {
        await api.delete('/cart');
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
  } else {
      localStorage.removeItem('cartItems');
    }
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.qty, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.qty, 0);
  };

  // Merge guest cart with user cart when logging in
  const mergeCarts = (guestCart) => {
    if (guestCart && guestCart.length > 0) {
      const updatedItems = [...cartItems];
      
      guestCart.forEach(guestItem => {
        const existingItem = updatedItems.find(item => item._id === guestItem._id);
        
        if (existingItem) {
          existingItem.qty += guestItem.qty;
        } else {
          updatedItems.push(guestItem);
        }
      });
      
      setCartItems(updatedItems);
      localStorage.removeItem('cartItems');
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        getCartTotal,
        getCartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
