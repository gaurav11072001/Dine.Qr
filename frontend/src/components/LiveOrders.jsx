import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Clock, Bell, Check, RotateCcw, AlertTriangle, Coffee, Play, CheckCircle } from 'lucide-react';

export default function LiveOrders() {
  const [orders, setOrders] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastOrdersCount, setLastOrdersCount] = useState(0);
  const [lastCallsCount, setLastCallsCount] = useState(0);

  // Play a premium synth beep alert
  const playNotificationSound = (pitch = 440) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(pitch, audioCtx.currentTime); // Hz
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);

      oscillator.start();
      // Ramp down volume smoothly
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn("Audio notification not allowed by browser autoplay policy yet.", e);
    }
  };

  const loadData = async (isFirstLoad = false) => {
    try {
      const [ordersRes, callsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/calls')
      ]);

      const freshOrders = ordersRes.data;
      const freshCalls = callsRes.data.filter(c => c.status === 'Active');

      if (!isFirstLoad) {
        // Trigger alert sound if new orders are added
        if (freshOrders.length > lastOrdersCount) {
          playNotificationSound(587.33); // D5 pitch
        }
        // Trigger high pitched double beep for waiter call
        if (freshCalls.length > lastCallsCount) {
          playNotificationSound(880); // A5 pitch
          setTimeout(() => playNotificationSound(880), 150);
        }
      }

      setOrders(freshOrders);
      setCalls(callsRes.data); // Keep all calls (we can sort solved ones)
      setLastOrdersCount(freshOrders.length);
      setLastCallsCount(freshCalls.length);
    } catch (err) {
      console.error('Failed to poll dashboard data', err);
    } finally {
      if (isFirstLoad) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(() => {
      loadData(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [lastOrdersCount, lastCallsCount]);

  const updateOrderStatus = async (orderId, nextStatus) => {
    try {
      await api.put(`/orders/${orderId}`, { status: nextStatus });
      loadData(false);
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  const handleResolveCall = async (callId) => {
    try {
      await api.put(`/calls/${callId}`);
      loadData(false);
    } catch (err) {
      alert('Failed to resolve waiter call');
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled');
  const activeWaiterCalls = calls.filter(c => c.status === 'Active');

  if (loading) {
    return (
      <div className="py-12 text-center flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Loading live boards...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
      
      {/* Live Orders Feed */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
          <h2 className="text-xs uppercase tracking-widest font-bold flex items-center gap-2">
            <Coffee className="w-4 h-4" /> Live Kitchen Orders ({activeOrders.length})
          </h2>
          <span className="text-[9px] uppercase bg-black text-white px-2 py-0.5 tracking-wider font-bold animate-pulse-subtle">
            Realtime AutoSync
          </span>
        </div>

        {activeOrders.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-neutral-200">
            <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold">No active orders right now</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {activeOrders.map((order) => (
              <div key={order._id} className="border border-neutral-200 p-5 bg-white hover:border-neutral-400 transition-colors">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-neutral-100 pb-3 mb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-black">Table {order.table_no}</h3>
                    <p className="text-[9px] text-neutral-400 mt-0.5">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>

                  <span className={`text-[9px] uppercase tracking-widest py-0.5 px-2.5 border font-semibold ${
                    order.status === 'Pending' 
                      ? 'border-neutral-300 text-neutral-400 bg-white' 
                      : order.status === 'Preparing' 
                        ? 'border-black bg-neutral-50 text-black' 
                        : 'bg-black text-white border-black'
                  }`}>
                    {order.status}
                  </span>
                </div>

                {/* Items */}
                <div className="flex flex-col gap-2 mb-4">
                  {order.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex justify-between items-center text-xs">
                      <span className="text-neutral-600">
                        {item.name} <strong className="text-black">x{item.quantity}</strong>
                      </span>
                      <span className="font-semibold">₹{item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="bg-neutral-50 border border-neutral-200 p-2.5 text-[10px] text-neutral-500 mb-4 leading-normal">
                    <strong>Instructions:</strong> {order.notes}
                  </div>
                )}

                {/* Footer Controls */}
                <div className="flex flex-wrap gap-2 justify-between items-center pt-3 border-t border-neutral-100">
                  <span className="text-xs font-bold">Total: ₹{order.total_price.toFixed(2)}</span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => updateOrderStatus(order._id, 'Cancelled')}
                      className="border border-neutral-200 hover:border-black text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 transition-colors"
                    >
                      Reject
                    </button>

                    {order.status === 'Pending' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'Preparing')}
                        className="bg-black hover:bg-neutral-900 border border-black text-white text-[9px] uppercase tracking-widest font-bold px-4.5 py-1.5 transition-colors flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" /> Start Preparing
                      </button>
                    )}

                    {order.status === 'Preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'Served')}
                        className="bg-black hover:bg-neutral-900 border border-black text-white text-[9px] uppercase tracking-widest font-bold px-4.5 py-1.5 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark Served
                      </button>
                    )}

                    {order.status === 'Served' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'Completed')}
                        className="bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-black text-[9px] uppercase tracking-widest font-bold px-4.5 py-1.5 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Waiter Calls Section */}
      <div className="flex flex-col gap-6">
        <h2 className="text-xs uppercase tracking-widest font-bold border-b border-neutral-200 pb-3 flex items-center gap-2">
          <Bell className="w-4 h-4" /> Service Requests ({activeWaiterCalls.length})
        </h2>

        {activeWaiterCalls.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-200 bg-neutral-50/50">
            <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold">No calling tables</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeWaiterCalls.map((call) => (
              <div 
                key={call._id} 
                className="bg-black text-white border border-black p-4 flex justify-between items-center shadow-lg animate-pulse-subtle"
              >
                <div>
                  <h4 className="text-sm font-bold tracking-widest uppercase">Table {call.table_no}</h4>
                  <p className="text-[9px] text-neutral-400 uppercase tracking-widest mt-1">
                    Requested: {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <button
                  onClick={() => handleResolveCall(call._id)}
                  className="bg-white hover:bg-neutral-200 text-black text-[9px] uppercase tracking-widest font-bold px-3 py-2 flex items-center gap-1 transition-colors"
                >
                  <Check className="w-3 h-3" /> Dismiss
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Resolved Calls logs (small list) */}
        {calls.filter(c => c.status === 'Resolved').length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-[9px] uppercase tracking-widest font-bold text-neutral-400">Recently Dismissed</span>
            <div className="max-h-40 overflow-y-auto border border-neutral-200 p-3 bg-neutral-50 flex flex-col gap-2">
              {calls.filter(c => c.status === 'Resolved').slice(0, 5).map((c) => (
                <div key={c._id} className="flex justify-between items-center text-[10px] text-neutral-400">
                  <span>Table {c.table_no}</span>
                  <span className="italic">Served</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
