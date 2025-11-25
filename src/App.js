// App.js (Versão Modificada para Google SSO)

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Importe o novo componente de login SSO
import LoginSSO from './components/LoginGoogleSSO'; // ASSUMIDO: Novo componente de login SSO
// Os componentes de administração e dashboard permanecem
import UserSettings from './components/UserSettings';
// import Register from './components/Register'; // REMOVIDO: Não é mais necessário
import DashboardAdmin from './components/DashboardAdmin';
import UserDashboard from './components/UserDashboard';
import Teams from './components/Teams';

// Rota protegida - Permanece inalterada, pois a lógica de autenticação (localStorage) é a mesma
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const userEmail = localStorage.getItem("userEmail");
  const accessLevel = localStorage.getItem("accessLevel");

  if (!userEmail) {
    // Redireciona para a nova rota de login
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && accessLevel !== "Admin") {
    return <Navigate to="/user-dashboard" replace />;
  }

  return children;
};

// Rota que impede acesso se estiver logado - Permanece inalterada
const AuthRoute = ({ children }) => {
  const userEmail = localStorage.getItem("userEmail");
  return userEmail ? <Navigate to="/user-dashboard" replace /> : children;
};

function App() {
  const isLoggedIn = !!localStorage.getItem("userEmail");

  return (
    <Router>
      <Routes>
        {/* Rota inicial: Redireciona para dashboard se logado, ou para login se deslogado */}
        <Route path="/" element={
          isLoggedIn ?
            <Navigate to="/user-dashboard" replace /> :
            <Navigate to="/login" replace />
        } />

        {/* Rota de Login: Usa o novo componente LoginSSO */}
        <Route path="/login" element={
          <AuthRoute>
            <LoginSSO /> {/* SUBSTITUÍDO: Login -> LoginSSO */}
          </AuthRoute>
        } />

        {/* Rota de Registro: REMOVIDA ou APONTADA para o LoginSSO */}
        {/* Se você quiser manter a rota /register, pode apontá-la para o login */}
        <Route path="/register" element={
          <Navigate to="/login" replace />
        } />
        {/* OU SIMPLESMENTE REMOVA A ROTA /register */}

        {/* Rotas Protegidas (Admin) - Permanecem inalteradas */}
        <Route path="/user-settings" element={
          <ProtectedRoute adminOnly>
            <UserSettings />
          </ProtectedRoute>
        } />

        <Route path="/dashboard-admin" element={
          <ProtectedRoute adminOnly>
            <DashboardAdmin />
          </ProtectedRoute>
        } />

        <Route path="/teams" element={
          <ProtectedRoute adminOnly>
            <Teams />
          </ProtectedRoute>
        } />

        {/* Rota Protegida (User) - Permanece inalterada */}
        <Route path="/user-dashboard" element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        } />

        {/* Rota Curinga */}
        <Route path="*" element={
          isLoggedIn ? <Navigate to="/user-dashboard" replace /> : <Navigate to="/login" replace />
        } />
      </Routes>
    </Router>
  );
}

export default App;
