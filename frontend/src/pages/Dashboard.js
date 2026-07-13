import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getItems } from "../services/api";

const CATEGORIES = [
  { name: "Shirts", type: "Shirts", image: "/images/cat-shirts.jpg" },
  { name: "Dresses", type: "Dresses", image: "/images/cat-dresses.jpg" },
  { name: "Jeans", type: "Jeans", image: "/images/cat-jeans.jpg" },
  { name: "Jackets", type: "Jackets", image: "/images/cat-jackets.jpg" },
];

export default function Dashboard() {
  const { user, isGuest } = useAuth();
  const [stats, setStats] = useState({ total: 0, types: {} });

  useEffect(() => {
    if (isGuest) return;
    getItems().then((res) => {
      const items = res.data;
      const types = {};
      items.forEach((i) => {
        types[i.type] = (types[i.type] || 0) + 1;
      });
      setStats({ total: items.length, types });
    }).catch(() => {});
  }, [isGuest]);

  return (
    <div className="dashboard">
      {/* === HERO with full-bleed HD image === */}
      <section className="hero">
        <img src="/images/hero.jpg" alt="" className="hero-bg" />
        <div className="hero-overlay" />
        <div className="hero-text">
          <span className="hero-eyebrow">Welcome to</span>
          <h1>Wardrobe<br/>Intelligence</h1>
          <p>AI-curated outfits. Size-matched recommendations.<br/>Your wardrobe, perfected.</p>
          <div className="hero-actions">
            <Link to="/shop" className="hero-cta">Shop Collection</Link>
            <Link to="/body-scan" className="hero-cta hero-cta-outline">Find My Size</Link>
          </div>
        </div>
      </section>

      {/* === DUAL BANNER with HD images === */}
      <section className="dual-banner">
        <Link to="/shop?gender=Women" className="dual-card">
          <img src="/images/women.jpg" alt="Women's Collection" className="dual-bg" />
          <div className="dual-overlay" />
          <div className="dual-inner">
            <span className="dual-label">Women</span>
            <span className="dual-cta-link">Explore Collection</span>
          </div>
        </Link>
        <Link to="/shop?gender=Men" className="dual-card">
          <img src="/images/men.jpg" alt="Men's Collection" className="dual-bg" />
          <div className="dual-overlay" />
          <div className="dual-inner">
            <span className="dual-label">Men</span>
            <span className="dual-cta-link">Explore Collection</span>
          </div>
        </Link>
      </section>

      {/* === CATEGORIES with HD images === */}
      <section className="page">
        <div className="section-header">
          <h2>Shop by Category</h2>
          <Link to="/shop" className="view-all-link">View All</Link>
        </div>
        <div className="category-grid">
          {CATEGORIES.map((cat) => (
            <Link to={`/shop?type=${cat.type}`} key={cat.name} className="category-card">
              <img src={cat.image} alt={cat.name} />
              <div className="category-overlay" />
              <span className="category-label">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* === MARQUEE STRIP === */}
      <div className="marquee-strip">
        <div className="marquee-content">
          <span>Smart Wardrobe</span>
          <span className="marquee-dot" />
          <span>Outfit Combos</span>
          <span className="marquee-dot" />
          <span>Size Matching</span>
          <span className="marquee-dot" />
          <span>Gap Analysis</span>
          <span className="marquee-dot" />
          <span>18,000+ Products</span>
          <span className="marquee-dot" />
          <span>AI Powered</span>
        </div>
      </div>

      {/* === FEATURES === */}
      <section className="features-section">
        <div className="feature">
          <div className="feature-num">01</div>
          <h4>Smart Wardrobe</h4>
          <p>Upload your clothes. AI classifies and organizes them instantly.</p>
        </div>
        <div className="feature-divider" />
        <div className="feature">
          <div className="feature-num">02</div>
          <h4>Outfit Engine</h4>
          <p>Get outfit combinations scored by color harmony and occasion.</p>
        </div>
        <div className="feature-divider" />
        <div className="feature">
          <div className="feature-num">03</div>
          <h4>Perfect Fit</h4>
          <p>Enter measurements. Get size recommendations across all products.</p>
        </div>
      </section>

      {/* === WARDROBE STATS === */}
      {stats.total > 0 && (
        <section className="page">
          <div className="section-header">
            <h2>My Wardrobe</h2>
            <Link to="/wardrobe" className="view-all-link">View All</Link>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Items</div>
            </div>
            {Object.entries(stats.types).map(([type, count]) => (
              <div key={type} className="stat-card">
                <div className="stat-number">{count}</div>
                <div className="stat-label">{type}</div>
              </div>
            ))}
          </div>
          <div className="quick-links">
            <Link to="/suggestions" className="btn-secondary">Outfit Ideas</Link>
            <Link to="/gaps" className="btn-secondary">Gap Analysis</Link>
            <Link to="/upload" className="btn-secondary">Add Clothes</Link>
          </div>
        </section>
      )}

      {/* === CTA BANNER with HD background === */}
      <section className="cta-banner">
        <img src="/images/cta-bg.jpg" alt="" className="cta-bg" />
        <div className="cta-overlay" />
        <div className="cta-content">
          <span className="cta-eyebrow">Personalized For You</span>
          <h2>Find Your Perfect Size</h2>
          <p>Enter your body measurements and discover clothes that fit you perfectly.</p>
          <Link to="/body-scan" className="hero-cta">Get Started</Link>
        </div>
      </section>
    </div>
  );
}
