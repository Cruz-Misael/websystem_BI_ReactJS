// UserDashboard.js (Versão Atualizada para SSO)
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UserDashboard.css';
import logo from '../assets/sebraFundoBranco.jpg'; 

const API_BASE_URL = process.env.REACT_APP_API_URL;

const UserDashboard = () => {
  const [dashboards, setDashboards] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState('');
  const [userTeam, setUserTeam] = useState('');
  const navigate = useNavigate();

  const fetchDashboards = useCallback(async (team) => {
    try {
      // Continua buscando dashboards pelo time, como já estava
      const response = await fetch(`${API_BASE_URL}/dashboard/team/${team}`);
      const data = await response.json();
      setDashboards(data);
    } catch (error) {
      console.error("Erro ao buscar dashboards:", error);
    }
  }, []);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    const level = localStorage.getItem("accessLevel");
    const team = localStorage.getItem("team");

    if (!email || !level || !team) {
      // Redireciona para a nova tela de login SSO
      navigate('/login-sso'); 
    } else {
      setUserEmail(email);
      setAccessLevel(level);
      setUserTeam(team);
      fetchDashboards(team);
    }
  }, [fetchDashboards, navigate]);

  const logout = () => {
    // Limpa o localStorage
    localStorage.removeItem("userEmail");
    localStorage.removeItem("accessLevel");
    localStorage.removeItem("team");
    
    // Desloga do Google Identity Services (opcional, mas recomendado)
    if (window.google && window.google.accounts.id) {
        window.google.accounts.id.disableAutoSelect();
    }
    
    navigate('/login-sso');
  };

  // ... (Restante do código do UserDashboard, incluindo goToConfig, DashboardAdmin, Teams, openFullscreen)
  // A lógica de permissão (accessLevel === "Admin") permanece a mesma.

  const goToConfig = () => {
    if (accessLevel === "Admin") {
      navigate('/user-settings');
    } else {
      alert("Acesso negado! Apenas administradores podem acessar a página de configurações.");
    }
  };

  const DashboardAdmin = useCallback(() => {
    if (accessLevel === "Admin") {
      navigate('/dashboard-admin');
    } else {
      alert("Acesso negado!");
    }
  }, [accessLevel, navigate]);

  const Teams = useCallback(() => {
    if (accessLevel === "Admin") {
      navigate('/teams');
    } else {
      alert("Acesso negado!");
    }
  }, [accessLevel, navigate]);

  const openFullscreen = (url) => {
    try {
      const newWindow = window.open(url, "_blank", "fullscreen=yes");
      if (newWindow) newWindow.focus();
      else alert("Navegador bloqueou o pop-up. Permita para abrir em tela cheia.");
    } catch (err) {
      alert("URL inválida.");
    }
  };

  return (
    <div className="dashboard-page">
      <header className="app-header">
        <img src={logo} alt="Logo" className="app-logo" />
        <h1 className="app-title">
          DASHBOARDS: <span>{userTeam}</span> /
        </h1>
        <div className="button-container">
          <button className="config-btn" onClick={goToConfig}>Usuários</button>
          <button className="DashboardAdmin-btn" onClick={DashboardAdmin}>Dashboards</button>
          <button className="Teams-btn" onClick={Teams}>Times</button>
          <button className="logout-btn" onClick={logout}>Sair</button>
        </div>
      </header>

      <main className="dashboard-container">
        <section className="promo-cards">
          {dashboards.length > 0 ? (
            dashboards.map((dash) => (
              <div 
                key={dash.id} 
                className="card" 
                onClick={() => openFullscreen(dash.url)}>
                <img 
                  className="card-logo" 
                  src="https://www.c5alliance.com/wp-content/uploads/2021/01/power-bi_logo.png" 
                  alt="Power BI Logo"
                />
                <h3>{dash.title}</h3>
                <p>{dash.description}</p>
                {dash.url && (
                  <iframe
                    className="dashboard-frame"
                    src={dash.url}
                    title={dash.title}
                    allowFullScreen/>
                 )}
              </div>
            ))
          ) : (
            <p>Nenhum dashboard disponível para seu time.</p>
          )}
        </section>
      </main>

      <footer className="footer-content">
        <h4>
          {userEmail} | Acesso via Google SSO.
        </h4>
      </footer>
    </div>
  );
};

export default UserDashboard;
