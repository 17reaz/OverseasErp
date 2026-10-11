
import { useState } from "react";
import { createWorker } from "tesseract.js";

export default function PassportOCR() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFile(file?: File) {
    if (!file) return;

    setLoading(true);
    setText("");

    try {
      const worker = await createWorker("eng");

      const result = await worker.recognize(file);

      setText(result.data.text);

      await worker.terminate();
    } catch (error) {
      console.error("OCR failed:", error);
      setText("OCR করতে সমস্যা হয়েছে। আবার চেষ্টা করো।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {loading && <p>Passport পড়া হচ্ছে...</p>}

      <textarea
        className="w-full min-h-48 border rounded-md p-3"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Extracted passport text এখানে দেখাবে"
      />
    </div>
  );
}
