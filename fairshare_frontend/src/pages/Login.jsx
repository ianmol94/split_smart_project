import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Couldn't log in");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center-shell">
      <div className="card" style={{ width: "100%", maxWidth: 380 }}>
        <span className="eyebrow">Welcome back</span>
        <h1 style={{ marginTop: "0.3rem" }}>Log in</h1>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>
        <p style={{ marginTop: "1.2rem", fontSize: "0.88rem" }}>
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
