import { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { CalendarX, CalendarDays } from 'lucide-react-native';
import api from '../services/api';
import { parseError } from '../services/errors';
import { colors, fonts, spacing, radius, type } from '../theme/theme';
import {
  hoyISO, addMonthsISO, finesDeSemanaEntre, esFinDeSemana, formatFechaLarga,
} from '../utils/fechas';
import Banner from '../components/Banner';
import HoraChip from '../components/HoraChip';
import EmptyState from '../components/EmptyState';
import ConfirmarCitaSheet from '../components/ConfirmarCitaSheet';

LocaleConfig.locales.es = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';

const MESES_MAXIMO = 6;

const calendarTheme = {
  calendarBackground: colors.surface,
  textSectionTitleColor: colors.textSecondary,
  textSectionTitleDisabledColor: colors.disabled,
  selectedDayBackgroundColor: colors.primary,
  selectedDayTextColor: '#FFFFFF',
  todayTextColor: colors.primaryMid,
  dayTextColor: colors.text,
  textDisabledColor: colors.disabled,
  arrowColor: colors.primaryMid,
  disabledArrowColor: colors.disabled,
  monthTextColor: colors.primary,
  textDayFontFamily: fonts.medium,
  textMonthFontFamily: fonts.semibold,
  textDayHeaderFontFamily: fonts.medium,
  textDayFontSize: 15,
  textMonthFontSize: 16,
  textDayHeaderFontSize: 12,
};

export default function DisponibilidadScreen({ navigation, route }) {
  const { doctor } = route.params;

  const [fecha, setFecha] = useState(null);
  const [slots, setSlots] = useState([]);
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [horaElegida, setHoraElegida] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reservando, setReservando] = useState(false);
  const [reservaError, setReservaError] = useState(null);

  // Evita que una respuesta lenta de un día anterior pise la del día elegido después
  const ultimaConsulta = useRef(0);

  const { minDate, maxDate, marcados } = useMemo(() => {
    const min = hoyISO();
    const max = addMonthsISO(min, MESES_MAXIMO);
    const m = {};
    finesDeSemanaEntre(min, max).forEach((d) => {
      m[d] = { disabled: true, disableTouchEvent: true };
    });
    return { minDate: min, maxDate: max, marcados: m };
  }, []);

  const markedDates = useMemo(() => {
    if (!fecha) return marcados;
    return { ...marcados, [fecha]: { selected: true, selectedColor: colors.primary } };
  }, [marcados, fecha]);

  const cargarDisponibilidad = useCallback(async (dia) => {
    const id = ++ultimaConsulta.current;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/app/disponibilidad', { params: { doctor_id: doctor.id, fecha: dia } });
      if (id !== ultimaConsulta.current) return null;
      setSlots(data.slots);
      setLimiteAlcanzado(data.limite_alcanzado);
      return data;
    } catch (err) {
      if (id !== ultimaConsulta.current) return null;
      setSlots([]);
      setLimiteAlcanzado(false);
      setError(parseError(err));
      return null;
    } finally {
      if (id === ultimaConsulta.current) setLoading(false);
    }
  }, [doctor.id]);

  const onDayPress = (day) => {
    if (esFinDeSemana(day.dateString)) return;
    setFecha(day.dateString);
    cargarDisponibilidad(day.dateString);
  };

  const abrirSheet = (hora) => {
    setHoraElegida(hora);
    setReservaError(null);
    setSheetOpen(true);
  };

  const confirmar = async (notas) => {
    setReservando(true);
    setReservaError(null);
    try {
      // paciente_id no se envía: el backend lo toma del token
      const { data } = await api.post('/app/citas', {
        doctor_id: doctor.id,
        fecha,
        hora: horaElegida,
        notas,
      });
      setSheetOpen(false);
      navigation.navigate('Tabs', {
        screen: 'MisCitas',
        params: { reservada: { doctor_nombre: doctor.nombre, fecha: data.fecha, hora: data.hora } },
      });
    } catch (err) {
      setReservaError(parseError(err));
      // Un 400 suele ser un horario que se ocupó justo antes: refrescar los horarios
      if (err.response?.status === 400) cargarDisponibilidad(fecha);
    } finally {
      setReservando(false);
    }
  };

  const sinHorarios = fecha && !loading && !error && (limiteAlcanzado || slots.length === 0);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.doctor}>
          <Text style={styles.doctorNombre}>{doctor.nombre}</Text>
          <Text style={type.caption}>{doctor.especialidad}</Text>
        </View>

        <View style={styles.calendarWrap}>
          <Calendar
            theme={calendarTheme}
            firstDay={1}
            minDate={minDate}
            maxDate={maxDate}
            hideExtraDays
            enableSwipeMonths
            disableAllTouchEventsForDisabledDays
            markedDates={markedDates}
            onDayPress={onDayPress}
          />
        </View>
        <Text style={[type.caption, styles.leyenda]}>La clínica atiende de lunes a viernes.</Text>

        <View style={styles.horarios}>
          {!fecha ? (
            <EmptyState
              icon={CalendarDays}
              title="Elegí un día"
              message="Seleccioná una fecha en el calendario para ver los horarios libres de este doctor."
            />
          ) : (
            <>
              <Text style={type.heading}>Horarios del {formatFechaLarga(fecha)}</Text>

              {loading ? <ActivityIndicator color={colors.primaryMid} style={styles.loading} /> : null}
              {error ? <Banner message={error.message} tone={error.tone} style={styles.gap} /> : null}

              {sinHorarios ? (
                <EmptyState
                  icon={CalendarX}
                  tone="warning"
                  title="No hay horarios disponibles este día"
                  message={
                    limiteAlcanzado
                      ? 'El doctor ya alcanzó el máximo de citas para esta fecha. Probá con otro día.'
                      : 'Todos los turnos de este día están ocupados. Probá con otro día.'
                  }
                />
              ) : null}

              {!loading && slots.length > 0 ? (
                <View style={styles.chips}>
                  {slots.map((h) => (
                    <HoraChip key={h} hora={h} selected={sheetOpen && horaElegida === h} onPress={() => abrirSheet(h)} />
                  ))}
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      <ConfirmarCitaSheet
        visible={sheetOpen}
        doctor={doctor}
        fecha={fecha}
        hora={horaElegida}
        loading={reservando}
        error={reservaError}
        horaDisponible={slots.includes(horaElegida)}
        onConfirm={confirmar}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  doctor: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, gap: 2 },
  doctorNombre: { ...type.title },
  calendarWrap: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  leyenda: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  horarios: { padding: spacing.xl, gap: spacing.md },
  loading: { marginVertical: spacing.lg },
  gap: { marginTop: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
});
