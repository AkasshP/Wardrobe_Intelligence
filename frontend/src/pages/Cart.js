import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCart, updateCartItem, removeFromCart } from "../services/api";
import { API_BASE, resolveImageUrl } from "../services/api";

export default function Cart() {
  const [cart, setCart] = useState({ items: [], total: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      const res = await getCart();
      setCart(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchCart(); }, []);

  const handleQuantity = async (itemId, qty) => {
    if (qty <= 0) {
      await removeFromCart(itemId);
    } else {
      await updateCartItem(itemId, qty);
    }
    fetchCart();
  };

  const handleRemove = async (itemId) => {
    await removeFromCart(itemId);
    fetchCart();
  };

  if (loading) return <div className="page"><p className="loading">Loading...</p></div>;

  return (
    <div className="cart-page">
      <div className="cart-hero">
        <h1>Shopping Bag</h1>
        <p>{cart.count} {cart.count === 1 ? "item" : "items"}</p>
      </div>

      <div className="page">
        {cart.items.length === 0 ? (
          <div className="cart-empty">
            <h3>Your bag is empty</h3>
            <p>Discover our collection and find something you love.</p>
            <Link to="/shop" className="btn-primary">Continue Shopping</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {cart.items.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-img">
                    <img src={resolveImageUrl(item.image_url)} alt={item.name} />
                  </div>
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <span className="cart-item-size">Size: {item.size}</span>
                    <span className="cart-item-price">&#8377;{item.price}</span>
                  </div>
                  <div className="cart-item-qty">
                    <button onClick={() => handleQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <div className="cart-item-subtotal">
                    <span>&#8377;{item.subtotal.toFixed(0)}</span>
                    <button className="cart-remove" onClick={() => handleRemove(item.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>&#8377;{cart.total.toFixed(0)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="summary-row summary-total">
                <span>Total</span>
                <span>&#8377;{cart.total.toFixed(0)}</span>
              </div>
              <button className="btn-primary summary-checkout" onClick={() => navigate("/checkout")}>
                Proceed to Checkout
              </button>
              <Link to="/shop" className="summary-continue">Continue Shopping</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
