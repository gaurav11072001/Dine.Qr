import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import LandingPage from './pages/LandingPage';
import MenuPage from './pages/MenuPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import RestaurantLogin from './pages/RestaurantLogin';
import RestaurantDashboard from './pages/RestaurantDashboard';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* Customer Views */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/menu/table/:id" element={<MenuPage />} />
            <Route path="/menu/table/:id/orders" element={<OrderHistoryPage />} />
            <Route path="/menu/restaurant/:restaurantId/table/:tableNo" element={<MenuPage />} />
            <Route path="/menu/restaurant/:restaurantId/table/:tableNo/orders" element={<OrderHistoryPage />} />

            {/* Restaurant Staff/Owner Views */}
            <Route path="/restaurant/login" element={<RestaurantLogin />} />
            <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />

            {/* Super Admin Control Views */}
            <Route path="/superadmin/login" element={<SuperAdminLogin />} />
            <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />

            {/* Legacy Fallback Redirects */}
            <Route path="/admin/login" element={<Navigate to="/restaurant/login" replace />} />
            <Route path="/admin/dashboard" element={<Navigate to="/restaurant/dashboard" replace />} />

            {/* Fallback Catch-all redirection */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
