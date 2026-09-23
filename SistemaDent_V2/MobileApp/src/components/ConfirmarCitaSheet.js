import { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, CalendarDays, Clock } from 'lucide-react-native';
import { colors, fonts, radius, spacing, type, tabular } from '../theme/theme';
import { formatFechaLarga, formatHora } from '../utils/fechas';
import Banner from './Banner';
import Button from './Button';

export default function ConfirmarCitaSheet({ visible, doctor, fecha, hora, loading, error, horaDisponible = true, onConfirm, onClose }) {
  const insets = useSafeAreaInsets();
  const [notas, setNotas] = useState('');

  // Cada vez que se abre para un horario nuevo, arranca con las notas vacías
  useEffect(() => {
    if (visible) setNotas('');
  }, [visible, hora]);

  if (!doctor || !fecha || !hora) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={loading ? undefined : onClose} accessibilityLabel="Cerrar" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={type.heading}>Confirmar cita</Text>
            <Pressable onPress={onClose} disabled={loading} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cerrar">
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            <View style={styles.summary}>
              <Text style={styles.doctor}>{doctor.nombre}</Text>
              <Text style={type.caption}>{doctor.especialidad}</Text>
              <View style={styles.row}>
                <CalendarDays size={18} color={colors.primaryMid} />
                <Text style={styles.rowText}>{formatFechaLarga(fecha)}</Text>
              </View>
              <View style={styles.row}>
                <Clock size={18} color={colors.primaryMid} />
                <Text style={[styles.rowText, styles.hora]}>{formatHora(hora)} hs</Text>
              </View>
            </View>

            <Text style={[type.label, styles.notasLabel]}>Notas (opcional)</Text>
            <TextInput
              value={notas}
              onChangeText={setNotas}
              placeholder="Contale a la clínica el motivo de tu consulta"
              placeholderTextColor={colors.muted}
              multiline
              textAlignVertical="top"
              style={styles.notas}
              editable={!loading}
              accessibilityLabel="Notas de la cita"
            />

            {error ? <Banner message={error.message} tone={error.tone} style={styles.banner} /> : null}

            <Button
              title="Confirmar cita"
              onPress={() => onConfirm(notas.trim() || null)}
              loading={loading}
              disabled={!horaDisponible}
              style={styles.confirm}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg + 4,
    borderTopRightRadius: radius.lg + 4,
    maxHeight: '88%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginTop: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  summary: { backgroundColor: colors.tint, borderRadius: radius.md, padding: spacing.lg, gap: spacing.xs },
  doctor: { fontFamily: fonts.semibold, fontSize: 17, color: colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  rowText: { ...type.body, color: colors.text },
  hora: { fontFamily: fonts.bold, ...tabular },
  notasLabel: { marginTop: spacing.md },
  notas: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  banner: { marginTop: spacing.sm },
  confirm: { marginTop: spacing.md },
});
