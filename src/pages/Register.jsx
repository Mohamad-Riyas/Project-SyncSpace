import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const handleRegister = (event) => {
    event.preventDefault();
    window.localStorage.setItem("syncspace-authenticated", "true");
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="register-page">

      <div className="register-container">

        {/* SyncSpace Brand */}
        <div className="register-brand">

          <div className="register-logo">
            S
          </div>

          <h1>SyncSpace</h1>

          <p>Collaborate. Create. Connect.</p>

        </div>

        {/* Register Card */}
        <div className="register-card">

          <h2>Create Account</h2>

          <p className="register-subtitle">
            Join SyncSpace and start collaborating
          </p>

          <form onSubmit={handleRegister}>

            <div className="register-input-group">
              <label>Full Name</label>

              <input
                type="text"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="register-input-group">
              <label>Email</label>

              <input
                type="email"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="register-input-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Create a password"
                required
              />
            </div>

            <div className="register-input-group">
              <label>Confirm Password</label>

              <input
                type="password"
                placeholder="Confirm your password"
                required
              />
            </div>

            <button
              type="submit"
              className="register-button"
            >
              Create Account
            </button>

          </form>

          <p className="login-link">
            Already have an account?{" "}
            <Link to="/login">Login</Link>
          </p>

        </div>

        <p className="register-footer">
          © 2026 SyncSpace
        </p>

      </div>

    </div>
  );
}

export default Register;