import QRCode from "qrcode";

export const generateQR = async (data) => {
  try {
    return await QRCode.toDataURL(data);
  } catch (error) {
    console.error("QR Code Generation Error:", error);
    return null;
  }
};
