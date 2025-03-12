import React, { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import JsBarcode from "jsbarcode";

const BarcodeApp = () => {
    const [scannedBarcodes, setScannedBarcodes] = useState([]);
    const [currentBarcode, setCurrentBarcode] = useState(null);
    const videoRef = useRef(null);
    const codeReader = useRef(null);
    const scanning = useRef(false);

    // Beep sound function
    const playBeep = () => {
        const beep = new Audio("beep.mpeg");
        beep.play();
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
                playBeep(); // Play beep sound
                setScannedBarcodes(prev => [...prev, result.text]);
                setCurrentBarcode(result.text);
            }
        } catch (err) {
            requestAnimationFrame(scanLoop);
        }
    };

    const handleNext = () => {
        setCurrentBarcode(null);
        requestAnimationFrame(scanLoop);
    };

    const handleRemove = () => {
        setScannedBarcodes(prev => prev.filter((_, index) => index !== scannedBarcodes.indexOf(currentBarcode)));
        setCurrentBarcode(null);
        requestAnimationFrame(scanLoop);
    };

    const deleteBarcode = (index) => {
        setScannedBarcodes(prev => prev.filter((_, i) => i !== index));
    };

    useEffect(() => {
        return () => stopScanner();
    }, []);

    useEffect(() => {
        scannedBarcodes.forEach((code, index) => {
            JsBarcode(`#barcode-${index}`, code, {
                format: "CODE128",
                displayValue: false,
                width: 2,
                height: 40,
            });
        });
    }, [scannedBarcodes]);

    return (
        <div className="p-4 flex flex-col items-center">
            <h1 className="text-xl font-bold mb-4">Barcode Scanner</h1>

            <video ref={videoRef} style={{ width: 500, height: 300 }} autoPlay playsInline></video>

            {!scanning.current ? (
                <button onClick={startScanner} className="mt-2 bg-green-500 text-white p-2 rounded">Start Scanning</button>
            ) : (
                <button onClick={stopScanner} className="mt-2 bg-red-500 text-white p-2 rounded">Stop Camera</button>
            )}

            <h2 className="text-lg font-bold mt-4">{(scannedBarcodes.length === 0)? "": scannedBarcodes.length} Scanned Barcodes</h2>
            <ul className="mt-2 border p-2 w-full max-w-md">
                {scannedBarcodes.map((code, index) => (
                    <li key={index} className="p-1 border-b flex flex-col items-center">
                        <span className="font-semibold">{index + 1}. Barcode:</span> {code}
                        <svg id={`barcode-${index}`} className="my-2"></svg>
                        <button onClick={() => deleteBarcode(index)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
                    </li>
                ))}
            </ul>

            {currentBarcode && (
                <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <h2 className="text-2xl font-bold">Scanned Barcode</h2>
                        <p className="mt-2 text-lg">{currentBarcode}</p>
                        <div className="mt-4 flex justify-center gap-4">
                            <button onClick={handleNext} className="bg-blue-500 text-white px-8 py-2 rounded">Add</button>
                            <button onClick={handleRemove} className="bg-red-500 text-white px-4 py-2 rounded">Remove</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BarcodeApp;