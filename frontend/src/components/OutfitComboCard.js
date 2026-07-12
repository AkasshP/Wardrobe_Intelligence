import { useState } from "react";
import { rateOutfit } from "../services/api";

export default function OutfitComboCard({ combo }) {
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);

  const handleRate = async (value) => {
    setRating(value);
    await rateOutfit(combo.id, value);
    setRated(true);
  };

  return (
    <div className="combo-card">
      <div className="combo-items">
        <div className="combo-item">
          <img src={combo.top.image_url} alt="Top" />
          <span>{combo.top.type}</span>
        </div>
        <span className="combo-plus">+</span>
        <div className="combo-item">
          <img src={combo.bottom.image_url} alt="Bottom" />
          <span>{combo.bottom.type}</span>
        </div>
        {combo.layer && (
          <>
            <span className="combo-plus">+</span>
            <div className="combo-item">
              <img src={combo.layer.image_url} alt="Layer" />
              <span>{combo.layer.type}</span>
            </div>
          </>
        )}
      </div>

      <div className="combo-score">
        Score: {Math.round(combo.total_score * 100)}%
      </div>

      <div className="combo-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            className={`star ${star <= rating ? "filled" : ""}`}
            disabled={rated}
          >
            {star <= rating ? "\u2605" : "\u2606"}
          </button>
        ))}
        {rated && <span className="rated-label">Rated!</span>}
      </div>
    </div>
  );
}
