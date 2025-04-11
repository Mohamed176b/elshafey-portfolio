import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { signIn, supabase } from "../../supabase/supabaseClient";
import { setUserSession } from "../../utils/authUtils";
import "../../styles/Login.css";

/**
 * AdminLogin Component
 * Handles administrator authentication for the dashboard.
 *
 * Features:
 * - Secure login form
 * - Email/password validation
 * - Session management
 * - Error handling
 */
const AdminLogin = () => {
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const navigate = useNavigate();
  const [infoMessage, setInfoMessage] = useState("");

  useEffect(() => {
    document.title = "Dashboard Login";
  }, []);

  /**
   * Form submission handler
   * Validates credentials and creates user session
   * @param {Event} e - Form submission event
   */
  const handleLogin = useCallback(async () => {
    const email = emailRef.current.value;
    const password = passwordRef.current.value;

    // Validate inputs before attempting to sign in
    if (!validateInputs(email, password)) {
      return;
    }

    setInfoMessage("Logging in...");
    const result = await signIn(email, password);

    if (result.error) {
      alert(result.error);
    } else {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const sessionSaved = setUserSession(result.data.user);
        if (sessionSaved) {
          navigate("/dashboard");
        } else {
          setInfoMessage("Failed to save session!");
        }
      } else {
        setInfoMessage("Failed to save session!");
      }
    }
    setInfoMessage("");
  }, [navigate]);

  // Input validation function
  const validateInputs = (email, password) => {
    // Email validation using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setInfoMessage("Please enter a valid email address");
      return false;
    }

    // Password validation
    if (!password || password.length < 6) {
      setInfoMessage("Password must be at least 6 characters long");
      return false;
    }

    return true;
  };

  const loginForm = useMemo(
    () => (
      <div className="login-card">
        <h1>Login To The Dashboard</h1>
        <div className="inputs">
          <input type="email" placeholder="email" required ref={emailRef} />
          <input
            type="password"
            placeholder="Password"
            required
            ref={passwordRef}
          />
        </div>
        <button className="login-btn" onClick={handleLogin}>
          Login
        </button>
      </div>
    ),
    [handleLogin]
  );

  return (
    <div className="login-page">
      {infoMessage && <div className="toast">{infoMessage}</div>}
      {loginForm}
    </div>
  );
};

export default AdminLogin;
