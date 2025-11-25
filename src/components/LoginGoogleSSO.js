// LoginGoogleSSO.jsx — Versão modernizada com design system da dashboard
import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import logo from "../assets/logo_personalizado.png";
import {
  GoogleAuthProvider,
  signInWithCredential
} from "firebase/auth";
import { auth } from "../firebase";

const API_BASE_URL = process.env.REACT_APP_API_URL;
const GOOGLE_CLIENT_ID = process.env.REACT_APP_CLIENT_ID;

const LoginGoogleSSO = () => {
  const navigate = useNavigate();

  // Callback que recebe o token do Google
  const handleCredentialResponse = useCallback(async (response) => {
    try {
      const googleIdToken = response.credential;

      // 1) Login no Firebase usando o token do Google
      const credential = GoogleAuthProvider.credential(googleIdToken);
      await signInWithCredential(auth, credential);

      // 2) Obter ID Token do Firebase
      const firebaseIdToken = await auth.currentUser.getIdToken();

      // 3) Enviar token ao backend
      const authResponse = await fetch(`${API_BASE_URL}/auth/sso-firebase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseIdToken })
      });

      const data = await authResponse.json();

      if (!authResponse.ok) throw new Error(data.message);

      // 4) Salvar dados do usuário no localStorage
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("accessLevel", data.user.accessLevel);
      localStorage.setItem("team", data.user.team);
      localStorage.setItem("name", data.user.name);
      localStorage.setItem("photoUrl", data.user.photoUrl);

      navigate("/dashboard");

    } catch (err) {
      console.error("Erro no login Google SSO:", err);
      alert(err.message);
      auth.signOut();
    }
  }, [navigate]);

  useEffect(() => {
    if (!window.google) {
      console.error("Google Identity Services não carregou!");
      return;
    }

    console.log("Google Identity Services carregado!");

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(
      document.getElementById("google-sign-in-button"),
      {
        theme: "outline",
        size: "large",
        shape: "pill",
        width: 300
      }
    );

  }, [handleCredentialResponse]);

  return (
    <div className="login-layout">
      {/* Background gradient igual ao da dashboard */}
      <div className="login-background"></div>
      
      <div className="login-container">
        <div className="login-card-modern">
          {/* Header do card */}
          <div className="login-card-header">
            <img src={logo} alt="Logo Sebratel" className="login-logo" />

          </div>

          {/* Conteúdo principal */}
          <div className="login-card-content">
            <h2 className="card-title-modern">Acessar Dashboards</h2>
            <p className="card-subtitle-modern">
              Entre com sua conta Google corporativa
            </p>

            <div className="google-button-container">
              <div id="google-sign-in-button" className="google-sso-button-wrapper"></div>
            </div>

            <div className="login-features">
              <div className="feature-item">
                <i className="fas fa-chart-bar feature-icon"></i>
                <span>Dashboards Power BI</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-shield-alt feature-icon"></i>
                <span>Acesso Seguro</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-users feature-icon"></i>
                <span>Gerenciamento por Times</span>
              </div>
            </div>
          </div>

          {/* Footer do card */}
          <div className="login-card-footer">
            <p className="info-message-footer">
              <i className="fas fa-info-circle"></i>
              Apenas contas autorizadas do Google Workspace
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginGoogleSSO;