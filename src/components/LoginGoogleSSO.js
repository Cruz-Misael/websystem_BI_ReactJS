// LoginGoogleSSO.jsx — Versão estável com Botão Google + Firebase
import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import logo from "../assets/logo_personalizado.png";

import { getAuth, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { app } from "../firebase";

const auth = getAuth(app);

const API_BASE_URL = process.env.REACT_APP_API_URL;
const GOOGLE_CLIENT_ID = process.env.REACT_APP_CLIENT_ID;


const LoginGoogleSSO = () => {
  const navigate = useNavigate();

  // Callback que recebe o token do Google
  const handleCredentialResponse = useCallback(async (response) => {
    try {
      const googleIdToken = response.credential;

      // 1) Login no Firebase com o ID token do Google
      const credential = GoogleAuthProvider.credential(googleIdToken);
      await signInWithCredential(auth, credential);

      // 2) Obter Firebase ID Token
      const firebaseIdToken = await auth.currentUser.getIdToken();

      // 3) Enviar para seu backend na Cloud Run
      const authResponse = await fetch(`${API_BASE_URL}/auth/sso-firebase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseIdToken })
      });

      const data = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(data.message);
      }

      // 4) Salvar dados de acesso
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("accessLevel", data.user.accessLevel);
      localStorage.setItem("team", data.user.team);
      localStorage.setItem("name", data.user.name);

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

    // Inicializa o Google Sign-In (botão)
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    // Renderiza o botão Google
    window.google.accounts.id.renderButton(
      document.getElementById("google-sign-in-button"),
      {
        theme: "outline",
        size: "large",
        shape: "pill",
        width: 300
      }
    );

    // 👉 NÃO usar prompt() no localhost (causa erros FedCM)
    // window.google.accounts.id.prompt();

  }, [handleCredentialResponse]);

  return (
    <div className="login-container">
      <img src={logo} alt="Logo" />
      <h2>Acesse sua conta corporativa</h2>

      {/* Botão Google */}
      <div id="google-sign-in-button"></div>

      <p className="info-message">
        Use sua conta do Google Workspace para acessar o sistema.
      </p>
    </div>
  );
};

export default LoginGoogleSSO;
