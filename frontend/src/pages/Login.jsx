import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";
import "./Login.css";

const ROLE_HOME = { admin: "/dashboard", interviewer: "/dashboard", user: "/dashboard" };

function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogleCredential = async (credential) => {
    setError("");
    setLoading(true);
    try {
      const user = await loginWithGoogle(credential);
      const returnTo = new URLSearchParams(window.location.search).get("returnTo");
      navigate(returnTo || ROLE_HOME[user.role] || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both your email and password.");
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      const returnTo = new URLSearchParams(window.location.search).get("returnTo");
      navigate(returnTo || ROLE_HOME[user.role] || "/dashboard", { replace: true });
    } catch (err) {
      if (err.status === 400) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(err.message || "Could not reach the server. Is the backend running?");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="syncspace-brand">
          <img className="syncspace-logo" src="/SyncSpace%20Logo.png" alt="SyncSpace" />
          <p>Collaborate. Create. Connect.</p>
        </div>

        <div className="login-card">
          <h2>Welcome Back</h2>
          <p className="login-subtitle">Sign in to continue to your workspace</p>

          {error && (
            <div className="auth-alert" role="alert">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} noValidate>
            <div className="input-group">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="login-password">Password</label>
              <div className="password-field">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="forgot-password">
              <a href="#">Forgot password?</a>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="login-divider"><span>or</span></div>
          <GoogleSignInButton
            onCredential={handleGoogleCredential}
            onSetupRequired={() => setError("Google sign-in needs a Google OAuth web Client ID. Add it to both frontend and backend environment files.")}
            disabled={loading}
          />

          <p className="register-link">
            Don't have an account? <Link to="/register">Create account</Link>
          </p>
        </div>

        <p className="login-footer">© 2026 SyncSpace</p>
      </div>
    </div>
  );
}

export default Login;
