import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import api from '../api/api';
import { ArrowLeft, Clock, RefreshCw, CheckCircle, ChefHat, Bell, Receipt } from 'lucide-react';

export default function OrderHistoryPage() {
  const { restaurantId: paramRestaurantId, tableNo: paramTableNo, id: legacyId } = useParams();
  const restaurantId = paramRestaurantId || '6a18893d192fd2f387686af0';
  const routeTableId = paramTableNo || legacyId;

  const { 
    tableNo, 
    setTableNo, 
    placedOrders, 
    fetchTableOrders, 
    triggerWaiterCall 
  } = useContext(CartContext);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [billRequesting, setBillRequesting] = useState(false);
  const [billStatus, setBillStatus] = useState('');

  const tableNum = routeTableId || tableNo;

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTableOrders(tableNum, restaurantId);
    setRefreshing(false);
  };

  useEffect(() => {
    if (tableNum && restaurantId) {
      setTableNo(tableNum);
      const loadOrders = async () => {
        setLoading(true);
        await fetchTableOrders(tableNum, restaurantId);
        setLoading(false);
      };
      loadOrders();

      // Poll every 12 seconds for status updates from the kitchen
      const interval = setInterval(() => {
        fetchTableOrders(tableNum, restaurantId);
      }, 12000);
      return () => clearInterval(interval);
    }
  }, [tableNum, restaurantId]);

  const handleRequestBill = async () => {
    setBillRequesting(true);
    // Trigger service call to pager
    const res = await triggerWaiterCall();
    setBillRequesting(false);
    if (res.success) {
      setBillStatus('Bill requested! Staff will bring your printed check shortly.');
      setTimeout(() => setBillStatus(''), 8000);
    }
  };

  // Sum all non-cancelled orders
  const activeOrders = placedOrders.filter(order => order.status !== 'Cancelled');
  const totalBillAmount = activeOrders.reduce((sum, order) => sum + order.total_price, 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return 'border border-neutral-300 text-neutral-500 bg-white';
      case 'Preparing':
        return 'border border-black text-black bg-neutral-50 font-semibold';
      case 'Served':
        return 'bg-black text-white border border-black font-semibold';
      case 'Completed':
        return 'bg-neutral-100 text-neutral-400 border border-neutral-200';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'border border-neutral-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs uppercase tracking-widest font-bold">Loading Order History...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col pb-12 selection:bg-black selection:text-white">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex justify-between items-center z-30">
        <Link
          to={`/menu/restaurant/${restaurantId}/table/${tableNum}`}
          className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold hover:text-neutral-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Menu
        </Link>
        <div className="text-center">
          <h1 className="text-sm font-bold tracking-widest uppercase">Order Status</h1>
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold">Table {tableNum}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="border border-neutral-200 p-2 hover:border-black transition-colors"
          title="Refresh status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-grow p-6 max-w-2xl mx-auto w-full flex flex-col gap-6 animate-fade-in">
        {billStatus && (
          <div className="bg-black text-white p-4 text-xs uppercase tracking-wider text-center font-bold">
            {billStatus}
          </div>
        )}

        {placedOrders.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-neutral-200 flex flex-col items-center justify-center gap-3">
            <Clock className="w-8 h-8 text-neutral-300" />
            <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold">No orders placed yet</p>
            <Link
              to={`/menu/restaurant/${restaurantId}/table/${tableNum}`}
              className="bg-black text-white px-5 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-800 transition-all mt-2"
            >
              Order Dishes
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Orders Feed */}
            <div className="flex flex-col gap-4">
              {placedOrders.map((order, idx) => (
                <div key={order._id} className="border border-neutral-200 p-5 bg-white">
                  <div className="flex justify-between items-center border-b border-neutral-100 pb-3 mb-3">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
                      Order #{placedOrders.length - idx} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`text-[9px] uppercase tracking-widest py-0.5 px-2 font-bold ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="flex flex-col gap-2">
                    {order.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex justify-between items-center text-xs">
                        <span className="text-neutral-600">
                          {item.name} <strong className="text-black font-semibold">x{item.quantity}</strong>
                        </span>
                        <span className="font-bold">₹{item.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="mt-3 bg-neutral-50 p-2.5 border border-neutral-100 text-[10px] text-neutral-500 leading-normal">
                      <strong>Chef Note:</strong> {order.notes}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-100 text-xs font-bold uppercase tracking-wide">
                    <span>Order Total:</span>
                    <span>₹{order.total_price.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bill Summary Section */}
            <div className="border border-black p-6 bg-white flex flex-col gap-4">
              <h3 className="text-xs uppercase tracking-widest font-bold flex items-center gap-1.5 border-b border-neutral-200 pb-3">
                <Receipt className="w-4 h-4" /> Cumulative Table Bill
              </h3>

              <div className="flex flex-col gap-2.5 text-xs">
                {placedOrders.map((order, idx) => {
                  if (order.status === 'Cancelled') return null;
                  return (
                    <div key={order._id} className="flex justify-between items-center text-neutral-500">
                      <span>Order #{placedOrders.length - idx} ({order.status})</span>
                      <span>₹{order.total_price.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest border-t border-black pt-4">
                <span>Grand Total:</span>
                <span>₹{totalBillAmount.toFixed(2)}</span>
              </div>

              <button
                onClick={handleRequestBill}
                disabled={billRequesting}
                className="w-full bg-black text-white hover:bg-neutral-900 border border-black py-3 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all mt-2"
              >
                {billRequesting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Bell className="w-4 h-4" /> Request Physical Bill
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
