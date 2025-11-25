// UserDashboard.js - Versão com Ícone Único de Barras
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UserDashboard.css';
// Altere o caminho da logo se for diferente
import logo from '../assets/logo_personalizado.png'; 

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Componente único com visual de barras para todos os dashboards
const DashboardVisual = () => {
  // Gera alturas aleatórias para as barras para dar variedade visual
  const getRandomHeight = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  return (
    <div className="dashboard-visual">
      <div className="visual-chart">
        <div className="chart-bar" style={{ height: `${getRandomHeight(40, 90)}%` }}></div>
        <div className="chart-bar" style={{ height: `${getRandomHeight(30, 80)}%` }}></div>
        <div className="chart-bar" style={{ height: `${getRandomHeight(50, 95)}%` }}></div>
        <div className="chart-bar" style={{ height: `${getRandomHeight(20, 70)}%` }}></div>
        <div className="chart-bar" style={{ height: `${getRandomHeight(60, 85)}%` }}></div>
      </div>
      <div className="category-badge">Dashboard</div>
    </div>
  );
};

const UserDashboard = () => {
    const [dashboards, setDashboards] = useState([]);
    const [userEmail, setUserEmail] = useState('');
    const [accessLevel, setAccessLevel] = useState('');
    const [userTeam, setUserTeam] = useState('');
    const [userName, setUserName] = useState('');
    const [userPhotoUrl, setUserPhotoUrl] = useState(
      'https://i.ibb.co/68B1zT3/default-avatar.png' 
    ); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardCount, setDashboardCount] = useState(0); // Novo estado para contagem
    const navigate = useNavigate();

    // =========================================================
    // 1. FUNÇÕES DE BUSCA E LÓGICA
    // =========================================================

    const fetchDashboards = useCallback(async (team) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/team/${team}`);
            if (!response.ok) {
                throw new Error('Falha ao carregar dashboards');
            }
            const data = await response.json();
            setDashboards(data);
            setDashboardCount(data.length); // Atualiza a contagem
        } catch (error) {
            console.error("Erro ao buscar dashboards:", error);
            setError('Não foi possível carregar os dashboards. Tente novamente mais tarde.');
            setDashboardCount(0); // Zera a contagem em caso de erro
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = () => {
        // Limpa o localStorage
        localStorage.removeItem("userEmail");
        localStorage.removeItem("accessLevel");
        localStorage.removeItem("team");
        localStorage.removeItem("name");
        localStorage.removeItem("photoUrl");

        // Desloga do Google Identity Services 
        if (window.google && window.google.accounts.id) {
            window.google.accounts.id.disableAutoSelect();
        }
        
        navigate('/login-sso');
    };

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

    const getUserInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : '?';
    };

    // =========================================================
    // 2. USE EFFECT (Definição dos dados do usuário)
    // =========================================================
    
    useEffect(() => {
        const email = localStorage.getItem("userEmail");
        const level = localStorage.getItem("accessLevel");
        const team = localStorage.getItem("team");
        const name = localStorage.getItem("name");
        const photoUrl = localStorage.getItem("photoUrl");

        if (!email || !level || !team) {
            navigate('/login-sso');
        } else {
            setUserEmail(email);
            setAccessLevel(level);
            setUserTeam(team);
            setUserName(name);
            if (photoUrl && photoUrl !== 'PLACEHOLDER_INITIAL') {
                setUserPhotoUrl(photoUrl);
            }
            fetchDashboards(team);
        }
    }, [fetchDashboards, navigate]);

    // =========================================================
    // 3. RENDERIZAÇÃO (JSX)
    // =========================================================

    return (
        <div className="app-layout">
            {/* 1. Sidebar (Barra de Navegação Esquerda) */}
            <aside className="app-sidebar">
                {/* Seção do Perfil (Com foto, nome e time) */}
                <div className="user-profile">
                    {userPhotoUrl && userPhotoUrl !== 'PLACEHOLDER_INITIAL' ? (
                        <img src={userPhotoUrl} alt="Foto do Usuário" className="user-avatar" />
                    ) : (
                        <div className="user-avatar user-avatar-initial">
                            {getUserInitial(userName)}
                        </div>
                    )}
                    <h3 className="profile-name">{userName || userEmail}</h3>
                    <p className="profile-team">Setor: {userTeam}</p>
                    <hr className="profile-divider" />
                </div>

                {/* Botões de Ação/Navegação */}
                <nav className="sidebar-nav">
                    <button className="nav-btn active">
                        <i className="fas fa-chart-bar"></i> Meus Dashboards
                    </button>
                    
                    {accessLevel === "Admin" && (
                        <>
                            <button className="nav-btn" onClick={DashboardAdmin}>
                                <i className="fas fa-cog"></i> Gerenciar Dashboards
                            </button>
                            <button className="nav-btn" onClick={Teams}>
                                <i className="fas fa-users"></i> Gerenciar Setores
                            </button>
                            <button className="nav-btn" onClick={goToConfig}>
                                <i className="fas fa-user-lock"></i> Gerenciar Usuários
                            </button>
                        </>
                    )}
                </nav>
                
                {/* Botão Sair no rodapé da Sidebar */}
                <button className="logout-btn-sidebar" onClick={logout}>
                    <i className="fas fa-sign-out-alt"></i> Sair
                </button>
            </aside>

            {/* 2. Conteúdo Principal */}
            <div className="main-content">
                  <header className="main-header">
                    <div className="header-left">
                      <img src={logo} alt="Logo Sebratel" className="header-logo" />
                      <h1 className="header-title-text">
                        Dashboards Sebratel - {userTeam}
                      </h1>
                    </div>

                    <div className="header-right">
                      {/* Informações corporativas */}
                      <div className="header-info">
                        <div className="info-item">
                          <i className="fas fa-building"></i>
                          <span>Sebratel Telecom</span>
                        </div>
                        <div className="info-item">
                          <i className="fas fa-layer-group"></i>
                          <span>Business Intelligence</span>
                        </div>
                        <div className="current-time" id="current-time">
                          {/* Será preenchido via JavaScript */}
                        </div>
                      </div>

                      {/* Notificações - Agora mostra contagem real de dashboards */}
                      <div className="notification-badge" title={`${dashboardCount} dashboards disponíveis`}>
                        <i className="fas fa-chart-bar"></i> {/* Mudei para ícone de gráfico */}
                        {dashboardCount > 0 && (
                          <span className="badge-count">
                            {dashboardCount > 99 ? '99+' : dashboardCount}
                          </span>
                        )}
                      </div>

                      {/* Menu do Usuário */}
                      <div className="user-menu">
                        <div className="user-info-header">
                          <span className="user-name-header">{userName || userEmail}</span>
                          <span className="user-role-header">{accessLevel} • {userTeam}</span>
                        </div>
                        {userPhotoUrl && userPhotoUrl !== 'PLACEHOLDER_INITIAL' ? (
                          <img src={userPhotoUrl} alt="User" className="user-avatar-header" />
                        ) : (
                          <div className="user-avatar-header user-avatar-initial">
                            {getUserInitial(userName)}
                          </div>
                        )}
                      </div>
                    </div>
                  </header>
                <main className="dashboard-grid-container">
                    {isLoading ? (
                        <div className="loading-state">
                            <i className="fas fa-spinner fa-spin"></i>
                            <p>Carregando dashboards...</p>
                        </div>
                    ) : error ? (
                        <div className="error-state">
                            <i className="fas fa-exclamation-triangle"></i>
                            <p>{error}</p>
                            <button onClick={() => fetchDashboards(userTeam)} className="retry-btn">
                                Tentar novamente
                            </button>
                        </div>
                    ) : dashboards.length > 0 ? (
                        <section className="promo-cards-grid">
                            {dashboards.map((dash, index) => (
                                <div 
                                    key={dash.id} 
                                    className="dashboard-card" 
                                    onClick={() => openFullscreen(dash.url)}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="card-preview">
                                        <DashboardVisual />
                                    </div>
                                    <div className="card-info">
                                        <h3 className="card-title-text">{dash.title}</h3>                                        
                                        <div className="card-meta">
                                            <div className="meta-item">
                                                <i className="fas fa-chart-bar"></i>
                                            </div>
                                            <div className="meta-item">
                                                <i className="fas fa-clock"></i>
                                                <span>{dash.description}</span>
                                            </div>
                                        </div>
                                        
                                        <button className="card-action-btn" onClick={(e) => {
                                            e.stopPropagation();
                                            openFullscreen(dash.url);
                                        }}>
                                            Abrir em Tela Cheia <i className="fas fa-external-link-alt"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </section>
                    ) : (
                        <div className="no-dashboards-message">
                            <i className="fas fa-info-circle"></i> 
                            <p>Nenhum dashboard disponível para o time {userTeam}.</p>
                            {accessLevel === "Admin" && (
                                <button onClick={DashboardAdmin} className="add-dashboard-btn">
                                    Adicionar novo dashboard
                                </button>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default UserDashboard;