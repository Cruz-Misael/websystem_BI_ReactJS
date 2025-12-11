// DashboardAdmin.js - Versão Final Completa
import React from 'react'; 
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard_admin.css';
import logo from '../assets/logo_personalizado.png';

const API_BASE_URL = process.env.REACT_APP_API_URL;

function DashboardAdmin() {
  const [dashboards, setDashboards] = useState([]);
  const [filteredDashboards, setFilteredDashboards] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(''); 
  const [newDashboard, setNewDashboard] = useState({
    title: '',
    description: '',
    url: '',
    thumbnail: ''
  });
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [userEmail, setUserEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState('');
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
    email: '',
    onConfirm: null
  });

  useEffect(() => {
    applyFilters();
  }, [dashboards, searchTerm, sortBy]);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    const level = localStorage.getItem("accessLevel");
    const name = localStorage.getItem("name");
    const photoUrl = localStorage.getItem("photoUrl");

    if (email && level) {
      setUserEmail(email);
      setAccessLevel(level);
      setUserName(name || '');
      if (photoUrl && photoUrl !== 'PLACEHOLDER_INITIAL') {
        setUserPhotoUrl(photoUrl);
      }
    } else {
      navigate('/login-sso');
      return;
    }

    fetchDashboards();
    fetchUsers();
  }, [navigate]);

  const openCreateModal = () => {
    setNewDashboard({ title: '', description: '', url: '', thumbnail: '' });
    setShowCreateModal(true);
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (!response.ok) throw new Error('Erro ao buscar usuários');
      const result = await response.json();
      
      if (result.success) {
        setUsers(result.data);
      } else {
        throw new Error(result.message || 'Erro ao carregar usuários');
      }
    } catch (error) {
      console.error('Falha ao carregar usuários:', error);
    }
  };

  const goToConfig = () => {
    if (accessLevel === "Admin") {
      navigate('/user-settings');
    } else {
      showErrorModal("Acesso negado! Apenas administradores podem acessar a página de configurações.");
    }
  };

  const goToAnalytics = () => {
    if (accessLevel === "Admin") {
      navigate('/dashboard-analytics');
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
    localStorage.removeItem("userEmail");
    localStorage.removeItem("accessLevel");
    localStorage.removeItem("name");
    localStorage.removeItem("photoUrl");

    if (window.google && window.google.accounts.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    
    navigate('/login-sso');
  };

  const getUserInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const applyFilters = () => {
    let filtered = [...dashboards];

    if (searchTerm && searchTerm.trim() !== '') {
      filtered = filtered.filter(dashboard =>
        dashboard.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dashboard.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dashboard.emailsWithAccess?.some(email => 
          email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'oldest':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'mostAccess':
          return (b.emailsWithAccess?.length || 0) - (a.emailsWithAccess?.length || 0);
        case 'leastAccess':
          return (a.emailsWithAccess?.length || 0) - (b.emailsWithAccess?.length || 0);
        default:
          return 0;
      }
    });

    setFilteredDashboards(filtered);
  };

  const openRemoveAccessModal = (dashboardId, email, dashboardTitle) => {
    setModal({
      isOpen: true,
      type: 'delete',
      title: 'Remover Acesso',
      message: `Tem certeza que deseja remover o acesso de ${email} ao dashboard "${dashboardTitle}"?`,
      dashboardId: dashboardId,
      email: email,
      onConfirm: () => handleRemoveAccess(dashboardId, email)
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
      email: '',
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

  const handleRemoveAccess = async (dashboardId, email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/access-email`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardID: dashboardId,
          email: email
        })
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Falha ao remover acesso');
      }
      
      setDashboards(prevDashboards => 
        prevDashboards.map(dashboard => 
          dashboard.id === dashboardId
            ? {
                ...dashboard,
                emailsWithAccess: dashboard.emailsWithAccess.filter(e => e !== email)
              }
            : dashboard
        )
      );
      
      closeModal();
      showSuccessModal(`Acesso de ${email} removido com sucesso!`);
      
    } catch (error) {
      console.error('Erro ao remover acesso:', error);
      showErrorModal(error.message || 'Falha ao remover acesso');
    }
  };

  const handleCreateDashboard = async () => {
    if (!newDashboard.title || !newDashboard.url) {
      showErrorModal('Título e URL são obrigatórios');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDashboard)
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erro ao criar dashboard');
      }
      
      fetchDashboards();
      setNewDashboard({ title: '', description: '', url: '', thumbnail: '' });
      setShowCreateModal(false);
      showSuccessModal('Dashboard criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar dashboard:', error);
      showErrorModal(error.message || 'Erro ao criar dashboard');
    }
  };

  const fetchDashboards = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result && result.success && Array.isArray(result.data)) {
        setDashboards(result.data);
      } else {
        throw new Error('Formato de resposta inválido');
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar dashboards:', error);
      showErrorModal(`Falha ao carregar dashboards: ${error.message}`);
    }
  };

  const handleSetAccess = async (dashboardId) => {
    if (!selectedEmail) {
      showErrorModal('Selecione um usuário antes de conceder acesso');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/access-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardID: dashboardId,
          email: selectedEmail
        })
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Falha ao conceder acesso');
      }
      
      setDashboards(prevDashboards => 
        prevDashboards.map(dashboard => 
          dashboard.id === dashboardId
            ? {
                ...dashboard,
                emailsWithAccess: [...(dashboard.emailsWithAccess || []), selectedEmail]
              }
            : dashboard
        )
      );
      
      setSelectedEmail('');
      showSuccessModal(`Acesso concedido para ${selectedEmail}!`);
      
    } catch (error) {
      console.error('Erro:', error);
      showErrorModal(error.message || 'Falha ao conceder acesso');
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
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erro ao editar dashboard');
      }
      
      setEditingDashboard(null);
      fetchDashboards();
      showSuccessModal('Dashboard atualizado com sucesso!');
    } catch (error) {
      console.error(error);
      showErrorModal(error.message || 'Erro ao salvar edição');
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

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('title');
  };

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="user-profile">
          {userPhotoUrl && userPhotoUrl !== 'PLACEHOLDER_INITIAL' ? (
            <img src={userPhotoUrl} alt="Foto do Usuário" className="user-avatar" />
          ) : (
            <div className="user-avatar user-avatar-initial">
              {getUserInitial(userName)}
            </div>
          )}
          <h3 className="profile-name">{userName}</h3>
          <p className="profile-team">Nível: {accessLevel}</p>
          <hr className="profile-divider" />
        </div>

        <nav className="sidebar-nav">
          <button className="nav-btn" onClick={DashboardUser}>
            <i className="fas fa-chart-bar"></i> Meus Dashboards
          </button>
          
          {accessLevel === "Admin" && (
            <>
              <button className="nav-btn active">
                <i className="fas fa-cog"></i> Gerenciar Dashboards
              </button>
              <button className="nav-btn" onClick={goToConfig}>
                <i className="fas fa-user-lock"></i> Gerenciar Usuários
              </button>
              <button className="nav-btn" onClick={goToAnalytics}>
                <i className="fas fa-analytics"></i> Analytics
              </button>
            </>
          )}
        </nav>
        
        <button className="logout-btn-sidebar" onClick={logout}>
          <i className="fas fa-sign-out-alt"></i> Sair
        </button>
        
        <div class="sidebar-footer">
            <p class="footer-title">Sebratel Tecnologia — Todos os direitos reservados</p>
            <p class="footer-subtitle">Desenvolvido pela Equipe de P&D</p>
        </div>


      </aside>

      <div className="main-content">
        <header className="main-header">
          <div className="header-left">
            <img src={logo} alt="Logo Sebratel" className="header-logo" />
            <h1 className="header-title-text">
              Gerenciamento de Dashboards
            </h1>
          </div>

          <div className="header-right">
            <div className="header-info">
              <div className="info-item">
                <i className="fas fa-building"></i>
                <span>Sebratel Telecom</span>
              </div>
              <div className="info-item">
                <i className="fas fa-layer-group"></i>
                <span>Business Intelligence</span>
              </div>
              <div className="current-time" id="current-time"></div>
            </div>
            <div className="user-menu">
              <div className="user-info-header">
                <span className="user-name-header">{userName || userEmail}</span>
                <span className="user-role-header">{accessLevel}</span>
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
                onClick={openCreateModal}
              >
                <i className="fas fa-plus-circle"></i>
                <span>Criar Novo Dashboard</span>
              </button>
              <button 
                className="quick-action-btn secondary-action"
                onClick={goToConfig}
              >
                <i className="fas fa-users-cog"></i>
                <span>Gerenciar Usuários</span>
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
                disabled={!searchTerm && sortBy === 'title'}
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
                  placeholder="Buscar por título, descrição ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="filter-input"
                />
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
              {searchTerm && (
                <span className="active-filters">
                  Filtros ativos: 
                  <span className="filter-tag">Busca: "{searchTerm}"</span>
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
                    onClick={openCreateModal}
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
                            <i className="fas fa-envelope"></i>
                            {dashboard.emailsWithAccess?.length || 0} emails
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
                    {dashboard.emailsWithAccess && dashboard.emailsWithAccess.length > 0 && (
                      <div className="access-section">
                        <h4 className="access-title">
                          <i className="fas fa-envelope"></i>
                          Emails com Acesso
                        </h4>
                        <div className="access-tags">
                          {dashboard.emailsWithAccess.map(email => (
                            <span key={`${dashboard.id}-${email}`} className="access-tag">
                              {email}
                              <button 
                                className="remove-tag"
                                onClick={() => openRemoveAccessModal(dashboard.id, email, dashboard.title)}
                                title="Remover acesso"
                              >
                                <i className="fas fa-times"></i>
                                <span>X</span>
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Adicionar Novo Acesso */}
                    <div className="add-access-section">
                      <select
                        value={selectedEmail}
                        onChange={(e) => setSelectedEmail(e.target.value)}
                        className="access-select"
                      >
                        <option value="">Selecione um usuário...</option>
                        {users
                          // 1. Filtragem (mantida)
                          .filter(user => !dashboard.emailsWithAccess?.includes(user.email))
                          // 2. Ordenação (NOVA ETAPA)
                          .sort((a, b) => {
                            // Converte para letras minúsculas para garantir uma ordenação case-insensitive (ignorando maiúsculas/minúsculas)
                            const nameA = a.name.toLowerCase();
                            const nameB = b.name.toLowerCase();

                            if (nameA < nameB) {
                              return -1; // 'a' vem antes de 'b'
                            }
                            if (nameA > nameB) {
                              return 1; // 'a' vem depois de 'b'
                            }
                            return 0; // Nomes são iguais
                          })
                          // 3. Mapeamento (mantido)
                          .map(user => (
                            <option key={user.id} value={user.email}>
                              {user.name} ({user.email}) - {user.accessLevel}
                            </option>
                          ))
                        }
                      </select>
                      <button 
                        onClick={() => handleSetAccess(dashboard.id)}
                        className="secondary-btn access-btn"
                        disabled={!selectedEmail}
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
        </main>

        {/* Modal de Criação */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Criar Novo Dashboard</h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="modal-body">
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
              </div>
              
              <div className="modal-footer">
                <button className="secondary-btn" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button 
                  className="primary-btn" 
                  onClick={handleCreateDashboard}
                  disabled={!newDashboard.title || !newDashboard.url}
                >
                  <i className="fas fa-plus"></i>
                  Criar Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

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