import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LiveOrders from '../components/LiveOrders';
import ManageDishes from '../components/ManageDishes';
import ManageCategories from '../components/ManageCategories';
import ManageTables from '../components/ManageTables';
import { LogOut, Coffee, Layers, QrCode, Terminal } from 'lucide-react';

export default function RestaurantDashboard() {
  const { user, token, logout, loading } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('orders');
  const navigate = useNavigate();

  // Route security checks
  useEffect(() => {
    if (!loading) {
      if (!token || !user) {
        navigate('/restaurant/login');
      } else if (user.role !== 'restaurant_owner') {
        // If logged in but not owner, redirect to their proper place
        if (user.role === 'superadmin') {
          navigate('/superadmin/dashboard');
        } else {
          logout();
          navigate('/restaurant/login');
        }
      }
    }
  }, [token, user, loading, navigate]);

  if (loading || !token || !user || user.role !== 'restaurant_owner') {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs uppercase tracking-widest font-bold">Verifying credentials...</span>
        </div>
      </div>
    );
  }

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'orders':
        return <LiveOrders />;
      case 'dishes':
        return <ManageDishes />;
      case 'categories':
        return <ManageCategories />;
      case 'tables':
        return <ManageTables />;
      default:
        return <LiveOrders />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-black font-sans flex flex-col selection:bg-black selection:text-white">
      {/* Top Navbar */}
      <header className="bg-black text-white px-6 py-4 flex justify-between items-center z-10 shadow-md">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          <h1 className="text-sm font-bold tracking-widest uppercase">
            {user?.restaurant_name ? `${user.restaurant_name} PANEL` : 'RESTAURANT PORTAL'}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-bold uppercase tracking-wider">{user?.name || 'Staff User'}</span>
            <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-semibold">{user?.role || 'Owner'}</span>
          </div>
          
          <button
            onClick={() => {
              logout();
              navigate('/restaurant/login');
            }}
            className="border border-neutral-800 hover:border-white p-2 text-neutral-400 hover:text-white transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-white border-r border-neutral-200 p-6 flex flex-col gap-2 flex-shrink-0">
          <span className="text-[9px] uppercase tracking-widest font-bold text-neutral-400 mb-3 px-3">Terminal Modules</span>
          
          {/* Live Kitchen */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full text-left px-4 py-3 text-xs uppercase tracking-widest font-bold flex items-center gap-2.5 transition-all border ${
              activeTab === 'orders'
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-500 border-transparent hover:text-black'
            }`}
          >
            <Coffee className="w-4 h-4" /> Kitchen Feed
          </button>

          {/* Dishes */}
          <button
            onClick={() => setActiveTab('dishes')}
            className={`w-full text-left px-4 py-3 text-xs uppercase tracking-widest font-bold flex items-center gap-2.5 transition-all border ${
              activeTab === 'dishes'
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-500 border-transparent hover:text-black'
            }`}
          >
            <Layers className="w-4 h-4" /> Dishes Catalog
          </button>

          {/* Categories */}
          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full text-left px-4 py-3 text-xs uppercase tracking-widest font-bold flex items-center gap-2.5 transition-all border ${
              activeTab === 'categories'
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-500 border-transparent hover:text-black'
            }`}
          >
            <Layers className="w-4 h-4" /> Categories list
          </button>

          {/* Tables / QR */}
          <button
            onClick={() => setActiveTab('tables')}
            className={`w-full text-left px-4 py-3 text-xs uppercase tracking-widest font-bold flex items-center gap-2.5 transition-all border ${
              activeTab === 'tables'
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-500 border-transparent hover:text-black'
            }`}
          >
            <QrCode className="w-4 h-4" /> Tables & QRs
          </button>
        </aside>

        {/* Dynamic Panels */}
        <main className="flex-grow p-6 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full">
          {renderActiveComponent()}
        </main>
      </div>
    </div>
  );
}
