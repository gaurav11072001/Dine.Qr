import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, User, Building } from 'lucide-react';

export default function RestaurantLogin() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register, token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (token && user) {
      if (user.role === 'restaurant_owner') {
        navigate('/restaurant/dashboard');
      } else if (user.role === 'superadmin') {
        navigate('/superadmin/dashboard');
      }
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (isRegister) {
      if (!name.trim() || !email.trim() || !password.trim() || !restaurantName.trim()) {
        setErrorMsg('Please fill in all fields.');
        return;
      }
      setLoading(true);
      const res = await register(name.trim(), email.trim(), password, restaurantName.trim());
      setLoading(false);
      if (res.success) {
        navigate('/restaurant/dashboard');
      } else {
        setErrorMsg(res.message);
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setErrorMsg('Please fill in all fields.');
        return;
      }
      setLoading(true);
      const res = await login(email.trim(), password);
      setLoading(false);
      if (res.success) {
        navigate('/restaurant/dashboard');
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-6 selection:bg-black selection:text-white font-sans">
      <div className="w-full max-w-sm border border-neutral-300 p-8 md:p-10 bg-white">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold tracking-widest uppercase">DINE.QR</h1>
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1.5 font-semibold">
            {isRegister ? 'Register Your Restaurant' : 'Restaurant Portal'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-black text-white p-3 text-xs uppercase tracking-wider flex items-center gap-2 font-bold animate-fade-in">
            <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <>
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold">Your Name</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-neutral-300 focus:border-black pl-10 pr-4 py-2.5 text-xs rounded-none focus:outline-none transition-colors"
                    required
                  />
                  <User className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                </div>
              </div>

              {/* Restaurant Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold">Restaurant Name</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Bistro House"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full bg-white border border-neutral-300 focus:border-black pl-10 pr-4 py-2.5 text-xs rounded-none focus:outline-none transition-colors"
                    required
                  />
                  <Building className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold">Email Address</label>
            <div className="relative">
              <input
                type="email"
                placeholder="owner@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-neutral-300 focus:border-black pl-10 pr-4 py-2.5 text-xs rounded-none focus:outline-none transition-colors"
                required
              />
              <Mail className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold">Security Password</label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-neutral-300 focus:border-black pl-10 pr-4 py-2.5 text-xs rounded-none focus:outline-none transition-colors"
                required
              />
              <Lock className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white hover:bg-neutral-900 border border-black py-3 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all mt-3"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              isRegister ? 'Register & Access Portal' : 'Authenticate'
            )}
          </button>
        </form>

        {/* Toggle View */}
        <div className="text-center mt-6 pt-6 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg('');
            }}
            className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 hover:text-black transition-colors"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register Restaurant"}
          </button>
        </div>
      </div>
    </div>
  );
}
