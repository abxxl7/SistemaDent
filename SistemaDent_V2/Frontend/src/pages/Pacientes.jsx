import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Search, Pencil, Lock, ClipboardList, KeyRound } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import './Pacientes.css';

const TIPOS_SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const emptyForm = {
  nombre: '',
  documento: '',
  telefono: '',
  email: '',
  fecha_registro: new Date().toISOString().split('T')[0],
  direccion: '',
  tipo_sangre: '',
};

export default function Pacientes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canViewHistorial = user?.rol === 'doctor' || user?.rol === 'admin';
  const canResetAcceso   = user?.rol === 'admin'  || user?.rol === 'recepcionista';
  const [pacientes, setPacientes] = useState([]);
  const [form, setForm]           = useState(emptyForm);
  const [editId, setEditId]       = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [search, setSearch]       = useState('');

  const load = () => api.get('/pacientes').then(r => setPacientes(r.data))
    .catch(() => setError('No se pudo cargar la lista de pacientes. Verificá tu conexión e intentá de nuevo.'));
  useEffect(() => { load(); }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      if (editId) {
        await api.put(`/pacientes/${editId}`, {
          nombre:      form.nombre,
          telefono:    form.telefono,
          email:       form.email || null,
          direccion:   form.direccion || null,
          tipo_sangre: form.tipo_sangre || null,
        });
        setSuccess('Paciente actualizado correctamente.');
      } else {
        await api.post('/pacientes', {
          ...form,
          email:       form.email       || null,
          direccion:   form.direccion   || null,
          tipo_sangre: form.tipo_sangre || null,
        });
        setSuccess('Paciente registrado correctamente.');
      }
      setForm(emptyForm); setEditId(null); setShowForm(false); load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar el paciente.');
    }
  };

  const handleEdit = p => {
    setForm({
      nombre:         p.nombre,
      documento:      p.documento,
      telefono:       p.telefono,
      email:          p.email        || '',
      fecha_registro: p.fecha_registro,
      direccion:      p.direccion    || '',
      tipo_sangre:    p.tipo_sangre  || '',
    });
    setEditId(p.id); setShowForm(true); setError(''); setSuccess('');
  };

  const handleResetAcceso = async p => {
    if (!confirm(`¿Resetear el acceso de ${p.nombre}? Va a tener que volver a activar su cuenta desde la app con una contraseña nueva.`)) return;
    setError(''); setSuccess('');
    try {
      const { data } = await api.put(`/pacientes/${p.id}/resetear-password`);
      setSuccess(data.detail);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al resetear el acceso del paciente.');
    }
  };

  const filtered = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.documento.includes(search)
  );

  return (
    <div className="pacientes">
      <div className="page-header">
        <h1>Pacientes</h1>
        <button className="btn btn-primary" onClick={() => {
          setShowForm(!showForm); setEditId(null); setForm(emptyForm);
          setError(''); setSuccess('');
        }}>
          {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Nuevo paciente</>}
        </button>
      </div>

      {error   && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      {showForm && (
        <div className="card pacientes-form">
          <h3>{editId ? 'Editar paciente' : 'Registrar nuevo paciente'}</h3>
          <form onSubmit={handleSubmit} className="pacientes-form-grid">
            <div className="form-group">
              <label>Nombre completo *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Ej: Juan Pérez" />
            </div>
            <div className="form-group">
              <label>Número de documento *</label>
              <input name="documento" value={form.documento} onChange={handleChange} required placeholder="Ej: 4521789" disabled={!!editId} />
            </div>
            <div className="form-group">
              <label>Teléfono *</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} required placeholder="Ej: 0981123456" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="correo@ejemplo.com" />
            </div>
            <div className="form-group">
              <label>Dirección</label>
              <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Ej: Av. España 123, Asunción" />
            </div>
            <div className="form-group">
              <label>Tipo de sangre</label>
              <select name="tipo_sangre" value={form.tipo_sangre} onChange={handleChange}>
                <option value="">— Seleccionar —</option>
                {TIPOS_SANGRE.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {!editId && (
              <div className="form-group">
                <label>Fecha de registro *</label>
                <input name="fecha_registro" type="date" value={form.fecha_registro} onChange={handleChange} required />
              </div>
            )}
            <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary">{editId ? 'Actualizar' : 'Registrar'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setEditId(null); }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="pacientes-search">
          <div className="search-input-wrap">
            <Search size={16} className="search-input-icon" />
            <input
              placeholder="Buscar por nombre o documento..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <span className="pacientes-count">{filtered.length} paciente{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Tipo de sangre</th>
                <th>Email</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '32px' }}>No se encontraron pacientes.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.nombre}</strong></td>
                  <td>{p.documento}</td>
                  <td>{p.telefono}</td>
                  <td>{p.direccion || '—'}</td>
                  <td>{p.tipo_sangre
                    ? <span className="badge confirmada">{p.tipo_sangre}</span>
                    : '—'}
                  </td>
                  <td>{p.email || '—'}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(p)}><Pencil size={14} /> Editar</button>
                      {canViewHistorial && (
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/pacientes/${p.id}/historial`)}>
                          <ClipboardList size={14} /> Ver historial
                        </button>
                      )}
                      {canResetAcceso && p.tiene_cuenta && (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleResetAcceso(p)}>
                          <KeyRound size={14} /> Resetear acceso
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="v2-note">
        <Lock size={14} /> En esta versión los registros de pacientes son permanentes para preservar el historial médico.
      </div>
    </div>
  );
}