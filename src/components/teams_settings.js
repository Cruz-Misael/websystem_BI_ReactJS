// Teams.js - Versão com Layout Padronizado
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/teams_settings.css';
import logo from '../assets/logo_personalizado.png';

const API_BASE_URL = process.env.REACT_APP_API_URL;

function Teams() {
    const [teams, setTeams] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    // NOVOS ESTADOS PARA OS DADOS DO USUÁRIO
    const [userEmail, setUserEmail] = useState('');
    const [accessLevel, setAccessLevel] = useState('');
    const [userTeam, setUserTeam] = useState('');
    const [userName, setUserName] = useState('');
    const [userPhotoUrl, setUserPhotoUrl] = useState(
        'https://i.ibb.co/68B1zT3/default-avatar.png' 
    );

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
        } else {
            navigate('/login-sso');
            return;
        }

        fetchTeams();
    }, [navigate]);

    // FUNÇÕES DE NAVEGAÇÃO E LOGOUT
    const goToDashboardAdmin = () => {
        if (accessLevel === "Admin") {
            navigate('/dashboard-admin');
        } else {
            alert("Acesso negado! Apenas administradores podem acessar.");
        }
    };

    const goToAnalytics = () => {
        if (accessLevel === "Admin") {
        navigate('/dashboard-analytics');
        } else {
        showErrorModal("Acesso negado! Apenas administradores podem acessar a página de configurações.");
        }
    };

    const goToUserSettings = () => {
        if (accessLevel === "Admin") {
            navigate('/user-settings');
        } else {
            alert("Acesso negado! Apenas administradores podem acessar.");
        }
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

    // MODAL CUSTOMIZADO
    const [modal, setModal] = useState({
        isOpen: false,
        type: '', // 'delete', 'success', 'error'
        title: '',
        message: '',
        teamId: null,
        onConfirm: null
    });

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

    const openDeleteModal = (teamId, teamName) => {
        setModal({
            isOpen: true,
            type: 'delete',
            title: 'Confirmar Desativação',
            message: `Tem certeza que deseja desativar o time "${teamName}"?`,
            teamId: teamId,
            onConfirm: () => handleDelete(teamId)
        });
    };

    const closeModal = () => {
        setModal({
            isOpen: false,
            type: '',
            title: '',
            message: '',
            teamId: null,
            onConfirm: null
        });
    };

    const fetchTeams = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_BASE_URL}/teams`);
            
            if (!response || !response.ok) {
                throw new Error(`HTTP error! status: ${response?.status || 'no response'}`);
            }
    
            const contentType = response.headers?.get('content-type');
            if (!contentType?.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Expected JSON but got ${contentType}`);
            }
    
            const data = await response.json();
            
            if (!data?.success || !Array.isArray(data.data)) {
                throw new Error('Invalid data structure from API');
            }
    
            setTeams(data.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch teams:', {
                message: err.message,
                stack: err.stack
            });
            setError('Falha ao carregar times');
            setTeams([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            showErrorModal('Nome do time é obrigatório');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const url = editingId
                ? `${API_BASE_URL}/teams/${editingId}`
                : `${API_BASE_URL}/teams`;
            const method = editingId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    description: formData.description.trim()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao salvar time');
            }

            showSuccessModal(editingId ? 'Time atualizado com sucesso!' : 'Time criado com sucesso!');
            setFormData({ name: '', description: '' });
            setEditingId(null);
            fetchTeams();
            
        } catch (err) {
            showErrorModal(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (team) => {
        setFormData({ 
            name: team.name,
            description: team.description || ''
        });
        setEditingId(team.id);
        setError(null);
        setSuccess(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await fetch(`${API_BASE_URL}/teams/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Erro ao desativar time');
            showSuccessModal('Time desativado com sucesso!');
            fetchTeams();
        } catch (err) {
            showErrorModal(err.message);
        } finally {
            setLoading(false);
            closeModal();
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
                    <p className="profile-team">Setor: {userTeam}</p>
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
                            <i className="fas fa-users"></i> Gerenciar Setores
                        </button>
                        <button className="nav-btn" onClick={goToUserSettings}>
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
            </aside>

            {/* CONTEÚDO PRINCIPAL */}
            <div className="main-content">
              <header className="main-header">
                <div className="header-left">
                  <img src={logo} alt="Logo Sebratel" className="header-logo" />
                  <h1 className="header-title-text">
                    Gerenciamento de Setores
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
                    {/* Seção de Criação/Edição */}
                    <section className="admin-section">
                        <div className="section-header">
                            <i className="fas fa-users section-icon"></i>
                            <h2>{editingId ? 'Editar Time' : 'Criar Novo Time'}</h2>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="create-team-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nome do Time *</label>
                                    <input
                                        name="name"
                                        type="text"
                                        placeholder="Digite o nome do time..."
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        disabled={loading}
                                        className="form-input"
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea
                                    name="description"
                                    placeholder="Descreva o propósito deste time..."
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    rows="3"
                                    className="form-textarea"
                                />
                            </div>
                            
                            <div className="form-actions">
                                <button 
                                    type="submit" 
                                    className="primary-btn"
                                    disabled={loading || !formData.name.trim()}
                                >
                                    <i className={loading ? "fas fa-spinner fa-spin" : editingId ? "fas fa-save" : "fas fa-plus"}></i>
                                    {loading ? 'Processando...' : (editingId ? 'Atualizar Time' : 'Criar Setor')}
                                </button>
                                
                                {editingId && (
                                    <button
                                        type="button"
                                        className="secondary-btn"
                                        onClick={() => {
                                            setFormData({ name: '', description: '' });
                                            setEditingId(null);
                                        }}
                                        disabled={loading}
                                    >
                                        <i className="fas fa-times"></i>
                                        Cancelar Edição
                                    </button>
                                )}
                            </div>
                        </form>
                    </section>

                    {/* Lista de Times */}
                    <section className="admin-section">
                        <div className="section-header">
                            <i className="fas fa-list section-icon"></i>
                            <h2>
                                Times Cadastrados 
                                <span className="count-badge">{teams.length}</span>
                            </h2>
                        </div>

                        {loading && teams.length === 0 ? (
                            <div className="loading-state">
                                <i className="fas fa-spinner fa-spin"></i>
                                <p>Carregando times...</p>
                            </div>
                        ) : teams.length === 0 ? (
                            <div className="empty-state">
                                <i className="fas fa-users-slash"></i>
                                <h3>Nenhum time cadastrado</h3>
                                <p>Comece criando seu primeiro time acima.</p>
                            </div>
                        ) : (
                            <div className="teams-table-container">
                                <table className="teams-table">
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Descrição</th>
                                            <th>Status</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teams.map(team => (
                                            <tr key={team.id}>
                                                <td className="team-name">{team.name}</td>
                                                <td className="team-description">{team.description || '-'}</td>
                                                <td>
                                                    <span className={`status-badge ${team.isActive ? 'active' : 'inactive'}`}>
                                                        <i className={`fas ${team.isActive ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                                                        {team.isActive ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </td>
                                                <td className="action-buttons">
                                                    <button 
                                                        onClick={() => handleEdit(team)} 
                                                        className="action-btn edit-btn"
                                                        title="Editar time"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                        <span>Editar</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => openDeleteModal(team.id, team.name)} 
                                                        className="action-btn delete-btn"
                                                        title="Excluir time"
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
                                            Confirmar Desativação
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

export default Teams;