import { useState } from "react";
import { Link } from "react-router-dom";

const DUMMY_ITEMS = [
  { id: 1, image: "/images/wardrobe-1.jpg", type: "shirt", sub_type: "formal", primary_color: "White", color_hex: "#ffffff", pattern: "solid", season: ["spring", "summer"], formality: 0.8, times_worn: 12 },
  { id: 2, image: "/images/wardrobe-2.jpg", type: "t-shirt", sub_type: "casual", primary_color: "White", color_hex: "#f5f5f5", pattern: "solid", season: ["summer"], formality: 0.2, times_worn: 24 },
  { id: 3, image: "/images/wardrobe-3.jpg", type: "jeans", sub_type: "slim", primary_color: "Blue", color_hex: "#4a6fa5", pattern: "solid", season: ["fall", "winter"], formality: 0.3, times_worn: 31 },
  { id: 4, image: "/images/wardrobe-4.jpg", type: "jacket", sub_type: "puffer", primary_color: "Olive", color_hex: "#5e6350", pattern: "solid", season: ["winter"], formality: 0.4, times_worn: 8 },
  { id: 5, image: "/images/wardrobe-5.jpg", type: "dress", sub_type: "midi", primary_color: "Burgundy", color_hex: "#800020", pattern: "solid", season: ["fall"], formality: 0.7, times_worn: 5 },
  { id: 6, image: "/images/wardrobe-6.jpg", type: "sweater", sub_type: "crew neck", primary_color: "Cream", color_hex: "#f5f0e1", pattern: "knit", season: ["fall", "winter"], formality: 0.4, times_worn: 15 },
  { id: 7, image: "/images/wardrobe-7.jpg", type: "shirt", sub_type: "linen", primary_color: "Beige", color_hex: "#d4c5a9", pattern: "solid", season: ["summer"], formality: 0.5, times_worn: 9 },
  { id: 8, image: "/images/wardrobe-8.jpg", type: "shirt", sub_type: "casual", primary_color: "Blue", color_hex: "#3d6b99", pattern: "striped", season: ["spring", "summer"], formality: 0.5, times_worn: 18 },
  { id: 9, image: "/images/wardrobe-9.jpg", type: "trousers", sub_type: "chinos", primary_color: "Khaki", color_hex: "#c3b091", pattern: "solid", season: ["spring", "fall"], formality: 0.6, times_worn: 20 },
  { id: 10, image: "/images/wardrobe-10.jpg", type: "jacket", sub_type: "leather", primary_color: "Black", color_hex: "#1a1a1a", pattern: "solid", season: ["fall", "winter"], formality: 0.6, times_worn: 11 },
  { id: 11, image: "/images/wardrobe-11.jpg", type: "shorts", sub_type: "casual", primary_color: "Navy", color_hex: "#1b2838", pattern: "solid", season: ["summer"], formality: 0.2, times_worn: 14 },
  { id: 12, image: "/images/wardrobe-12.jpg", type: "t-shirt", sub_type: "polo", primary_color: "Black", color_hex: "#111111", pattern: "solid", season: ["summer", "spring"], formality: 0.4, times_worn: 22 },
];

export default function Wardrobe() {
  const [items] = useState(DUMMY_ITEMS);
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("grid"); // grid | list

  const types = ["all", ...new Set(items.map((i) => i.type))];
  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);
  const totalWorn = items.reduce((sum, i) => sum + i.times_worn, 0);

  return (
    <div className="wardrobe-page">
      {/* === HEADER BANNER === */}
      <div className="wardrobe-hero">
        <div className="wardrobe-hero-content">
          <h1>My Wardrobe</h1>
          <p>{items.length} pieces curated for your style</p>
        </div>
      </div>

      <div className="page">
        {/* === STATS ROW === */}
        <div className="wardrobe-stats">
          <div className="w-stat">
            <span className="w-stat-num">{items.length}</span>
            <span className="w-stat-label">Total Pieces</span>
          </div>
          <div className="w-stat">
            <span className="w-stat-num">{types.length - 1}</span>
            <span className="w-stat-label">Categories</span>
          </div>
          <div className="w-stat">
            <span className="w-stat-num">{totalWorn}</span>
            <span className="w-stat-label">Times Worn</span>
          </div>
          <div className="w-stat">
            <span className="w-stat-num">{Math.round(totalWorn / items.length)}</span>
            <span className="w-stat-label">Avg per Item</span>
          </div>
        </div>

        {/* === TOOLBAR === */}
        <div className="wardrobe-toolbar">
          <div className="filter-bar">
            {types.map((t) => (
              <button
                key={t}
                className={`filter-btn ${filter === t ? "active" : ""}`}
                onClick={() => setFilter(t)}
              >
                {t === "all" ? `All (${items.length})` : `${t} (${items.filter(i => i.type === t).length})`}
              </button>
            ))}
          </div>
          <div className="wardrobe-actions">
            <div className="view-toggle">
              <button className={`view-btn ${view === "grid" ? "active" : ""}`} onClick={() => setView("grid")}>
                <span className="view-icon-grid" />
              </button>
              <button className={`view-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>
                <span className="view-icon-list" />
              </button>
            </div>
            <Link to="/upload" className="btn-primary">+ Add Item</Link>
          </div>
        </div>

        {/* === ITEMS GRID === */}
        <div className={view === "grid" ? "w-grid" : "w-list"}>
          {filtered.map((item) => (
            <div key={item.id} className={view === "grid" ? "w-card" : "w-list-card"}>
              <div className="w-card-img">
                <img src={item.image} alt={item.type} />
                <div className="w-card-overlay">
                  <button className="w-card-action">View Details</button>
                </div>
              </div>
              <div className="w-card-info">
                <div className="w-card-top">
                  <span className="w-card-type">{item.type}</span>
                  <span className="w-card-subtype">{item.sub_type}</span>
                </div>
                <div className="w-card-details">
                  <div className="w-card-color">
                    <span className="w-color-dot" style={{ backgroundColor: item.color_hex }} />
                    <span>{item.primary_color}</span>
                  </div>
                  <span className="w-card-pattern">{item.pattern}</span>
                </div>
                <div className="w-card-bottom">
                  <div className="w-card-seasons">
                    {item.season.map((s) => (
                      <span key={s} className="w-season">{s}</span>
                    ))}
                  </div>
                  <span className="w-card-worn">Worn {item.times_worn}x</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
