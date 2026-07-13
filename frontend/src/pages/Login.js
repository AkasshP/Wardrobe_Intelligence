import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { login, getMe } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.redirectAfter || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await login(email, password);
      localStorage.setItem("token", res.data.access_token);
      const me = await getMe();
      loginUser(res.data.access_token, me.data);
      navigate(redirectTo);
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{display:'flex',justifyContent:'center',marginBottom:'1rem'}}><Logo /></div>
        <h1>Wardrobe Intelligence</h1>
        <p className="auth-subtitle">Sign in to your wardrobe</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">Sign In</button>
        </form>
        <p className="auth-switch">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
