import { useState, useRef } from "react";
import { toast } from "react-toastify";

export function AnnouncementBannerEditor() {
  const [bannerText, setBannerText] = useState(
    "Welcome! Check out our special holiday offers!"
  );
  const [bannerImage, setBannerImage] = useState(null); // URL or base64
  const [bannerVisible, setBannerVisible] = useState(true);
  const [textColor, setTextColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#fde68a"); // light yellow
  const textRef = useRef(null);

  // Handle image upload and preview
  const onImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setBannerImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Basic formatting commands for the contenteditable div
  const applyFormat = (command) => {
    document.execCommand(command, false, null);
    setBannerText(textRef.current.innerHTML);
  };

  const handleTextChange = () => {
    setBannerText(textRef.current.innerHTML);
  };

  const handleSave = () => {
    // Here you would send bannerText, bannerImage, textColor, bgColor, and bannerVisible to your backend
    toast.success("Announcement banner saved!");
  };

  const handleClearImage = () => setBannerImage(null);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Announcement Banner Editor</h2>

      <div className="max-w-xl space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block mb-2 font-semibold">
            Banner Image (optional):
          </label>
          <input type="file" accept="image/*" onChange={onImageChange} />
          {bannerImage && (
            <div className="mt-2 relative inline-block">
              <img
                src={bannerImage}
                alt="Banner Preview"
                className="max-w-full h-48 object-contain rounded border"
              />
              <button
                onClick={handleClearImage}
                className="absolute top-1 right-1 bg-red-600 text-white rounded px-2 py-1 hover:bg-red-800"
                aria-label="Remove banner image"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Text Color */}
        <div>
          <label className="block mb-2 font-semibold">Text Color:</label>
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="w-12 h-10 cursor-pointer"
          />
        </div>

        {/* Background Color */}
        <div>
          <label className="block mb-2 font-semibold">Background Color:</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="w-12 h-10 cursor-pointer"
          />
        </div>

        {/* Show/Hide */}
        <div>
          <label className="inline-flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              checked={bannerVisible}
              onChange={() => setBannerVisible((v) => !v)}
            />
            Show Banner
          </label>
        </div>

        {/* Rich Text Editor */}
        <div>
          <label className="block mb-2 font-semibold">Banner Text:</label>
          <div className="mb-2 space-x-2">
            <button
              type="button"
              onClick={() => applyFormat("bold")}
              className="border px-2 py-1 rounded hover:bg-gray-200"
              title="Bold"
            >
              <b>B</b>
            </button>
            <button
              type="button"
              onClick={() => applyFormat("italic")}
              className="border px-2 py-1 rounded hover:bg-gray-200"
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              onClick={() => applyFormat("underline")}
              className="border px-2 py-1 rounded hover:bg-gray-200"
              title="Underline"
            >
              <u>U</u>
            </button>
            <button
              type="button"
              onClick={() => applyFormat("removeFormat")}
              className="border px-2 py-1 rounded hover:bg-gray-200"
              title="Clear formatting"
            >
              Clear
            </button>
          </div>
          <div
            ref={textRef}
            contentEditable
            onInput={handleTextChange}
            className="border rounded p-3 min-h-[100px] focus:outline-none"
            style={{ color: textColor }}
            dangerouslySetInnerHTML={{ __html: bannerText }}
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Save Banner
        </button>
      </div>

      {/* Preview */}
      {bannerVisible && (
        <div
          className="mt-10 p-6 rounded-lg font-semibold"
          style={{ backgroundColor: bgColor, color: textColor }}
        >
          {bannerImage && (
            <img
              src={bannerImage}
              alt="Banner"
              className="max-w-full mb-4 object-contain rounded"
            />
          )}
          <div dangerouslySetInnerHTML={{ __html: bannerText }} />
        </div>
      )}
    </div>
  );
}
