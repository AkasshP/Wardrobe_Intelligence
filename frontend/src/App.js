import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Wardrobe from "./pages/Wardrobe";
import Upload from "./pages/Upload";
import Suggestions from "./pages/Suggestions";
import Shop from "./pages/Shop";
import GapAnalysis from "./pages/GapAnalysis";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Orders from "./pages/Orders";
import BodyScan from "./pages/BodyScan";
import TryOn from "./pages/TryOn";
import "./App.css";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
}

function GuestRoute({ children }) {
  const { loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Guest-accessible routes */}
          <Route path="/" element={<GuestRoute><Dashboard /></GuestRoute>} />
          <Route path="/shop" element={<GuestRoute><Shop /></GuestRoute>} />
          <Route path="/cart" element={<GuestRoute><Cart /></GuestRoute>} />
          <Route path="/wishlist" element={<GuestRoute><Wishlist /></GuestRoute>} />
          <Route path="/try-on" element={<GuestRoute><TryOn /></GuestRoute>} />
          <Route path="/body-scan" element={<GuestRoute><BodyScan /></GuestRoute>} />

          {/* Auth-required routes */}
          <Route path="/wardrobe" element={<PrivateRoute><Wardrobe /></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
          <Route path="/suggestions" element={<PrivateRoute><Suggestions /></PrivateRoute>} />
          <Route path="/gaps" element={<PrivateRoute><GapAnalysis /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
          <Route path="/order-confirmation/:orderId" element={<PrivateRoute><OrderConfirmation /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
