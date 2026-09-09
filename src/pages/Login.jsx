import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const handleLogin = (event) => {
    event.preventDefault();
    window.localStorage.setItem("syncspace-authenticated", "true");
    const returnTo = new URLSearchParams(window.location.search).get("returnTo");
    navigate(returnTo || "/dashboard", { replace: true });
  };

  return (
    <div className="login-page">

      {/* SyncSpace Logo / Brand */}
      <div className="login-container">

        <div className="syncspace-brand">
          <div className="syncspace-logo">S</div>

          <h1>SyncSpace</h1>

          <p>Collaborate. Create. Connect.</p>
        </div>

        {/* Login Card */}
        <div className="login-card">

          <h2>Welcome Back</h2>

          <p className="login-subtitle">
            Sign in to continue to your workspace
          </p>

          <form onSubmit={handleLogin}>

            <div className="input-group">
              <label>Email</label>

              <input
                type="email"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="forgot-password">
              <a href="#">Forgot password?</a>
            </div>

            <button type="submit" className="login-button">
              Login
            </button>

          </form>

          <p className="register-link">
            Don't have an account?{" "}
            <Link to="/register">Create account</Link>
          </p>

        </div>

        <p className="login-footer">
          © 2026 SyncSpace
        </p>

      </div>

    </div>
  );
}

export default Login;