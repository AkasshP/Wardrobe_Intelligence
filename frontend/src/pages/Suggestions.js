import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getOutfitCombos, generateSingleCombo } from "../services/api";
import { API_BASE, resolveImageUrl } from "../services/api";

const OCCASIONS = [
  { id: "casual", label: "Casual", icon: "01" },
  { id: "smart_casual", label: "Smart Casual", icon: "02" },
  { id: "office", label: "Office", icon: "03" },
  { id: "formal", label: "Formal", icon: "04" },
  { id: "party", label: "Party", icon: "05" },
  { id: "date", label: "Date Night", icon: "06" },
];

export default function Suggestions() {
  const navigate = useNavigate();
  const [step, setStep] = useState("choose");
  const [occasion, setOccasion] = useState("");
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingIdx, setGeneratingIdx] = useState(-1);
  const [totalGenerated, setTotalGenerated] = useState(0);
  const [meta, setMeta] = useState({});
  const bodyPhoto = localStorage.getItem("bodyPhoto");

  const handleOccasionSelect = async (occasionId) => {
    setOccasion(occasionId);
    setLoading(true);
    setStep("generating");

    try {
      // First get combos without generation
      const res = await getOutfitCombos(occasionId, 5, false);
      const comboData = res.data.combos || [];
      setCombos(comboData.map((c) => ({ ...c, tryon_image: null })));
      setMeta({
        skinTone: res.data.skin_tone,
        bodyType: res.data.body_type,
      });
      setLoading(false);

      // Then generate try-on for each combo one by one
      for (let i = 0; i < comboData.length; i++) {
        setGeneratingIdx(i);
        try {
          const genRes = await generateSingleCombo(comboData[i].top.id, comboData[i].bottom.id);
          if (genRes.data.success) {
            setCombos((prev) => {
              const updated = [...prev];
              updated[i] = { ...updated[i], tryon_image: genRes.data.tryon_image };
              return updated;
            });
            setTotalGenerated((prev) => prev + 1);
          }
        } catch (err) {
          console.error(`Combo ${i + 1} generation failed:`, err);
        }
      }
      setGeneratingIdx(-1);
      setStep("combos");
    } catch {
      setCombos([]);
      setLoading(false);
      setStep("combos");
    }
  };

  const handleTryCombo = (combo) => {
    navigate(`/try-on?product=${combo.bottom.id}`);
  };

  const occasionLabel = OCCASIONS.find((o) => o.id === occasion)?.label || occasion;

  return (
    <div className="suggestions-page">
      <div className="cart-hero">
        <h1>Outfit Suggestions</h1>
        <p>AI-styled combos tailored to your skin tone and occasion</p>
      </div>

      <div className="page">
        {/* STEP 1: Choose occasion */}
        {step === "choose" && (
          <div className="occasion-choose">
            <h3>What's the occasion?</h3>
            <p className="section-desc">We'll style complete outfits on you</p>

            {bodyPhoto && (
              <div className="occasion-user-preview">
                <img src={bodyPhoto} alt="" />
                <span>Your profile</span>
              </div>
            )}

            <div className="occasion-grid-large">
              {OCCASIONS.map((o) => (
                <div key={o.id} className="occasion-card-large" onClick={() => handleOccasionSelect(o.id)}>
                  <div className="occasion-icon-large">{o.icon}</div>
                  <h4>{o.label}</h4>
                </div>
              ))}
            </div>

            <div className="occasion-or"><span>or</span></div>
            <div className="occasion-explore">
              <Link to="/shop" className="btn-secondary">Explore Individually</Link>
              <p>Browse and try on items one by one</p>
            </div>
          </div>
        )}

        {/* STEP 2: Generating */}
        {(step === "generating" || step === "combos") && (
          <div className="combos-view">
            <div className="combos-header">
              <div>
                <h3>{occasionLabel} Looks</h3>
                <p className="section-desc">
                  {generatingIdx >= 0
                    ? `Styling look ${generatingIdx + 1} of ${combos.length}...`
                    : `${combos.length} outfits styled for your ${meta.skinTone?.replace("_", " ")} skin tone`}
                </p>
              </div>
              <button className="btn-secondary" onClick={() => { setStep("choose"); setCombos([]); setTotalGenerated(0); }} style={{fontSize: '0.65rem', padding: '0.5rem 1rem'}}>
                Change Occasion
              </button>
            </div>

            {loading ? (
              <div className="scan-loading" style={{padding: '3rem'}}>
                <div className="scan-spinner" />
                <h3>Finding the best outfits...</h3>
              </div>
            ) : (
              <div className="combos-generated">
                {combos.map((combo, i) => (
                  <div key={i} className="combo-gen-card">
                    <div className="combo-gen-header">
                      <span className="combo-gen-num">Look {i + 1}</span>
                      <span className="combo-gen-score">{combo.score}% match</span>
                    </div>

                    <div className="combo-gen-body">
                      {/* Try-on result or loading */}
                      <div className="combo-gen-tryon">
                        {combo.tryon_image ? (
                          <img src={resolveImageUrl(combo.tryon_image)} alt={`Look ${i + 1}`} />
                        ) : generatingIdx === i ? (
                          <div className="combo-gen-loading">
                            <div className="scan-spinner" />
                            <p>Styling...</p>
                          </div>
                        ) : generatingIdx > i ? (
                          <div className="combo-gen-loading">
                            <p>Could not generate</p>
                          </div>
                        ) : (
                          <div className="combo-gen-loading">
                            <p>Waiting...</p>
                          </div>
                        )}
                      </div>

                      {/* Product details */}
                      <div className="combo-gen-products">
                        <div className="combo-gen-product">
                          <img src={resolveImageUrl(combo.top.image_url)} alt="" />
                          <div>
                            <span className="combo-gen-type">{combo.top.article_type}</span>
                            <p>{combo.top.name}</p>
                            <span className="combo-gen-price">&#8377;{combo.top.price}</span>
                          </div>
                        </div>
                        <div className="combo-gen-product">
                          <img src={resolveImageUrl(combo.bottom.image_url)} alt="" />
                          <div>
                            <span className="combo-gen-type">{combo.bottom.article_type}</span>
                            <p>{combo.bottom.name}</p>
                            <span className="combo-gen-price">&#8377;{combo.bottom.price}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="combo-gen-footer">
                      <div>
                        <span className="combo-vibe">{combo.vibe}</span>
                        <p className="combo-gen-reason">{combo.reasoning}</p>
                      </div>
                      <div className="combo-gen-actions">
                        <span className="combo-total">&#8377;{combo.total_price}</span>
                        <button className="btn-primary" onClick={() => handleTryCombo(combo)} style={{fontSize: '0.6rem', padding: '0.5rem 1.2rem'}}>
                          Try Full Look
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="combos-explore-option">
              <p>Want to mix and match yourself?</p>
              <Link to="/shop" className="btn-secondary">Explore Individually</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
