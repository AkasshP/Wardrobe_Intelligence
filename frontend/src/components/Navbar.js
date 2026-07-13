import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCart } from "../services/api";
import Logo from "./Logo";

export default function Navbar() {
  const { user, isGuest, logout } = useAuth();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    getCart().then((res) => setCartCount(res.data.count)).catch(() => {});
    const interval = setInterval(() => {
      getCart().then((res) => setCartCount(res.data.count)).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">
          <Logo />
        </Link>
      </div>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/shop">Shop</Link>
        {!isGuest && <Link to="/wardrobe">Wardrobe</Link>}
        {!isGuest && <Link to="/suggestions">Outfits</Link>}
        {!isGuest && <Link to="/profile">Profile</Link>}
        <Link to="/wishlist" className="nav-icon" title="Wishlist">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </Link>
        <Link to="/cart" className="nav-icon nav-cart" title="Bag">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </Link>
        {isGuest ? (
          <Link to="/login" className="btn-logout" style={{ textDecoration: "none" }}>Sign In</Link>
        ) : (
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        )}
      </div>
    </nav>
  );
}
