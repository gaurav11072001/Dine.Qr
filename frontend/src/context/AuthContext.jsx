import React, { createContext, useState, useEffect } from 'react';
import api from '../api/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('dineqr_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      const savedUser = localStorage.getItem('dineqr_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      const { token: userToken, user: userData } = response.data;
      
      localStorage.setItem('dineqr_token', userToken);
      localStorage.setItem('dineqr_user', JSON.stringify(userData));
      
      setToken(userToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please verify credentials.'
      };
    }
  };

  const register = async (name, email, password, restaurantName) => {
    try {
      const response = await api.post('/register', {
        name,
        email,
        password,
        restaurant_name: restaurantName
      });
      const { token: userToken, user: userData } = response.data;
      
      localStorage.setItem('dineqr_token', userToken);
      localStorage.setItem('dineqr_user', JSON.stringify(userData));
      
      setToken(userToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('dineqr_token');
    localStorage.removeItem('dineqr_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
