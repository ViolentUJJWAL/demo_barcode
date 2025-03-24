import React, { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import JsBarcode from "jsbarcode";

const BarcodeApp = () => {
    const [scannedBarcodes, setScannedBarcodes] = useState([]);
    const [currentBarcode, setCurrentBarcode] = useState(null);
    const [scanningCurrent, setScanningCurrent] = useState(false);
    const [manualInput, setManualInput] = useState("");
    const videoRef = useRef(null);
    const codeReader = useRef(null);
    const scanning = useRef(false);
    const inputBuffer = useRef("");

    const playBeep = () => {
        const beep = new Audio("beep.mpeg");
        beep.play();
    };

    const startScanner = async () => {
        if (!videoRef.current) return;

        codeReader.current = new BrowserMultiFormatReader();
        setScanningCurrent(true);
        scanning.current = true;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 500 },
                    height: { ideal: 200 },
                    focusMode: "continuous"
                },
            });

            videoRef.current.srcObject = stream;
            requestAnimationFrame(scanLoop);
        } catch (error) {
            console.error("Camera error:", error);
        }
    };

    const stopScanner = () => {
        scanning.current = false;
        setScanningCurrent(false);
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        if (codeReader.current) {
            codeReader.current.reset();
        }
    };

    const scanLoop = async () => {
        if (!scanning.current || !codeReader.current || !videoRef.current) return;

        try {
            const result = await codeReader.current.decodeOnceFromVideoDevice(undefined, videoRef.current);

            if (result) {
                // Check for duplicate barcode
                if (scannedBarcodes.includes(result.text)) {
                    alert(`Duplicate barcode detected: ${result.text}`);
                } else {
                    playBeep();
                    addBarcode(result.text);
                }

                // Pause scanning for 1 second to prevent multiple detections
                scanning.current = false;
                setTimeout(() => {
                    scanning.current = true;
                    if (scanning.current) requestAnimationFrame(scanLoop);
                }, 1000);
            }
        } catch (err) {
            if (scanning.current) requestAnimationFrame(scanLoop);
        }
    };


    const addBarcode = (barcode) => {
        if (!scannedBarcodes.includes(barcode)) {
            setScannedBarcodes(prev => [...prev, barcode]);
            setCurrentBarcode(barcode);
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

    const handleBarcodeReaderInput = (event) => {
        if (event.key === "Enter") {
            if (inputBuffer.current) {
                addBarcode(inputBuffer.current);
                inputBuffer.current = "";
            }
        } else {
            inputBuffer.current += event.key;
        }
    };

    const handleManualSubmit = () => {
        if (manualInput.trim()) {
            addBarcode(manualInput.trim());
            setManualInput("");
        }
    };

    useEffect(() => {
        window.addEventListener("keydown", handleBarcodeReaderInput);
        return () => {
            window.removeEventListener("keydown", handleBarcodeReaderInput);
            stopScanner();
        };
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

            <div className="relative">
                <video
                    ref={videoRef}
                    style={{ width: "100%", height: "100%" }}
                    autoPlay
                    playsInline
                ></video>

                {/* Horizontal and vertical center lines */}
                {scanningCurrent && (
                    <>
                        {/* Horizontal line */}
                        <div
                            className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 opacity-70"
                            style={{ transform: "translateY(-50%)" }}
                        ></div>

                        {/* Vertical line */}
                        {/* <div
              className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-red-500 opacity-70"
              style={{ transform: "translateX(-50%)" }}
            ></div> */}

                        {/* Optional: Central targeting box */}
                        <div
                            className="absolute top-1/2 left-1/2 w-64 h-30 border-2 border-blue-500 opacity-50"
                            style={{ transform: "translate(-50%, -50%)" }}
                        ></div>
                    </>
                )}
            </div>

            {!scanningCurrent ? (
                <button onClick={startScanner} className="mt-2 bg-green-500 text-white p-2 rounded">Start Scanning</button>
            ) : (
                <button onClick={stopScanner} className="mt-2 bg-red-500 text-white p-2 rounded">Stop Camera</button>
            )}

            <div className="mt-4">
                <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Enter barcode manually"
                    className="p-2 border rounded"
                />
                <button onClick={handleManualSubmit} className="ml-2 bg-blue-500 text-white p-2 rounded">Add</button>
            </div>

            <h2 className="text-lg font-bold mt-4">{scannedBarcodes.length} Scanned Barcodes</h2>
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