import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getCart, getStripeConfig, checkout, confirmOrder } from "../services/api";
import { API_BASE, resolveImageUrl } from "../services/api";

let stripePromise = null;

function CheckoutForm({ cart }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [shipping, setShipping] = useState({
    full_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip_code: "",
    country: "India",
    phone: "",
  });

  const handleChange = (key, value) => {
    setShipping({ ...shipping, [key]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    if (!shipping.full_name || !shipping.address_line1 || !shipping.city || !shipping.state || !shipping.zip_code) {
      setError("Please fill all required fields");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const res = await checkout(shipping);
      const { client_secret, order_id } = res.data;

      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name: shipping.full_name },
        },
      });

      if (result.error) {
        setError(result.error.message);
        setProcessing(false);
      } else {
        await confirmOrder(order_id);
        navigate(`/order-confirmation/${order_id}`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Payment failed");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="checkout-layout">
        <div className="checkout-left">
          <h3>Shipping Address</h3>
          <div className="checkout-fields">
            <div className="field-full">
              <label>Full Name *</label>
              <input value={shipping.full_name} onChange={(e) => handleChange("full_name", e.target.value)} required />
            </div>
            <div className="field-full">
              <label>Address *</label>
              <input value={shipping.address_line1} onChange={(e) => handleChange("address_line1", e.target.value)} required />
            </div>
            <div className="field-full">
              <label>Apartment, Suite (optional)</label>
              <input value={shipping.address_line2} onChange={(e) => handleChange("address_line2", e.target.value)} />
            </div>
            <div className="field-half">
              <label>City *</label>
              <input value={shipping.city} onChange={(e) => handleChange("city", e.target.value)} required />
            </div>
            <div className="field-half">
              <label>State *</label>
              <input value={shipping.state} onChange={(e) => handleChange("state", e.target.value)} required />
            </div>
            <div className="field-half">
              <label>ZIP Code *</label>
              <input value={shipping.zip_code} onChange={(e) => handleChange("zip_code", e.target.value)} required />
            </div>
            <div className="field-half">
              <label>Phone</label>
              <input value={shipping.phone} onChange={(e) => handleChange("phone", e.target.value)} />
            </div>
          </div>

          <h3 style={{ marginTop: "2rem" }}>Payment</h3>
          <div className="stripe-card-wrapper">
            <CardElement options={{
              style: {
                base: {
                  fontSize: "14px",
                  color: "#1e1e1e",
                  fontFamily: "'Inter', sans-serif",
                  "::placeholder": { color: "#aaa" },
                },
              },
            }} />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="btn-primary checkout-pay" disabled={!stripe || processing}>
            {processing ? "Processing..." : `Pay \u20B9${cart.total.toFixed(0)}`}
          </button>
        </div>

        <div className="checkout-right">
          <h3>Order Summary</h3>
          <div className="checkout-items">
            {cart.items.map((item) => (
              <div key={item.id} className="checkout-item">
                <img src={resolveImageUrl(item.image_url)} alt={item.name} />
                <div>
                  <p>{item.name}</p>
                  <span>Size: {item.size} | Qty: {item.quantity}</span>
                  <span className="checkout-item-price">&#8377;{item.subtotal.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="checkout-total">
            <div className="summary-row"><span>Subtotal</span><span>&#8377;{cart.total.toFixed(0)}</span></div>
            <div className="summary-row"><span>Shipping</span><span>Free</span></div>
            <div className="summary-row summary-total"><span>Total</span><span>&#8377;{cart.total.toFixed(0)}</span></div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function Checkout() {
  const [cart, setCart] = useState(null);
  const [stripeKey, setStripeKey] = useState(null);

  useEffect(() => {
    getCart().then((res) => setCart(res.data));
    getStripeConfig().then((res) => {
      if (res.data.publishable_key) {
        setStripeKey(res.data.publishable_key);
        stripePromise = loadStripe(res.data.publishable_key);
      }
    });
  }, []);

  if (!cart) return <div className="page"><p className="loading">Loading...</p></div>;

  if (cart.items.length === 0) {
    return (
      <div className="page">
        <div className="cart-empty">
          <h3>Your bag is empty</h3>
          <p>Add items before checkout.</p>
        </div>
      </div>
    );
  }

  if (!stripeKey) {
    return (
      <div className="page">
        <div className="cart-empty">
          <h3>Payment Not Configured</h3>
          <p>Stripe keys not set. Add STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY to .env</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="cart-hero">
        <h1>Checkout</h1>
      </div>
      <div className="page">
        <Elements stripe={stripePromise}>
          <CheckoutForm cart={cart} />
        </Elements>
      </div>
    </div>
  );
}
