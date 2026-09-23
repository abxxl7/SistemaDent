import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius, tabular, MIN_TOUCH } from '../theme/theme';
import { formatHora } from '../utils/fechas';

export default function HoraChip({ hora, selected = false, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Horario ${formatHora(hora)}`}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{formatHora(hora)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minWidth: 82,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { transform: [{ scale: 0.96 }], opacity: 0.9 },
  text: { fontFamily: fonts.semibold, fontSize: 16, color: colors.primaryMid, ...tabular },
  textSelected: { color: '#FFFFFF' },
});
