import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate('/admin/dashboard');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/admin/dashboard');
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-6 selection:bg-black selection:text-white font-sans">
      <div className="w-full max-w-sm border border-neutral-300 p-8 md:p-10 bg-white">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold tracking-widest uppercase">DINE.QR</h1>
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1.5 font-semibold">Staff Control Terminal</p>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-black text-white p-3 text-xs uppercase tracking-wider flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Email Address</label>
            <div className="relative">
              <input
                type="email"
                placeholder="admin@dineqr.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-neutral-300 focus:border-black pl-10 pr-4 py-2.5 text-xs rounded-none focus:outline-none transition-colors"
                required
              />
              <Mail className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Security Password</label>
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
            className="w-full bg-black text-white hover:bg-neutral-900 border border-black py-3 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all mt-4"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Authenticate'
            )}
          </button>
        </form>

        <div className="text-center mt-8">
          <p className="text-[10px] text-neutral-400">
            For credential configuration, consult your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
