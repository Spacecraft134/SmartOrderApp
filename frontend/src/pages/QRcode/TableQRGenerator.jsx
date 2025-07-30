import { useState, useRef, useCallback } from "react";
import QRCode from "react-qr-code";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";
import { SketchPicker } from "react-color";
import { motion, AnimatePresence } from "framer-motion";

export function TableQRGenerator() {
  const baseUrl = "http://localhost:5173/customerOrder?table=";
  const [numTables, setNumTables] = useState(10);
  const [generated, setGenerated] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customDesign, setCustomDesign] = useState({
    logo: null,
    title: "Table QR Code",
    subtitle: "Scan to order",
    backgroundColor: "#ffffff",
    qrColor: "#000000",
    textColor: "#000000",
    borderColor: "#e2e8f0",
    showTableNumber: true,
  });
  const [downloadingAll, setDownloadingAll] = useState(false);

  const qrRefs = useRef({});

  const handleGenerated = () => setGenerated(true);

  const handleNumTablesChange = (e) => {
    const value = Math.min(Math.max(1, Number(e.target.value)), 100);
    setNumTables(value);
  };
  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    for (let num of tableNumbers) {
      const node = qrRefs.current[num];
      if (!node) continue;
      try {
        const dataUrl = await toPng(node, {
          quality: 1,
          pixelRatio: 2,
        });
        saveAs(dataUrl, `table-${num}-qr.png`);
      } catch (err) {
        console.error(`QR download failed for table ${num}`, err);
      }
    }
    setDownloadingAll(false);
  };
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomDesign((prev) => ({
          ...prev,
          logo: event.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const tableNumbers = Array.from({ length: numTables }, (_, i) => i + 1);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          QR Code Generator
        </h1>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Tables
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={numTables}
              onChange={handleNumTablesChange}
              className="border border-gray-300 px-4 py-2 rounded-lg w-full sm:w-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleGenerated}
              disabled={generated}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                generated
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              }`}
            >
              Generate
            </button>

            {generated && (
              <button
                onClick={() => setIsCustomizing(true)}
                className="px-5 py-2.5 rounded-lg font-medium bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all"
              >
                Customize Design
              </button>
            )}

            {generated && (
              <button
                onClick={handleDownloadAll}
                disabled={downloadingAll}
                className={`px-5 py-2.5 rounded-lg font-medium ${
                  downloadingAll
                    ? "bg-gray-300 text-gray-600 cursor-wait"
                    : "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                }`}
              >
                {downloadingAll ? "Downloading..." : "Download All"}
              </button>
            )}

            <button
              onClick={() => {
                setGenerated(false);
                setNumTables(10);
              }}
              className="px-5 py-2.5 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white shadow-sm transition-all"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {generated && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {tableNumbers.map((num) => (
            <div
              key={num}
              ref={(el) => (qrRefs.current[num] = el)}
              className="border border-gray-200 p-4 rounded-lg text-center bg-white"
              style={{
                backgroundColor: customDesign.backgroundColor,
                borderColor: customDesign.borderColor,
                color: customDesign.textColor,
              }}
            >
              {customDesign.logo && (
                <img
                  src={customDesign.logo}
                  alt="Logo"
                  className="w-16 h-16 mx-auto mb-2 object-contain"
                />
              )}
              <h3 className="text-lg font-semibold mb-1">
                {customDesign.title}
              </h3>
              <p className="text-sm mb-3">{customDesign.subtitle}</p>

              <QRCode
                value={`${baseUrl}${num}`}
                size={128}
                level="H"
                className="w-full h-auto mx-auto"
                fgColor={customDesign.qrColor}
                bgColor="transparent"
              />

              {customDesign.showTableNumber && (
                <p className="mt-3 font-medium">Table #{num}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isCustomizing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setIsCustomizing(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4">
                Customize QR Code Design
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={customDesign.title}
                      onChange={(e) =>
                        setCustomDesign({
                          ...customDesign,
                          title: e.target.value,
                        })
                      }
                      className="border p-2 rounded w-full"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={customDesign.subtitle}
                      onChange={(e) =>
                        setCustomDesign({
                          ...customDesign,
                          subtitle: e.target.value,
                        })
                      }
                      className="border p-2 rounded w-full"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Upload Logo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="border p-2 rounded w-full"
                    />
                    {customDesign.logo && (
                      <button
                        onClick={() =>
                          setCustomDesign({ ...customDesign, logo: null })
                        }
                        className="mt-2 text-sm text-red-500 hover:text-red-700"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className=" text-sm font-medium mb-1 flex items-center">
                      <input
                        type="checkbox"
                        checked={customDesign.showTableNumber}
                        onChange={(e) =>
                          setCustomDesign({
                            ...customDesign,
                            showTableNumber: e.target.checked,
                          })
                        }
                        className="mr-2"
                      />
                      Show Table Number
                    </label>
                  </div>
                </div>

                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Background Color
                    </label>
                    <SketchPicker
                      color={customDesign.backgroundColor}
                      onChangeComplete={(color) =>
                        setCustomDesign({
                          ...customDesign,
                          backgroundColor: color.hex,
                        })
                      }
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      QR Code Color
                    </label>
                    <SketchPicker
                      color={customDesign.qrColor}
                      onChangeComplete={(color) =>
                        setCustomDesign({ ...customDesign, qrColor: color.hex })
                      }
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Text Color
                    </label>
                    <SketchPicker
                      color={customDesign.textColor}
                      onChangeComplete={(color) =>
                        setCustomDesign({
                          ...customDesign,
                          textColor: color.hex,
                        })
                      }
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Border Color
                    </label>
                    <SketchPicker
                      color={customDesign.borderColor}
                      onChangeComplete={(color) =>
                        setCustomDesign({
                          ...customDesign,
                          borderColor: color.hex,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsCustomizing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsCustomizing(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply Design
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
