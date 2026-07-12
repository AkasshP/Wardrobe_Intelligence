import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getOrders } from "../services/api";
import { API_BASE, resolveImageUrl } from "../services/api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders().then((res) => setOrders(res.data.orders)).catch(() => {});
    setLoading(false);
  }, []);

  if (loading) return <div className="page"><p className="loading">Loading...</p></div>;

  return (
    <div className="orders-page">
      <div className="cart-hero">
        <h1>My Orders</h1>
      </div>

      <div className="page">
        {orders.length === 0 ? (
          <div className="cart-empty">
            <h3>No orders yet</h3>
            <p>Your order history will appear here.</p>
            <Link to="/shop" className="btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div>
                    <span className="order-id">Order #{order.id.slice(0, 8).toUpperCase()}</span>
                    <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className={`order-status status-${order.status}`}>{order.status}</span>
                </div>
                <div className="order-items-preview">
                  {order.items.slice(0, 4).map((item, i) => (
                    <img key={i} src={resolveImageUrl(item.image_url)} alt={item.name} className="order-thumb" />
                  ))}
                  {order.items.length > 4 && <span className="order-more">+{order.items.length - 4}</span>}
                </div>
                <div className="order-footer">
                  <span>{order.items_count} {order.items_count === 1 ? "item" : "items"}</span>
                  <span className="order-total">&#8377;{order.total.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
