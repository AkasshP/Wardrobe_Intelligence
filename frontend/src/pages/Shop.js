import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts, getRecommendedProducts, getShopFilters, addToCart, addToWishlist } from "../services/api";
import { API_BASE, resolveImageUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Shop() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const hasBodyPhoto = !!localStorage.getItem("bodyPhoto");
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({});
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("browse");
  const [sizeInfo, setSizeInfo] = useState(null);
  const [selectedSize, setSelectedSize] = useState({});
  const [wishlisted, setWishlisted] = useState({});
  const [addedToCart, setAddedToCart] = useState({});
  const [toast, setToast] = useState(null);

  const [query, setQuery] = useState({
    gender: "",
    article_type: "",
    color: "",
    usage: "",
    search: "",
    page: 1,
  });

  useEffect(() => {
    getShopFilters().then((res) => setFilters(res.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchProducts(); }, [query, mode]); // eslint-disable-line

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(query).forEach(([k, v]) => { if (v) params[k] = v; });
      let res;
      if (mode === "recommend" && user?.measurements) {
        res = await getRecommendedProducts(params);
        setSizeInfo({ size: res.data.recommended_size, fits: res.data.size_fits });
      } else {
        res = await getProducts(params);
        setSizeInfo(null);
      }
      setProducts(res.data.products || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch { setProducts([]); }
    setLoading(false);
  };

  const updateQuery = (key, value) => setQuery({ ...query, [key]: value, page: 1 });

  const handleAddToCart = async (product) => {
    const size = selectedSize[product.id] || (product.available_sizes && product.available_sizes[0]) || "M";
    await addToCart(product.id, size);
    setAddedToCart({ ...addedToCart, [product.id]: true });
    showToast("Added to bag");
    setTimeout(() => setAddedToCart((prev) => ({ ...prev, [product.id]: false })), 2000);
  };

  const handleWishlist = async (product) => {
    if (wishlisted[product.id]) return;
    await addToWishlist(product.id);
    setWishlisted({ ...wishlisted, [product.id]: true });
  };

  return (
    <div className="page shop">
      {toast && <div className="toast">{toast}</div>}

      <div className="page-header">
        <h2>Shop ({total} products)</h2>
        <div className="mode-toggle">
          <button className={`filter-btn ${mode === "browse" ? "active" : ""}`} onClick={() => setMode("browse")}>Browse All</button>
          <button
            className={`filter-btn ${mode === "recommend" ? "active" : ""}`}
            onClick={() => setMode("recommend")}
            disabled={!user?.measurements}
            title={!user?.measurements ? "Enter measurements in Profile first" : ""}
          >For My Size</button>
        </div>
      </div>

      {sizeInfo && (
        <div className="size-banner">
          <span>Your recommended size: <strong>{sizeInfo.size}</strong></span>
          <div className="size-fits">
            {Object.entries(sizeInfo.fits).map(([s, score]) => (
              <span key={s} className={`size-pill ${s === sizeInfo.size ? "best" : ""}`}>{s}: {Math.round(score * 100)}%</span>
            ))}
          </div>
        </div>
      )}

      <div className="shop-filters">
        <input type="text" placeholder="Search products..." value={query.search} onChange={(e) => updateQuery("search", e.target.value)} className="search-input" />
        <select value={query.gender} onChange={(e) => updateQuery("gender", e.target.value)}>
          <option value="">All Genders</option>
          {(filters.genders || []).map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={query.article_type} onChange={(e) => updateQuery("article_type", e.target.value)}>
          <option value="">All Types</option>
          {(filters.article_types || []).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={query.usage} onChange={(e) => updateQuery("usage", e.target.value)}>
          <option value="">All Usage</option>
          {(filters.usages || []).map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="loading">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="empty-state">No products found. Try different filters.</p>
      ) : (
        <>
          <div className="product-grid">
            {products.map((p) => (
              <div key={p.id} className="product-card">
                <div className="product-image">
                  <img src={resolveImageUrl(p.image_url)} alt={p.name} />
                  <button
                    className={`product-wishlist-btn ${wishlisted[p.id] ? "wishlisted" : ""}`}
                    onClick={() => handleWishlist(p)}
                    title={wishlisted[p.id] ? "Saved" : "Add to Wishlist"}
                  >
                    {wishlisted[p.id] ? "\u2665" : "\u2661"}
                  </button>
                  <div className="product-hover-actions">
                    <select
                      className="product-size-select"
                      value={selectedSize[p.id] || ""}
                      onChange={(e) => setSelectedSize({ ...selectedSize, [p.id]: e.target.value })}
                    >
                      <option value="">Size</option>
                      {(p.available_sizes || []).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      className={`product-add-btn ${addedToCart[p.id] ? "added" : ""}`}
                      onClick={() => handleAddToCart(p)}
                    >
                      {addedToCart[p.id] ? "\u2713 Added" : "Add to Bag"}
                    </button>
                    {hasBodyPhoto && (
                      <button
                        className="product-tryon-btn"
                        onClick={() => navigate(`/try-on?product=${p.id}`)}
                      >
                        Try On
                      </button>
                    )}
                  </div>
                </div>
                <div className="product-body">
                  <p className="product-name">{p.name}</p>
                  <div className="product-meta">
                    <span className="product-price">&#8377;{p.price}</span>
                    <span className="product-type">{p.article_type}</span>
                  </div>
                  {p.color && <span className="product-color">{p.color}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button disabled={query.page <= 1} onClick={() => setQuery({ ...query, page: query.page - 1 })}>Previous</button>
            <span>Page {query.page} of {pages}</span>
            <button disabled={query.page >= pages} onClick={() => setQuery({ ...query, page: query.page + 1 })}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}
