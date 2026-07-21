import { useEffect, useState } from 'react';
import { Users, CalendarDays, Clock, CircleCheck } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import api from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ pacientes: 0, citas: 0, pendientes: 0, confirmadas: 0 });
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/pacientes'), api.get('/citas'), api.get('/doctores')]).then(([p, c, d]) => {
      const citasHoy = c.data.filter(ct => ct.fecha === new Date().toISOString().split('T')[0]);
      setStats({
        pacientes:  p.data.length,
        citas:      c.data.length,
        pendientes: c.data.filter(ct => ct.estado === 'pendiente').length,
        confirmadas: c.data.filter(ct => ct.estado === 'confirmada').length,
      });
      setCitas(citasHoy.slice(0, 5));
      setPacientes(p.data);
      setDoctores(d.data);
    }).catch(() => setError('No se pudieron cargar los datos del dashboard. Verificá tu conexión e intentá de nuevo.'));
  }, []);

  const getNombre = (lista, id) => lista.find(x => x.id === id)?.nombre || '—';

  const statCards = [
    { label: 'Total Pacientes',    value: stats.pacientes,   color: '#3B82F6', icon: Users },
    { label: 'Total Citas',        value: stats.citas,       color: '#10B981', icon: CalendarDays },
    { label: 'Citas Pendientes',   value: stats.pendientes,  color: '#F59E0B', icon: Clock },
    { label: 'Citas Confirmadas',  value: stats.confirmadas, color: '#6366F1', icon: CircleCheck },
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="dashboard-date">{new Date().toLocaleDateString('es-PY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="dashboard-welcome card">
        <div>
          <h2>Bienvenido, {user?.nombre}</h2>
          <p>Rol: <strong>{user?.rol}</strong></p>
        </div>
      </div>

      <div className="stat-grid">
        {statCards.map(s => {
          const Icon = s.icon;
          return (
            <div className="stat-card card" key={s.label}>
              <div className="stat-icon" style={{ background: s.color + '18', color: s.color }}>
                <Icon size={22} strokeWidth={2} />
              </div>
              <div>
                <p className="stat-value">{s.value}</p>
                <p className="stat-label">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card dashboard-table-card">
        <div className="dashboard-table-header">
          <h3>Citas de hoy</h3>
        </div>
        {citas.length === 0 ? (
          <p className="dashboard-empty">No hay citas programadas para hoy.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Doctor</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {citas.map(c => (
                  <tr key={c.id}>
                    <td>{c.hora || '—'}</td>
                    <td>{getNombre(pacientes, c.paciente_id)}</td>
                    <td>{getNombre(doctores, c.doctor_id)}</td>
                    <td><span className={`badge ${c.estado}`}>{c.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}