import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import './Usuarios.css';

const emptyForm = { nombre: '', email: '', password: '', rol: 'recepcionista' };

export default function Usuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm]         = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const isAdmin = user?.rol === 'admin';

  const load = () => api.get('/usuarios').then(r => setUsuarios(r.data))
    .catch(() => setError('No se pudo cargar la lista de usuarios. Verificá tu conexión e intentá de nuevo.'));

  // El hook se llama siempre (regla de hooks): solo el fetch queda condicionado al rol.
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      await api.post('/usuarios/registro', form);
      setSuccess('Usuario registrado correctamente.');
      setForm(emptyForm); setShowForm(false); load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar el usuario.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Gestión de Usuarios</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Nuevo usuario</>}
        </button>
      </div>

      {error   && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      {showForm && (
        <div className="card usuarios-form">
          <h3>Registrar nuevo usuario</h3>
          <form onSubmit={handleSubmit} className="usuarios-form-grid">
            <div className="form-group">
              <label>Nombre completo</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Nombre del usuario" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="correo@sistemadent.com" />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label>Rol</label>
              <select name="rol" value={form.rol} onChange={handleChange}>
                <option value="recepcionista">Recepcionista</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Registrar</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.nombre}</strong></td>
                  <td>{u.email}</td>
                  <td><span className="badge confirmada badge-capitalize">{u.rol}</span></td>
                  <td><span className={`badge ${u.activo ? 'confirmada' : 'cancelada'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}