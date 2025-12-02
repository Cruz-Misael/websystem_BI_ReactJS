// DashboardClicks.js - Analytics de Cliques em Dashboards
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard_clicks.css';
import logo from '../assets/logo_personalizado.png';


const API_BASE_URL = process.env.REACT_APP_API_URL;

const DashboardClicks = () => {
    const [clickData, setClickData] = useState([]);
    const [stats, setStats] = useState({
        totalClicks: 0,
        uniqueUsers: 0,
        topDashboard: '',
        clicksToday: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d
    const [userEmail, setUserEmail] = useState('');
    const [accessLevel, setAccessLevel] = useState('');
    const [userTeam, setUserTeam] = useState('');
    const [userName, setUserName] = useState('');
    const [userPhotoUrl, setUserPhotoUrl] = useState('');
    const [inactiveUsers, setInactiveUsers] = useState([]);
    const [loadingInactive, setLoadingInactive] = useState(false);
    const navigate = useNavigate();

    // =========================================================
    // 1. FUNÇÕES DE BUSCA E LÓGICA
    // =========================================================

    const fetchInactiveUsers = async () => {
        try {
            setLoadingInactive(true);
            const response = await fetch(`${API_BASE_URL}/users/inativos`);
            const result = await response.json();

            if (result.success) {
                setInactiveUsers(result.data);
            }
        } catch (err) {
            console.error("Erro ao carregar usuários inativos", err);
        } finally {
            setLoadingInactive(false);
        }
    };

    const deleteUser = async (id) => {
        if (!window.confirm("Tem certeza que deseja remover este usuário?")) return;

        try {
            await fetch(`${API_BASE_URL}/users/${id}`, {
                method: "DELETE"
            });

            setInactiveUsers(prev => prev.filter(u => u.id !== id));
        } catch (err) {
            console.error("Erro ao deletar usuário:", err);
        }
    };

    const deleteAllInactive = async () => {
        if (!window.confirm("Tem certeza que deseja REMOVER TODOS os usuários inativos?")) return;

        for (const user of inactiveUsers) {
            await fetch(`${API_BASE_URL}/users/${user.id}`, { method: "DELETE" });
        }

        setInactiveUsers([]);
    };

    const fetchClickData = useCallback(async () => {
        if (accessLevel !== "Admin") {
            setError("Acesso restrito a administradores.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            // Calcula datas baseadas no timeRange
            const endDate = new Date();
            const startDate = new Date();
            
            switch (timeRange) {
                case '7d':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(endDate.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(endDate.getDate() - 90);
                    break;
                default:
                    startDate.setDate(endDate.getDate() - 7);
            }

            const response = await fetch(
                `${API_BASE_URL}/dashboard/clicks?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
            );
            
            if (!response.ok) {
                throw new Error('Falha ao carregar dados de cliques');
            }
            
            const result = await response.json();
            
            if (result.success) {
                setClickData(result.data);
                calculateStats(result.data);
            } else {
                throw new Error(result.message || 'Erro ao buscar dados');
            }
        } catch (error) {
            console.error("Erro ao buscar dados de cliques:", error);
            setError('Não foi possível carregar os dados de analytics. Tente novamente mais tarde.');
        } finally {
            setIsLoading(false);
        }
    }, [timeRange, accessLevel]);

    const calculateStats = (data) => {
        if (!data || data.length === 0) {
            setStats({
                totalClicks: 0,
                uniqueUsers: 0,
                topDashboard: 'N/A',
                clicksToday: 0
            });
            return;
        }

        // Total de cliques
        const totalClicks = data.length;

        // Usuários únicos
        const uniqueUsers = new Set(data.map(click => click.userEmail)).size;

        // Dashboard mais popular
        const dashboardCounts = {};
        data.forEach(click => {
            const dashName = click.dashboardTitle || `Dashboard ${click.dashboardId}`;
            dashboardCounts[dashName] = (dashboardCounts[dashName] || 0) + 1;
        });
        
        const topDashboard = Object.entries(dashboardCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

        // Cliques hoje
        const today = new Date().toDateString();
        const clicksToday = data.filter(click => {
            const clickDate = click.timestamp?.toDate?.() || new Date(click.timestamp?._seconds * 1000);
            return clickDate.toDateString() === today;
        }).length;

        setStats({
            totalClicks,
            uniqueUsers,
            topDashboard,
            clicksToday
        });
    };

    const getClicksByDay = () => {
        const daysMap = {};
        
        clickData.forEach(click => {
            const date = click.timestamp?.toDate?.() || new Date(click.timestamp?._seconds * 1000);
            const dayKey = date.toLocaleDateString('pt-BR');
            
            if (!daysMap[dayKey]) {
                daysMap[dayKey] = 0;
            }
            daysMap[dayKey]++;
        });

        return Object.entries(daysMap)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .slice(-10); // Últimos 10 dias
    };

    const getTopDashboards = () => {
        const dashMap = {};
        
        clickData.forEach(click => {
            const dashName = click.dashboardTitle || `Dashboard ${click.dashboardId}`;
            dashMap[dashName] = (dashMap[dashName] || 0) + 1;
        });

        return Object.entries(dashMap)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5); // Top 5
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

    const goToUserDashboard = () => {
        navigate('/user-dashboard');
    };

    const goToConfig = () => {
        navigate('/user-settings');
    };

    const DashboardAdmin = () => {
        navigate('/dashboard-admin');
    };

    const Teams = () => {
        navigate('/teams');
    };

    const getUserInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : '?';
    };

    const getDashboardClicksByMonth = () => {
        const monthlyData = {};
        const allDashboards = new Set();
        const allMonths = new Set();

        // Processa todos os cliques
        clickData.forEach(click => {
            const date = click.timestamp?.toDate?.() || new Date(click.timestamp?._seconds * 1000);
            const monthKey = date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');
            const dashboardName = click.dashboardTitle || `Dashboard ${click.dashboardId}`;

            allDashboards.add(dashboardName);
            allMonths.add(monthKey);

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {};
            }

            if (!monthlyData[monthKey][dashboardName]) {
                monthlyData[monthKey][dashboardName] = 0;
            }

            monthlyData[monthKey][dashboardName]++;
        });

        // Ordena os meses
        const sortedMonths = Array.from(allMonths).sort((a, b) => {
            const [mA, yA] = a.split('/');
            const [mB, yB] = b.split('/');
            const dateA = new Date(`${yA}-${mA}-01`);
            const dateB = new Date(`${yB}-${mB}-01`);
            return dateA - dateB;
        });

        // Ordena os dashboards por nome
        const sortedDashboards = Array.from(allDashboards).sort();

        return {
            months: sortedMonths,
            dashboards: sortedDashboards,
            data: monthlyData
        };
    };

    const GroupedBarChart = ({ title }) => {
        const { months, dashboards, data } = getDashboardClicksByMonth();

        if (months.length === 0 || dashboards.length === 0) {
            return (
                <div className="chart-container">
                    <h4>{title}</h4>
                    <div className="no-data">Sem dados para exibir</div>
                </div>
            );
        }

        // Encontra o valor máximo para escalar as barras
        let maxValue = 0;
        months.forEach(month => {
            dashboards.forEach(dashboard => {
                const value = data[month]?.[dashboard] || 0;
                maxValue = Math.max(maxValue, value);
            });
        });

        // Cores para as barras (pode personalizar)
        const colors = [
            'linear-gradient(135deg, #FF6B6B, #EE5A52)',
            'linear-gradient(135deg, #4ECDC4, #45B7AF)',
            'linear-gradient(135deg, #FFD166, #FFC857)',
            'linear-gradient(135deg, #06D6A0, #05C191)',
            'linear-gradient(135deg, #118AB2, #0F7A9D)',
            'linear-gradient(135deg, #073B4C, #052E3A)',
            'linear-gradient(135deg, #7209B7, #5A0792)',
            'linear-gradient(135deg, #F15BB5, #D14A9E)',
            'linear-gradient(135deg, #00BBF9, #00A5E0)',
            'linear-gradient(135deg, #9B5DE5, #7D46C7)'
        ];




        return (
            <div className="chart-container grouped-chart">
                <h4>{title}</h4>
                <div className="chart-legend">
                    {dashboards.map((dashboard, index) => (
                        <div key={dashboard} className="legend-item">
                            <div 
                                className="legend-color" 
                                style={{ background: colors[index % colors.length] }}
                            ></div>
                            <span className="legend-label">{dashboard}</span>
                        </div>
                    ))}
                </div>
                <div className="grouped-bars-container">
                    <div className="bars-scroll">
                        {months.map(month => (
                            <div key={month} className="month-group">
                                <div className="month-label">{month}</div>
                                <div className="bars-group">
                                    {dashboards.map((dashboard, index) => {
                                        const value = data[month]?.[dashboard] || 0;
                                        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                                        
                                        return (
                                            <div key={dashboard} className="bar-container">
                                                <div className="bar-wrapper">
                                                    <div 
                                                        className="grouped-bar"
                                                        style={{ 
                                                            height: `${percentage}%`,
                                                            background: colors[index % colors.length]
                                                        }}
                                                        title={`${dashboard}: ${value} cliques`}
                                                    ></div>
                                                </div>
                                                <div className="bar-value-small">{value}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // =========================================================
    // 2. USE EFFECT
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
        }
    }, [navigate]);

    useEffect(() => {
        if (accessLevel === "Admin") {
            fetchClickData();
        }
    }, [fetchClickData, accessLevel]);

    // =========================================================
    // 3. COMPONENTES VISUAIS
    // =========================================================

    const StatCard = ({ title, value, icon, color }) => (
        <div className="stat-card">
            <div className="stat-icon" style={{ background: color }}>
                <i className={icon}></i>
            </div>
            <div className="stat-content">
                <h3 className="stat-value">{value}</h3>
                <p className="stat-title">{title}</p>
            </div>
        </div>
    );

    const SimpleBarChart = ({ data, title }) => {
        if (!data || data.length === 0) {
            return (
                <div className="chart-container">
                    <h4>{title}</h4>
                    <div className="no-data">Sem dados para exibir</div>
                </div>
            );
        }

        const maxValue = Math.max(...data.map(([, count]) => count));
        
        return (
            <div className="chart-container">
                <h4>{title}</h4>
                <div className="bar-chart">
                    {data.map(([label, value]) => (
                        <div key={label} className="bar-item">
                            <div className="bar-label">{label}</div>
                            <div className="bar-track">
                                <div 
                                    className="bar-fill"
                                    style={{ 
                                        width: `${(value / maxValue) * 100}%`,
                                        background: 'linear-gradient(135deg, var(--sebratel-red), var(--sebratel-yellow))'
                                    }}
                                ></div>
                            </div>
                            <div className="bar-value">{value}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const getClicksByMonth = () => {
        const monthsMap = {};

        clickData.forEach(click => {
            const date = click.timestamp?.toDate?.() || new Date(click.timestamp?._seconds * 1000);

            // Formato: "Jan/2025"
            const monthKey = date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' })
                .replace('.', ''); // remove ponto do "jan."

            if (!monthsMap[monthKey]) {
                monthsMap[monthKey] = 0;
            }

            monthsMap[monthKey]++;
        });

        return Object.entries(monthsMap)
            .sort(([a], [b]) => {
                const [mA, yA] = a.split('/');
                const [mB, yB] = b.split('/');

                const dateA = new Date(`${yA}-${mA}-01`);
                const dateB = new Date(`${yB}-${mB}-01`);

                return dateA - dateB;
            });
    };

    const renderInactiveUsers = () => (
    <div className="inactive-users-section">
        <h2>Usuários sem acesso há mais de dois meses:</h2>

        <button
        className="inactive-refresh-btn"
        onClick={fetchInactiveUsers}
        >
        Atualizar lista
        </button>

        {inactiveUsers.length > 0 && (
        <button
            className="inactive-delete-all-btn"
            onClick={deleteAllInactive}
        >
            Excluir Todos
        </button>
        )}

        {loadingInactive && <p>Carregando usuários inativos...</p>}

        {!loadingInactive && inactiveUsers.length === 0 && (
        <p className="inactive-empty">Nenhum usuário inativo encontrado.</p>
        )}

        {!loadingInactive && inactiveUsers.length > 0 && (
        <div className="inactive-table-wrapper">
            <table className="inactive-table">
            <thead>
                <tr>
                <th>Nome</th>
                <th>Email</th>
                <th className="text-center">Ação</th>
                </tr>
            </thead>
            <tbody>
                {inactiveUsers.map((u) => (
                <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td className="text-center">
                    <button
                        className="inactive-delete-btn"
                        onClick={() => deleteUser(u.id)}
                    >
                        Excluir
                    </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        )}
    </div>
    );

    const getDistinctDashboardsByMonth = () => {
    const monthDashMap = {};

    clickData.forEach(click => {
        const date = click.timestamp?.toDate?.() || new Date(click.timestamp?._seconds * 1000);
        const monthKey = date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');
        const dashboard = click.dashboardTitle || `Dashboard ${click.dashboardId}`;

        if (!monthDashMap[monthKey]) monthDashMap[monthKey] = new Set();
        monthDashMap[monthKey].add(dashboard);
    });

    // Converte para array de [mês, quantidade distinta]
    return Object.entries(monthDashMap)
        .map(([month, dashboardsSet]) => [month, dashboardsSet.size])
        .sort(([a], [b]) => {
        const [mA, yA] = a.split('/');
        const [mB, yB] = b.split('/');
        return new Date(`${yA}-${mA}-01`) - new Date(`${yB}-${mB}-01`);
        });
    };

    const DashboardsByMonthChart = ({ data, title }) => {
    if (!data || data.length === 0) {
        return (
        <div className="chart-container">
            <h4>{title}</h4>
            <div className="no-data">Sem dados para exibir</div>
        </div>
        );
    }

    return (
        <div className="chart-container">
        <h4>{title}</h4>
        <div className="dashboards-by-month">
            {data.map(([month, dashboards]) => (
            <div key={month} className="month-group">
                <div className="month-label">{month}</div>
                <div className="dashboards-list">
                {dashboards.map(d => (
                    <span key={d} className="dashboard-tag">{d}</span>
                ))}
                </div>
            </div>
            ))}
        </div>
        </div>
    );
    };

    const getDashboardsByLastTwoMonths = () => {
        const monthDashMap = {};

        clickData.forEach(click => {
            const date = click.timestamp?.toDate?.() || new Date(click.timestamp?._seconds * 1000);
            const monthKey = date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');
            const dashboard = click.dashboardTitle || `Dashboard ${click.dashboardId}`;

            if (!monthDashMap[monthKey]) monthDashMap[monthKey] = new Set();
            monthDashMap[monthKey].add(dashboard);
        });

        // Ordena os meses
        const sortedMonths = Object.entries(monthDashMap)
            .sort(([a], [b]) => {
            const [mA, yA] = a.split('/');
            const [mB, yB] = b.split('/');
            return new Date(`${yA}-${mA}-01`) - new Date(`${yB}-${mB}-01`);
            });

        // Pega apenas os dois últimos meses
        const lastTwoMonths = sortedMonths.slice(-2);

        return lastTwoMonths.map(([month, dashboardsSet]) => [month, Array.from(dashboardsSet)]);
    };



    // =========================================================
    // 4. RENDERIZAÇÃO
    // =========================================================
    return (
        <div className="app-layout">
            {/* Sidebar (igual ao UserDashboard) */}
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
                    <button className="nav-btn" onClick={goToUserDashboard}>
                        <i className="fas fa-chart-bar"></i> Meus Dashboards
                    </button>
                    
                    <button className="nav-btn" onClick={DashboardAdmin}>
                        <i className="fas fa-cog"></i> Gerenciar Dashboards
                    </button>
                    
                    <button className="nav-btn" onClick={goToConfig}>
                        <i className="fas fa-user-lock"></i> Gerenciar Usuários
                    </button>

                    <button className="nav-btn active">
                        <i className="fas fa-analytics"></i> Analytics
                    </button>
                </nav>
                
                <button className="logout-btn-sidebar" onClick={logout}>
                    <i className="fas fa-sign-out-alt"></i> Sair
                </button>
                <div class="sidebar-footer">
                    <p class="footer-title">Sebratel Tecnologia — Todos os direitos reservados</p>
                    <p class="footer-subtitle">Desenvolvido pela Equipe de P&D</p>
                </div>
            </aside>

            {/* Conteúdo Principal */}
            <div className="main-content">
        <header className="main-header">
          <div className="header-left">
            <img src={logo} alt="Logo Sebratel" className="header-logo" />
            <h1 className="header-title-text">
              Gerenciamento de Cliques
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

                <main className="dashboard-grid-container">
                    {isLoading ? (
                        <div className="loading-state">
                            <i className="fas fa-spinner fa-spin"></i>
                            <p>Carregando analytics...</p>
                        </div>
                    ) : error ? (
                        <div className="error-state">
                            <i className="fas fa-exclamation-triangle"></i>
                            <p>{error}</p>
                            <button onClick={fetchClickData} className="retry-btn">
                                Tentar novamente
                            </button>
                        </div>
                    ) : (
                        <div className="analytics-content">
                            {/* Cards de Estatísticas */}
                            <div className="stats-grid compact-stats">
                                <StatCard 
                                    title="Total de Cliques" 
                                    value={stats.totalClicks} 
                                    icon="fas fa-mouse-pointer"
                                    color="linear-gradient(135deg, var(--sebratel-red), var(--sebratel-red-dark))"
                                />
                                <StatCard 
                                    title="Usuários Únicos" 
                                    value={stats.uniqueUsers} 
                                    icon="fas fa-users"
                                    color="linear-gradient(135deg, var(--sebratel-yellow), var(--sebratel-yellow-dark))"
                                />
                                <StatCard 
                                    title="Cliques Hoje" 
                                    value={stats.clicksToday} 
                                    icon="fas fa-calendar-day"
                                    color="linear-gradient(135deg, #10B981, #059669)"
                                />
                                <StatCard 
                                    title="Dashboard Mais Popular" 
                                    value={stats.topDashboard} 
                                    icon="fas fa-trophy"
                                    color="linear-gradient(135deg, #8B5CF6, #7C3AED)"
                                />
                            </div>

                            {/* Gráficos */}
                            <div className="charts-grid">
                                <SimpleBarChart 
                                    data={getClicksByDay()} 
                                    title="Cliques por Dia (Últimos 10 dias)"
                                />
                                <SimpleBarChart 
                                    data={getTopDashboards()} 
                                    title="Top 5 Dashboards Mais Acessados"
                                />
                                <SimpleBarChart 
                                    data={getClicksByMonth()} 
                                    title="Cliques por Mês"
                                />
                                <DashboardsByMonthChart
                                    data={getDashboardsByLastTwoMonths()}
                                    title="Dashboards Visualizados (Últimos 2 meses)"
                                />
                                <SimpleBarChart 
                                    data={getDistinctDashboardsByMonth()} 
                                    title="Dashboards Distintas Acessados por Mês" 
                                />

                            </div>

                            {/* =========================================================
                                    AQUI ENTRA A NOVA SEÇÃO: USUÁRIOS INATIVOS
                                ========================================================= */}
                            {renderInactiveUsers && renderInactiveUsers()}

                            {/* Botão de atualizar */}
                            <div className="analytics-actions">
                                <button onClick={fetchClickData} className="refresh-btn">
                                    <i className="fas fa-sync-alt"></i> Atualizar Dados
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default DashboardClicks;