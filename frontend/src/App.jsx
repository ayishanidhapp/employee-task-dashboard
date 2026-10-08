import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Tasks from './pages/Tasks';

function Protected({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return <div className="center-screen"><div className="spinner" /></div>;
  return admin ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { admin, loading } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!loading && admin ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="employees" element={<Employees />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
