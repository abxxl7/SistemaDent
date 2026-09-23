import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, fonts, radius, MIN_TOUCH } from '../theme/theme';

const VARIANTS = {
  primary:   { bg: colors.primary, fg: '#FFFFFF', border: colors.primary },
  secondary: { bg: colors.tint,    fg: colors.primary, border: colors.tint },
  outline:   { bg: 'transparent',  fg: colors.primary, border: colors.border },
};

export default function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, icon: Icon, style }) {
  const v = VARIANTS[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border },
        inactive && styles.inactive,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {Icon ? <Icon size={18} color={v.fg} strokeWidth={2} /> : null}
          <Text style={[styles.text, { color: v.fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: { fontFamily: fonts.semibold, fontSize: 16 },
  inactive: { opacity: 0.55 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
