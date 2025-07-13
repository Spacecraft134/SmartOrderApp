import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiDownload,
  FiImage,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
} from "react-icons/fi";

export function PosterEditor() {
  const [poster, setPoster] = useState({
    text: "Welcome to our restaurant!",
    image: null,
    textColor: "#000000",
    bgColor: "#ffffff",
    alignment: "center",
  });

  const textRef = useRef(null);
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);

  const applyFormat = (command) => {
    document.execCommand(command);
    setPoster((prev) => ({ ...prev, text: textRef.current.innerHTML }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Max 5MB image allowed.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () =>
        setPoster((prev) => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!previewRef.current) return;
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        backgroundColor: poster.bgColor,
      });
      const link = document.createElement("a");
      link.download = `poster-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Poster downloaded successfully!");
    } catch (error) {
      toast.error("Failed to generate poster");
      console.error(error);
    }
  };

  const handleAlignmentChange = (align) => {
    setPoster({ ...poster, alignment: align });
  };

  useEffect(() => {
    if (textRef.current) {
      textRef.current.style.textAlign = poster.alignment;
    }
  }, [poster.alignment]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Poster Editor
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Panel */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-700">
            Design Tools
          </h2>

          <div className="space-y-6">
            {/* Text Formatting */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Text Formatting
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => applyFormat("bold")}
                  className={`p-2 rounded-lg ${
                    document.queryCommandState("bold")
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100"
                  }`}
                  title="Bold"
                >
                  <FiBold size={18} />
                </button>
                <button
                  onClick={() => applyFormat("italic")}
                  className={`p-2 rounded-lg ${
                    document.queryCommandState("italic")
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100"
                  }`}
                  title="Italic"
                >
                  <FiItalic size={18} />
                </button>
                <button
                  onClick={() => applyFormat("underline")}
                  className={`p-2 rounded-lg ${
                    document.queryCommandState("underline")
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100"
                  }`}
                  title="Underline"
                >
                  <FiUnderline size={18} />
                </button>
              </div>
            </div>

            {/* Color Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Text Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={poster.textColor}
                    onChange={(e) =>
                      setPoster({ ...poster, textColor: e.target.value })
                    }
                    className="w-10 h-10 cursor-pointer rounded border border-gray-300"
                  />
                  <span className="text-sm text-gray-600">
                    {poster.textColor}
                  </span>
                </div>
              </div>
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Background Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={poster.bgColor}
                    onChange={(e) =>
                      setPoster({ ...poster, bgColor: e.target.value })
                    }
                    className="w-10 h-10 cursor-pointer rounded border border-gray-300"
                  />
                  <span className="text-sm text-gray-600">
                    {poster.bgColor}
                  </span>
                </div>
              </div>
            </div>

            {/* Alignment */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Text Alignment
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAlignmentChange("left")}
                  className={`p-2 rounded-lg ${
                    poster.alignment === "left"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100"
                  }`}
                  title="Left Align"
                >
                  <FiAlignLeft size={18} />
                </button>
                <button
                  onClick={() => handleAlignmentChange("center")}
                  className={`p-2 rounded-lg ${
                    poster.alignment === "center"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100"
                  }`}
                  title="Center Align"
                >
                  <FiAlignCenter size={18} />
                </button>
                <button
                  onClick={() => handleAlignmentChange("right")}
                  className={`p-2 rounded-lg ${
                    poster.alignment === "right"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100"
                  }`}
                  title="Right Align"
                >
                  <FiAlignRight size={18} />
                </button>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Upload Image
              </label>
              <button
                onClick={() => fileInputRef.current.click()}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition"
              >
                <FiImage /> Choose Image
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {poster.image && (
                <p className="mt-2 text-sm text-green-600">
                  Image uploaded successfully!
                </p>
              )}
            </div>

            {/* Download Button */}
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              <FiDownload /> Download Poster
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-700">
            Poster Preview
          </h2>
          <div
            ref={previewRef}
            className="w-full aspect-[3/4] rounded-lg border-2 border-gray-200 overflow-hidden flex flex-col items-center justify-center p-8"
            style={{ backgroundColor: poster.bgColor }}
          >
            {poster.image && (
              <img
                src={poster.image}
                alt="Poster"
                className="max-w-full max-h-[50%] object-contain mb-6"
              />
            )}
            <div
              ref={textRef}
              contentEditable
              onInput={() =>
                setPoster((prev) => ({
                  ...prev,
                  text: textRef.current.innerHTML,
                }))
              }
              className="w-full min-h-[100px] p-4 outline-none text-center"
              style={{
                color: poster.textColor,
                textAlign: poster.alignment,
                fontSize: "1.5rem",
                lineHeight: "1.5",
              }}
              dangerouslySetInnerHTML={{ __html: poster.text }}
            />
          </div>
          <p className="mt-4 text-sm text-gray-500 text-center">
            Note: The downloaded version will be higher quality
          </p>
        </div>
      </div>
    </div>
  );
}
