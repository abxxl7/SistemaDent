import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, type } from '../theme/theme';
import Button from './Button';

// Cada pantalla pasa su propio ícono, título y texto (con la voz de la app) — sin textos genéricos
export default function EmptyState({ icon: Icon, title, message, actionLabel, onAction, tone = 'neutral', style }) {
  const iconColor = tone === 'warning' ? colors.warning : colors.primaryMid;
  const iconBg = tone === 'warning' ? colors.warningBg : colors.tint;

  return (
    <View style={[styles.wrap, style]}>
      {Icon ? (
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Icon size={28} color={iconColor} strokeWidth={1.75} />
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel ? <Button title={actionLabel} onPress={onAction} variant="secondary" style={styles.action} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xl },
  iconWrap: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  title: { ...type.heading, textAlign: 'center' },
  message: { ...type.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  action: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
