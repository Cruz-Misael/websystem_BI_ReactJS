// DashboardAdmin.js - Versão com Sidebar Completo
import React from 'react'; 
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DashboardAdmin.css';
import logo from '../assets/logo_personalizado.png';

const API_BASE_URL = process.env.REACT_APP_API_URL;

function DashboardAdmin() {
  const [dashboards, setDashboards] = useState([]);
  const [filteredDashboards, setFilteredDashboards] = useState([]);
  const [teams, setTeams] = useState([]);
  const [newDashboard, setNewDashboard] = useState({
    title: '',
    description: '',
    url: '',
    thumbnail: ''
  });
  const [accessRules, setAccessRules] = useState({});
  const [editingDashboard, setEditingDashboard] = useState(null);
  
  // Estados para os filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [sortBy, setSortBy] = useState('title');
  
  // NOVOS ESTADOS PARA OS DADOS DO USUÁRIO
  const [userEmail, setUserEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState('');
  const [userTeam, setUserTeam] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhotoUrl, setUserPhotoUrl] = useState(
    'https://i.ibb.co/68B1zT3/default-avatar.png' 
  );

  const navigate = useNavigate();
  
  const [modal, setModal] = useState({
    isOpen: false,
    type: '',
    title: '',
    message: '',
    dashboardId: null,
    team: '',
    onConfirm: null
  });

  useEffect(() => {
    // PRIMEIRO: Carregar dados do usuário
    const email = localStorage.getItem("userEmail");
    const level = localStorage.getItem("accessLevel");
    const team = localStorage.getItem("team");
    const name = localStorage.getItem("name");
    const photoUrl = localStorage.getItem("photoUrl");

    if (email && level && team) {
      setUserEmail(email);
      setAccessLevel(level);
      setUserTeam(team);
      setUserName(name || '');
      if (photoUrl && photoUrl !== 'PLACEHOLDER_INITIAL') {
        setUserPhotoUrl(photoUrl);
      }
    } else {
      // Se não tem dados, redireciona para login
      navigate('/login-sso');
      return;
    }

    // DEPOIS: Carregar dashboards e times
    fetchDashboards();
    fetchTeams();
  }, [navigate]);

  // Efeito para aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [dashboards, searchTerm, selectedTeam, sortBy]);

  // FUNÇÕES DE NAVEGAÇÃO E LOGOUT
  const goToConfig = () => {
    if (accessLevel === "Admin") {
      navigate('/user-settings');
    } else {
      showErrorModal("Acesso negado! Apenas administradores podem acessar a página de configurações.");
    }
  };

  const Teams = () => {
    if (accessLevel === "Admin") {
      navigate('/teams');
    } else {
      showErrorModal("Acesso negado!");
    }
  };

  const DashboardUser = () => {
    navigate('/dashboard');
  };

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

  const getUserInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };


  useEffect(() => {
    fetchDashboards();
    fetchTeams();
  }, []);

  // Efeito para aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [dashboards, searchTerm, selectedTeam, sortBy]);

  const applyFilters = () => {
    let filtered = [...dashboards];

    // Filtro por termo de busca (título)
    if (searchTerm) {
      filtered = filtered.filter(dashboard =>
        dashboard.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dashboard.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por equipe
    if (selectedTeam) {
      filtered = filtered.filter(dashboard =>
        dashboard.access && dashboard.access.includes(selectedTeam)
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'oldest':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'mostAccess':
          return (b.access?.length || 0) - (a.access?.length || 0);
        case 'leastAccess':
          return (a.access?.length || 0) - (b.access?.length || 0);
        default:
          return 0;
      }
    });

    setFilteredDashboards(filtered);
  };

  const openRemoveAccessModal = (dashboardId, team, dashboardTitle) => {
    setModal({
      isOpen: true,
      type: 'delete',
      title: 'Remover Acesso',
      message: `Tem certeza que deseja remover o acesso do time ${team} ao dashboard "${dashboardTitle}"?`,
      dashboardId: dashboardId,
      team: team,
      onConfirm: () => handleRemoveAccess(dashboardId, team)
    });
  };

  const showSuccessModal = (message) => {
    setModal({
      isOpen: true,
      type: 'success',
      title: 'Sucesso!',
      message: message,
      onConfirm: () => closeModal()
    });
  };

  const showErrorModal = (message) => {
    setModal({
      isOpen: true,
      type: 'error',
      title: 'Erro',
      message: message,
      onConfirm: () => closeModal()
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      type: '',
      title: '',
      message: '',
      dashboardId: null,
      team: '',
      onConfirm: null
    });
  };

  const handleDeleteDashboard = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboards/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao deletar');
      
      fetchDashboards();
      closeModal();
      showSuccessModal('Dashboard excluído com sucesso!');
    } catch (error) {
      console.error(error);
      showErrorModal('Erro ao excluir dashboard');
    }
  };

  const handleRemoveAccess = async (dashboardId, team) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/access`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardID: dashboardId,
          team: team
        })
      });
      
      if (!response.ok) throw new Error('Falha ao remover acesso');
      
      setDashboards(prevDashboards => 
        prevDashboards.map(dashboard => 
          dashboard.id === dashboardId
            ? {
                ...dashboard,
                access: dashboard.access.filter(t => t !== team)
              }
            : dashboard
        )
      );
      
      closeModal();
      showSuccessModal(`Acesso do time ${team} removido com sucesso!`);
      
    } catch (error) {
      console.error('Erro ao remover acesso:', error);
      showErrorModal('Falha ao remover acesso');
    }
  };


  const handleCreateDashboard = async () => {
    if (!newDashboard.title || !newDashboard.url) {
      showErrorModal('Título e URL são obrigatórios');
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDashboard)
      });
      
      fetchDashboards();
      setNewDashboard({ title: '', description: '', url: '', thumbnail: '' });
      showSuccessModal('Dashboard criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar dashboard:', error);
      showErrorModal('Erro ao criar dashboard');
    }
  };

  const fetchDashboardAccess = async (dashboardId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/access?dashboardId=${dashboardId}`);
        if (!response || !response.ok) {
            throw new Error(`Erro ao buscar acessos: ${response?.status || "sem resposta"}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Resposta não é JSON: ${text.substring(0, 100)}...`);
        }
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error(`Erro ao buscar acessos para dashboard ${dashboardId}:`, error);
        return [];
    }
  };

  const fetchDashboards = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard`);
      if (!response.ok) throw new Error('Erro ao buscar dashboards');
      const dashboards = await response.json();
      
      const dashboardsWithAccess = await Promise.all(
        dashboards.map(async dashboard => {
          const accessList = await fetchDashboardAccess(dashboard.id);
          return {
            ...dashboard,
            access: accessList.map(item => item.team)
          };
        })
      );

      setDashboards(dashboardsWithAccess);
      
      const initialAccessRules = {};
      dashboardsWithAccess.forEach(dashboard => {
        if (dashboard.access && dashboard.access.length > 0) {
          initialAccessRules[dashboard.id] = dashboard.access[0];
        }
      });
      setAccessRules(initialAccessRules);
      
    } catch (error) {
      console.error('Falha ao carregar dashboards:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/teams`);
      if (!response.ok) throw new Error('Erro ao buscar times');
      const data = await response.json();
      if (data.success) {
        setTeams(data.data.map(team => team.name));
      } else {
        throw new Error(data.message || 'Erro ao carregar times');
      }
    } catch (error) {
      console.error('Falha ao carregar times:', error);
    }
  };

  

  const handleSetAccess = async (dashboardId) => {
    if (!accessRules[dashboardId]) {
      showErrorModal('Selecione um time antes de definir o acesso');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardID: dashboardId,
          team: accessRules[dashboardId],
          accessLevel: 'view'
        })
      });
      
      if (!response.ok) throw new Error('Falha ao atualizar regras');
      
      setDashboards(prevDashboards => 
        prevDashboards.map(dashboard => 
          dashboard.id === dashboardId
            ? {
                ...dashboard,
                access: [...(dashboard.access || []), accessRules[dashboardId]]
              }
            : dashboard
        )
      );
      
      // Limpa o select após adicionar
      setAccessRules(prev => ({
        ...prev,
        [dashboardId]: ''
      }));

      showSuccessModal(`Acesso concedido ao time ${accessRules[dashboardId]}!`);
      
    } catch (error) {
      console.error('Erro:', error);
      showErrorModal('Falha ao atualizar regras de acesso');
    }
  };

  const handleEditDashboard = (dashboard) => {
    setEditingDashboard({ ...dashboard });
  };

  const handleSaveDashboardEdit = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboards/${editingDashboard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingDashboard.title,
          description: editingDashboard.description,
          url: editingDashboard.url
        })
      });
      if (!response.ok) throw new Error('Erro ao editar dashboard');
      setEditingDashboard(null);
      fetchDashboards();
      showSuccessModal('Dashboard atualizado com sucesso!');
    } catch (error) {
      console.error(error);
      showErrorModal('Erro ao salvar edição');
    }
  };

  const openDeleteModal = (dashboardId, dashboardTitle) => {
    setModal({
      isOpen: true,
      type: 'delete',
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o dashboard "${dashboardTitle}"? Esta ação não pode ser desfeita.`,
      dashboardId: dashboardId,
      onConfirm: () => handleDeleteDashboard(dashboardId)
    });
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTeam('');
    setSortBy('title');
  };


  return (
    <div className="app-layout">
      {/* SIDEBAR COMPLETO COM DADOS DO USUÁRIO */}
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
          <button className="nav-btn" onClick={DashboardUser}>
            <i className="fas fa-chart-bar"></i> Meus Dashboards
          </button>
          
          {accessLevel === "Admin" && (
            <>
              <button className="nav-btn active">
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

      {/* CONTEÚDO PRINCIPAL (TODO O SEU JSX EXISTENTE) */}
      <div className="main-content">
        <header className="main-header">
          <div className="header-left">
            <img src={logo} alt="Logo Sebratel" className="header-logo" />
            <h1 className="header-title-text">
              Gerenciamento de Dashboards
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

        <main className="admin-content">
          {/* Seção de Ações Rápidas */}
          <section className="quick-actions-section">
            <div className="actions-header">
              <h3>
                <i className="fas fa-bolt"></i>
                Ações Rápidas
              </h3>
            </div>
            <div className="actions-grid">
              <button 
                className="quick-action-btn primary-action"
                onClick={() => document.querySelector('.create-dashboard-form').scrollIntoView({ behavior: 'smooth' })}
              >
                <i className="fas fa-plus-circle"></i>
                <span>Criar Novo Dashboard</span>
              </button>
              <button 
                className="quick-action-btn secondary-action"
                onClick={() => navigate('/teams')}
              >
                <i className="fas fa-users-cog"></i>
                <span>Gerenciar Setores</span>
              </button>
            </div>
          </section>
          {/* Seção de Filtros */}
          <section className="filters-section">
            <div className="filters-header">
              <h3>
                <i className="fas fa-filter"></i>
                Filtros e Ordenação
              </h3>
              <button 
                className="clear-filters-btn"
                onClick={clearFilters}
                disabled={!searchTerm && !selectedTeam && sortBy === 'title'}
              >
                <i className="fas fa-times"></i>
                Limpar Filtros
              </button>
            </div>

            <div className="filters-grid">
              <div className="filter-group">
                <label>
                  <i className="fas fa-search"></i>
                  Buscar Dashboard
                </label>
                <input
                  type="text"
                  placeholder="Buscar por título ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label>
                  <i className="fas fa-users"></i>
                  Filtrar por Equipe
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Todas as equipes</option>
                  {teams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>
                  <i className="fas fa-sort"></i>
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="title">Título (A-Z)</option>
                  <option value="newest">Mais Recentes</option>
                  <option value="oldest">Mais Antigos</option>
                  <option value="mostAccess">Mais Acessos</option>
                  <option value="leastAccess">Menos Acessos</option>
                </select>
              </div>
            </div>

            <div className="filters-stats">
              <span className="stat-item">
                <strong>{filteredDashboards.length}</strong> de <strong>{dashboards.length}</strong> dashboards
              </span>
              {(searchTerm || selectedTeam) && (
                <span className="active-filters">
                  Filtros ativos: 
                  {searchTerm && <span className="filter-tag">Busca: "{searchTerm}"</span>}
                  {selectedTeam && <span className="filter-tag">Equipe: {selectedTeam}</span>}
                </span>
              )}
            </div>
          </section>

          {/* Lista de Dashboards Existentes */}
          <section className="admin-section">
            <div className="section-header">
              <i className="fas fa-chart-bar section-icon"></i>
              <h2>
                Todos os Dashboards 
                <span className="count-badge">{filteredDashboards.length}</span>
              </h2>
            </div>

            {filteredDashboards.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-inbox"></i>
                <h3>Nenhum dashboard encontrado</h3>
                <p>
                  {dashboards.length === 0 
                    ? 'Comece criando seu primeiro dashboard.' 
                    : 'Tente ajustar os filtros para ver mais resultados.'
                  }
                </p>
                {dashboards.length === 0 && (
                  <button 
                    className="primary-btn"
                    onClick={() => document.querySelector('.create-dashboard-form').scrollIntoView({ behavior: 'smooth' })}
                  >
                    <i className="fas fa-plus"></i>
                    Criar Primeiro Dashboard
                  </button>
                )}
              </div>
            ) : (
              <div className="dashboard-grid">
                {filteredDashboards.map(dashboard => (
                  <div key={dashboard.id} className="dashboard-admin-card">
                    <div className="card-header">
                      <div className="card-title-section">
                        <h3 className="card-title">{dashboard.title}</h3>
                        <div className="dashboard-stats">
                          <span className="stat">
                            <i className="fas fa-users"></i>
                            {dashboard.access?.length || 0} times
                          </span>
                        </div>
                      </div>
                      <div className="card-actions">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEditDashboard(dashboard)}
                          title="Editar Dashboard"
                        >
                          <i className="fas fa-edit"></i>
                          <span>Editar</span>
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => openDeleteModal(dashboard.id, dashboard.title)}
                          title="Deletar Dashboard"
                        >
                          <i className="fas fa-trash"></i>
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>

                    <p className="card-description">{dashboard.description}</p>
                    <div className="card-url-container">
                      <i className="fas fa-link"></i>
                      <span className="card-url">{dashboard.url}</span>
                    </div>

                    {/* Acessos Atuais */}
                    {dashboard.access && dashboard.access.length > 0 && (
                      <div className="access-section">
                        <h4 className="access-title">
                          <i className="fas fa-users"></i>
                          Times com Acesso
                        </h4>
                        <div className="access-tags">
                          {dashboard.access.map(team => (
                            <span key={`${dashboard.id}-${team}`} className="access-tag">
                              {team}
                              <button 
                                className="remove-tag"
                                onClick={() => openRemoveAccessModal(dashboard.id, team, dashboard.title)}
                                title="Remover acesso"
                              >
                                <span>❌</span>
                                <i className="fas fa-times"></i>
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Adicionar Novo Acesso */}
                    <div className="add-access-section">
                      <select
                        value={accessRules[dashboard.id] || ''}
                        onChange={(e) => setAccessRules({
                          ...accessRules,
                          [dashboard.id]: e.target.value
                        })}
                        className="access-select"
                      >
                        <option value="">Selecione um time para adicionar...</option>
                        {teams
                          .filter(team => !dashboard.access?.includes(team))
                          .map(team => (
                            <option key={team} value={team}>{team}</option>
                          ))
                        }
                      </select>
                      <button 
                        onClick={() => handleSetAccess(dashboard.id)}
                        className="secondary-btn access-btn"
                        disabled={!accessRules[dashboard.id]}
                      >
                        <i className="fas fa-plus"></i>
                        Adicionar Acesso
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Seção de Criação */}
          <section className="admin-section create-section">
            <div className="section-header">
              <i className="fas fa-plus-circle section-icon"></i>
              <h2>Criar Novo Dashboard</h2>
            </div>
            
            <div className="create-dashboard-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Título do Dashboard *</label>
                  <input
                    placeholder="Digite o título do dashboard..."
                    value={newDashboard.title}
                    onChange={(e) => setNewDashboard({...newDashboard, title: e.target.value})}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>URL do Dashboard *</label>
                  <input
                    placeholder="https://app.powerbi.com/..."
                    value={newDashboard.url}
                    onChange={(e) => setNewDashboard({...newDashboard, url: e.target.value})}
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  placeholder="Descreva o propósito e conteúdo deste dashboard..."
                  value={newDashboard.description}
                  onChange={(e) => setNewDashboard({...newDashboard, description: e.target.value})}
                  className="form-textarea"
                  rows="3"
                />
              </div>
              
              <button 
                onClick={handleCreateDashboard}
                className="primary-btn create-btn"
                disabled={!newDashboard.title || !newDashboard.url}
              >
                <i className="fas fa-plus"></i>
                Criar Dashboard
              </button>
            </div>
          </section>
        </main>

        {/* Modal de Edição */}
        {editingDashboard && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Editar Dashboard</h2>
                <button 
                  className="close-btn"
                  onClick={() => setEditingDashboard(null)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label>Título *</label>
                  <input
                    value={editingDashboard.title}
                    onChange={(e) =>
                      setEditingDashboard({ ...editingDashboard, title: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>URL *</label>
                  <input
                    value={editingDashboard.url}
                    onChange={(e) =>
                      setEditingDashboard({ ...editingDashboard, url: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Descrição</label>
                  <textarea
                    value={editingDashboard.description}
                    onChange={(e) =>
                      setEditingDashboard({ ...editingDashboard, description: e.target.value })
                    }
                    className="form-textarea"
                    rows="3"
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="secondary-btn" onClick={() => setEditingDashboard(null)}>
                  Cancelar
                </button>
                <button 
                  className="primary-btn" 
                  onClick={handleSaveDashboardEdit}
                  disabled={!editingDashboard.title || !editingDashboard.url}
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Customizado */}
        {modal.isOpen && (
          <div className="modal-overlay custom-modal-overlay">
            <div className="custom-modal">
              <div className={`modal-header ${modal.type}`}>
                <div className="modal-icon">
                  {modal.type === 'delete' && <i className="fas fa-exclamation-triangle"></i>}
                  {modal.type === 'success' && <i className="fas fa-check-circle"></i>}
                  {modal.type === 'error' && <i className="fas fa-times-circle"></i>}
                </div>
                <h3>{modal.title}</h3>
                <button className="close-modal-btn" onClick={closeModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="modal-body">
                <p>{modal.message}</p>
              </div>
              
              <div className="modal-footer">
                {modal.type === 'delete' && (
                  <>
                    <button className="btn-secondary" onClick={closeModal}>
                      Cancelar
                    </button>
                    <button 
                      className="btn-danger" 
                      onClick={modal.onConfirm}
                    >
                      <i className="fas fa-trash"></i>
                      Confirmar Exclusão
                    </button>
                  </>
                )}
                
                {(modal.type === 'success' || modal.type === 'error') && (
                  <button className="btn-primary" onClick={modal.onConfirm}>
                    OK
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardAdmin;