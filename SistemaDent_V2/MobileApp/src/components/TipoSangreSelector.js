import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing, type, MIN_TOUCH } from '../theme/theme';

// Valores exactos del enum TipoSangre del backend
export const TIPOS_SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Tocar el tipo elegido lo deselecciona (el campo es opcional)
export default function TipoSangreSelector({ value, onChange, label = 'Tipo de sangre (opcional)' }) {
  return (
    <View style={styles.wrap}>
      <Text style={type.label}>{label}</Text>
      <View style={styles.chips}>
        {TIPOS_SANGRE.map((t) => {
          const activo = value === t;
          return (
            <Pressable
              key={t}
              onPress={() => onChange(activo ? null : t)}
              accessibilityRole="button"
              accessibilityState={{ selected: activo }}
              accessibilityLabel={`Tipo de sangre ${t}`}
              style={({ pressed }) => [styles.chip, activo && styles.chipActivo, pressed && styles.chipPressed]}
            >
              <Text style={[styles.chipText, activo && styles.chipTextActivo]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    width: '22.5%',
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  chipText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  chipTextActivo: { color: '#FFFFFF' },
});
