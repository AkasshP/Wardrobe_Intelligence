import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { getProduct, getProducts, addToCart } from "../services/api";
import { API_BASE, resolveImageUrl } from "../services/api";
import api from "../services/api";

const CATEGORIES = ["Tshirts", "Shirts", "Jeans", "Trousers", "Shorts", "Jackets", "Dresses", "Sweaters"];

export default function TryOn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productId = searchParams.get("product");
  const [product, setProduct] = useState(null);
  const [bodyPhoto] = useState(localStorage.getItem("bodyPhoto"));
  const [processing, setProcessing] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [error, setError] = useState("");
  const [addedToBag, setAddedToBag] = useState(false);
  const [toast, setToast] = useState(null);

  // Session chaining
  const [sessionHistory, setSessionHistory] = useState(() => {
    const saved = sessionStorage.getItem("tryonHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [currentBase, setCurrentBase] = useState(() => {
    return sessionStorage.getItem("tryonCurrentBase") || null;
  });

  // Browse panel
  const [showBrowse, setShowBrowse] = useState(false);
  const [browseCategory, setBrowseCategory] = useState("Shirts");
  const [browseProducts, setBrowseProducts] = useState([]);

  useEffect(() => {
    if (productId) {
      getProduct(productId).then((res) => setProduct(res.data)).catch(() => {});
    }
  }, [productId]);

  useEffect(() => {
    if (showBrowse) {
      getProducts({ article_type: browseCategory, limit: 12 })
        .then((res) => setBrowseProducts(res.data.products || []))
        .catch(() => {});
    }
  }, [showBrowse, browseCategory]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const displayPhoto = currentBase ? `${API_BASE}${currentBase}` : bodyPhoto;

  const handleTryOn = async () => {
    setProcessing(true);
    setError("");
    setResultImage(null);
    setShowBrowse(false);

    try {
      const form = new FormData();
      form.append("product_id", product.id);
      form.append("article_type", product.article_type || "");
      form.append("garment_description", `${product.article_type} ${product.color || ""} ${product.name}`);

      if (currentBase) {
        const baseRes = await fetch(resolveImageUrl(currentBase));
        const baseBlob = await baseRes.blob();
        const baseFile = new File([baseBlob], "person.jpg", { type: "image/jpeg" });
        form.append("person_image", baseFile);
      }

      const res = await api.post("/api/tryon", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });

      if (res.data.prediction_id) {
        // Poll for result
        const predictionId = res.data.prediction_id;
        const poll = async () => {
          for (let i = 0; i < 60; i++) {
            await new Promise((r) => setTimeout(r, 3000));
            try {
              const statusRes = await api.get("/api/tryon/status", {
                params: { prediction_id: predictionId },
              });
              if (statusRes.data.status === "succeeded") {
                const resultUrl = statusRes.data.result_image;
                setResultImage(resultUrl);
                const newEntry = {
                  productId: product.id,
                  productName: product.name,
                  articleType: product.article_type,
                  resultImage: resultUrl,
                  timestamp: Date.now(),
                };
                const newHistory = [...sessionHistory, newEntry];
                setSessionHistory(newHistory);
                sessionStorage.setItem("tryonHistory", JSON.stringify(newHistory));
                setProcessing(false);
                return;
              } else if (statusRes.data.status === "failed") {
                setError(statusRes.data.error || "Try-on failed");
                setProcessing(false);
                return;
              }
            } catch (pollErr) {
              console.error("Poll error:", pollErr);
            }
          }
          setError("Try-on timed out. Please try again.");
          setProcessing(false);
        };
        poll();
        return;
      } else {
        setError(res.data.detail || "Try-on failed");
      }
    } catch (err) {
      console.error("Try-on error:", err);
      setError(err.response?.data?.detail || err.message || "Try-on failed.");
    }
    setProcessing(false);
  };

  const handleUseAsBase = () => {
    const latestResult = sessionHistory[sessionHistory.length - 1]?.resultImage;
    if (latestResult) {
      setCurrentBase(latestResult);
      sessionStorage.setItem("tryonCurrentBase", latestResult);
      setResultImage(null);
      setShowBrowse(true);
      showToast("Pick another item to complete your outfit!");
    }
  };

  const handlePickProduct = (p) => {
    setShowBrowse(false);
    navigate(`/try-on?product=${p.id}`);
  };

  const handleResetToOriginal = () => {
    setCurrentBase(null);
    sessionStorage.removeItem("tryonCurrentBase");
    setResultImage(null);
    setSessionHistory([]);
    sessionStorage.removeItem("tryonHistory");
    showToast("Reset to original photo");
    setShowBrowse(false);
  };

  const handleAddToBag = async () => {
    const size = (product.available_sizes && product.available_sizes[0]) || "M";
    await addToCart(product.id, size);
    setAddedToBag(true);
    showToast("Added to bag");
    setTimeout(() => setAddedToBag(false), 2000);
  };

  if (!bodyPhoto && !currentBase) {
    return (
      <div className="page">
        <div className="cart-empty">
          <h3>No body photo found</h3>
          <p>Upload a full-body photo first to use virtual try-on.</p>
          <Link to="/body-scan" className="btn-primary">Go to Body Scan</Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="page"><p className="loading">Loading...</p></div>;
  }

  return (
    <div className="tryon-page">
      {toast && <div className="toast">{toast}</div>}

      <div className="cart-hero">
        <h1>Virtual Try-On</h1>
        <p>AI-powered — see how it looks on you</p>
      </div>

      <div className="page">
        {/* Session bar */}
        {sessionHistory.length > 0 && (
          <div className="tryon-session-bar">
            <div className="session-info">
              <span className="session-label">Session</span>
              <span className="session-count">{sessionHistory.length} {sessionHistory.length === 1 ? "change" : "changes"}</span>
              {sessionHistory.map((h, i) => (
                <span key={i} className="session-chip">{h.articleType}</span>
              ))}
            </div>
            <div className="session-actions">
              <button className="btn-secondary" onClick={handleResetToOriginal} style={{fontSize: '0.6rem', padding: '0.4rem 0.8rem'}}>
                Reset to Original
              </button>
            </div>
          </div>
        )}

        {/* Main try-on area */}
        {!showBrowse && (
          <>
            <div className="tryon-main">
              <div className="tryon-column">
                <div className="tryon-label">{currentBase ? "Current Look" : "You"}</div>
                <div className="tryon-frame">
                  <img src={displayPhoto} alt="" />
                </div>
              </div>

              <div className="tryon-center">
                {!resultImage && !processing && (
                  <div className="tryon-generate">
                    <div className="tryon-garment-preview">
                      <img src={resolveImageUrl(product.image_url)} alt="" />
                    </div>
                    <p className="tryon-garment-name">{product.name}</p>
                    <p className="tryon-category-badge">{product.article_type}</p>
                    <button className="btn-primary" onClick={handleTryOn}>
                      {currentBase ? "Apply to Current Look" : "Try On"}
                    </button>
                  </div>
                )}

                {processing && (
                  <div className="tryon-processing">
                    <div className="scan-spinner" />
                    <h4>Fitting garment for you...</h4>
                    <p>Finding the best suggestions based on your style</p>
                  </div>
                )}

                {!processing && resultImage && (
                  <div className="tryon-arrow">
                    <svg width="40" height="24" viewBox="0 0 40 24" fill="none" stroke="var(--champagne)" strokeWidth="2">
                      <path d="M0 12H36M36 12L28 4M36 12L28 20"/>
                    </svg>
                  </div>
                )}
              </div>

              <div className="tryon-column">
                <div className="tryon-label">Result</div>
                <div className="tryon-frame">
                  {resultImage ? (
                    <img src={resultImage} alt="Try-on result" />
                  ) : (
                    <div className="tryon-placeholder">
                      {processing ? "" : "Result will appear here"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && <div className="error-msg" style={{textAlign: 'center', marginBottom: '1rem'}}>{error}</div>}

            {/* Product Bar */}
            <div className="tryon-product-bar">
              <div className="tryon-product-details">
                <h3>{product.name}</h3>
                <div className="tryon-product-meta">
                  <span className="tryon-price">&#8377;{product.price}</span>
                  <span className="tryon-type">{product.article_type}</span>
                </div>
              </div>
              <div className="tryon-product-actions">
                {resultImage && (
                  <button className="btn-primary" onClick={handleUseAsBase}>
                    Keep &amp; Change Another
                  </button>
                )}
                {resultImage && (
                  <button className="btn-secondary" onClick={() => setResultImage(null)}>Try Again</button>
                )}
                <button className={`btn-primary ${addedToBag ? "added" : ""}`} onClick={handleAddToBag}>
                  {addedToBag ? "\u2713 Added" : "Add to Bag"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* === BROWSE PANEL (inline shop) === */}
        {showBrowse && (
          <div className="tryon-browse">
            <div className="tryon-browse-header">
              <div>
                <h3>Complete Your Outfit</h3>
                <p className="section-desc">Pick another item to try on with your current look</p>
              </div>
              <div className="tryon-browse-current">
                <img src={displayPhoto} alt="" />
              </div>
            </div>

            <div className="tryon-browse-categories">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`filter-btn ${browseCategory === cat ? "active" : ""}`}
                  onClick={() => setBrowseCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="tryon-browse-grid">
              {browseProducts.map((p) => (
                <div key={p.id} className="tryon-browse-card" onClick={() => handlePickProduct(p)}>
                  <div className="tryon-browse-img">
                    <img src={resolveImageUrl(p.image_url)} alt={p.name} />
                  </div>
                  <p className="tryon-browse-name">{p.name}</p>
                  <span className="tryon-browse-price">&#8377;{p.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
