import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/pacientes', icon: '👤', label: 'Pacientes' },
  { to: '/citas',     icon: '📅', label: 'Citas' },
  { to: '/usuarios',  icon: '⚙️',  label: 'Usuarios', adminOnly: true },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">🦷</span>
        <span className="sidebar-logo-text">SistemaDent</span>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{user?.nombre?.[0]?.toUpperCase()}</div>
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">{user?.nombre}</p>
          <p className="sidebar-user-role">{user?.rol}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => {
          if (item.adminOnly && user?.rol !== 'admin') return null;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <button className="sidebar-logout" onClick={handleLogout}>
        <span>⎋</span> Cerrar sesión
      </button>
    </aside>
  );
}