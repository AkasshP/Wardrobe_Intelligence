import axios from "axios";

export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Resolve image URL — if already full URL (S3), use as-is. Otherwise prefix API_BASE.
export const resolveImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
};

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Auth
export const register = (email, password) =>
  api.post("/api/auth/register", { email, password });
export const login = (email, password) =>
  api.post("/api/auth/login", { email, password });
export const getMe = () => api.get("/api/auth/me");
export const updateProfile = (data) => api.put("/api/auth/me", data);

// Wardrobe
export const uploadItem = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/api/wardrobe/items", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const getItems = () => api.get("/api/wardrobe/items");
export const updateItem = (id, data) => api.put(`/api/wardrobe/items/${id}`, data);
export const deleteItem = (id) => api.delete(`/api/wardrobe/items/${id}`);

// Outfits
export const getSuggestions = (occasion, count = 5) =>
  api.get("/api/outfits/suggest", { params: { occasion, count } });
export const rateOutfit = (comboId, rating, worn = false) =>
  api.post("/api/outfits/rate", { combo_id: comboId, rating, worn });
export const getHistory = () => api.get("/api/outfits/history");

// Analysis
export const analyzeBody = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/api/analysis/body", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const saveMeasurements = (data) => api.post("/api/analysis/measurements", data);

// Shop
export const getProducts = (params) => api.get("/api/shop/products", { params });
export const getProduct = (id) => api.get(`/api/shop/products/${id}`);
export const getRecommendedProducts = (params) => api.get("/api/shop/recommend", { params });
export const getShopFilters = () => api.get("/api/shop/filters");
export const getSizeChart = (chest, waist, hips, gender) =>
  api.get("/api/shop/size-chart", { params: { chest, waist, hips, gender } });

// Cart
export const getCart = () => api.get("/api/cart");
export const addToCart = (product_id, size, quantity = 1) =>
  api.post("/api/cart", { product_id, size, quantity });
export const updateCartItem = (item_id, quantity) =>
  api.put(`/api/cart/${item_id}`, { quantity });
export const removeFromCart = (item_id) => api.delete(`/api/cart/${item_id}`);
export const clearCart = () => api.delete("/api/cart");

// Wishlist
export const getWishlist = () => api.get("/api/cart/wishlist");
export const addToWishlist = (product_id) =>
  api.post(`/api/cart/wishlist?product_id=${product_id}`);
export const removeFromWishlist = (item_id) => api.delete(`/api/cart/wishlist/${item_id}`);

// Orders
export const checkout = (shipping) => api.post("/api/orders/checkout", { shipping });
export const confirmOrder = (order_id) => api.post(`/api/orders/${order_id}/confirm`);
export const getOrders = () => api.get("/api/orders");
export const getOrder = (id) => api.get(`/api/orders/${id}`);

// Config
export const getStripeConfig = () => api.get("/api/config/stripe");

// Outfit Combos
export const getOutfitCombos = (occasion, count = 5, generate = false) =>
  api.get("/api/outfits/suggest-combos", { params: { occasion, count, generate }, timeout: 600000 });

export const generateSingleCombo = (topId, bottomId) =>
  api.get("/api/outfits/generate-single", { params: { top_id: topId, bottom_id: bottomId }, timeout: 120000 });

// Gaps
export const getGapAnalysis = () => api.get("/api/gaps");

// Try-on status polling
export const checkTryonStatus = (predictionId) =>
  api.get("/api/tryon/status", { params: { prediction_id: predictionId } });

export default api;
