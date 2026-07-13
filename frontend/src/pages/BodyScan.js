import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const GUEST_SCAN_LIMIT = 3;

const INSTRUCTIONS = [
  { icon: "1", title: "Wear a simple t-shirt & jeans", desc: "Avoid coats, jackets, or layered outfits. A plain fitted t-shirt and jeans work best for accurate try-on results." },
  { icon: "2", title: "Stand straight", desc: "Face the camera, arms slightly away from your body, feet shoulder-width apart." },
  { icon: "3", title: "Full body in frame", desc: "Make sure your entire body is visible — from head to toe. Step back if needed." },
  { icon: "4", title: "Good lighting", desc: "Well-lit room, no harsh shadows. Plain background works best." },
  { icon: "5", title: "Camera at eye level", desc: "Place camera at chest/eye level, about 6-8 feet away. Use a timer or ask someone." },
];

const OCCASIONS = [
  { id: "casual", label: "Casual", desc: "Everyday wear, relaxed outfits" },
  { id: "smart_casual", label: "Smart Casual", desc: "Polished yet relaxed" },
  { id: "office", label: "Office", desc: "Professional work attire" },
  { id: "formal", label: "Formal", desc: "Events, dinners, occasions" },
  { id: "party", label: "Party", desc: "Night out, celebrations" },
  { id: "date", label: "Date Night", desc: "Impressive, stylish looks" },
];

export default function BodyScan() {
  const { user, setUser, isGuest } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [step, setStep] = useState("instructions");
  const [scanAttempts, setScanAttempts] = useState(() => {
    const saved = localStorage.getItem("bodyScanAttempts");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [results, setResults] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editMeasurements, setEditMeasurements] = useState({});
  const [gender, setGender] = useState("Men");
  const [saving, setSaving] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState("");

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setErrors([]);
      setWarnings([]);
      setResults(null);
      setStep("uploading");
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    if (isGuest && scanAttempts >= GUEST_SCAN_LIMIT) {
      setStep("signup");
      return;
    }

    setStep("validating");

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await api.post("/api/analysis/body", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res.data;

      if (!data.success) {
        setErrors(data.errors || []);
        setWarnings(data.warnings || []);
        setStep("error");
      } else {
        setResults(data);
        setWarnings(data.warnings || []);
        setEditMeasurements(data.measurements);
        // Save body photo file to localStorage as smaller base64
        const canvas = document.createElement("canvas");
        const img = new window.Image();
        img.onload = () => {
          // Resize to max 512px width to keep localStorage small
          const maxW = 512;
          const scale = Math.min(1, maxW / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          const small = canvas.toDataURL("image/jpeg", 0.7);
          localStorage.setItem("bodyPhoto", small);
        };
        img.src = preview;
        if (!isGuest) {
          setUser({ ...user, measurements: data.measurements, body_type: data.body_type });
        }
        if (isGuest) {
          const newCount = scanAttempts + 1;
          setScanAttempts(newCount);
          localStorage.setItem("bodyScanAttempts", newCount.toString());
        }
        setStep("results");
      }
    } catch (err) {
      setErrors([err.response?.data?.detail || "Analysis failed. Please try again."]);
      setStep("error");
    }
  };

  const handleEditChange = (key, value) => {
    setEditMeasurements({ ...editMeasurements, [key]: parseFloat(value) || 0 });
  };

  const handleSaveEdits = async () => {
    setSaving(true);
    try {
      if (!isGuest) {
        await api.post("/api/analysis/measurements", { ...editMeasurements, gender });
        setUser({ ...user, measurements: { ...editMeasurements, gender } });
      }
      setStep("occasion");
    } catch {}
    setSaving(false);
  };

  const handleContinueToOccasion = () => {
    setStep("occasion");
  };

  const handleOccasionSelect = (occasionId) => {
    setSelectedOccasion(occasionId);
  };

  const handleShopWithOccasion = () => {
    navigate(`/shop${selectedOccasion ? `?usage=${selectedOccasion === "casual" ? "Casual" : selectedOccasion === "office" ? "Formal" : selectedOccasion === "formal" ? "Formal" : "Casual"}` : ""}`);
  };

  const handleRetake = () => {
    setStep("instructions");
    setFile(null);
    setPreview(null);
    setErrors([]);
    setWarnings([]);
    setResults(null);
  };

  return (
    <div className="bodyscan-page">
      <div className="cart-hero">
        <h1>Body Scan</h1>
        <p>Upload a full-body photo to get your measurements</p>
        {isGuest && (
          <p style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "0.5rem" }}>
            {GUEST_SCAN_LIMIT - scanAttempts} free {GUEST_SCAN_LIMIT - scanAttempts === 1 ? "scan" : "scans"} remaining
            &nbsp;·&nbsp;<Link to="/register" style={{ color: "inherit", textDecoration: "underline" }}>Sign up for unlimited</Link>
          </p>
        )}
      </div>

      <div className="page">
        {/* INSTRUCTIONS */}
        {step === "instructions" && (
          <div className="scan-instructions">
            <h3>How to take the perfect photo</h3>
            <div className="instruction-grid">
              {INSTRUCTIONS.map((inst) => (
                <div key={inst.icon} className="instruction-card">
                  <div className="instruction-icon">{inst.icon}</div>
                  <h4>{inst.title}</h4>
                  <p>{inst.desc}</p>
                </div>
              ))}
            </div>
            <div className="scan-gender">
              <label>I'm shopping for:</label>
              <div className="gender-toggle">
                <button className={`filter-btn ${gender === "Men" ? "active" : ""}`} onClick={() => setGender("Men")}>Men</button>
                <button className={`filter-btn ${gender === "Women" ? "active" : ""}`} onClick={() => setGender("Women")}>Women</button>
              </div>
            </div>
            <div className="scan-upload-area" onClick={() => fileRef.current.click()}>
              <div className="scan-upload-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <p>Click to upload your full-body photo</p>
              <span>JPEG or PNG, minimum 480x640</span>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} hidden />
            </div>
          </div>
        )}

        {/* UPLOADING */}
        {step === "uploading" && (
          <div className="scan-preview-step">
            <div className="scan-preview-container">
              <img src={preview} alt="" className="scan-preview-img" />
              <div className="scan-checklist">
                <h4>Quick check:</h4>
                <label><input type="checkbox" defaultChecked /> Full body visible (head to toe)</label>
                <label><input type="checkbox" defaultChecked /> Standing straight</label>
                <label><input type="checkbox" defaultChecked /> Good lighting</label>
                <label><input type="checkbox" defaultChecked /> Fitted clothing</label>
              </div>
            </div>
            <div className="scan-actions">
              <button className="btn-secondary" onClick={handleRetake}>Choose Different Photo</button>
              <button className="btn-primary" onClick={handleAnalyze}>Analyze My Body</button>
            </div>
          </div>
        )}

        {/* VALIDATING */}
        {step === "validating" && (
          <div className="scan-loading">
            <div className="scan-spinner" />
            <h3>Analyzing your photo...</h3>
            <p>Detecting body landmarks and calculating measurements</p>
          </div>
        )}

        {/* ERROR */}
        {step === "error" && (
          <div className="scan-error-step">
            <div className="scan-preview-small">
              <img src={preview} alt="" />
            </div>
            <div className="scan-errors">
              <div className="scan-error-icon">!</div>
              <h3>Photo doesn't meet requirements</h3>
              <ul className="error-list">
                {errors.map((err, i) => <li key={i} className="error-item">{err}</li>)}
              </ul>
              {warnings.length > 0 && (
                <ul className="warning-list">
                  {warnings.map((w, i) => <li key={i} className="warning-item">{w}</li>)}
                </ul>
              )}
              <button className="btn-primary" onClick={handleRetake}>Try Again</button>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {step === "results" && results && (
          <div className="scan-results-step">
            <div className="scan-preview-small">
              <img src={preview} alt="" />
              <div className="scan-confidence">{Math.round(results.confidence * 100)}% confidence</div>
            </div>
            <div className="scan-measurements">
              <h3>Your Measurements</h3>
              <p className="scan-body-type">Body type: <strong>{results.body_type}</strong></p>
              {warnings.length > 0 && (
                <div className="scan-warnings-box">
                  {warnings.map((w, i) => <p key={i}>{w}</p>)}
                </div>
              )}
              <div className="measurement-results-grid">
                {Object.entries(results.measurements).filter(([k]) => k !== "gender").map(([key, value]) => (
                  <div key={key} className="measure-result">
                    <span className="measure-label">{key.replace("_", " ")}</span>
                    {editMode ? (
                      <input type="number" step="0.1" value={editMeasurements[key] || value} onChange={(e) => handleEditChange(key, e.target.value)} />
                    ) : (
                      <span className="measure-value">{value}"</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="scan-size-result">
                <span>Recommended Size:</span>
                <span className="scan-size-badge">{results.size_recommendation?.recommended_size}</span>
              </div>
              <div className="scan-result-actions">
                {!editMode ? (
                  <>
                    <button className="btn-secondary" onClick={() => setEditMode(true)}>Edit Measurements</button>
                    <button className="btn-primary" onClick={handleContinueToOccasion}>Continue</button>
                  </>
                ) : (
                  <>
                    <button className="btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
                    <button className="btn-primary" onClick={handleSaveEdits} disabled={saving}>{saving ? "Saving..." : "Save & Continue"}</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SIGNUP PROMPT (guest limit reached) */}
        {step === "signup" && (
          <div className="cart-empty">
            <h3>You've used all {GUEST_SCAN_LIMIT} free body scans</h3>
            <p>Create a free account to get unlimited body scans and save your measurements.</p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1.5rem" }}>
              <Link to="/register" className="btn-primary">Sign Up Free</Link>
              <Link to="/login" className="btn-secondary">Already have an account? Log in</Link>
            </div>
          </div>
        )}

        {/* OCCASION SELECTION */}
        {step === "occasion" && (
          <div className="occasion-step">
            <h3>What's the occasion?</h3>
            <p className="section-desc">Help us recommend the perfect outfit for you</p>
            <div className="occasion-grid">
              {OCCASIONS.map((o) => (
                <div
                  key={o.id}
                  className={`occasion-card ${selectedOccasion === o.id ? "selected" : ""}`}
                  onClick={() => handleOccasionSelect(o.id)}
                >
                  <h4>{o.label}</h4>
                  <p>{o.desc}</p>
                </div>
              ))}
            </div>
            <div className="scan-actions" style={{ marginTop: "2rem" }}>
              <button className="btn-secondary" onClick={() => navigate("/shop")}>Skip</button>
              <button className="btn-primary" onClick={handleShopWithOccasion} disabled={!selectedOccasion}>
                Show Recommendations
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
