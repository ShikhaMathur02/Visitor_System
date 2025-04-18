import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';

function QRScanner() {
  const [scanResult, setScanResult] = useState(null);
  const [visitorData, setVisitorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const baseUrl =  'http://localhost:5000';

  useEffect(() => {
    // Initialize QR scanner
    const scanner = new Html5QrcodeScanner('qr-reader', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 10,
    });

    // Success callback when QR code is scanned
    const onScanSuccess = async (decodedText) => {
      scanner.clear();
      setScanResult(decodedText);
      
      try {
        setLoading(true);
        // Assuming the QR code contains a visitor ID
        const response = await axios.get(`${baseUrl}/visitors/${decodedText}`);
        setVisitorData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching visitor data:', err);
        setError('Failed to fetch visitor information. Please try again.');
        setLoading(false);
      }
    };

    // Error callback
    const onScanFailure = (error) => {
      console.warn(`QR scan error: ${error}`);
    };

    // Render the scanner
    scanner.render(onScanSuccess, onScanFailure);

    // Clean up on component unmount
    return () => {
      scanner.clear();
    };
  }, [baseUrl]);

  const handleConfirmExit = async () => {
    if (!visitorData) return;
    
    try {
      setLoading(true);
      await axios.post(`${baseUrl}/visitors/confirm-exit`, { 
        phone: visitorData.phone 
      });
      
      setLoading(false);
      alert('Exit confirmed successfully');
      
      // Reset state to scan another QR code
      setScanResult(null);
      setVisitorData(null);
      
      // Reinitialize scanner
      window.location.reload();
    } catch (err) {
      console.error('Error confirming exit:', err);
      setLoading(false);
      setError('Failed to confirm exit. Please try again.');
    }
  };

  return (
    <div className="container">
      <h2>Scan QR Code</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {!scanResult && (
        <div id="qr-reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}></div>
      )}
      
      {loading && <div className="loading">Processing...</div>}
      
      {visitorData && (
        <div className="visitor-info">
          <h3>Visitor Information</h3>
          <p><strong>Name:</strong> {visitorData.name}</p>
          <p><strong>Phone:</strong> {visitorData.phone}</p>
          <p><strong>Purpose:</strong> {visitorData.purpose}</p>
          <p><strong>Entry Time:</strong> {new Date(visitorData.entryTime).toLocaleString()}</p>
          
          {visitorData.exitApproved ? (
            <button 
              onClick={handleConfirmExit}
              className="confirm-btn"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Confirm Exit'}
            </button>
          ) : (
            <div className="warning-message">
              Exit not approved yet. Please request approval first.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QRScanner;
