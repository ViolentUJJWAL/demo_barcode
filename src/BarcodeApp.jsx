import React, { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import JsBarcode from "jsbarcode";

const BarcodeApp = () => {
  const [orderId, setOrderId] = useState("A7fG2E9XkB");
  const [barcode, setBarcode] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [scanResult, setScanResult] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const videoRef = useRef(null);
  const codeReader = useRef(null);
  const scanning = useRef(false);

  // Generate Barcode
  const generateBarcode = () => {
    if (!orderId) return;
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, orderId, { format: "CODE128" });
    setBarcode(canvas.toDataURL());
  };

  // Print Barcode
  const printBarcode = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            body { text-align: center; margin: 40px; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <h2>Order ID: ${orderId}</h2>
          <img src="${barcode}" alt="Barcode" />
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    // printWindow.document.close();
  };

  // Start Barcode Scanner
  const startScanner = async () => {
    if (!videoRef.current) return;

    codeReader.current = new BrowserMultiFormatReader();
    scanning.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      videoRef.current.srcObject = stream;
      requestAnimationFrame(scanLoop);
    } catch (error) {
      console.error("Camera error:", error);
    }
  };

  // Stop Camera
  const stopScanner = () => {
    scanning.current = false;
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Continuous Scan Loop
  const scanLoop = async () => {
    if (!scanning.current || !codeReader.current) return;

    try {
      const result = await codeReader.current.decodeOnceFromVideoDevice(undefined, videoRef.current);
      if (result) {
        setScannedCode(result.text);
        const isVerified = result.text === orderId;
        setScanResult(
          isVerified
            ? { msg: "✅ Order Verified Successfully!", result: true }
            : { msg: "❌ Invalid Order Barcode!", result: false }
        );

        if (isVerified) {
          stopScanner();
          setShowPopup(true);
        } else {
          setTimeout(() => requestAnimationFrame(scanLoop), 500);
        }
      }
    } catch (err) {
      requestAnimationFrame(scanLoop);
    }
  };

  // Restart Camera
  const restartScanner = () => {
    setScannedCode("");
    setScanResult("");
    setShowPopup(false);
    startScanner();
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="text-xl font-bold mb-4">Fast Barcode Scanner</h1>

      <input
        type="text"
        placeholder="Enter Order ID"
        value={orderId}
        onChange={(e) => setOrderId(e.target.value)}
        className="border p-2 rounded mb-2"
      />
      <button onClick={generateBarcode} className="bg-blue-500 text-white p-2 rounded">Generate Barcode</button>
      {barcode && (
        <>
          <img height={200} width={400} src={barcode} alt="Generated Barcode" className="mt-2" />
          <button onClick={printBarcode} className="mt-2 bg-gray-500 text-white p-2 rounded">Print Barcode</button>
        </>
      )}

      <h2 className="text-lg font-bold mt-4">Scan Barcode</h2>
      <video ref={videoRef} style={{ width: 500, height: 300 }} autoPlay playsInline></video>

      {!scanning.current ? (
        <button onClick={startScanner} className="mt-2 bg-green-500 text-white p-2 rounded">Start Scanning</button>
      ) : (
        <button onClick={stopScanner} className="mt-2 bg-red-500 text-white p-2 rounded">Stop Camera</button>
      )}

      {scannedCode && (
        <div className="mt-4">
          <p>Scanned Code: <strong>{scannedCode}</strong></p>
          <p className={`font-bold ${scanResult?.result ? "text-green-500" : "text-red-500"}`}>{scanResult?.msg}</p>
        </div>
      )}

      {showPopup && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold text-green-600">✅ Verified Successfully!</h2>
            <p className="mt-2">The barcode matches the order.</p>
            <button onClick={restartScanner} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Restart Scanner</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeApp;