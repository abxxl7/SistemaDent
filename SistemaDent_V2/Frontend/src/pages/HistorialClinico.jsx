import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, ChevronDown, ChevronUp, FileText, Paperclip } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import './HistorialClinico.css';

const TIPOS_ARCHIVO = [
  { value: 'radiografia', label: 'Radiografía' },
  { value: 'foto',        label: 'Foto' },
  { value: 'documento',   label: 'Documento' },
];

const emptyForm = {
  doctor_id:   '',
  cita_id:     '',
  fecha:       new Date().toISOString().split('T')[0],
  diagnostico: '',
  tratamiento: '',
  notas:       '',
};

export default function HistorialClinico() {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canView = user?.rol === 'admin' || user?.rol === 'doctor';

  const [paciente, setPaciente]           = useState(null);
  const [entradas, setEntradas]           = useState([]);
  const [doctores, setDoctores]           = useState([]);
  const [citas, setCitas]                 = useState([]);
  const [form, setForm]                   = useState(emptyForm);
  const [archivosTipo, setArchivosTipo]   = useState('radiografia');
  const [archivosFiles, setArchivosFiles] = useState(null);
  const [showForm, setShowForm]           = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [expandedIds, setExpandedIds]     = useState([]);
  const [thumbs, setThumbs]               = useState({});
  const [lightbox, setLightbox]           = useState(null);
  const thumbUrls = useRef(new Set());

  const load = () => Promise.all([
    api.get(`/pacientes/${pacienteId}`),
    api.get(`/pacientes/${pacienteId}/historial`),
    api.get('/doctores'),
    api.get('/citas'),
  ]).then(([p, h, d, c]) => {
    setPaciente(p.data);
    setEntradas(h.data);
    setDoctores(d.data);
    setCitas(c.data.filter(cita => cita.paciente_id === Number(pacienteId)));
  }).catch(() => setError('No se pudo cargar el historial clínico. Verificá tu conexión e intentá de nuevo.'));

  // El hook se llama siempre (regla de hooks): solo el fetch queda condicionado al rol.
  useEffect(() => { if (canView) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pacienteId, canView]);

  useEffect(() => () => {
    thumbUrls.current.forEach(url => URL.revokeObjectURL(url));
  }, []);

  if (!canView) return <Navigate to="/pacientes" replace />;

  const getNombreDoctor = id => doctores.find(d => d.id === id)?.nombre || `ID ${id}`;

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      const { data: nuevo } = await api.post('/historial', {
        paciente_id: Number(pacienteId),
        doctor_id:   Number(form.doctor_id),
        cita_id:     form.cita_id ? Number(form.cita_id) : null,
        fecha:       form.fecha,
        diagnostico: form.diagnostico,
        tratamiento: form.tratamiento,
        notas:       form.notas || null,
      });

      if (archivosFiles && archivosFiles.length > 0) {
        const fd = new FormData();
        fd.append('tipo', archivosTipo);
        Array.from(archivosFiles).forEach(f => fd.append('archivos', f));
        await api.post(`/historial/${nuevo.id}/archivos`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setSuccess('Entrada de historial registrada correctamente.');
      setForm(emptyForm); setArchivosFiles(null); setArchivosTipo('radiografia'); setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar la entrada de historial.');
    }
  };

  const cargarMiniatura = async archivo => {
    if (thumbs[archivo.id]) return;
    try {
      const { data } = await api.get(`/archivos/${archivo.id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      thumbUrls.current.add(url);
      setThumbs(prev => ({ ...prev, [archivo.id]: url }));
    } catch {
      // La miniatura simplemente no se muestra si falla la descarga.
    }
  };

  const toggleExpand = entrada => {
    const abierta = expandedIds.includes(entrada.id);
    setExpandedIds(abierta ? expandedIds.filter(id => id !== entrada.id) : [...expandedIds, entrada.id]);
    if (!abierta) {
      entrada.archivos.filter(a => a.tipo !== 'documento').forEach(cargarMiniatura);
    }
  };

  const descargarArchivo = async archivo => {
    try {
      const { data } = await api.get(`/archivos/${archivo.id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url; a.download = archivo.nombre_archivo;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('No se pudo descargar el archivo.');
    }
  };

  return (
    <div className="historial">
      <div className="page-header">
        <div className="historial-title">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/pacientes')}>
            <ArrowLeft size={14} /> Volver
          </button>
          <h1>Historial clínico{paciente ? ` — ${paciente.nombre}` : ''}</h1>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setShowForm(!showForm); setForm(emptyForm); setArchivosFiles(null);
          setError(''); setSuccess('');
        }}>
          {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Nueva entrada</>}
        </button>
      </div>

      {error   && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      {showForm && (
        <div className="card historial-form">
          <h3>Registrar nueva entrada</h3>
          <form onSubmit={handleSubmit} className="historial-form-grid">
            <div className="form-group">
              <label>Doctor *</label>
              <select name="doctor_id" value={form.doctor_id} onChange={handleChange} required>
                <option value="">— Seleccionar doctor —</option>
                {doctores.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Cita relacionada</label>
              <select name="cita_id" value={form.cita_id} onChange={handleChange}>
                <option value="">— Ninguna —</option>
                {citas.map(c => <option key={c.id} value={c.id}>{c.fecha} {c.hora}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Fecha *</label>
              <input name="fecha" type="date" value={form.fecha} onChange={handleChange} required />
            </div>
            <div className="form-group full-width">
              <label>Diagnóstico *</label>
              <textarea name="diagnostico" value={form.diagnostico} onChange={handleChange} rows={2} required placeholder="Ej: Caries en pieza 26" />
            </div>
            <div className="form-group full-width">
              <label>Tratamiento *</label>
              <textarea name="tratamiento" value={form.tratamiento} onChange={handleChange} rows={2} required placeholder="Ej: Obturación con resina compuesta" />
            </div>
            <div className="form-group full-width">
              <label>Notas</label>
              <textarea name="notas" value={form.notas} onChange={handleChange} rows={2} placeholder="Observaciones adicionales..." />
            </div>
            <div className="form-group">
              <label>Tipo de archivo a adjuntar</label>
              <select value={archivosTipo} onChange={e => setArchivosTipo(e.target.value)}>
                {TIPOS_ARCHIVO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Adjuntar archivos</label>
              <input type="file" multiple onChange={e => setArchivosFiles(e.target.files)} />
            </div>
            <div className="form-actions full-width">
              <button type="submit" className="btn btn-primary">Registrar entrada</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="historial-lista">
        {entradas.length === 0 ? (
          <div className="card historial-empty">No hay entradas de historial clínico registradas para este paciente.</div>
        ) : entradas.map(entrada => {
          const abierta = expandedIds.includes(entrada.id);
          return (
            <div key={entrada.id} className="card historial-entry">
              <button className="historial-entry-header" onClick={() => toggleExpand(entrada)}>
                <div className="historial-entry-summary">
                  <span className="historial-fecha">{entrada.fecha}</span>
                  <span className="historial-diagnostico">{entrada.diagnostico}</span>
                  <span className="historial-doctor">{getNombreDoctor(entrada.doctor_id)}</span>
                </div>
                {abierta ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {abierta && (
                <div className="historial-entry-body">
                  <div className="historial-detalle">
                    <div>
                      <span className="historial-label">Tratamiento</span>
                      <p>{entrada.tratamiento}</p>
                    </div>
                    {entrada.notas && (
                      <div>
                        <span className="historial-label">Notas</span>
                        <p>{entrada.notas}</p>
                      </div>
                    )}
                  </div>

                  {entrada.archivos.length > 0 && (
                    <div className="historial-archivos">
                      <span className="historial-label"><Paperclip size={13} /> Archivos adjuntos</span>
                      <div className="historial-archivos-grid">
                        {entrada.archivos.map(archivo => (
                          archivo.tipo === 'documento' ? (
                            <button key={archivo.id} className="historial-doc" onClick={() => descargarArchivo(archivo)}>
                              <FileText size={16} /> {archivo.nombre_archivo}
                            </button>
                          ) : (
                            <button
                              key={archivo.id}
                              className="historial-thumb"
                              onClick={() => thumbs[archivo.id] && setLightbox(thumbs[archivo.id])}
                            >
                              {thumbs[archivo.id]
                                ? <img src={thumbs[archivo.id]} alt={archivo.nombre_archivo} />
                                : <span className="historial-thumb-loading">…</span>}
                            </button>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {lightbox && (
        <div className="historial-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Vista completa" />
        </div>
      )}
    </div>
  );
}
