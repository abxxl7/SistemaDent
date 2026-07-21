import { useEffect, useState } from 'react';
import { Plus, X, Clock, Trash2 } from 'lucide-react';
import api from '../services/api';
import './Citas.css';

const emptyForm = { paciente_id: '', doctor_id: '', fecha: '', hora: '', notas: '' };

// Turnos fijos de 45 min: 08:00, 08:45, 09:30 ... 17:45
const SLOTS_HORARIO = [
  '08:00', '08:45', '09:30', '10:15', '11:00', '11:45', '12:30',
  '13:15', '14:00', '14:45', '15:30', '16:15', '17:00', '17:45',
];

// Transiciones válidas por estado
const TRANSICIONES = {
  pendiente:  ['confirmada', 'cancelada'],
  confirmada: ['completada', 'cancelada'],
  cancelada:  [],
  completada: [],
};

export default function Citas() {
  const [citas, setCitas]         = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores]   = useState([]);
  const [form, setForm]           = useState(emptyForm);
  const [showForm, setShowForm]   = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [filter, setFilter]       = useState('todos');
  const [flashId, setFlashId]     = useState(null);

  const load = () => Promise.all([
    api.get('/citas'), api.get('/pacientes'), api.get('/doctores')
  ]).then(([c, p, d]) => {
    setCitas(c.data); setPacientes(p.data); setDoctores(d.data);
  }).catch(() => setError('No se pudo cargar la lista de citas. Verificá tu conexión e intentá de nuevo.'));

  useEffect(() => { load(); }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setSuccess('');

    try {
      await api.post('/citas', {
        paciente_id: parseInt(form.paciente_id),
        doctor_id:   parseInt(form.doctor_id),
        fecha:       form.fecha,
        hora:        form.hora,
        notas:       form.notas || null,
      });
      setSuccess('Cita agendada correctamente.');
      setForm(emptyForm); setShowForm(false); load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al agendar la cita.');
    }
  };

  const handleEstado = async (id, estadoActual, nuevoEstado) => {
    const permitidos = TRANSICIONES[estadoActual] || [];
    if (!permitidos.includes(nuevoEstado)) {
      alert(`Transición inválida: no se puede pasar de "${estadoActual}" a "${nuevoEstado}".`);
      return;
    }
    try {
      await api.put(`/citas/${id}`, { estado: nuevoEstado });
      load();
      setFlashId(id);
      setTimeout(() => setFlashId(null), 1000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al actualizar el estado.');
    }
  };

  const handleDelete = async id => {
    if (!confirm('¿Eliminar esta cita?')) return;
    try {
      await api.delete(`/citas/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar la cita.');
    }
  };

  const getNombre = (lista, id) => lista.find(x => x.id === id)?.nombre || `ID ${id}`;

  const filtered = filter === 'todos' ? citas : citas.filter(c => c.estado === filter);

  return (
    <div className="citas">
      <div className="page-header">
        <h1>Citas</h1>
        <button className="btn btn-primary" onClick={() => {
          setShowForm(!showForm); setError(''); setSuccess('');
        }}>
          {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Nueva cita</>}
        </button>
      </div>

      {error   && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      {showForm && (
        <div className="card citas-form">
          <h3>Agendar nueva cita</h3>
          <div className="horario-info">
            <Clock size={14} /> Horario laboral: 08:00 — 18:00 · Turnos de 45 min · Máximo 9 citas por doctor por día
          </div>
          <form onSubmit={handleSubmit} className="citas-form-grid">
            <div className="form-group">
              <label>Paciente *</label>
              <select name="paciente_id" value={form.paciente_id} onChange={handleChange} required>
                <option value="">— Seleccionar paciente —</option>
                {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Doctor *</label>
              <select name="doctor_id" value={form.doctor_id} onChange={handleChange} required>
                <option value="">— Seleccionar doctor —</option>
                {doctores.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Fecha *</label>
              <input name="fecha" type="date" value={form.fecha} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Hora * (turnos de 45 min)</label>
              <select name="hora" value={form.hora} onChange={handleChange} required>
                <option value="">— Seleccionar horario —</option>
                {SLOTS_HORARIO.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="form-group full-width">
              <label>Notas</label>
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
          <span className="pacientes-count" style={{ marginLeft: 'auto' }}>
            {filtered.length} cita{filtered.length !== 1 ? 's' : ''}
          </span>
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
                <tr key={c.id} className={flashId === c.id ? 'row-flash' : ''}>
                  <td>{getNombre(pacientes, c.paciente_id)}</td>
                  <td>{getNombre(doctores, c.doctor_id)}</td>
                  <td>{c.fecha}</td>
                  <td>{c.hora}</td>
                  <td><span className={`badge ${c.estado}`}>{c.estado}</span></td>
                  <td>
                    <div className="row-actions">
                      <select
                        className="estado-select"
                        value={c.estado}
                        onChange={e => handleEstado(c.id, c.estado, e.target.value)}
                        disabled={c.estado === 'cancelada' || c.estado === 'completada'}
                      >
                        <option value={c.estado}>{c.estado}</option>
                        {(TRANSICIONES[c.estado] || []).map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
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