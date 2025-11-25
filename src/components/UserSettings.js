// UserSettings.js - Versão com Layout Padronizado
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/UserSettings.css';
import logo from '../assets/logo_personalizado.png';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const UserSettings = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    accessLevel: '',
    team: ''
  });
  const [editData, setEditData] = useState({
    id: '',
    name: '',
    email: '',
    accessLevel: '',
    team: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [teams, setTeams] = useState([]);
  
  // NOVOS ESTADOS PARA OS DADOS DO USUÁRIO
  const [userEmail, setUserEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState('');
  const [userTeam, setUserTeam] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhotoUrl, setUserPhotoUrl] = useState(
    'https://i.ibb.co/68B1zT3/default-avatar.png' 
  );

  // MODAL CUSTOMIZADO
  const [modal, setModal] = useState({
    isOpen: false,
    type: '', // 'delete', 'success', 'error'
    title: '',
    message: '',
    userId: null,
    onConfirm: null
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Carregar dados do usuário do localStorage
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
      
      // Verificar se é admin
      if (level !== 'Admin') {
        navigate('/dashboard');
        return;
      }
    } else {
      navigate('/login-sso');
      return;
    }

    fetchUsers();
    fetchTeams();
  }, [navigate]);

  // FUNÇÕES DE NAVEGAÇÃO E LOGOUT
  const goToDashboardAdmin = () => {
    navigate('/dashboard-admin');
  };

  const goToTeams = () => {
    navigate('/teams');
  };

  const DashboardUser = () => {
    navigate('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("accessLevel");
    localStorage.removeItem("team");
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

  // FUNÇÕES DO MODAL CUSTOMIZADO
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

  const openDeleteModal = (userId, userName) => {
    setModal({
      isOpen: true,
      type: 'delete',
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o usuário "${userName}"? Esta ação não pode ser desfeita.`,
      userId: userId,
      onConfirm: () => handleDelete(userId)
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      type: '',
      title: '',
      message: '',
      userId: null,
      onConfirm: null
    });
  };

  // FUNÇÕES EXISTENTES (atualizadas para usar modais customizados)
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      showErrorModal('Não foi possível carregar os usuários.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (e) => {
    setFormData(prev => ({ ...prev, accessLevel: e.target.value }));
  };

  const handleSave = async () => {
    const { name, email, accessLevel, team } = formData;

    if (!name || !email || !accessLevel || !team) {
      showErrorModal('Preencha todos os campos antes de salvar.');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/users`, formData);
      fetchUsers();
      setFormData({ name: '', email: '', accessLevel: '', team: '' });
      showSuccessModal('Usuário criado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      showErrorModal('Erro ao criar usuário.');
    }
  };

  const openEditModal = (user) => {
    setEditData({
      id: user.id,
      name: user.name,
      email: user.email,
      accessLevel: user.accessLevel,
      team: user.team || ''
    });
    setShowModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditRadioChange = (e) => {
    setEditData(prev => ({ ...prev, accessLevel: e.target.value }));
  };

  const handleUpdate = async () => {
    const { id, name, email, accessLevel, team } = editData;

    if (!name || !email || !accessLevel || !team) {
      showErrorModal('Preencha todos os campos antes de atualizar.');
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/users/${id}`, { name, email, accessLevel, team });
      fetchUsers();
      setShowModal(false);
      showSuccessModal('Usuário atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      if (error.response) {
        showErrorModal(`Erro: ${error.response.data.message || 'Falha ao atualizar usuário.'}`);
      } else {
        showErrorModal('Erro de conexão com o servidor.');
      }
    }
  };

  const handleDelete = async (userId) => {
    try {
      await axios.delete(`${API_BASE_URL}/users/${userId}`);
      fetchUsers();
      closeModal();
      showSuccessModal('Usuário excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      showErrorModal('Erro ao excluir usuário.');
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
      setTeams(["Comercial", "Instalação", "Manutenção", "Infraestrutura", "Suporte"]);
    }
  };

  return (
    <div className="app-layout">
      {/* SIDEBAR PADRONIZADO */}
      <aside className="app-sidebar">
        <div className="user-profile">
          {userPhotoUrl && userPhotoUrl !== 'PLACEHOLDER_INITIAL' ? (
            <img src={userPhotoUrl} alt="Foto do Usuário" className="user-avatar" />
          ) : (
            <div className="user-avatar user-avatar-initial">
              {getUserInitial(userName)}
            </div>
          )}
          <h3 className="profile-name">{userName || userEmail}</h3>
          <p className="profile-team">Time: {userTeam}</p>
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
              <button className="nav-btn" onClick={goToTeams}>
                <i className="fas fa-users"></i> Gerenciar Times
              </button>
              <button className="nav-btn active">
                <i className="fas fa-user-lock"></i> Gerenciar Usuários
              </button>
            </>
          )}
        </nav>
        
        <button className="logout-btn-sidebar" onClick={logout}>
          <i className="fas fa-sign-out-alt"></i> Sair
        </button>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="main-content">
        <header className="main-header">
          <div className="header-left">
            <img src={logo} alt="Logo Sebratel" className="header-logo" />
            <h1 className="header-title-text">
              Gerenciamento de Usuários
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
          {/* Seção de Criação de Usuário */}
          <section className="admin-section">
            <div className="section-header">
              <i className="fas fa-user-plus section-icon"></i>
              <h2>Criar Novo Usuário</h2>
            </div>
            
            <div className="create-user-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nome *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Digite o nome do usuário..."
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Email *</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Digite o email do usuário..."
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nível de Acesso *</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input 
                        type="radio" 
                        name="accessLevel" 
                        value="Admin" 
                        checked={formData.accessLevel === 'Admin'}
                        onChange={handleRadioChange}
                      />
                      <span className="radio-custom"></span>
                      Admin
                    </label>
                    <label className="radio-label">
                      <input 
                        type="radio" 
                        name="accessLevel" 
                        value="User" 
                        checked={formData.accessLevel === 'User'}
                        onChange={handleRadioChange}
                      />
                      <span className="radio-custom"></span>
                      User
                    </label>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Time *</label>
                  <select 
                    name="team"
                    value={formData.team}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="">Selecione um time</option>
                    {teams.map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button 
                className="primary-btn" 
                onClick={handleSave}
                disabled={!formData.name || !formData.email || !formData.accessLevel || !formData.team}
              >
                <i className="fas fa-save"></i>
                Criar Usuário
              </button>
            </div>
          </section>

          {/* Lista de Usuários */}
          <section className="admin-section">
            <div className="section-header">
              <i className="fas fa-users section-icon"></i>
              <h2>
                Usuários Cadastrados 
                <span className="count-badge">{users.length}</span>
              </h2>
            </div>

            {users.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-user-slash"></i>
                <h3>Nenhum usuário cadastrado</h3>
                <p>Comece criando seu primeiro usuário acima.</p>
              </div>
            ) : (
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Acesso</th>
                      <th>Time</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td className="user-name">{user.name}</td>
                        <td className="user-email">{user.email}</td>
                        <td>
                          <span className={`access-badge ${user.accessLevel.toLowerCase()}`}>
                            {user.accessLevel}
                          </span>
                        </td>
                        <td className="user-team">{user.team || 'Não definido'}</td>
                        <td className="action-buttons">
                          <button 
                            onClick={() => openEditModal(user)}
                            className="action-btn edit-btn"
                            title="Editar usuário"
                          >
                            <i className="fas fa-edit"></i>
                            <span>Editar</span>
                          </button>
                          <button 
                            onClick={() => openDeleteModal(user.id, user.name)}
                            className="action-btn delete-btn"
                            title="Excluir usuário"
                          >
                            <i className="fas fa-trash"></i>
                            <span>❌</span>
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

        {/* Modal de Edição */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Editar Usuário</h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowModal(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label>Nome *</label>
                  <input
                    type="text"
                    name="name"
                    value={editData.name}
                    onChange={handleEditInputChange}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleEditInputChange}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Nível de Acesso *</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="editAccessLevel"
                        value="Admin"
                        checked={editData.accessLevel === 'Admin'}
                        onChange={handleEditRadioChange}
                      />
                      <span className="radio-custom"></span>
                      Admin
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="editAccessLevel"
                        value="User"
                        checked={editData.accessLevel === 'User'}
                        onChange={handleEditRadioChange}
                      />
                      <span className="radio-custom"></span>
                      User
                    </label>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Time *</label>
                  <select
                    name="team"
                    value={editData.team}
                    onChange={handleEditInputChange}
                    className="form-select"
                  >
                    <option value="">Selecione um time</option>
                    {teams.map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="secondary-btn" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button 
                  className="primary-btn" 
                  onClick={handleUpdate}
                  disabled={!editData.name || !editData.email || !editData.accessLevel || !editData.team}
                >
                  <i className="fas fa-save"></i>
                  Atualizar Usuário
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
};

export default UserSettings;