import { useEffect, useRef } from 'react';
import { Animated, AccessibilityInfo, Text, StyleSheet } from 'react-native';
import { CircleAlert, TriangleAlert, CircleCheck } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../theme/theme';

const TONES = {
  error:   { bg: colors.errorBg,   line: colors.errorLine,   fg: colors.error,   Icon: CircleAlert },
  warning: { bg: colors.warningBg, line: colors.warningLine, fg: colors.warning, Icon: TriangleAlert },
  success: { bg: colors.successBg, line: colors.successLine, fg: colors.success, Icon: CircleCheck },
};

// Mensaje persistente (nunca desaparece solo): errores del backend, avisos y confirmaciones
export default function Banner({ message, tone = 'error', style }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        opacity.setValue(1);
      } else {
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [message, opacity]);

  if (!message) return null;
  const t = TONES[tone];

  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.wrap, { backgroundColor: t.bg, borderLeftColor: t.line, opacity }, style]}
    >
      <t.Icon size={20} color={t.fg} strokeWidth={2} style={styles.icon} />
      <Text style={[styles.text, { color: t.fg }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderLeftWidth: 4,
  },
  icon: { marginTop: 1 },
  text: { flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
});
