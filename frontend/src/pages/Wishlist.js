import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getWishlist, removeFromWishlist, addToCart } from "../services/api";
import { API_BASE, resolveImageUrl } from "../services/api";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState({ items: [], count: 0 });
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const res = await getWishlist();
      setWishlist(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchWishlist(); }, []);

  const handleRemove = async (itemId) => {
    await removeFromWishlist(itemId);
    fetchWishlist();
  };

  const handleAddToCart = async (item) => {
    const size = (item.available_sizes && item.available_sizes[0]) || "M";
    await addToCart(item.product_id, size);
    await removeFromWishlist(item.id);
    fetchWishlist();
  };

  if (loading) return <div className="page"><p className="loading">Loading...</p></div>;

  return (
    <div className="wishlist-page">
      <div className="cart-hero">
        <h1>Wishlist</h1>
        <p>{wishlist.count} saved {wishlist.count === 1 ? "item" : "items"}</p>
      </div>

      <div className="page">
        {wishlist.items.length === 0 ? (
          <div className="cart-empty">
            <h3>Your wishlist is empty</h3>
            <p>Save items you love for later.</p>
            <Link to="/shop" className="btn-primary">Explore Collection</Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.items.map((item) => (
              <div key={item.id} className="wishlist-card">
                <div className="wishlist-img">
                  <img src={resolveImageUrl(item.image_url)} alt={item.name} />
                  <button className="wishlist-remove" onClick={() => handleRemove(item.id)}>&#10005;</button>
                </div>
                <div className="wishlist-info">
                  <p className="wishlist-name">{item.name}</p>
                  <span className="wishlist-price">&#8377;{item.price}</span>
                  <button className="btn-secondary wishlist-move" onClick={() => handleAddToCart(item)}>
                    Move to Bag
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
