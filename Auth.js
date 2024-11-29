import React, { useState } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import "./Auth.css"; // Importing CSS for styling

const Auth = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      onLogin(userCredential.user);
    } catch (error) {
      alert(`Error logging in: ${error.message}`);
    }
  };

  const handleGoogleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      onLogin(result.user);
    } catch (error) {
      alert(`Google login error: ${error.message}`);
    }
  };

  return (
    <div className="wrapper">
      <div className="logo">
        <img src="logo512.png" alt="logo" />
      </div>
      <div className="name">Welcome Back</div>
      <div className="form-field">
        <i className="bi bi-envelope"></i>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="form-field">
        <i className="bi bi-lock"></i>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button className="btn" onClick={handleLogin}>
        <i className="bi bi-box-arrow-in-right"></i> Log In
      </button>
      <button className="btn btn-google" onClick={handleGoogleLogin}>
        <i className="bi bi-google"></i> Log In with Google
      </button>
      <a href="#">Forgot Password?</a>
    </div>
  );
};

export default Auth;
