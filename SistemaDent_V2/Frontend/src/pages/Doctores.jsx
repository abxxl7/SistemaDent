import { useEffect, useState } from 'react';
import { Plus, X, CalendarDays, Pencil, Trash2, Search } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import './Doctores.css';

const emptyForm = { nombre: '', especialidad: '', email: '' };

export default function Doctores() {
  const { user }                  = useAuth();
  const [doctores, setDoctores]   = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [form, setForm]           = useState(emptyForm);
  const [editId, setEditId]       = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [search, setSearch]       = useState('');
  const [agenda, setAgenda]       = useState({ doctorId: null, fecha: '', citas: [] });

  const load = () => Promise.all([api.get('/doctores'), api.get('/pacientes')])
    .then(([d, p]) => { setDoctores(d.data); setPacientes(p.data); })
    .catch(() => setError('No se pudo cargar la lista de doctores. Verificá tu conexión e intentá de nuevo.'));
  useEffect(() => { load(); }, []);

  const getNombrePaciente = (id) => pacientes.find(p => p.id === id)?.nombre || `ID ${id}`;

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      if (editId) {
        await api.put(`/doctores/${editId}`, form);
        setSuccess('Doctor actualizado correctamente.');
      } else {
        await api.post('/doctores', form);
        setSuccess('Doctor registrado correctamente.');
      }
      setForm(emptyForm); setEditId(null); setShowForm(false); load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar el doctor.');
    }
  };

  const handleEdit = d => {
    setForm({ nombre: d.nombre, especialidad: d.especialidad, email: d.email });
    setEditId(d.id); setShowForm(true); setError(''); setSuccess('');
  };

  const handleDelete = async id => {
    if (!confirm('¿Eliminar este doctor?')) return;
    try {
      await api.delete(`/doctores/${id}`); load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al eliminar el doctor.');
    }
  };

  const verAgenda = async (doctorId) => {
    if (!agenda.fecha) { setError('Seleccioná una fecha para ver la agenda.'); return; }
    setError('');
    try {
      const { data } = await api.get(`/doctores/${doctorId}/agenda?fecha=${agenda.fecha}`);
      setAgenda(prev => ({ ...prev, doctorId, citas: data }));
    } catch {
      setError('Error al cargar la agenda.');
    }
  };

  const filtered = doctores.filter(d =>
    d.nombre.toLowerCase().includes(search.toLowerCase()) ||
    d.especialidad.toLowerCase().includes(search.toLowerCase())
  );

  const isAdmin = user?.rol === 'admin';

  return (
    <div className="doctores">
      <div className="page-header">
        <h1>Doctores</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => {
            setShowForm(!showForm); setEditId(null); setForm(emptyForm);
            setError(''); setSuccess('');
          }}>
            {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Nuevo doctor</>}
          </button>
        )}
      </div>

      {error   && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      {showForm && isAdmin && (
        <div className="card doctores-form">
          <h3>{editId ? 'Editar doctor' : 'Registrar nuevo doctor'}</h3>
          <form onSubmit={handleSubmit} className="doctores-form-grid">
            <div className="form-group">
              <label>Nombre completo *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Ej: Dr. Juan Pérez" />
            </div>
            <div className="form-group">
              <label>Especialidad *</label>
              <input name="especialidad" value={form.especialidad} onChange={handleChange} required placeholder="Ej: Odontología General" />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="doctor@sistemadent.com" />
            </div>
            <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary">{editId ? 'Actualizar' : 'Registrar'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setEditId(null); }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Panel de agenda */}
      <div className="card agenda-panel">
        <h3><CalendarDays size={16} /> Consultar agenda del doctor</h3>
        <div className="agenda-controls">
          <input
            type="date"
            value={agenda.fecha}
            onChange={e => setAgenda(prev => ({ ...prev, fecha: e.target.value, citas: [], doctorId: null }))}
            className="agenda-date"
          />
          <span className="agenda-hint">Seleccioná una fecha y luego hacé click en "Ver agenda" del doctor.</span>
        </div>
        {agenda.doctorId && agenda.citas.length === 0 && (
          <p className="agenda-empty">No hay citas programadas para este doctor en la fecha seleccionada.</p>
        )}
        {agenda.citas.length > 0 && (
          <div className="table-wrapper" style={{ marginTop: 12 }}>
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Estado</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {agenda.citas.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.hora}</strong></td>
                    <td>{getNombrePaciente(c.paciente_id)}</td>
                    <td><span className={`badge ${c.estado}`}>{c.estado}</span></td>
                    <td>{c.notas || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="pacientes-search">
          <div className="search-input-wrap">
            <Search size={16} className="search-input-icon" />
            <input
              placeholder="Buscar por nombre o especialidad..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <span className="pacientes-count">{filtered.length} doctor{filtered.length !== 1 ? 'es' : ''}</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Especialidad</th>
                <th>Email</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '32px' }}>No se encontraron doctores.</td></tr>
              ) : filtered.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.nombre}</strong></td>
                  <td>{d.especialidad}</td>
                  <td>{d.email}</td>
                  <td><span className={`badge ${d.activo ? 'confirmada' : 'cancelada'}`}>{d.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => verAgenda(d.id)}><CalendarDays size={14} /> Ver agenda</button>
                      {isAdmin && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(d)}><Pencil size={14} /> Editar</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id)}><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}