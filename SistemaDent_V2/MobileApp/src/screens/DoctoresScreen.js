import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { ChevronRight, Stethoscope, RefreshCw } from 'lucide-react-native';
import api from '../services/api';
import { parseError } from '../services/errors';
import { colors, fonts, spacing, type, MIN_TOUCH } from '../theme/theme';
import Banner from '../components/Banner';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';

// "Dra. Ana Pérez" -> "AP"
const iniciales = (nombre) =>
  nombre
    .replace(/^(dr|dra)\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

export default function DoctoresScreen({ navigation }) {
  const [doctores, setDoctores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async ({ esRefresh = false } = {}) => {
    if (esRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/app/doctores');
      setDoctores(data);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primaryMid} size="large" />
      </View>
    );
  }

  if (error && doctores.length === 0) {
    return (
      <View style={styles.errorWrap}>
        <Banner message={error.message} tone={error.tone} />
        <Button title="Reintentar" icon={RefreshCw} variant="secondary" onPress={() => cargar()} style={styles.retry} />
      </View>
    );
  }

  return (
    <FlatList
      data={doctores}
      keyExtractor={(d) => String(d.id)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => cargar({ esRefresh: true })} tintColor={colors.primaryMid} colors={[colors.primaryMid]} />}
      ListHeaderComponent={
        <View style={styles.intro}>
          <Text style={type.title}>Elegí tu doctor</Text>
          <Text style={[type.body, styles.introText]}>Tocá un profesional para ver los días y horarios libres.</Text>
          {error ? <Banner message={error.message} tone={error.tone} style={styles.introBanner} /> : null}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon={Stethoscope}
          title="Todavía no hay doctores para reservar"
          message="La clínica no tiene profesionales habilitados en este momento. Deslizá hacia abajo para actualizar o probá más tarde."
        />
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => navigation.navigate('Disponibilidad', { doctor: item })}
          accessibilityRole="button"
          accessibilityLabel={`${item.nombre}, ${item.especialidad}. Ver disponibilidad`}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{iniciales(item.nombre)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.nombre} numberOfLines={1}>{item.nombre}</Text>
            <Text style={type.caption} numberOfLines={1}>{item.especialidad}</Text>
          </View>
          <ChevronRight size={20} color={colors.muted} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  errorWrap: { flex: 1, padding: spacing.xl, gap: spacing.lg, backgroundColor: colors.background },
  retry: { alignSelf: 'flex-start' },
  list: { paddingBottom: spacing.xxl, backgroundColor: colors.background, flexGrow: 1 },
  intro: { padding: spacing.xl, paddingBottom: spacing.lg, gap: spacing.xs },
  introText: { color: colors.textSecondary },
  introBanner: { marginTop: spacing.md },
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  rowPressed: { backgroundColor: colors.tint },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: spacing.xl + 48 + spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bold, fontSize: 16, color: colors.primary },
  info: { flex: 1, gap: 2, minHeight: MIN_TOUCH - 12, justifyContent: 'center' },
  nombre: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22, color: colors.text },
});
