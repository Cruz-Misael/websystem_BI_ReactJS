//Teams.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Teams.css';
import logo from '../assets/sebraFundoBranco.jpg'; // logo do Power BI


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
    const navigate = useNavigate();
    
    const fetchTeams = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_BASE_URL}/teams`);
        
        // Verificação robusta da resposta
        if (!response || !response.ok) {
          throw new Error(`HTTP error! status: ${response?.status || 'no response'}`);
        }
    
        const contentType = response.headers?.get('content-type');
        if (!contentType?.includes('application/json')) {
          const text = await response.text();
          throw new Error(`Expected JSON but got ${contentType}`);
        }
    
        const data = await response.json();
        
        // Validação da estrutura dos dados
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
        setError('Failed to load teams');
        setTeams([]); // Fallback para array vazio
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

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
            setError('Nome do time é obrigatório');
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

            setSuccess(editingId ? 'Time atualizado com sucesso!' : 'Time criado com sucesso!');
            setFormData({ name: '', description: '' });
            setEditingId(null);
            fetchTeams();
            
            // Limpa mensagem de sucesso após 3 segundos
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message);
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
        if (window.confirm('Tem certeza que deseja desativar este time?')) {
            setLoading(true);
            setError(null);
            setSuccess(null);
            try {
                const response = await fetch(`${API_BASE_URL}/teams/${id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error('Erro ao desativar time');
                setSuccess('Time desativado com sucesso!');
                fetchTeams();
                setTimeout(() => setSuccess(null), 3000);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBack = () => {
        navigate('/dashboard');
    };

    return (
        <div className="teams-page">
          <header className="app-header">
            <img src={logo} alt="Logo" className="app-logo" />
            <h1 className="app-title">DASHBOARDS / CONFIGURAÇÕES DE TIMES / </h1>
            <div>        
              <button className="back-button" onClick={handleBack}>
                Voltar
              </button>
            </div>
          </header>
    
          <div className="config-content">
            {/* Formulário */}
            <div className="form-container">
              <h2>{editingId ? 'Editar time' : 'Criar Novo Time'}</h2>
              
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
    
              <form onSubmit={handleSubmit}>
                <div className="form-field">
                  <label htmlFor="name">Time:</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </div>
    
                <div className="form-field">
                  <label htmlFor="description">Descrição:</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    disabled={loading}
                    rows="3"
                  />
                </div>
    
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="save-button"
                    disabled={loading}
                  >
                    {loading ? 'Processando...' : (editingId ? 'Atualizar' : 'Salvar')}
                  </button>
    
                  {editingId && (
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => {
                        setFormData({ name: '', description: '' });
                        setEditingId(null);
                      }}
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
    
            {/* Lista de Times */}
            <div className="table-container">
              <h2>Times Cadastrados</h2>
              
              {loading && teams.length === 0 ? (
                <p>Carregando times...</p>
              ) : teams.length === 0 ? (
                <p>Nenhum time cadastrado.</p>
              ) : (
                <table>
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
                        <td>{team.name}</td>
                        <td>{team.description || '-'}</td>
                        <td>
                          <span 
                            style={{ 
                              color: team.isActive ? 'green' : 'red', 
                              fontWeight: 'bold' 
                            }}
                          >
                            {team.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="action-buttons">
                          <button onClick={() => handleEdit(team)} className="edit-button">
                            ✏️
                          </button>
                          <button onClick={() => handleDelete(team.id)} className="delete-button" aria-label={`Deletar time`}
                          >
                            ❌
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    export default Teams;

    