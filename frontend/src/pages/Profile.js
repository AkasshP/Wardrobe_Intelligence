import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateProfile, saveMeasurements } from "../services/api";

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const m = user?.measurements || {};

  const [measurements, setMeasurements] = useState({
    height: m.height || "",
    chest: m.chest || "",
    waist: m.waist || "",
    hips: m.hips || "",
    shoulders: m.shoulders || "",
    gender: m.gender || "Men",
  });

  const [sizeResult, setSizeResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [preferences, setPreferences] = useState(user?.preferences || {});

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleMeasurementChange = (key, value) => {
    setMeasurements({ ...measurements, [key]: value });
  };

  const handleSaveMeasurements = async () => {
    const data = {
      ...measurements,
      height: parseFloat(measurements.height),
      chest: parseFloat(measurements.chest),
      waist: parseFloat(measurements.waist),
      hips: parseFloat(measurements.hips),
      shoulders: measurements.shoulders ? parseFloat(measurements.shoulders) : null,
    };

    if (!data.chest || !data.waist || !data.hips) {
      showToast("Chest, waist, and hips are required");
      return;
    }

    setSaving(true);
    try {
      const res = await saveMeasurements(data);
      setSizeResult(res.data.size_recommendation);
      setUser({ ...user, measurements: res.data.measurements });
      showToast("Measurements saved! Redirecting to recommendations...");
      setTimeout(() => navigate("/shop"), 2000);
    } catch (err) {
      showToast("Failed to save");
    }
    setSaving(false);
  };

  const handleSavePreferences = async () => {
    await updateProfile({ preferences });
    setUser({ ...user, preferences });
    showToast("Preferences saved!");
  };

  return (
    <div className="page profile">
      {toast && <div className="toast">{toast}</div>}

      <h2>Profile</h2>

      <section className="profile-section">
        <h3>Body Measurements</h3>
        <p className="section-desc">
          Enter your measurements in inches. This helps us recommend the right size.
        </p>

        <div className="measurement-grid">
          <div className="measure-field">
            <label>Gender</label>
            <select
              value={measurements.gender}
              onChange={(e) => handleMeasurementChange("gender", e.target.value)}
            >
              <option value="Men">Men</option>
              <option value="Women">Women</option>
            </select>
          </div>
          <div className="measure-field">
            <label>Height (inches)</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 68"
              value={measurements.height}
              onChange={(e) => handleMeasurementChange("height", e.target.value)}
            />
          </div>
          <div className="measure-field">
            <label>Chest (inches) *</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 38"
              value={measurements.chest}
              onChange={(e) => handleMeasurementChange("chest", e.target.value)}
            />
          </div>
          <div className="measure-field">
            <label>Waist (inches) *</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 32"
              value={measurements.waist}
              onChange={(e) => handleMeasurementChange("waist", e.target.value)}
            />
          </div>
          <div className="measure-field">
            <label>Hips (inches) *</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 38"
              value={measurements.hips}
              onChange={(e) => handleMeasurementChange("hips", e.target.value)}
            />
          </div>
          <div className="measure-field">
            <label>Shoulders (inches)</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 18"
              value={measurements.shoulders}
              onChange={(e) => handleMeasurementChange("shoulders", e.target.value)}
            />
          </div>
        </div>

        <button onClick={handleSaveMeasurements} className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save & Get Size"}
        </button>

        {sizeResult && (
          <div className="size-result">
            <h4>Your Recommended Size: <span className="size-highlight">{sizeResult.recommended_size}</span></h4>
            <div className="size-fits-detail">
              {Object.entries(sizeResult.all_fits).map(([size, score]) => (
                <div key={size} className="size-fit-bar">
                  <span className="size-label">{size}</span>
                  <div className="fit-bar-bg">
                    <div
                      className="fit-bar-fill"
                      style={{ width: `${Math.round(score * 100)}%` }}
                    />
                  </div>
                  <span className="fit-percent">{Math.round(score * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="profile-section">
        <h3>Style Preferences</h3>
        <label>Preferred Style</label>
        <select
          value={preferences.style || ""}
          onChange={(e) => setPreferences({ ...preferences, style: e.target.value })}
        >
          <option value="">Select...</option>
          <option value="casual">Casual</option>
          <option value="smart_casual">Smart Casual</option>
          <option value="formal">Formal</option>
          <option value="streetwear">Streetwear</option>
          <option value="minimalist">Minimalist</option>
        </select>

        <label>Favorite Colors</label>
        <input
          type="text"
          value={preferences.colors || ""}
          onChange={(e) => setPreferences({ ...preferences, colors: e.target.value })}
          placeholder="e.g. navy, black, white"
        />

        <button onClick={handleSavePreferences} className="btn-primary">
          Save Preferences
        </button>
      </section>
    </div>
  );
}
