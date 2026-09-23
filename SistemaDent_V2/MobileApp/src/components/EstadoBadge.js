import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../theme/theme';

// Punto y fondo con el color del sistema; texto en tono más oscuro para mantener el contraste
const ESTADOS = {
  pendiente:  { label: 'Pendiente',  dot: colors.pendiente,  fg: '#B45309', bg: '#FEF3C7' },
  confirmada: { label: 'Confirmada', dot: colors.confirmada, fg: '#047857', bg: '#D1FAE5' },
  cancelada:  { label: 'Cancelada',  dot: colors.cancelada,  fg: '#B91C1C', bg: '#FEE2E2' },
  completada: { label: 'Completada', dot: colors.completada, fg: '#1D4ED8', bg: '#DBEAFE' },
};

export default function EstadoBadge({ estado }) {
  const e = ESTADOS[estado] ?? { label: estado, dot: colors.muted, fg: colors.textSecondary, bg: colors.border };
  return (
    <View style={[styles.badge, { backgroundColor: e.bg }]} accessibilityLabel={`Estado: ${e.label}`}>
      <View style={[styles.dot, { backgroundColor: e.dot }]} />
      <Text style={[styles.text, { color: e.fg }]}>{e.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16 },
});
