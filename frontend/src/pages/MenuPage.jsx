import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import api, { STATIC_BASE_URL } from '../api/api';
import { Search, ShoppingBag, X, Plus, Minus, Bell, ClipboardList, Info, HelpCircle } from 'lucide-react';

export default function MenuPage() {
  const { restaurantId: paramRestaurantId, tableNo: paramTableNo, id: legacyId } = useParams();
  const restaurantId = paramRestaurantId || '6a18893d192fd2f387686af0';
  const routeTableId = paramTableNo || legacyId;

  const {
    tableNo,
    setTableNo,
    restaurantId: cartRestaurantId,
    setRestaurantId,
    cartItems,
    addToCart,
    updateQuantity,
    cartTotal,
    cartCount,
    placeOrder,
    triggerWaiterCall,
    activeWaiterCall,
    checkWaiterCallStatus
  } = useContext(CartContext);

  const [restaurantName, setRestaurantName] = useState('DineQR');
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activeDishDetails, setActiveDishDetails] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [chefNotes, setChefNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [waiterCallLoading, setWaiterCallLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [orderSuccessMessage, setOrderSuccessMessage] = useState('');

  // Handle setting table ID and restaurant ID from route params
  useEffect(() => {
    if (routeTableId) {
      setTableNo(routeTableId);
      checkWaiterCallStatus(routeTableId);
    }
    if (restaurantId) {
      setRestaurantId(restaurantId);
    }
  }, [routeTableId, restaurantId]);

  // Load restaurant metadata, categories, and menu dishes
  useEffect(() => {
    if (!restaurantId) return;
    
    const loadMenu = async () => {
      try {
        const [restRes, catRes, dishRes] = await Promise.all([
          api.get(`/restaurants/${restaurantId}`),
          api.get(`/categories?restaurant_id=${restaurantId}`),
          api.get(`/menu?restaurant_id=${restaurantId}`)
        ]);
        setRestaurantName(restRes.data.name);
        setCategories(catRes.data);
        setDishes(dishRes.data);
      } catch (err) {
        console.error('Failed to load menu data', err);
        setErrorMessage('Could not load menu. Please scan QR again.');
      } finally {
        setLoading(false);
      }
    };
    loadMenu();
  }, [restaurantId]);

  const handleCallWaiter = async () => {
    setWaiterCallLoading(true);
    const res = await triggerWaiterCall();
    setWaiterCallLoading(false);
    if (!res.success) {
      alert(res.message);
    }
  };

  const handlePlaceOrder = async () => {
    setSubmittingOrder(true);
    setErrorMessage('');
    const res = await placeOrder(chefNotes);
    setSubmittingOrder(false);
    if (res.success) {
      setChefNotes('');
      setCartOpen(false);
      setOrderSuccessMessage('Order placed successfully! Sending to the kitchen...');
      setTimeout(() => setOrderSuccessMessage(''), 5000);
    } else {
      setErrorMessage(res.message);
    }
  };

  // Filter dishes by search and category
  const filteredDishes = dishes.filter((dish) => {
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dish.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || dish.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs uppercase tracking-widest font-bold">Loading Menu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col pb-24 relative selection:bg-black selection:text-white">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex justify-between items-center z-30">
        <div>
          <h1 className="text-lg font-bold tracking-widest uppercase">{restaurantName}</h1>
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold">Table {tableNo || routeTableId || '—'}</p>
        </div>
        
        {tableNo && restaurantId && (
          <Link
            to={`/menu/restaurant/${restaurantId}/table/${tableNo}/orders`}
            className="flex items-center gap-1.5 border border-black px-3 py-1.5 text-xs uppercase tracking-widest font-bold hover:bg-black hover:text-white transition-all"
          >
            <ClipboardList className="w-4 h-4" />
            My Orders
          </Link>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-grow p-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
        {/* Success Alert */}
        {orderSuccessMessage && (
          <div className="bg-black text-white p-4 border border-black text-xs uppercase tracking-wider text-center animate-fade-in font-bold">
            {orderSuccessMessage}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search for delicious dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-neutral-300 focus:border-black pl-10 pr-4 py-3 text-sm rounded-none focus:outline-none transition-colors"
          />
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-neutral-100 pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 text-xs uppercase tracking-widest font-bold transition-all border whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-black border-black text-white'
                : 'bg-white border-neutral-200 text-neutral-500 hover:text-black hover:border-black'
            }`}
          >
            All Menu
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id)}
              className={`px-4 py-2 text-xs uppercase tracking-widest font-bold transition-all border whitespace-nowrap ${
                selectedCategory === cat._id
                  ? 'bg-black border-black text-white'
                  : 'bg-white border-neutral-200 text-neutral-500 hover:text-black hover:border-black'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Dishes list */}
        {filteredDishes.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-neutral-200">
            <HelpCircle className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
            <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold">No dishes found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDishes.map((dish) => {
              const cartItem = cartItems.find((item) => item._id === dish._id);
              const qty = cartItem ? cartItem.quantity : 0;

              return (
                <div
                  key={dish._id}
                  className="border border-neutral-200 p-4 flex gap-4 hover:border-black transition-colors animate-fade-in bg-white"
                >
                  {/* Image */}
                  <div 
                    onClick={() => setActiveDishDetails(dish)}
                    className="w-24 h-24 bg-neutral-100 flex-shrink-0 border border-neutral-200 cursor-pointer overflow-hidden relative group"
                  >
                    {dish.image ? (
                      <img
                        src={`${STATIC_BASE_URL}${dish.image}`}
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-50">
                        <Info className="w-5 h-5 text-neutral-300" />
                      </div>
                    )}
                    {!dish.available && (
                      <div className="absolute inset-0 bg-white/85 flex items-center justify-center">
                        <span className="text-[9px] uppercase tracking-widest font-bold text-neutral-500 bg-neutral-100 border border-neutral-300 px-1 py-0.5">Out</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div className="cursor-pointer" onClick={() => setActiveDishDetails(dish)}>
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold uppercase tracking-wide line-clamp-1">{dish.name}</h3>
                        <span className="text-xs font-bold">₹{dish.price.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">{dish.description}</p>
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
                        {dish.available ? 'Available' : 'Unavailable'}
                      </span>

                      {dish.available && (
                        qty > 0 ? (
                          <div className="flex items-center border border-black bg-white">
                            <button
                              onClick={() => updateQuantity(dish._id, -1)}
                              className="px-2.5 py-1 text-xs hover:bg-neutral-100 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold min-w-[20px] text-center">{qty}</span>
                            <button
                              onClick={() => updateQuantity(dish._id, 1)}
                              className="px-2.5 py-1 text-xs hover:bg-neutral-100 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(dish)}
                            className="bg-black text-white hover:bg-neutral-900 border border-black px-3.5 py-1 text-[10px] uppercase tracking-widest font-bold transition-all"
                          >
                            Add
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Waiter Call Button */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={handleCallWaiter}
          disabled={waiterCallLoading}
          className={`h-12 w-12 rounded-full border flex items-center justify-center shadow-lg transition-all ${
            activeWaiterCall
              ? 'bg-black text-white border-black animate-pulse-subtle'
              : 'bg-white text-black border-neutral-200 hover:border-black'
          }`}
          title={activeWaiterCall ? "Waiter Called" : "Call Waiter"}
        >
          {waiterCallLoading ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Bell className="w-5 h-5" />
          )}
        </button>
        {activeWaiterCall && (
          <div className="absolute left-14 top-3 bg-black text-white text-[9px] uppercase tracking-widest font-bold py-1 px-2 border border-black whitespace-nowrap shadow-md">
            Waiter is coming!
          </div>
        )}
      </div>

      {/* Sticky Bottom Cart Banner */}
      {cartCount() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-neutral-800 flex justify-between items-center z-40 max-w-4xl mx-auto shadow-2xl animate-slide-up">
          <div className="text-white">
            <p className="text-xs uppercase tracking-widest font-bold">{cartCount()} Item{cartCount() > 1 ? 's' : ''}</p>
            <p className="text-sm font-semibold tracking-wide">₹{cartTotal().toFixed(2)}</p>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="bg-white hover:bg-neutral-200 text-black px-6 py-2.5 text-xs uppercase tracking-widest font-bold flex items-center gap-2 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" /> View Cart
          </button>
        </div>
      )}

      {/* Dish Details Modal */}
      {activeDishDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white border border-neutral-300 w-full max-w-md flex flex-col relative animate-slide-up">
            <button
              onClick={() => setActiveDishDetails(null)}
              className="absolute right-4 top-4 bg-white/95 border border-neutral-200 hover:border-black p-1.5 transition-colors z-10"
            >
              <X className="w-4 h-4 text-black" />
            </button>

            {/* Dish Image */}
            <div className="w-full h-64 bg-neutral-100 border-b border-neutral-200 overflow-hidden relative">
              {activeDishDetails.image ? (
                <img
                  src={`${STATIC_BASE_URL}${activeDishDetails.image}`}
                  alt={activeDishDetails.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Info className="w-8 h-8 text-neutral-300" />
                </div>
              )}
            </div>

            {/* Details Content */}
            <div className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start gap-4">
                <h2 className="text-base font-bold uppercase tracking-wider">{activeDishDetails.name}</h2>
                <span className="text-base font-bold">₹{activeDishDetails.price.toFixed(2)}</span>
              </div>
              
              <p className="text-xs text-neutral-500 leading-relaxed font-light">
                {activeDishDetails.description || 'No description available for this dish.'}
              </p>

              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
                  Availability: {activeDishDetails.available ? 'In Stock' : 'Out of stock'}
                </span>

                {activeDishDetails.available && (
                  (() => {
                    const cartItem = cartItems.find((item) => item._id === activeDishDetails._id);
                    const qty = cartItem ? cartItem.quantity : 0;
                    return qty > 0 ? (
                      <div className="flex items-center border border-black bg-white">
                        <button
                          onClick={() => updateQuantity(activeDishDetails._id, -1)}
                          className="px-2.5 py-1 text-xs hover:bg-neutral-100 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold min-w-[20px] text-center">{qty}</span>
                        <button
                          onClick={() => updateQuantity(activeDishDetails._id, 1)}
                          className="px-2.5 py-1 text-xs hover:bg-neutral-100 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(activeDishDetails)}
                        className="bg-black text-white hover:bg-neutral-900 border border-black px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-all"
                      >
                        Add to Cart
                      </button>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
          <div className="bg-white border-l border-neutral-300 w-full max-w-md flex flex-col animate-slide-up h-full">
            {/* Drawer Header */}
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest">Your Order Basket</h2>
                <p className="text-[9px] text-neutral-500 uppercase tracking-widest mt-0.5">Table {tableNo}</p>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="border border-neutral-200 hover:border-black p-1.5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-4">
              {cartItems.map((item) => (
                <div key={item._id} className="flex justify-between items-center border-b border-neutral-100 pb-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide">{item.name}</h4>
                    <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">₹{item.price.toFixed(2)} each</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                    <div className="flex items-center border border-black">
                      <button
                        onClick={() => updateQuantity(item._id, -1)}
                        className="px-2 py-0.5 text-xs hover:bg-neutral-100 transition-colors"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="px-2 text-xs font-bold min-w-[16px] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item._id, 1)}
                        className="px-2 py-0.5 text-xs hover:bg-neutral-100 transition-colors"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Chef Notes */}
              <div className="mt-4 flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Special Instructions for Chef</label>
                <textarea
                  placeholder="e.g. Extra spicy, no onions, gluten-free..."
                  value={chefNotes}
                  onChange={(e) => setChefNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-neutral-300 focus:border-black p-3 text-xs focus:outline-none transition-colors rounded-none resize-none"
                />
              </div>

              {errorMessage && (
                <div className="bg-red-50 text-red-700 text-xs border border-red-200 p-3 text-center uppercase tracking-wide">
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Cart Footer Checkout */}
            <div className="p-6 border-t border-neutral-200 bg-neutral-50 flex flex-col gap-4">
              <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest">
                <span>Total Amount:</span>
                <span>₹{cartTotal().toFixed(2)}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={submittingOrder}
                className="w-full bg-black text-white hover:bg-neutral-900 border border-black py-3 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all"
              >
                {submittingOrder ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Place Order & Send to Kitchen'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
