//UserSettings.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/UserSettings.css';
import logo from '../assets/sebraFundoBranco.jpg'; // logo do Power BI
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
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]); // Remove o array fixo

  useEffect(() => {
    const checkAuth = () => {
      const userEmail = localStorage.getItem("userEmail");
      const accessLevel = localStorage.getItem("accessLevel");
      const userTeam = localStorage.getItem("team");
    
      if (!userEmail || !accessLevel || !userTeam) {
        return '/login';
      } else if (accessLevel !== 'Admin') {
        return '/dashboard';
      }
      return null;
    };
  
    const redirectPath = checkAuth();
    if (redirectPath) {
      navigate(redirectPath);
    } else {
      fetchUsers();
      fetchTeams(); // Adicione esta linha para carregar os times
    }
  }, [navigate]);

  // Carrega usuários
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      alert('Não foi possível carregar os usuários.');
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
      alert('Preencha todos os campos antes de salvar.');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/users`, formData);
      fetchUsers();
      setFormData({ name: '', email: '', accessLevel: '', team: '' });
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
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
      alert('Preencha todos os campos antes de atualizar.');
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/users/${id}`, { name, email, accessLevel, team });
      fetchUsers();
      setShowModal(false);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      if (error.response) {
        alert(`Erro: ${error.response.data.message || 'Falha ao atualizar usuário.'}`);
      } else {
        alert('Erro de conexão com o servidor.');
      }
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await axios.delete(`${API_BASE_URL}/users/${userId}`);
        fetchUsers();
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
      }
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/teams`);
      if (!response.ok) throw new Error('Erro ao buscar times');
      const data = await response.json();
      if (data.success) {
        // Mapeia para pegar apenas os nomes dos times
        setTeams(data.data.map(team => team.name));
      } else {
        throw new Error(data.message || 'Erro ao carregar times');
      }
    } catch (error) {
      console.error('Falha ao carregar times:', error);
      // Fallback temporário para não quebrar o sistema
      setTeams(["Comercial", "Instalação", "Manutenção", "Infraestrutura", "Suporte"]);
      alert('Erro ao carregar times. Usando lista temporária.');
    }
  };


  return (
    <div className="config-page-container">
      <header className="app-header">
        <img src={logo} alt="Logo" className="app-logo" />
        <h1 
        className="app-title">DASHBOARDS / CONFIGURAÇOES DE USUÁRIOS / 
        </h1>
        <div>        
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            Voltar
          </button>
        </div>
      </header>

      <div className="config-content">
        <div className="form-container">
          <h2>Informações Pessoais:</h2>
          <div className="form-field">
            <label htmlFor='name'>Nome:</label>
            <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Digite o nome do usuário..."
          />
          </div>
          <div className="form-field">
            <label htmlFor='email'>Email:</label>
            <input 
              id="email"
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Digite o email do usuário..."
            />
          </div>
          <div className="form-field">
            <label>Acesso:</label>
            <div className="checkbox-group">
              <label>
                <input 
                  type="radio" 
                  name="accessLevel" 
                  value="Admin" 
                  checked={formData.accessLevel === 'Admin'}
                  onChange={handleRadioChange}
                /> Admin
              </label>
              <label>
                <input 
                  type="radio" 
                  name="accessLevel" 
                  value="User" 
                  checked={formData.accessLevel === 'User'}
                  onChange={handleRadioChange}
                /> User
              </label>
            </div>
          </div>
          <div className="form-field">
            <label>Setor:</label>
            <select 
            name="team"
            value={formData.team}
            onChange={handleInputChange}
            required
          >
            <option value="" disabled>Selecione um setor</option>
            {teams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
          </div>
          <button className="save-button" onClick={handleSave}>Salvar</button>
        </div>

        <div className="table-container">
          <h2>Tabela de Usuários</h2>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Acesso</th>
                <th>Setor</th>
                <th>Excluir</th>
                <th>Editar</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.accessLevel}</td>
                  <td>{user.team || 'Não definido'}</td>
                  <td>
                    <button 
                      className="delete-button" 
                      onClick={() => handleDelete(user.id)}
                      data-testid="delete-button"
                    >
                      ❌
                    </button>
                  </td>
                  <td>
                    <button 
                      className="edit-button" 
                      onClick={() => openEditModal(user)}
                      data-testid="edit-button"
                    >
                      ✏️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição */}
      {showModal && (
        <div className="modal active" data-testid="edit-modal">
          <div className="modal-content">
            <span className="close-button" onClick={() => setShowModal(false)}>
              ×
            </span>
            <h2>Editar Usuário</h2>
            <div className="form-field">
              <label>Nome:</label>
              <input
                type="text"
                name="name"
                value={editData.name}
                onChange={handleEditInputChange}
                data-testid="edit-name-input"
              />
            </div>
            <div className="form-field">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={editData.email}
                onChange={handleEditInputChange}
                data-testid="edit-email-input"
              />
            </div>
            <div className="form-field">
              <label>Acesso:</label>
              <div className="checkbox-group">
                <label>
                  <input
                    type="radio"
                    name="editAccessLevel"
                    value="Admin"
                    checked={editData.accessLevel === 'Admin'}
                    onChange={handleEditRadioChange}
                    data-testid="edit-access-admin"
                  /> Admin
                </label>
                <label>
                  <input
                    type="radio"
                    name="editAccessLevel"
                    value="User"
                    checked={editData.accessLevel === 'User'}
                    onChange={handleEditRadioChange}
                    data-testid="edit-access-user"
                  /> User
                </label>
              </div>
            </div>
            <div className="form-field">
              <label>Setor:</label>
              <select
                name="team"
                value={editData.team}
                onChange={handleEditInputChange}
                required
                data-testid="edit-team-select"
              >
                <option value="" disabled>Selecione um setor</option>
                {teams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
            <button className="save-button" onClick={handleUpdate}>
              Atualizar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSettings;