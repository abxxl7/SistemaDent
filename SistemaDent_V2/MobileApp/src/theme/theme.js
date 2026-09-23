// Paleta del sistema web (.claude/skills/frontend-design/SKILL.md) para que la app se sienta parte del mismo producto.
export const colors = {
  primary:      '#1B3A6B',
  primaryMid:   '#2E5FA3',
  accent:       '#4A90D9',
  tint:         '#EBF2FC',
  background:   '#F8FAFC',
  surface:      '#FFFFFF',
  text:         '#1E293B',
  // #94A3B8 (muted del sistema) queda con poco contraste sobre blanco en texto chico; se usa solo en íconos/placeholder.
  textSecondary: '#64748B',
  muted:        '#94A3B8',
  border:       '#E2E8F0',
  disabled:     '#CBD5E1',

  // Estados de cita
  pendiente:  '#F59E0B',
  confirmada: '#10B981',
  cancelada:  '#EF4444',
  completada: '#3B82F6',

  // Mensajes: ámbar para advertencias de reglas de negocio, rojo solo para errores bloqueantes
  warning:     '#B45309',
  warningBg:   '#FFFBEB',
  warningLine: '#F59E0B',
  error:       '#B91C1C',
  errorBg:     '#FEF2F2',
  errorLine:   '#EF4444',
  success:     '#047857',
  successBg:   '#ECFDF5',
  successLine: '#10B981',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

export const fonts = {
  regular:  'Inter_400Regular',
  medium:   'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold:     'Inter_700Bold',
};

export const type = {
  title:   { fontFamily: fonts.bold,     fontSize: 24, lineHeight: 30, color: colors.text },
  heading: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24, color: colors.text },
  body:    { fontFamily: fonts.regular,  fontSize: 16, lineHeight: 22, color: colors.text },
  label:   { fontFamily: fonts.medium,   fontSize: 14, lineHeight: 20, color: colors.text },
  caption: { fontFamily: fonts.regular,  fontSize: 13, lineHeight: 18, color: colors.textSecondary },
};

// Números alineados en columnas (horarios)
export const tabular = { fontVariant: ['tabular-nums'] };

export const MIN_TOUCH = 48;
