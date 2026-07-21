import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, Users, CalendarDays, Stethoscope, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard', icon: LayoutGrid,   label: 'Dashboard' },
  { to: '/pacientes', icon: Users,        label: 'Pacientes' },
  { to: '/citas',     icon: CalendarDays, label: 'Citas' },
  { to: '/doctores',  icon: Stethoscope,  label: 'Doctores' },
  { to: '/usuarios',  icon: Settings,     label: 'Usuarios', adminOnly: true },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon"><Stethoscope size={20} strokeWidth={2} /></span>
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
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-link-icon"><Icon size={18} strokeWidth={2} /></span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <button className="sidebar-logout" onClick={handleLogout}>
        <LogOut size={16} strokeWidth={2} /> Cerrar sesión
      </button>
    </aside>
  );
}