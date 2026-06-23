import { useEffect, useState } from 'react';
import api from '../services/api';
import './Citas.css';

// BUG V1: El formulario permite enviar cita sin paciente, doctor, fecha u hora.
// No hay validación de conflicto de horario en el frontend ni en el backend.

const emptyForm = { paciente_id: '', doctor_id: '', fecha: '', hora: '', notas: '' };

export default function Citas() {
  const [citas, setCitas]       = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [form, setForm]         = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [filter, setFilter]     = useState('todos');

  const load = () => Promise.all([
    api.get('/citas'), api.get('/pacientes'), api.get('/doctores')
  ]).then(([c, p, d]) => {
    setCitas(c.data); setPacientes(p.data); setDoctores(d.data);
  }).catch(() => {});

  useEffect(() => { load(); }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      // BUG V1: Se envía el form sin validar que todos los campos estén completos.
      await api.post('/citas', {
        paciente_id: form.paciente_id ? parseInt(form.paciente_id) : null,
        doctor_id:   form.doctor_id   ? parseInt(form.doctor_id)   : null,
        fecha:       form.fecha  || null,
        hora:        form.hora   || null,
        notas:       form.notas  || null,
      });
      setSuccess('Cita agendada correctamente.');
      setForm(emptyForm); setShowForm(false); load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al agendar la cita.');
    }
  };

  const handleEstado = async (id, estado) => {
    // BUG V1: Cualquier transición de estado es permitida sin validación.
    await api.put(`/citas/${id}`, { estado });
    load();
  };

  const handleDelete = async id => {
    if (!confirm('¿Eliminar esta cita?')) return;
    await api.delete(`/citas/${id}`); load();
  };

  const getNombre = (lista, id) => lista.find(x => x.id === id)?.nombre || `ID ${id}`;

  const filtered = filter === 'todos' ? citas : citas.filter(c => c.estado === filter);

  return (
    <div className="citas">
      <div className="page-header">
        <h1>Citas</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '+ Nueva cita'}
        </button>
      </div>

      {error   && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      {showForm && (
        <div className="card citas-form">
          <h3>Agendar nueva cita</h3>
          <form onSubmit={handleSubmit} className="citas-form-grid">
            <div className="form-group">
              <label>Paciente</label>
              {/* BUG V1: Campo no requerido — se puede enviar sin seleccionar */}
              <select name="paciente_id" value={form.paciente_id} onChange={handleChange}>
                <option value="">— Seleccionar paciente —</option>
                {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Doctor</label>
              <select name="doctor_id" value={form.doctor_id} onChange={handleChange}>
                <option value="">— Seleccionar doctor —</option>
                {doctores.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Fecha</label>
              <input name="fecha" type="date" value={form.fecha} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Hora</label>
              <input name="hora" type="time" value={form.hora} onChange={handleChange} />
            </div>
            <div className="form-group full-width">
              <label>Notas (opcional)</label>
              <textarea name="notas" value={form.notas} onChange={handleChange} rows={2} placeholder="Observaciones adicionales..." />
            </div>
            <div className="form-actions full-width">
              <button type="submit" className="btn btn-primary">Agendar cita</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="citas-filters">
          {['todos','pendiente','confirmada','cancelada','completada'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <span className="pacientes-count" style={{ marginLeft: 'auto' }}>{filtered.length} cita{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Doctor</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '32px' }}>No hay citas.</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td>{c.paciente_id ? getNombre(pacientes, c.paciente_id) : <span style={{color:'var(--danger)'}}>Sin paciente</span>}</td>
                  <td>{c.doctor_id   ? getNombre(doctores, c.doctor_id)   : <span style={{color:'var(--danger)'}}>Sin doctor</span>}</td>
                  <td>{c.fecha || '—'}</td>
                  <td>{c.hora  || '—'}</td>
                  <td><span className={`badge ${c.estado}`}>{c.estado}</span></td>
                  <td>
                    <div className="row-actions">
                      <select
                        className="estado-select"
                        value={c.estado}
                        onChange={e => handleEstado(c.id, e.target.value)}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="cancelada">Cancelada</option>
                        <option value="completada">Completada</option>
                      </select>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>🗑️</button>
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