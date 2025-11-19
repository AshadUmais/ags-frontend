import React, { useState, useRef, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import Header from '../public/Header';
import { getOrderByQR, updateOrderCheckIn } from '../../api';

export default function TicketChecker() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, pending: 0 });
  const [manualCode, setManualCode] = useState("");

  const scannerRef = useRef(null);
  const successSoundRef = useRef(null);
  const qrCodeRegionId = "qr-reader";

  // Format date from integer
  const formatDateFromInt = (dateInt) => {
    const dateStr = dateInt.toString();
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const date = new Date(`${year}-${month}-${day}`);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Play success sound + vibration
  const playSuccessFeedback = () => {
    if (successSoundRef.current) {
      successSoundRef.current.currentTime = 0;
      successSoundRef.current.play().catch(() => {});
    }
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  // Calculate statistics
  useEffect(() => {
    if (order) {
      const total = order.tickets?.length || 0;
      const checkedIn = order.tickets?.filter(t => t.checkedIn).length || 0;
      setStats({ total, checkedIn, pending: total - checkedIn });
    }
  }, [order]);

  // Initialize QR Scanner
  useEffect(() => {
    if (!order && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        qrCodeRegionId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: ['QR_CODE']
        },
        false
      );

      scannerRef.current.render(onScanSuccess, onScanError);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Scanner cleanup error:", err));
        scannerRef.current = null;
      }
    };
  }, [order]);

  // Handle successful QR scan
  const onScanSuccess = (decodedText) => {
    handleScan(decodedText);
  };

  // Handle scan errors (we can ignore these)
  const onScanError = (error) => {
    // Ignore scanning errors - they're normal when no QR code is visible
  };

  // Handle QR Scan
  const handleScan = async (code) => {
    if (!code || code === scannedCode) return;

    const hexCode = code.trim();
    setScannedCode(hexCode);
    setLoading(true);
    setError("");
    setSuccess(false);

    // Stop scanner
    if (scannerRef.current) {
      scannerRef.current.clear().catch(err => console.error("Scanner clear error:", err));
      scannerRef.current = null;
    }

    try {
      const data = await getOrderByQR(hexCode);
      console.log("Fetched order data:", data);
      
      // Handle the response structure - data might have .order or be the order itself
      const orderData = data.order || data;
      
      setOrder(orderData);
      playSuccessFeedback();
      
      // Add to scan history
      setScanHistory(prev => [{
        id: orderData.ID,
        time: new Date().toLocaleTimeString(),
        status: 'scanned'
      }, ...prev.slice(0, 9)]);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch order details. Please try again.");
      setOrder(null);
      setScannedCode("");
    } finally {
      setLoading(false);
    }
  };

  // Manual QR input
  const handleManualInput = async () => {
    if (!manualCode.trim()) {
      setError("Please enter a valid order code");
      return;
    }
    await handleScan(manualCode);
  };

  // Toggle Check-in
  const toggleCheck = (index) => {
    const updated = { ...order };
    updated.tickets[index].checkedIn = !updated.tickets[index].checkedIn;
    setOrder(updated);
  };

  // Toggle all tickets
  const toggleAll = (checkIn) => {
    const updated = { ...order };
    updated.tickets = updated.tickets.map(t => ({ ...t, checkedIn: checkIn }));
    setOrder(updated);
  };

  // Confirm Check-in
  const handleConfirm = async () => {
    try {
      setLoading(true);
      
      // Replace with your API call: await updateOrderCheckIn(scannedCode, order);
      const response = await updateOrderCheckIn(order);

      if (response.ok) {
        setSuccess(true);
        playSuccessFeedback();
        
        // Update history
        setScanHistory(prev => prev.map(item => 
          item.id === order.ID ? { ...item, status: 'confirmed' } : item
        ));
        
        setOrder(null);
        setScannedCode("");
        setManualCode("");

        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        throw new Error('Failed to update');
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Cancel and rescan
  const handleCancel = () => {
    setOrder(null);
    setScannedCode("");
    setManualCode("");
    setError("");
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'scanned':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCheckerBackground = () => {
    return {
      background: 'linear-gradient(45deg, #8d6aacff, #d09dfdff, #e8e8f8, #c8a8ff)',
      backgroundSize: '400% 400%',
      animation: 'sheenEffect 5s ease-in-out infinite'
    };
  };

  return (
    <>
      <Header />
      <div className="min-h-screen p-4" style={{
        paddingTop: '7rem',
        ...getCheckerBackground()
      }}>
        <audio ref={successSoundRef} src="data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA..." />

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">🎫 Ticket Checker</h1>
                <p className="text-sm text-gray-600">Scan QR codes to verify tickets</p>
              </div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors"
              >
                {showHistory ? 'Hide History' : 'Show History'}
              </button>
            </div>

            {/* Quick Stats */}
            {order && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-3 rounded-xl text-center">
                  <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                  <div className="text-xs text-gray-600">Total Tickets</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-xl text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
                  <div className="text-xs text-gray-600">Checked In</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-3 rounded-xl text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                  <div className="text-xs text-gray-600">Pending</div>
                </div>
              </div>
            )}
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-4 animate-scale-in">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-green-600">Check-in Updated!</p>
                  <p className="text-sm text-gray-600">Tickets verified successfully</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-4 border-l-4 border-red-500">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Scan History */}
          {showHistory && scanHistory.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">Recent Scans</h3>
              <div className="space-y-2">
                {scanHistory.map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">Order #{item.id}</span>
                      <span className="text-sm text-gray-600 ml-2">{item.time}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Camera View or Manual Input */}
          {!order && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-4 text-center">Scan QR Code</h3>
              
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-3"></div>
                  <p className="text-gray-700 font-medium">Fetching order details...</p>
                </div>
              ) : (
                <>
                  {/* QR Scanner */}
                  <div id={qrCodeRegionId} className="rounded-xl overflow-hidden"></div>
                  
                  <p className="text-center text-sm text-gray-600 mt-4">
                    Point camera at the QR code on the ticket
                  </p>

                  {/* Manual Input Option */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-center text-sm text-gray-600 mb-3">Or enter order code manually:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleManualInput()}
                        placeholder="Order code or QR value"
                        className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-sm"
                      />
                      <button
                        onClick={handleManualInput}
                        className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Order Details Card */}
          {order && (
            <div className="bg-white rounded-2xl shadow-lg p-6 animate-scale-in">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Order #{order.ID}</h2>
                  <p className="text-sm text-gray-600">
                    {order.tickets?.[0]?.booking_date 
                      ? formatDateFromInt(order.tickets[0].booking_date)
                      : 'Date N/A'}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                  {order.order_status || 'N/A'}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => toggleAll(true)}
                  className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                >
                  Check All In
                </button>
                <button
                  onClick={() => toggleAll(false)}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Uncheck All
                </button>
              </div>

              {/* Tickets List */}
              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                {order.tickets?.map((ticket, i) => (
                  <div
                    key={i}
                    onClick={() => toggleCheck(i)}
                    className={`flex justify-between items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      ticket.checkedIn
                        ? 'bg-green-50 border-green-300'
                        : 'bg-gray-50 border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div>
                      <span className="font-medium text-gray-800">{ticket.title}</span>
                      <span className="text-sm text-gray-600 ml-2">#{ticket.id}</span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      ticket.checkedIn
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300'
                    }`}>
                      {ticket.checkedIn && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:brightness-110 transition-all font-medium shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Updating...
                    </span>
                  ) : (
                    'Confirm Check-in'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes sheenEffect {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes scale-in {
            0% { transform: scale(0.9); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          
          .animate-scale-in {
            animation: scale-in 0.3s ease-out;
          }

          /* Custom styling for html5-qrcode */
          #qr-reader {
            border: none !important;
          }
          
          #qr-reader__dashboard_section_csr {
            border: none !important;
          }
          
          #qr-reader video {
            border-radius: 1rem !important;
            border: 4px solid rgb(216, 180, 254) !important;
          }
          
          #qr-reader__scan_region {
            border-radius: 1rem !important;
          }
        `}</style>
      </div>
    </>
  );
}