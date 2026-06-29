import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import './Layout.css';

export default function Layout() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Cargando...</div>;
  if (!user)   return <Navigate to="/login" replace />;

  return (
    <div className="layout">
      <Sidebar />
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}