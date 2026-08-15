import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand">
          Fairshare<span className="brand-tag">trip expenses</span>
        </Link>
        <nav className="nav-actions">
          {isAuthenticated ? (
            <>
              <span className="hint" style={{ margin: 0 }}>
                {user?.name}
              </span>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-ghost" to="/login">
                Log in
              </Link>
              <Link className="btn btn-primary" to="/register">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
