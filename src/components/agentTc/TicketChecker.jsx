import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import Header from "../public/Header";
import { getOrderByQR, updateOrderCheckIn } from "../../api";

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
  let zoomLevel = 1.0;
  let zoomInterval = null;

  // Modal when all tickets are already checked in
  const [alreadyCheckedModal, setAlreadyCheckedModal] = useState(false);

  // Success modal after confirm
  const [successModal, setSuccessModal] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState(null);

  // Camera / Scanner
  const scannerRef = useRef(null);
  const qrCodeRegionId = "qr-camera-region";

  // Torch + Camera control
  const [cameraId, setCameraId] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [torchOn, setTorchOn] = useState(false);

  const successSoundRef = useRef(null);

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
      successSoundRef.current.play().catch(() => { });
    }
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };
  const startAutoZoom = () => {
    if (!scannerRef.current) return;

    if (zoomInterval) clearInterval(zoomInterval);

    zoomInterval = setInterval(async () => {
      try {
        zoomLevel = Math.min(zoomLevel + 0.1, 3.0);  // smooth zoom increment
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ zoom: zoomLevel }]
        });
      } catch (err) {
        clearInterval(zoomInterval);
      }
    }, 300);
  };

  // Calculate statistics
  useEffect(() => {
    if (order) {
      const total = order.tickets?.length || 0;
      const checkedIn = order.tickets?.filter(t => t.checkedIn).length || 0;
      setStats({ total, checkedIn, pending: total - checkedIn });
    }
  }, [order]);

  // Initialize camera on first load
  useEffect(() => {
    initCameraList();
  }, []);

  const initCameraList = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      if (devices.length > 0) setCameraId(devices[0].id);
    } catch (err) {
      console.error("Camera fetch error:", err);
    }
  };

  // Start scanner whenever order is cleared
  useEffect(() => {
    if (!order && cameraId) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [order, cameraId]);

  // -------------------------
  // START HTML5QRCODE SCANNER
  // -------------------------
  const startScanner = async () => {
    try {
      if (scannerRef.current) return;

      const html5Qr = new Html5Qrcode(qrCodeRegionId);
      scannerRef.current = html5Qr;

      await html5Qr.start(
        { deviceId: { exact: cameraId } },
        {
          fps: 20,
          disableFlip: false,
          formatsToSupport: [0], // 0 = QR_CODE only
          videoConstraints: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
            focusMode: "continuous",
            advanced: [
              { focusMode: "continuous" },
              { exposureMode: "continuous" },
              { zoom: { ideal: 2 } },
            ],
          },
        },
        (decodedText) => handleScan(decodedText),
        () => { }
      );
    } catch (err) {
      console.error("Camera start error:", err);
      // Fallback: try without advanced constraints
      try {
        const html5Qr = new Html5Qrcode(qrCodeRegionId);
        scannerRef.current = html5Qr;

        await html5Qr.start(
          { facingMode: "environment" },
          { fps: 15, formatsToSupport: [0] },
          (decodedText) => handleScan(decodedText),
          () => { }
        );
      } catch (fallbackErr) {
        console.error("Fallback camera error:", fallbackErr);
      }
    }
  };

  // STOP SCANNER
  const stopScanner = () => {
    try {
      // Stop auto-zoom loop
      if (zoomInterval) {
        clearInterval(zoomInterval);
        zoomInterval = null;
      }

      // Reset zoom level for next scan
      zoomLevel = 1.0;

      // Stop scanner safely
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => { });
        scannerRef.current = null;
      }
    } catch (err) {
      console.error("stopScanner error:", err);
    }
  };

  // -------------------------
  // HANDLE SCAN SUCCESS
  // -------------------------
  const handleScan = async (code) => {
    if (!code || code === scannedCode) return;
    startAutoZoom();
    stopScanner();

    setScannedCode(code);
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await getOrderByQR(code);
      const orderData = res.order || res;

      const allIn = orderData.tickets.every((t) => t.status === "in");
      const someIn = orderData.tickets.some((t) => t.status === "in");

      if (allIn) {
        setAlreadyCheckedModal(true);
        setOrder(null);
        setLoading(false);
        return;
      }

      if (someIn) {
        orderData.tickets = orderData.tickets.map((t) => ({
          ...t,
          locked: t.status === "in",
          checkedIn: t.status === "in",
        }));
      } else {
        orderData.tickets = orderData.tickets.map((t) => ({
          ...t,
          locked: false,
          checkedIn: false,
        }));
      }

      setOrder(orderData);
      playSuccessFeedback();

      setScanHistory((prev) => [
        {
          id: orderData.ID,
          time: new Date().toLocaleTimeString(),
          status: "scanned",
        },
        ...prev.slice(0, 9),
      ]);
    } catch (err) {
      console.error(err);
      setError("Unable to fetch order. Try again.");
    }

    setLoading(false);
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
    if (order.tickets[index].locked) return;
    const updated = { ...order };
    updated.tickets[index].checkedIn = !updated.tickets[index].checkedIn;
    setOrder(updated);
  };

  // Toggle all tickets
  const toggleAll = (checkIn) => {
    const updated = { ...order };
    updated.tickets = updated.tickets.map(t =>
      t.locked ? t : { ...t, checkedIn: checkIn }
    );
    setOrder(updated);
  };

  // Confirm Check-in
  const handleConfirm = async () => {
    // Must check at least ONE editable + checked ticket
    const hasChecked = order.tickets.some(t => t.checkedIn && !t.locked);
    if (!hasChecked) {
      setError("Please select at least one ticket.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Call API
      const response = await updateOrderCheckIn(order);

      // Different backends send different success indicators:
      const isSuccess =
        response?.ok === true ||
        response?.success === true ||
        response?.status === 200;

      if (!isSuccess) {
        throw new Error("API did not return success");
      }

      // Success feedback (sound + vibration)
      playSuccessFeedback();

      // Update scan history
      setScanHistory(prev =>
        prev.map(item =>
          item.id === order.ID ? { ...item, status: "confirmed" } : item
        )
      );

      // Show success modal
      setConfirmedOrderId(order.ID);
      setSuccessModal(true);

      // Clear order & reset inputs
      setOrder(null);
      setScannedCode("");
      setManualCode("");

      // Restart scanner automatically after 500ms
      setTimeout(() => {
        startScanner();
      }, 500);

    } catch (err) {
      console.error(err);
      setError("Failed to update order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle success modal close
  const handleSuccessModalClose = async () => {
    setSuccessModal(false);
    setConfirmedOrderId(null);
    setSuccess(false);

    // Clear UI state
    setOrder(null);
    setScannedCode("");
    setManualCode("");
    setError("");

    // Reset zoom
    zoomLevel = 1.0;
    if (zoomInterval) {
      clearInterval(zoomInterval);
      zoomInterval = null;
    }

    // Stop scanner fully (MUST AWAIT)
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.warn("Scanner stop error:", e);
      }
      scannerRef.current = null;
    }

    // 🔥 This delay is REQUIRED on most Android devices
    setTimeout(() => {
      startScanner(); // now camera starts perfectly
    }, 300);
  };


  // Cancel and rescan
  const handleCancel = () => {
    setOrder(null);
    setScannedCode("");
    setManualCode("");
    setError("");
  };

  // TORCH TOGGLE
  const toggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.warn("Torch not supported");
    }
  };

  // CAMERA SWITCH
  const switchCamera = () => {
    const idx = cameras.findIndex((c) => c.id === cameraId);
    const next = cameras[(idx + 1) % cameras.length];
    setCameraId(next.id);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'scanned': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCheckerBackground = () => ({
    background: 'linear-gradient(45deg, #8d6aacff, #d09dfdff, #e8e8f8, #c8a8ff)',
    backgroundSize: '400% 400%',
    animation: 'sheenEffect 5s ease-in-out infinite'
  });

  return (
    <>
      <Header />
      <div className="min-h-screen p-2 sm:p-4" style={{ paddingTop: '5rem', ...getCheckerBackground() }}>
        <audio ref={successSoundRef} src="data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA..." />

        {/* SUCCESS MODAL - Transaction Complete */}
        {successModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 sm:p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full animate-success-modal">
              <div className="relative mx-auto mb-4 sm:mb-6" style={{ width: "100px", height: "100px" }}>
                <div className="absolute inset-0 bg-green-100 rounded-full animate-pulse-ring"></div>
                <div className="absolute inset-2 bg-green-50 rounded-full"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-check-bounce">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-check-draw" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="absolute inset-0 animate-confetti">
                  <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div className="absolute top-1/4 right-0 w-2 h-2 bg-purple-400 rounded-full"></div>
                  <div className="absolute bottom-1/4 left-0 w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="absolute bottom-0 right-1/4 w-2 h-2 bg-pink-400 rounded-full"></div>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Done!</h2>
              <p className="text-green-600 font-semibold text-base sm:text-lg mb-1">✅ Check-in Successful</p>
              <p className="text-gray-600 text-sm sm:text-base mb-1">Order #{confirmedOrderId}</p>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">Tickets have been verified</p>

              <div className="w-full h-1 bg-gray-200 rounded-full mb-4 sm:mb-6 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full animate-progress-bar"></div>
              </div>

              <button
                onClick={handleSuccessModalClose}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold text-base sm:text-lg hover:brightness-110 transition-all shadow-lg"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* ALL CHECKED-IN MODAL */}
        {alreadyCheckedModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl text-center shadow-xl max-w-sm w-full">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-green-600 text-xl font-semibold">Already Checked-In</h2>
              <p className="text-gray-700 mt-2">All tickets in this order were already checked in.</p>
              <button
                onClick={async () => {
                  setAlreadyCheckedModal(false);
                  setScannedCode("");
                  setOrder(null);

                  // Reset zoom
                  zoomLevel = 1.0;
                  if (zoomInterval) {
                    clearInterval(zoomInterval);
                    zoomInterval = null;
                  }

                  // Stop scanner if still held by device
                  if (scannerRef.current) {
                    await scannerRef.current.stop().catch(() => { });
                    scannerRef.current = null;
                  }

                  // Small delay to ensure camera is released
                  setTimeout(() => {
                    startScanner();   // 🔥 MUST call this manually
                  }, 250);
                }}
                className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-xl hover:bg-purple-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">🎫 Ticket Checker</h1>
                <p className="text-xs sm:text-sm text-gray-600">Scan QR codes to verify tickets</p>
              </div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors text-sm"
              >
                {showHistory ? 'Hide History' : 'Show History'}
              </button>
            </div>

            {/* Quick Stats */}
            {order && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-2 sm:p-3 rounded-xl text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-800">{stats.total}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-2 sm:p-3 rounded-xl text-center">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.checkedIn}</div>
                  <div className="text-xs text-gray-600">Checked In</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-2 sm:p-3 rounded-xl text-center">
                  <div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.pending}</div>
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
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-center text-sm sm:text-base">Scan QR Code</h3>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-purple-600 mb-3"></div>
                  <p className="text-gray-700 font-medium text-sm sm:text-base">Fetching order details...</p>
                </div>
              ) : (
                <>
                  {/* QR Scanner Region */}
                  <div
                    id={qrCodeRegionId}
                    style={{
                      width: "100%",
                      height: "380px",
                      borderRadius: "16px",
                      overflow: "hidden",
                    }}
                  />

                  {/* Torch & Camera Switch */}
                  <div className="flex justify-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                    <button
                      onClick={toggleTorch}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors text-sm"
                    >
                      {torchOn ? "🔦 Off" : "🔦 On"}
                    </button>
                    {cameras.length > 1 && (
                      <button
                        onClick={switchCamera}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors text-sm"
                      >
                        📷 Switch
                      </button>
                    )}
                  </div>

                  <p className="text-center text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4">
                    Point camera at the QR code on the ticket
                  </p>

                  {/* Manual Input Option */}
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                    <p className="text-center text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">Or enter order code manually:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleManualInput()}
                        placeholder="Order code"
                        className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-sm min-w-0"
                      />
                      <button
                        onClick={handleManualInput}
                        className="px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-medium whitespace-nowrap"
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
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 animate-scale-in">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Order #{order.ID}</h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {order.tickets?.[0]?.booking_date
                      ? formatDateFromInt(order.tickets[0].booking_date)
                      : 'Date N/A'}
                  </p>
                </div>
                <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                  {order.order_status || 'N/A'}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 mb-3 sm:mb-4">
                <button
                  onClick={() => toggleAll(true)}
                  className="flex-1 px-2 sm:px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-xs sm:text-sm font-medium"
                >
                  Check All
                </button>
                <button
                  onClick={() => toggleAll(false)}
                  className="flex-1 px-2 sm:px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm font-medium"
                >
                  Uncheck All
                </button>
              </div>

              {/* Tickets List */}
              <div className="space-y-2 mb-4 sm:mb-6 max-h-56 sm:max-h-64 overflow-y-auto">
                {order.tickets?.map((ticket, i) => (
                  <div
                    key={i}
                    onClick={() => toggleCheck(i)}
                    className={`flex justify-between items-center p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${ticket.locked
                      ? "bg-gray-100 border-gray-300 cursor-not-allowed opacity-50"
                      : ticket.checkedIn
                        ? 'bg-green-50 border-green-300'
                        : 'bg-gray-50 border-gray-200 hover:border-purple-300'
                      }`}
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <span className="font-medium text-gray-800 text-sm sm:text-base block truncate">{ticket.title}</span>
                      <span className="text-xs sm:text-sm text-gray-600">#{ticket.id}</span>
                      {ticket.locked && (
                        <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                          Already In
                        </span>
                      )}
                    </div>
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${ticket.checkedIn
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300'
                      }`}>
                      {ticket.checkedIn && (
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:brightness-110 transition-all font-medium shadow-lg disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                      <span className="hidden sm:inline">Updating...</span>
                    </span>
                  ) : (
                    'Confirm'
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
          
          @keyframes success-modal {
            0% { transform: scale(0.5); opacity: 0; }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); opacity: 1; }
          }
          
          @keyframes check-bounce {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); }
          }
          
          @keyframes check-draw {
            0% { stroke-dasharray: 100; stroke-dashoffset: 100; }
            100% { stroke-dasharray: 100; stroke-dashoffset: 0; }
          }
          
          @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.3; }
            100% { transform: scale(1); opacity: 0.5; }
          }
          
          @keyframes confetti {
            0% { transform: scale(0) rotate(0deg); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: scale(1.5) rotate(180deg); opacity: 0; }
          }
          
          @keyframes progress-bar {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          
          .animate-scale-in {
            animation: scale-in 0.3s ease-out;
          }
          
          .animate-success-modal {
            animation: success-modal 0.5s ease-out;
          }
          
          .animate-check-bounce {
            animation: check-bounce 0.6s ease-out 0.2s both;
          }
          
          .animate-check-draw {
            animation: check-draw 0.5s ease-out 0.5s both;
          }
          
          .animate-pulse-ring {
            animation: pulse-ring 1.5s ease-in-out infinite;
          }
          
          .animate-confetti {
            animation: confetti 1s ease-out 0.3s both;
          }
          
          .animate-progress-bar {
            animation: progress-bar 2s ease-out;
          }

          /* QR Scanner styling */
          #qr-camera-region video {
            border-radius: 16px !important;
          }
        `}</style>
      </div>
    </>
  );
}