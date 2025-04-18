const QRCode = require("qrcode");

/**
 * Generates a QR code from the provided data
 * @param {string|object} data - Data to encode in the QR code
 * @param {object} options - QR code generation options
 * @returns {Promise<string>} - Data URL of the generated QR code
 */
const generateQR = async (data, options = {}) => {
  try {
    // Convert object to string if needed
    const qrData = typeof data === 'object' ? JSON.stringify(data) : data;
    
    // Default options
    const defaultOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
    
    // Merge default options with provided options
    const qrOptions = { ...defaultOptions, ...options };
    
    // Generate QR code
    return await QRCode.toDataURL(qrData, qrOptions);
  } catch (error) {
    console.error("QR Code Generation Error:", error);
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

module.exports = { generateQR };
