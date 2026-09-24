export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mismos límites que el backend (bcrypt admite hasta 72 caracteres)
export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 72;

export const validarPassword = (password) => {
  if (password.length < PASSWORD_MIN) return `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`;
  if (password.length > PASSWORD_MAX) return `La contraseña no puede superar los ${PASSWORD_MAX} caracteres`;
  return null;
};
