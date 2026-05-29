import React, { createContext, useState, useEffect } from 'react';
import api from '../api/api';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [tableNo, setTableNo] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [placedOrders, setPlacedOrders] = useState([]);
  const [activeWaiterCall, setActiveWaiterCall] = useState(null);

  // Restore cart on page refresh
  useEffect(() => {
    const savedCart = sessionStorage.getItem('dineqr_cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const saveCart = (items) => {
    setCartItems(items);
    sessionStorage.setItem('dineqr_cart', JSON.stringify(items));
  };

  const addToCart = (dish) => {
    const existing = cartItems.find(item => item._id === dish._id);
    if (existing) {
      saveCart(cartItems.map(item => 
          item._id === dish._id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
      ));
    } else {
      saveCart([...cartItems, { ...dish, quantity: 1 }]);
    }
  };

  const removeFromCart = (dishId) => {
    saveCart(cartItems.filter(item => item._id !== dishId));
  };

  const updateQuantity = (dishId, amount) => {
    const existing = cartItems.find(item => item._id === dishId);
    if (!existing) return;

    const newQuantity = existing.quantity + amount;
    if (newQuantity <= 0) {
      removeFromCart(dishId);
    } else {
      saveCart(cartItems.map(item =>
        item._id === dishId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const cartCount = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Fetch running order list
  const fetchTableOrders = async (tableNum, restId = restaurantId) => {
    const rId = restId || restaurantId;
    if (!tableNum || !rId) return;
    try {
      const response = await api.get(`/orders?table_no=${tableNum}&restaurant_id=${rId}`);
      setPlacedOrders(response.data);
    } catch (error) {
      console.error('Error fetching running orders:', error);
    }
  };

  // Checkout and place order
  const placeOrder = async (notes = '') => {
    if (!tableNo || !restaurantId || cartItems.length === 0) {
      return { success: false, message: 'Cart is empty or session details are missing.' };
    }

    try {
      const payload = {
        table_no: tableNo,
        restaurant_id: restaurantId,
        items: cartItems.map(item => ({
          dish_id: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        notes
      };

      const response = await api.post('/orders', payload);
      clearCart();
      await fetchTableOrders(tableNo, restaurantId);
      return { success: true, order: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit order.'
      };
    }
  };

  // Request waiter service
  const triggerWaiterCall = async () => {
    if (!tableNo || !restaurantId) return { success: false, message: 'Session details are missing.' };

    try {
      const response = await api.post('/calls', { table_no: tableNo, restaurant_id: restaurantId });
      // The endpoint returns call log
      const callData = response.data.call || response.data;
      setActiveWaiterCall(callData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to request waiter.'
      };
    }
  };

  // Refresh waiter alert status
  const checkWaiterCallStatus = async (tableNum) => {
    // This endpoint now requires token. If 401 is thrown, we ignore it silently as customer is unauthorized
    if (!tableNum) return;
    try {
      const response = await api.get('/calls');
      // If we got an active service call, keep state active
      const activeCall = response.data.find(call => call.table_no === tableNum && call.status === 'Active');
      setActiveWaiterCall(activeCall || null);
    } catch (error) {
      // Quietly fail for customers without tokens
      console.log('Skipping waiter status check (requires authentication)');
    }
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      tableNo,
      setTableNo,
      restaurantId,
      setRestaurantId,
      placedOrders,
      activeWaiterCall,
      setActiveWaiterCall,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      fetchTableOrders,
      placeOrder,
      triggerWaiterCall,
      checkWaiterCallStatus
    }}>
      {children}
    </CartContext.Provider>
  );
};
