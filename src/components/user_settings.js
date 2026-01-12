// UserSettings.js - Versão com Modal de Criação
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/user_settings.css';
import logo from '../assets/logo_personalizado.png';

const API_BASE_URL = process.env.REACT_APP_FIREBASE;

const UserSettings = () => {
  // =========================================================
  // ESTADOS
  // =========================================================
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '', email: '', accessLevel: ''
  });
  const [editData, setEditData] = useState({
    id: '', name: '', email: '', accessLevel: ''
  });
  
  // NOVO: Estados para modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Estados de filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState('');
  const [sortBy, setSortBy] = useState('name');
  
  // Estados do usuário logado
  const [userEmail, setUserEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhotoUrl, setUserPhotoUrl] = useState('https://i.ibb.co/68B1zT3/default-avatar.png');

  // Modal customizado (para delete/success/error)
  const [modal, setModal] = useState({
    isOpen: false, type: '', title: '', message: '', userId: null, onConfirm: null
  });

  const navigate = useNavigate();

  // =========================================================
  // EFFECTS E INICIALIZAÇÃO
  // =========================================================
  useEffect(() => {
    initializeUserData();
  }, [navigate]);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, selectedAccessLevel, sortBy]);

  const initializeUserData = () => {
    const email = localStorage.getItem("userEmail");
    const level = localStorage.getItem("accessLevel");
    const name = localStorage.getItem("name");
    const photoUrl = localStorage.getItem("photoUrl");

    if (!email || !level) {
      navigate('/login-sso');
      return;
    }

    setUserEmail(email);
    setAccessLevel(level);
    setUserName(name || '');
    
    if (photoUrl && photoUrl !== 'PLACEHOLDER_INITIAL') {
      setUserPhotoUrl(photoUrl);
    }
    
    if (level !== 'Admin') {
      navigate('/dashboard');
      return;
    }

    fetchUsers();
  };

  // =========================================================
  // FUNÇÕES DE FILTRO
  // =========================================================
  const applyFilters = () => {
    let filtered = [...users];

    // Filtro por termo de busca (nome ou email)
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por nível de acesso
    if (selectedAccessLevel) {
      filtered = filtered.filter(user => 
        user.accessLevel === selectedAccessLevel
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'email':
          return (a.email || '').localeCompare(b.email || '');
        case 'accessLevel':
          return (a.accessLevel || '').localeCompare(b.accessLevel || '');
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'oldest':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        default:
          return 0;
      }
    });

    setFilteredUsers(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedAccessLevel('');
    setSortBy('name');
  };

  // =========================================================
  // FUNÇÕES DE NAVEGAÇÃO E UTILITÁRIAS
  // =========================================================
  const goToDashboardAdmin = () => navigate('/dashboard-admin');
  const goToAnalytics = () => {
    if (accessLevel === "Admin") {
      navigate('/dashboard-analytics');
    } else {
      showErrorModal("Acesso negado! Apenas administradores podem acessar analytics.");
    }
  };
  const DashboardUser = () => navigate('/dashboard');
  
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

  const getUserInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  // =========================================================
  // FUNÇÕES DO MODAL
  // =========================================================
  const showSuccessModal = (message) => setModal({ 
    isOpen: true, type: 'success', title: 'Sucesso!', message, onConfirm: () => closeModal() 
  });
  
  const showErrorModal = (message) => setModal({ 
    isOpen: true, type: 'error', title: 'Erro', message, onConfirm: () => closeModal() 
  });
  
  const openDeleteModal = (userId, userName) => setModal({ 
    isOpen: true, type: 'delete', title: 'Confirmar Exclusão', 
    message: `Tem certeza que deseja excluir o usuário "${userName}"?`, 
    userId, onConfirm: () => handleDelete(userId) 
  });
  
  const closeModal = () => setModal({ 
    isOpen: false, type: '', title: '', message: '', userId: null, onConfirm: null 
  });

  // =========================================================
  // FUNÇÕES PRINCIPAIS
  // =========================================================
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`);
      
      let usersArray = [];
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        usersArray = response.data.data;
      } else if (Array.isArray(response.data)) {
        usersArray = response.data;
      } else if (Array.isArray(response.data?.users)) {
        usersArray = response.data.users;
      }
      
      setUsers(usersArray);
      
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      showErrorModal('Não foi possível carregar os usuários.');
      setUsers([]);
    }
  };

  // NOVO: Função para abrir modal de criação
  const openCreateModal = () => {
    setFormData({ name: '', email: '', accessLevel: '' });
    setShowCreateModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (e) => {
    setFormData(prev => ({ ...prev, accessLevel: e.target.value }));
  };

  const handleSave = async () => {
    const { name, email, accessLevel } = formData;
    if (!name || !email || !accessLevel) {
      showErrorModal('Preencha todos os campos antes de salvar.');
      return;
    }
    
    try {
      await axios.post(`${API_BASE_URL}/users`, formData);
      await fetchUsers();
      setShowCreateModal(false); // Fecha o modal após salvar
      setFormData({ name: '', email: '', accessLevel: '' });
      showSuccessModal('Usuário criado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar usuário:', error);
      showErrorModal(error.response?.data?.message || 'Erro ao criar usuário.');
    }
  };

  // ATUALIZADO: Função para abrir modal de edição
  const openEditModal = (user) => {
    setEditData({ 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      accessLevel: user.accessLevel
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditRadioChange = (e) => {
    setEditData(prev => ({ ...prev, accessLevel: e.target.value }));
  };

  const handleUpdate = async () => {
    const { id, name, email, accessLevel } = editData;
    if (!name || !email || !accessLevel) {
      showErrorModal('Preencha todos os campos antes de atualizar.');
      return;
    }
    
    try {
      await axios.put(`${API_BASE_URL}/users/${id}`, { name, email, accessLevel });
      await fetchUsers();
      setShowEditModal(false);
      showSuccessModal('Usuário atualizado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      showErrorModal(error.response?.data?.message || 'Erro de conexão com o servidor.');
    }
  };

  const handleDelete = async (userId) => {
    try {
      await axios.delete(`${API_BASE_URL}/users/${userId}`);
      await fetchUsers();
      closeModal();
      showSuccessModal('Usuário excluído com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao excluir usuário:', error);
      showErrorModal('Erro ao excluir usuário.');
    }
  };

  // =========================================================
  // RENDERIZAÇÃO
  // =========================================================
  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <aside className="app-sidebar">
        <div className="user-profile">
          {userPhotoUrl && userPhotoUrl !== 'PLACEHOLDER_INITIAL' ? (
            <img src={userPhotoUrl} alt="Foto do Usuário" className="user-avatar" />
          ) : (
            <div className="user-avatar user-avatar-initial">{getUserInitial(userName)}</div>
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
              <button className="nav-btn" onClick={goToDashboardAdmin}>
                <i className="fas fa-cog"></i> Gerenciar Dashboards
              </button>
              <button className="nav-btn active">
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

      {/* CONTEÚDO PRINCIPAL */}
      <div className="main-content">
        <header className="main-header">
          <div className="header-left">
            <img src={logo} alt="Logo Sebratel" className="header-logo" />
            <h1 className="header-title-text">Gerenciamento de Usuários</h1>
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
                <span className="user-name-header">{userName}</span>
                <span className="user-role-header">{accessLevel}</span>
              </div>
              {userPhotoUrl && userPhotoUrl !== 'PLACEHOLDER_INITIAL' ? (
                <img src={userPhotoUrl} alt="User" className="user-avatar-header" />
              ) : (
                <div className="user-avatar-header user-avatar-initial">{getUserInitial(userName)}</div>
              )}
            </div>
          </div>
        </header>

        <main className="admin-content">
          {/* SEÇÃO DE AÇÕES RÁPIDAS (SUBSTITUI O FORMULÁRIO FIXO) */}
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
                <i className="fas fa-user-plus"></i>
                <span>Criar Novo Usuário</span>
              </button>
              <button 
                className="quick-action-btn secondary-action"
                onClick={() => document.querySelector('.filters-section').scrollIntoView({ behavior: 'smooth' })}
              >
                <i className="fas fa-filter"></i>
                <span>Filtrar Usuários</span>
              </button>
            </div>
          </section>

          {/* SEÇÃO DE FILTROS (MANTIDA) */}
          <section className="filters-section">
            <div className="filters-header">
              <h3>
                <i className="fas fa-filter"></i>
                Filtros e Ordenação
              </h3>
              <button 
                className="clear-filters-btn"
                onClick={clearFilters}
                disabled={!searchTerm && !selectedAccessLevel && sortBy === 'name'}
              >
                <i className="fas fa-times"></i>
                Limpar Filtros
              </button>
            </div>

            <div className="filters-grid">
              <div className="filter-group">
                <label>
                  <i className="fas fa-search"></i>
                  Buscar Usuários
                </label>
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label>
                  <i className="fas fa-user-tag"></i>
                  Filtrar por Acesso
                </label>
                <select
                  value={selectedAccessLevel}
                  onChange={(e) => setSelectedAccessLevel(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Todos os níveis</option>
                  <option value="Admin">Administradores</option>
                  <option value="User">Usuários</option>
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
                  <option value="name">Nome (A-Z)</option>
                  <option value="email">Email (A-Z)</option>
                  <option value="accessLevel">Nível de Acesso</option>
                  <option value="newest">Mais Recentes</option>
                  <option value="oldest">Mais Antigos</option>
                </select>
              </div>
            </div>

            <div className="filters-stats">
              <span className="stat-item">
                <strong>{filteredUsers.length}</strong> de <strong>{users.length}</strong> usuários
              </span>
              {(searchTerm || selectedAccessLevel) && (
                <span className="active-filters">
                  Filtros ativos: 
                  {searchTerm && <span className="filter-tag">Busca: "{searchTerm}"</span>}
                  {selectedAccessLevel && <span className="filter-tag">Acesso: {selectedAccessLevel}</span>}
                </span>
              )}
            </div>
          </section>

          {/* LISTA DE USUÁRIOS (MANTIDA) */}
          <section className="admin-section">
            <div className="section-header">
              <i className="fas fa-users section-icon"></i>
              <h2>
                Usuários Cadastrados 
                <span className="count-badge">{filteredUsers.length}</span>
              </h2>
            </div>

            {!Array.isArray(filteredUsers) || filteredUsers.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-user-slash"></i>
                <h3>Nenhum usuário encontrado</h3>
                <p>
                  {users.length === 0 
                    ? 'Comece criando seu primeiro usuário.' 
                    : 'Tente ajustar os filtros para ver mais resultados.'
                  }
                </p>
                {users.length === 0 && (
                  <button 
                    className="primary-btn"
                    onClick={openCreateModal}
                  >
                    <i className="fas fa-plus"></i>
                    Criar Primeiro Usuário
                  </button>
                )}
              </div>
            ) : (
              <div className="users-table-container compact-table">
                <table className="users-table compact-users-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Acesso</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td className="user-name compact-cell">{user.name}</td>
                        <td className="user-email compact-cell">{user.email}</td>
                        <td className="compact-cell">
                          <span className={`access-badge ${user.accessLevel?.toLowerCase()}`}>
                            {user.accessLevel}
                          </span>
                        </td>
                        <td className="action-buttons compact-actions">
                          <button 
                            onClick={() => openEditModal(user)} 
                            className="action-btn edit-btn compact-action-btn" 
                            title="Editar usuário"
                          >
                            <i className="fas fa-edit"></i><span>Editar</span>
                          </button>
                          <button 
                            onClick={() => openDeleteModal(user.id, user.name)} 
                            className="action-btn delete-btn compact-action-btn" 
                            title="Excluir usuário"
                          >
                            <i className="fas fa-trash"></i><span>Excluir</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>

        {/* MODAL DE CRIAÇÃO - NOVO */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content compact-modal">
              <div className="modal-header">
                <h2>Criar Novo Usuário</h2>
                <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="modal-body compact-modal-body">
                <div className="form-group compact-group">
                  <label>Nome *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder="Nome completo do usuário"
                    className="form-input compact-input" 
                  />
                </div>
                <div className="form-group compact-group">
                  <label>Email *</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    placeholder="email@empresa.com"
                    className="form-input compact-input" 
                  />
                </div>
                <div className="form-group compact-group">
                  <label>Nível de Acesso *</label>
                  <div className="radio-group compact-radio">
                    <label className="radio-label compact-radio-label">
                      <input 
                        type="radio" 
                        name="accessLevel" 
                        value="Admin" 
                        checked={formData.accessLevel === 'Admin'} 
                        onChange={handleRadioChange} 
                      />
                      <span className="radio-custom"></span>Admin
                    </label>
                    <label className="radio-label compact-radio-label">
                      <input 
                        type="radio" 
                        name="accessLevel" 
                        value="User" 
                        checked={formData.accessLevel === 'User'} 
                        onChange={handleRadioChange} 
                      />
                      <span className="radio-custom"></span>User
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer compact-modal-footer">
                <button className="secondary-btn" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button 
                  className="primary-btn compact-btn" 
                  onClick={handleSave} 
                  disabled={!formData.name || !formData.email || !formData.accessLevel}
                >
                  <i className="fas fa-save"></i>Criar Usuário
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE EDIÇÃO (ATUALIZADO) */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-content compact-modal">
              <div className="modal-header">
                <h2>Editar Usuário</h2>
                <button className="close-btn" onClick={() => setShowEditModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="modal-body compact-modal-body">
                <div className="form-group compact-group">
                  <label>Nome *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={editData.name} 
                    onChange={handleEditInputChange} 
                    className="form-input compact-input" 
                  />
                </div>
                <div className="form-group compact-group">
                  <label>Email *</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={editData.email} 
                    onChange={handleEditInputChange} 
                    className="form-input compact-input" 
                  />
                </div>
                <div className="form-group compact-group">
                  <label>Nível de Acesso *</label>
                  <div className="radio-group compact-radio">
                    <label className="radio-label compact-radio-label">
                      <input 
                        type="radio" 
                        name="editAccessLevel" 
                        value="Admin" 
                        checked={editData.accessLevel === 'Admin'} 
                        onChange={handleEditRadioChange} 
                      />
                      <span className="radio-custom"></span>Admin
                    </label>
                    <label className="radio-label compact-radio-label">
                      <input 
                        type="radio" 
                        name="editAccessLevel" 
                        value="User" 
                        checked={editData.accessLevel === 'User'} 
                        onChange={handleEditRadioChange} 
                      />
                      <span className="radio-custom"></span>User
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer compact-modal-footer">
                <button className="secondary-btn" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button 
                  className="primary-btn compact-btn" 
                  onClick={handleUpdate} 
                  disabled={!editData.name || !editData.email || !editData.accessLevel}
                >
                  <i className="fas fa-save"></i>Atualizar Usuário
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CUSTOMIZADO (MANTIDO) */}
        {modal.isOpen && (
          <div className="modal-overlay custom-modal-overlay">
            <div className="custom-modal compact-modal">
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
                    <button className="btn-danger" onClick={modal.onConfirm}>
                      <i className="fas fa-trash"></i>Confirmar Exclusão
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
};

export default UserSettings;