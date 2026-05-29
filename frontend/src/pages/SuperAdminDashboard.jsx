import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';
import { LogOut, Shield, Activity, Users, BarChart3, RefreshCw, Layers, ShoppingBag, Bell } from 'lucide-react';

export default function SuperAdminDashboard() {
  const { user, token, logout, loading } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('registry');
  const [restaurants, setRestaurants] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // Route security checks
  useEffect(() => {
    if (!loading) {
      if (!token || !user) {
        navigate('/superadmin/login');
      } else if (user.role !== 'superadmin') {
        if (user.role === 'restaurant_owner') {
          navigate('/restaurant/dashboard');
        } else {
          logout();
          navigate('/superadmin/login');
        }
      }
    }
  }, [token, user, loading, navigate]);

  // Load Registry & Activity
  const loadDashboardData = async () => {
    if (!token || user?.role !== 'superadmin') return;
    try {
      setRefreshing(true);
      const [restRes, actRes] = await Promise.all([
        api.get('/restaurants'),
        api.get('/activity')
      ]);
      setRestaurants(restRes.data);
      setActivityFeed(actRes.data);
    } catch (err) {
      console.error('Failed to load superadmin monitor data', err);
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token && user?.role === 'superadmin') {
      loadDashboardData();
      
      // Auto-poll activity feed every 8 seconds
      const interval = setInterval(async () => {
        try {
          const actRes = await api.get('/activity');
          setActivityFeed(actRes.data);
        } catch (err) {
          console.error('Failed to poll activity', err);
        }
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [token, user]);

  if (loading || !token || !user || user.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs uppercase tracking-widest font-bold">Verifying root privileges...</span>
        </div>
      </div>
    );
  }

  // Calculate totals for Platform Stats
  const totalRestaurants = restaurants.length;
  const totalDishesListed = restaurants.reduce((sum, r) => sum + (r.stats?.dishes || 0), 0);
  const totalOrdersPlaced = restaurants.reduce((sum, r) => sum + (r.stats?.orders || 0), 0);
  const activeWaiterCalls = restaurants.reduce((sum, r) => sum + (r.stats?.active_calls || 0), 0);

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col selection:bg-white selection:text-black">
      {/* Top Header */}
      <header className="bg-black border-b border-neutral-900 px-6 py-4 flex justify-between items-center z-10 shadow-md">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-neutral-400 animate-pulse" />
          <div>
            <h1 className="text-xs font-bold tracking-widest uppercase text-white">DINE.QR ROOT METRICS</h1>
            <p className="text-[9px] text-neutral-500 uppercase tracking-widest font-semibold">Superadmin Console</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={loadDashboardData}
            disabled={refreshing}
            className="border border-neutral-900 hover:border-neutral-700 p-2 text-neutral-400 hover:text-white transition-colors"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => {
              logout();
              navigate('/superadmin/login');
            }}
            className="border border-neutral-900 hover:border-neutral-700 p-2 text-neutral-400 hover:text-white transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Panel */}
      <div className="flex-grow flex flex-col md:flex-row">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-black border-r border-neutral-900 p-6 flex flex-col gap-2 flex-shrink-0">
          <span className="text-[9px] uppercase tracking-widest font-bold text-neutral-600 mb-3 px-3">System Monitor</span>
          
          {/* Tab 1: Registry */}
          <button
            onClick={() => setActiveTab('registry')}
            className={`w-full text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2.5 transition-all border ${
              activeTab === 'registry'
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-neutral-500 border-transparent hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Users className="w-4 h-4" /> Restaurant Directory
          </button>

          {/* Tab 2: Activity Feed */}
          <button
            onClick={() => setActiveTab('activity')}
            className={`w-full text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2.5 transition-all border ${
              activeTab === 'activity'
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-neutral-500 border-transparent hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Activity className="w-4 h-4" /> Live Platform Activity
          </button>

          {/* Tab 3: Stats */}
          <button
            onClick={() => setActiveTab('stats')}
            className={`w-full text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2.5 transition-all border ${
              activeTab === 'stats'
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-neutral-500 border-transparent hover:text-white hover:bg-neutral-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Global Performance
          </button>
        </aside>

        {/* Contents Area */}
        <main className="flex-grow p-6 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full">
          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">Querying platform registry...</span>
            </div>
          ) : (
            <>
              {/* Tab 1: Directory */}
              {activeTab === 'registry' && (
                <div className="flex flex-col gap-6 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-neutral-900 pb-4">
                    <div>
                      <h2 className="text-base font-bold uppercase tracking-wider">Restaurants Registry</h2>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Tenant verification & database storage statistics</p>
                    </div>
                  </div>

                  <div className="border border-neutral-900 bg-neutral-950 overflow-x-auto rounded-none">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-neutral-900 text-neutral-500 uppercase tracking-wider text-[9px] font-bold bg-black">
                          <th className="p-4">Restaurant</th>
                          <th className="p-4">Owner Email</th>
                          <th className="p-4">Registered Date</th>
                          <th className="p-4 text-center">Dishes Count</th>
                          <th className="p-4 text-center">Orders Placed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {restaurants.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="p-8 text-center text-neutral-600 uppercase tracking-wider">No tenants found.</td>
                          </tr>
                        ) : (
                          restaurants.map((rest) => (
                            <tr key={rest.id} className="border-b border-neutral-900 hover:bg-neutral-900 transition-colors">
                              <td className="p-4 font-bold uppercase tracking-wider text-white">{rest.name}</td>
                              <td className="p-4 text-neutral-400 font-mono">{rest.owner_email}</td>
                              <td className="p-4 text-neutral-400">
                                {rest.created_at ? new Date(rest.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                              </td>
                              <td className="p-4 text-center text-white font-semibold">{rest.stats?.dishes || 0}</td>
                              <td className="p-4 text-center text-white font-semibold">{rest.stats?.orders || 0}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 2: Activity */}
              {activeTab === 'activity' && (
                <div className="flex flex-col gap-6 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-neutral-900 pb-4">
                    <div>
                      <h2 className="text-base font-bold uppercase tracking-wider">Live Platform Activity</h2>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Real-time orders and service calls streaming from all locations</p>
                    </div>
                    <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-1 bg-neutral-900 text-neutral-400 animate-pulse">Live Polling</span>
                  </div>

                  <div className="flex flex-col gap-3.5">
                    {activityFeed.length === 0 ? (
                      <div className="text-center py-20 border border-dashed border-neutral-900">
                        <Activity className="w-6 h-6 text-neutral-700 mx-auto mb-2" />
                        <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Waiting for active orders or calls...</p>
                      </div>
                    ) : (
                      activityFeed.map((item) => (
                        <div
                          key={item.id}
                          className="border border-neutral-900 bg-neutral-950 p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3.5 hover:border-neutral-700 transition-colors animate-fade-in"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 border border-neutral-800 bg-black flex-shrink-0">
                              {item.type === 'order' ? (
                                <ShoppingBag className="w-4 h-4 text-white" />
                              ) : (
                                <Bell className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] uppercase tracking-widest font-bold text-white bg-neutral-900 px-2 py-0.5">
                                  {item.restaurant_name}
                                </span>
                                <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
                                  Table {item.table_no}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-400 mt-1 font-light">
                                {item.type === 'order' ? (
                                  <>Placed an order with <strong className="text-white font-semibold">{item.items_count} dish{item.items_count > 1 ? 'es' : ''}</strong></>
                                ) : (
                                  <>Requested immediate waiter service</>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex sm:flex-col justify-between items-end gap-1 flex-shrink-0">
                            {item.type === 'order' ? (
                              <span className="text-xs font-bold text-white">₹{item.total_price?.toFixed(2)}</span>
                            ) : null}
                            <div className="flex gap-2 items-center">
                              <span className="text-[9px] font-mono text-neutral-500">
                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                              <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border font-semibold ${
                                item.status === 'Pending' || item.status === 'Active'
                                  ? 'border-white text-white font-bold animate-pulse-subtle'
                                  : 'border-neutral-900 text-neutral-600 bg-neutral-900'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Stats */}
              {activeTab === 'stats' && (
                <div className="flex flex-col gap-6 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-neutral-900 pb-4">
                    <div>
                      <h2 className="text-base font-bold uppercase tracking-wider">Global Performance</h2>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Aggregated software performance and utilization metrics</p>
                    </div>
                  </div>

                  {/* Stat Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="border border-neutral-900 bg-neutral-950 p-6 flex flex-col gap-1.5 hover:border-neutral-700 transition-colors">
                      <Users className="w-5 h-5 text-neutral-500" />
                      <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold">Total Tenants</span>
                      <span className="text-2xl font-bold tracking-tight text-white">{totalRestaurants}</span>
                    </div>

                    <div className="border border-neutral-900 bg-neutral-950 p-6 flex flex-col gap-1.5 hover:border-neutral-700 transition-colors">
                      <Layers className="w-5 h-5 text-neutral-500" />
                      <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold">Dishes Listed</span>
                      <span className="text-2xl font-bold tracking-tight text-white">{totalDishesListed}</span>
                    </div>

                    <div className="border border-neutral-900 bg-neutral-950 p-6 flex flex-col gap-1.5 hover:border-neutral-700 transition-colors">
                      <ShoppingBag className="w-5 h-5 text-neutral-500" />
                      <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold">Total Orders</span>
                      <span className="text-2xl font-bold tracking-tight text-white">{totalOrdersPlaced}</span>
                    </div>

                    <div className="border border-neutral-900 bg-neutral-950 p-6 flex flex-col gap-1.5 hover:border-neutral-700 transition-colors">
                      <Bell className="w-5 h-5 text-neutral-500" />
                      <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold">Paging Alerts</span>
                      <span className="text-2xl font-bold tracking-tight text-white">{activeWaiterCalls} Active</span>
                    </div>
                  </div>

                  <div className="border border-neutral-900 bg-black p-6 flex flex-col gap-3">
                    <h3 className="text-xs uppercase tracking-widest font-bold text-white border-b border-neutral-900 pb-3">SaaS Security Architecture</h3>
                    <p className="text-xs text-neutral-400 leading-relaxed font-light">
                      This super administrator dashboard operates strictly in <strong className="text-white">READ-ONLY</strong> mode. Security tokens generated for root access contain a claim hierarchy enabling global querying of the restaurants registry, system stats, and live telemetry, but enforce absolute database immutability: **no database modifications are permitted** from this root terminal context. Restaurant data isolation is guaranteed by database index-level logical separation.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
