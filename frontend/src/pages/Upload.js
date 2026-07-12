import { useState, useRef } from "react";
import { uploadItem, updateItem } from "../services/api";
import { useNavigate } from "react-router-dom";

const TYPES = ["shirt", "pant", "jacket", "dress", "skirt", "shorts", "sweater", "coat"];
const PATTERNS = ["solid", "striped", "checked", "floral", "printed"];
const SEASONS = ["summer", "winter", "spring", "fall"];

export default function Upload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [edits, setEdits] = useState({});
  const fileRef = useRef();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadItem(file);
      setResult(res.data);
      setEdits({
        type: res.data.type,
        pattern: res.data.pattern,
        primary_color: res.data.primary_color,
        season: res.data.season || [],
      });
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.detail || err.message));
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!result) return;
    await updateItem(result.id, edits);
    navigate("/wardrobe");
  };

  const toggleSeason = (s) => {
    const current = edits.season || [];
    setEdits({
      ...edits,
      season: current.includes(s) ? current.filter((x) => x !== s) : [...current, s],
    });
  };

  return (
    <div className="page upload">
      <h2>Upload Clothing</h2>

      <div className="upload-area" onClick={() => fileRef.current.click()}>
        {preview ? (
          <img src={preview} alt="Preview" className="upload-preview" />
        ) : (
          <div className="upload-placeholder">
            <span className="upload-icon">+</span>
            <p>Click to select a photo</p>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          hidden
        />
      </div>

      {file && !result && (
        <button onClick={handleUpload} className="btn-primary" disabled={uploading}>
          {uploading ? "Analyzing..." : "Upload & Classify"}
        </button>
      )}

      {result && (
        <div className="classification-edit">
          <h3>AI Classification (edit if needed)</h3>

          <label>Type</label>
          <select value={edits.type} onChange={(e) => setEdits({ ...edits, type: e.target.value })}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <label>Pattern</label>
          <select value={edits.pattern} onChange={(e) => setEdits({ ...edits, pattern: e.target.value })}>
            {PATTERNS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          <label>Color</label>
          <input
            type="text"
            value={edits.primary_color || ""}
            onChange={(e) => setEdits({ ...edits, primary_color: e.target.value })}
            placeholder="e.g. navy, black, white"
          />

          <label>Seasons</label>
          <div className="season-toggles">
            {SEASONS.map((s) => (
              <button
                key={s}
                className={`season-btn ${(edits.season || []).includes(s) ? "active" : ""}`}
                onClick={() => toggleSeason(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <button onClick={handleSave} className="btn-primary">Save to Wardrobe</button>
        </div>
      )}
    </div>
  );
}
