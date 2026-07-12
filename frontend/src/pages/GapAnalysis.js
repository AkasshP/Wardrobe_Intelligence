import { useState, useEffect } from "react";
import { getGapAnalysis } from "../services/api";

export default function GapAnalysis() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getGapAnalysis().then((res) => setData(res.data)).catch(() => {});
  }, []);

  if (!data) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page gap-analysis">
      <h2>Wardrobe Gap Analysis</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{data.total_items}</div>
          <div className="stat-label">Total Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{data.current_combo_count}</div>
          <div className="stat-label">Possible Combos</div>
        </div>
      </div>

      <section>
        <h3>Items by Type</h3>
        <div className="type-breakdown">
          {Object.entries(data.items_by_type).map(([type, count]) => (
            <div key={type} className="type-bar">
              <span className="type-name">{type}</span>
              <div className="bar-fill" style={{ width: `${Math.min(100, count * 15)}%` }} />
              <span className="type-count">{count}</span>
            </div>
          ))}
        </div>
      </section>

      {data.suggestions.length > 0 && (
        <section>
          <h3>Recommended Purchases</h3>
          <p className="section-desc">Buy these items to unlock the most new outfits:</p>
          <div className="suggestion-list">
            {data.suggestions.map((s, i) => (
              <div key={i} className="suggestion-card">
                <span className="suggestion-item">{s.item}</span>
                <span className="suggestion-impact">+{s.new_combos} new outfits</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.color_gaps.length > 0 && (
        <section>
          <h3>Color Gaps</h3>
          <ul className="color-gaps-list">
            {data.color_gaps.map((gap, i) => (
              <li key={i}>{gap}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
