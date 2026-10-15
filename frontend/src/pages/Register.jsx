import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate(role === "interviewer" ? "/interviews" : "/dashboard", { replace: true });
    } catch (err) {
      if (err.status === 400) {
        setError(err.message || "That email is already registered.");
      } else {
        setError(err.message || "Could not reach the server. Is the backend running?");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-brand">
          <img className="register-logo" src="/SyncSpace%20Logo.png" alt="SyncSpace" />
          <p>Collaborate. Create. Connect.</p>
        </div>

        <div className="register-card">
          <h2>Create Account</h2>
          <p className="register-subtitle">Join SyncSpace and start collaborating</p>

          {error && (
            <div className="auth-alert" role="alert">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} noValidate>
            <div className="register-input-group">
              <label htmlFor="reg-name">Full Name</label>
              <input id="reg-name" type="text" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="register-input-group">
              <label htmlFor="reg-email">Email</label>
              <input id="reg-email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="register-input-group">
              <label htmlFor="reg-role">I am joining as a</label>
              <select id="reg-role" value={role} onChange={(e) => setRole(e.target.value)} required>
                <option value="user">Candidate / User — join interviews & collaborate</option>
                <option value="interviewer">Interviewer — create & run interviews</option>
              </select>
              <span className="field-hint">Admin accounts are provisioned separately and can't be self-registered.</span>
            </div>

            <div className="register-input-group">
              <label htmlFor="reg-password">Password</label>
              <div className="password-field">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="register-input-group">
              <label htmlFor="reg-confirm">Confirm Password</label>
              <input id="reg-confirm" type={showPassword ? "text" : "password"} placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>

            <button type="submit" className="register-button" disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="login-link">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>

        <p className="register-footer">© 2026 SyncSpace</p>
      </div>
    </div>
  );
}

export default Register;
