import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { ArrowRight, QrCode } from 'lucide-react';

export default function LandingPage() {
  const [tableInput, setTableInput] = useState('');
  const { setTableNo, setRestaurantId } = useContext(CartContext);
  const navigate = useNavigate();

  // Bistro House seeded ID
  const SEEDED_RESTAURANT_ID = '6a18893d192fd2f387686af0';

  const handleSimulate = (e) => {
    e.preventDefault();
    if (!tableInput.trim()) return;
    setTableNo(tableInput.trim());
    setRestaurantId(SEEDED_RESTAURANT_ID);
    navigate(`/menu/restaurant/${SEEDED_RESTAURANT_ID}/table/${tableInput.trim()}`);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-6 md:p-12 selection:bg-white selection:text-black font-sans">
      {/* Header */}
      <div className="flex justify-between items-center w-full">
        <h1 className="text-xl font-bold tracking-widest uppercase">DINE.QR</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/superadmin/login')}
            className="text-[10px] uppercase tracking-widest border border-neutral-900 hover:border-neutral-700 px-3 py-1.5 transition-all text-neutral-400 hover:text-white"
          >
            Superadmin
          </button>
          <button 
            onClick={() => navigate('/restaurant/login')}
            className="text-[10px] uppercase tracking-widest border border-neutral-800 hover:border-white px-4 py-1.5 transition-all font-bold bg-neutral-900"
          >
            Restaurant Staff Login
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-xl mx-auto my-auto py-12 flex flex-col items-start gap-6 animate-slide-up">
        <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-md mb-2">
          <QrCode className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-none uppercase">
          The Digital Dining Experience.
        </h2>
        
        <p className="text-neutral-400 text-sm md:text-base font-light leading-relaxed">
          Welcome to DINE.QR. Scan a table QR code to explore our menu, place orders instantly, and request service directly from your mobile browser.
        </p>

        {/* Simulate Table Scanner */}
        <form onSubmit={handleSimulate} className="w-full flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-grow">
            <input
              type="number"
              placeholder="Enter Table Number (e.g. 1)"
              value={tableInput}
              onChange={(e) => setTableInput(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-white px-4 py-3 text-sm text-white placeholder-neutral-500 rounded-none focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            className="bg-white hover:bg-neutral-200 text-black px-6 py-3 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            Enter Menu <ArrowRight className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
          * Simulates a customer scanning table QR code for "Bistro House"
        </p>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-neutral-500 tracking-wider">
        <p>© 2026 DINE.QR Systems. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
        </div>
      </div>
    </div>
  );
}
