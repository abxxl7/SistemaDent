import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, CircleCheck } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import './Login.css';

const FEATURES = [
  'Agenda inteligente de citas',
  'Panel del doctor en tiempo real',
  'Control de estados de cita',
  'Gestión completa de pacientes',
];

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('No se pudo conectar con el servidor. Verificá tu conexión e intentá de nuevo.');
      } else if (err.response.status === 401) {
        setError('Credenciales incorrectas. Verificá tu email y contraseña.');
      } else {
        setError(err.response.data?.detail || 'Ocurrió un error al iniciar sesión. Intentá de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <span className="login-brand-icon"><Stethoscope size={28} strokeWidth={2} /></span>
          <h1>SistemaDent</h1>
          <p>Gestión de citas odontológicas</p>
        </div>
        <ul className="login-features">
          {FEATURES.map(f => (
            <li key={f}><CircleCheck size={18} strokeWidth={2} /> {f}</li>
          ))}
        </ul>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>Iniciar sesión</h2>
          <p className="login-subtitle">Ingresá tus credenciales para continuar</p>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Correo electrónico</label>
              <input
                type="email"
                name="email"
                placeholder="admin@sistemadent.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}