import React, { useState, useEffect } from 'react';
import api, { STATIC_BASE_URL } from '../api/api';
import { Plus, Trash2, Printer, Download, QrCode, AlertCircle, ExternalLink } from 'lucide-react';

export default function ManageTables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableNo, setTableNo] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTables = async () => {
    try {
      const response = await api.get('/tables');
      setTables(response.data);
    } catch (err) {
      console.error('Failed to load tables list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!tableNo.trim()) return;

    setErrorMsg('');
    setSubmitting(true);
    try {
      const response = await api.post('/tables', { table_no: tableNo.trim() });
      setTables([...tables, response.data]);
      setTableNo('');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to register table');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTable = async (id, num) => {
    if (!window.confirm(`Are you sure you want to delete Table ${num} and its associated QR code PNG?`)) return;

    try {
      await api.delete(`/tables/${id}`);
      setTables(tables.filter(t => t._id !== id));
    } catch (err) {
      alert('Failed to delete table');
    }
  };

  const handlePrintQR = (table) => {
    const printWindow = window.open('', '_blank');
    const qrImgUrl = `${STATIC_BASE_URL}${table.qr_url}`;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - Table ${table.table_no}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              text-align: center;
              background-color: #fff;
            }
            .container {
              border: 3px solid #000000;
              padding: 40px;
              width: 320px;
              box-shadow: 0 0 10px rgba(0,0,0,0.05);
            }
            h1 {
              font-size: 32px;
              margin: 0 0 8px 0;
              letter-spacing: 3px;
              font-weight: 700;
              color: #000;
            }
            p {
              font-size: 11px;
              color: #666;
              margin: 0 0 35px 0;
              text-transform: uppercase;
              letter-spacing: 2px;
              font-weight: 700;
            }
            img {
              width: 240px;
              height: 240px;
              border: 1px solid #eee;
            }
            .footer {
              margin-top: 35px;
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 3px;
              color: #000;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>TABLE ${table.table_no}</h1>
            <p>Scan to view Menu & Order</p>
            <img src="${qrImgUrl}" alt="QR Code" />
            <div class="footer">DINE.QR SYSTEM</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="py-12 text-center flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Loading tables...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start animate-fade-in">
      
      {/* Create Table Card */}
      <div className="md:col-span-1 border border-neutral-200 p-6 bg-white flex flex-col gap-4">
        <h3 className="text-xs uppercase tracking-widest font-bold border-b border-neutral-100 pb-3 flex items-center gap-1.5">
          <QrCode className="w-4 h-4" /> Register Table
        </h3>
        
        {errorMsg && (
          <div className="bg-black text-white p-3 text-xs uppercase tracking-wider flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleAddTable} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold font-sans">Table Number</label>
            <input
              type="number"
              placeholder="e.g. 4, 12..."
              value={tableNo}
              onChange={(e) => setTableNo(e.target.value)}
              className="bg-white border border-neutral-300 focus:border-black p-2.5 text-xs rounded-none focus:outline-none transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-black hover:bg-neutral-900 border border-black text-white py-2.5 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Register & Generate QR
              </>
            )}
          </button>
        </form>
      </div>

      {/* Tables & QR Display Grid */}
      <div className="md:col-span-2 flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-widest font-bold border-b border-neutral-200 pb-3">
          Restaurant Tables List ({tables.length})
        </h2>

        {tables.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-neutral-200">
            <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold">No tables registered yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tables.map((table) => (
              <div
                key={table._id}
                className="border border-neutral-200 p-4 bg-white flex flex-col gap-4 hover:border-black transition-colors"
              >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Table {table.table_no}</span>
                  <a
                    href={table.redirect_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[9px] text-neutral-400 hover:text-black uppercase tracking-wider font-semibold flex items-center gap-1 transition-colors"
                  >
                    View Menu <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* QR Display */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-neutral-50 border border-neutral-200 p-1 flex-shrink-0 flex items-center justify-center">
                    <img
                      src={`${STATIC_BASE_URL}${table.qr_url}`}
                      alt={`Table ${table.table_no} QR`}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex flex-col gap-2 w-full">
                    {/* Print Button */}
                    <button
                      onClick={() => handlePrintQR(table)}
                      className="border border-black text-black hover:bg-neutral-50 text-[9px] uppercase tracking-widest font-bold py-1.5 px-3 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print QR Tag
                    </button>

                    {/* Download Button */}
                    <a
                      href={`${STATIC_BASE_URL}${table.qr_url}`}
                      download={`table_${table.table_no}_qr.png`}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-neutral-200 text-neutral-500 hover:border-black hover:text-black text-[9px] uppercase tracking-widest font-bold py-1.5 px-3 flex items-center justify-center gap-1.5 transition-colors text-center"
                    >
                      <Download className="w-3.5 h-3.5" /> Download PNG
                    </a>
                  </div>
                </div>

                {/* Delete Area */}
                <div className="flex justify-end pt-2 border-t border-neutral-100">
                  <button
                    onClick={() => handleDeleteTable(table._id, table.table_no)}
                    className="text-neutral-400 hover:text-red-700 text-[9px] uppercase tracking-wider font-bold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Delete Table
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
