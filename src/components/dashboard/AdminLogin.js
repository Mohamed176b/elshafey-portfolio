import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, supabase } from "../../supabase/supabaseClient";
import { setUserSession } from "../../utils/authUtils";

const AdminLogin = () => {
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const navigate = useNavigate();
  const [infoMessage, setInfoMessage] = useState("");

  useEffect(() => {
    document.title = "Dashboard Login";
  }, []);

  const handleLogin = async () => {
    setInfoMessage("Logging in..."); 
    const email = emailRef.current.value;
    const password = passwordRef.current.value;
    const result = await signIn(email, password);

    if (result.error) {
      alert(result.error);
    } else {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        setInfoMessage(""); 
        const sessionSaved = setUserSession(result.data.user);
        if (sessionSaved) {
          navigate("/dashboard");
        } else {
          alert("Failed to save session!");
        }
      } else {
        alert("Failed to save session!");
      }
    }
  };

  return (
    <div className="login-page">
      {infoMessage && <div className="toast">{infoMessage}</div>}
      <div className="login-card">
        <h1>Login To The Dashboard</h1>
        <div className="inputs">
          <input
            type="email"
            placeholder="email"
            required
            ref={emailRef}
          />
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
    </div>
  );
};

export default AdminLogin;