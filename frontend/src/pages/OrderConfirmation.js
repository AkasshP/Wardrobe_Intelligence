import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrder } from "../services/api";
import { API_BASE, resolveImageUrl } from "../services/api";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    getOrder(orderId).then((res) => setOrder(res.data)).catch(() => {});
  }, [orderId]);

  if (!order) return <div className="page"><p className="loading">Loading...</p></div>;

  return (
    <div className="confirmation-page">
      <div className="confirmation-hero">
        <div className="confirmation-check">&#10003;</div>
        <h1>Order Confirmed</h1>
        <p>Thank you for your purchase!</p>
        <span className="confirmation-id">Order #{order.id.slice(0, 8).toUpperCase()}</span>
      </div>

      <div className="page">
        <div className="confirmation-layout">
          <div className="confirmation-section">
            <h3>Order Details</h3>
            <div className="confirmation-items">
              {order.items.map((item, i) => (
                <div key={i} className="confirmation-item">
                  <img src={resolveImageUrl(item.image_url)} alt={item.name} />
                  <div>
                    <p>{item.name}</p>
                    <span>Size: {item.size} | Qty: {item.quantity}</span>
                  </div>
                  <span className="confirmation-price">&#8377;{(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="confirmation-total">
              <span>Total Paid</span>
              <span>&#8377;{order.total.toFixed(0)}</span>
            </div>
          </div>

          <div className="confirmation-section">
            <h3>Shipping To</h3>
            <div className="confirmation-address">
              <p>{order.shipping_address.full_name}</p>
              <p>{order.shipping_address.address_line1}</p>
              {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
              <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip_code}</p>
              <p>{order.shipping_address.country}</p>
            </div>
          </div>
        </div>

        <div className="confirmation-actions">
          <Link to="/orders" className="btn-secondary">View All Orders</Link>
          <Link to="/shop" className="btn-primary">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
