import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, ShieldAlert } from 'lucide-react';

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (token && user) {
      if (user.role === 'superadmin') {
        navigate('/superadmin/dashboard');
      } else if (user.role === 'restaurant_owner') {
        navigate('/restaurant/dashboard');
      }
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    const res = await login(email.trim(), password);
    setLoading(false);

    if (res.success) {
      navigate('/superadmin/dashboard');
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 selection:bg-white selection:text-black font-sans">
      <div className="w-full max-w-sm border border-neutral-800 p-8 md:p-10 bg-neutral-950">
        {/* Title */}
        <div className="text-center mb-8 flex flex-col items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-white" />
          <div>
            <h1 className="text-xl font-bold tracking-widest uppercase">DINE.QR</h1>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1.5 font-semibold">Platform Administration</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-white text-black p-3 text-xs uppercase tracking-wider flex items-center gap-2 font-bold animate-fade-in">
            <AlertCircle className="w-4 h-4 text-black flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Root Credentials</label>
            <div className="relative">
              <input
                type="email"
                placeholder="superadmin@dineqr.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-white pl-10 pr-4 py-2.5 text-xs rounded-none focus:outline-none transition-colors text-white"
                required
              />
              <Mail className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Master Password</label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-white pl-10 pr-4 py-2.5 text-xs rounded-none focus:outline-none transition-colors text-white"
                required
              />
              <Lock className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-neutral-200 text-black py-3 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all mt-4 border border-white"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Verify & Access'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
