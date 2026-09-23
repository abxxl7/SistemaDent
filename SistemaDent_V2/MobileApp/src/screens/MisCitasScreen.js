import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CalendarDays, RefreshCw } from 'lucide-react-native';
import api from '../services/api';
import { parseError } from '../services/errors';
import { colors, fonts, radius, spacing, type, tabular } from '../theme/theme';
import { diaDelMes, mesCorto, diaSemanaCorto, formatFechaCorta, formatFechaLarga, formatHora } from '../utils/fechas';
import Banner from '../components/Banner';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import EstadoBadge from '../components/EstadoBadge';

export default function MisCitasScreen({ navigation, route }) {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  // Confirmación de una cita recién reservada (llega por parámetro desde Disponibilidad)
  const reservada = route.params?.reservada;
  useEffect(() => {
    if (reservada) {
      setExito(
        `Cita reservada con ${reservada.doctor_nombre}: ${formatFechaLarga(reservada.fecha)}, ${formatHora(reservada.hora)} hs. ` +
        'Queda pendiente hasta que la clínica la confirme.'
      );
      navigation.setParams({ reservada: undefined });
    }
  }, [reservada, navigation]);

  const cargar = useCallback(async ({ esRefresh = false, silencioso = false } = {}) => {
    if (esRefresh) setRefreshing(true);
    else if (!silencioso) setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/app/mis-citas');
      setCitas(data);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Recarga cada vez que la pestaña gana foco (por ejemplo, después de reservar)
  // (silencioso: el spinner de pantalla completa es solo para la primera carga)
  useFocusEffect(
    useCallback(() => {
      cargar({ silencioso: true });
    }, [cargar])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primaryMid} size="large" />
      </View>
    );
  }

  if (error && citas.length === 0) {
    return (
      <View style={styles.errorWrap}>
        <Banner message={error.message} tone={error.tone} />
        <Button title="Reintentar" icon={RefreshCw} variant="secondary" onPress={() => cargar()} style={styles.retry} />
      </View>
    );
  }

  return (
    <FlatList
      data={citas}
      keyExtractor={(c) => String(c.id)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => cargar({ esRefresh: true })} tintColor={colors.primaryMid} colors={[colors.primaryMid]} />}
      ListHeaderComponent={
        <View style={styles.intro}>
          <Text style={type.title}>Mis citas</Text>
          {exito ? <Banner message={exito} tone="success" style={styles.banner} /> : null}
          {error ? <Banner message={error.message} tone={error.tone} style={styles.banner} /> : null}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon={CalendarDays}
          title="Todavía no reservaste ninguna cita"
          message="Elegí un doctor y un horario libre para agendar tu primera consulta."
          actionLabel="Ver doctores"
          onAction={() => navigation.navigate('Doctores')}
        />
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => (
        <View style={styles.row} accessible accessibilityLabel={`${formatFechaCorta(item.fecha)}, ${formatHora(item.hora)}, ${item.doctor_nombre}, ${item.estado}`}>
          <View style={styles.fecha}>
            <Text style={styles.fechaDia}>{diaDelMes(item.fecha)}</Text>
            <Text style={styles.fechaMes}>{mesCorto(item.fecha)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.hora}>{formatHora(item.hora)} hs</Text>
            <Text style={styles.doctor} numberOfLines={1}>{item.doctor_nombre}</Text>
            <Text style={type.caption}>{diaSemanaCorto(item.fecha)}</Text>
          </View>
          <EstadoBadge estado={item.estado} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  errorWrap: { flex: 1, padding: spacing.xl, gap: spacing.lg, backgroundColor: colors.background },
  retry: { alignSelf: 'flex-start' },
  list: { paddingBottom: spacing.xxl, backgroundColor: colors.background, flexGrow: 1 },
  intro: { padding: spacing.xl, paddingBottom: spacing.lg },
  banner: { marginTop: spacing.md },
  separator: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  fecha: {
    width: 52,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fechaDia: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 24, color: colors.primary, ...tabular },
  fechaMes: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 14, color: colors.primaryMid, textTransform: 'capitalize' },
  info: { flex: 1, gap: 1 },
  hora: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.text, ...tabular },
  doctor: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
});
