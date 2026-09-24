import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native';
import { User, KeyRound, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react-native';
import api from '../services/api';
import { parseError } from '../services/errors';
import { EMAIL_RE, validarPassword } from '../utils/validaciones';
import { colors, fonts, radius, spacing, type, MIN_TOUCH } from '../theme/theme';
import TextField from '../components/TextField';
import TipoSangreSelector from '../components/TipoSangreSelector';
import Button from '../components/Button';
import Banner from '../components/Banner';

const aForm = (p) => ({ telefono: p.telefono ?? '', email: p.email ?? '', direccion: p.direccion ?? '' });

export default function PerfilScreen() {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  const [form, setForm] = useState({ telefono: '', email: '', direccion: '' });
  const [tipoSangre, setTipoSangre] = useState(null);
  const [errors, setErrors] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(null);
  const [exito, setExito] = useState(null);

  const [passAbierto, setPassAbierto] = useState(false);
  const [pass, setPass] = useState({ actual: '', nueva: '', confirmar: '' });
  const [passErrors, setPassErrors] = useState({});
  const [cambiando, setCambiando] = useState(false);
  const [errorPass, setErrorPass] = useState(null);
  const [exitoPass, setExitoPass] = useState(null);

  const aplicarPerfil = (data) => {
    setPerfil(data);
    setForm(aForm(data));
    setTipoSangre(data.tipo_sangre ?? null);
  };

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const { data } = await api.get('/app/perfil');
      aplicarPerfil(data);
    } catch (err) {
      setErrorCarga(parseError(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const set = (campo) => (valor) => {
    setExito(null);
    setForm((f) => ({ ...f, [campo]: valor }));
  };
  const elegirSangre = (valor) => {
    setExito(null);
    setTipoSangre(valor);
  };

  const hayCambios =
    !!perfil &&
    (form.telefono.trim() !== (perfil.telefono ?? '') ||
      (form.email.trim() || null) !== (perfil.email ?? null) ||
      (form.direccion.trim() || null) !== (perfil.direccion ?? null) ||
      tipoSangre !== (perfil.tipo_sangre ?? null));

  const validarDatos = () => {
    const e = {};
    if (!form.telefono.trim()) e.telefono = 'Ingresá un teléfono de contacto';
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) e.email = 'El email no parece válido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async () => {
    setErrorGuardar(null);
    setExito(null);
    if (!validarDatos()) return;
    setGuardando(true);
    try {
      const { data } = await api.put('/app/perfil', {
        telefono: form.telefono.trim(),
        email: form.email.trim() || null,
        direccion: form.direccion.trim() || null,
        tipo_sangre: tipoSangre,
      });
      aplicarPerfil(data);
      setExito('Tus datos se actualizaron correctamente.');
    } catch (err) {
      setErrorGuardar(parseError(err));
    } finally {
      setGuardando(false);
    }
  };

  const setPassCampo = (campo) => (valor) => setPass((p) => ({ ...p, [campo]: valor }));

  const validarPass = () => {
    const e = {};
    if (!pass.actual) e.actual = 'Ingresá tu contraseña actual';
    const errNueva = validarPassword(pass.nueva);
    if (errNueva) e.nueva = errNueva;
    if (pass.confirmar !== pass.nueva) e.confirmar = 'Las contraseñas nuevas no coinciden';
    setPassErrors(e);
    return Object.keys(e).length === 0;
  };

  const cambiarPassword = async () => {
    setErrorPass(null);
    setExitoPass(null);
    if (!validarPass()) return;
    setCambiando(true);
    try {
      await api.put('/app/perfil/password', { password_actual: pass.actual, password_nueva: pass.nueva });
      setPass({ actual: '', nueva: '', confirmar: '' });
      setPassErrors({});
      setPassAbierto(false);
      setExitoPass('Contraseña actualizada. La próxima vez que inicies sesión usá la nueva.');
    } catch (err) {
      setErrorPass(parseError(err));
    } finally {
      setCambiando(false);
    }
  };

  const alternarPass = () => {
    setPassAbierto((a) => !a);
    setExitoPass(null);
    setErrorPass(null);
  };

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primaryMid} size="large" />
      </View>
    );
  }

  if (errorCarga) {
    return (
      <View style={styles.errorWrap}>
        <Banner message={errorCarga.message} tone={errorCarga.tone} />
        <Button title="Reintentar" icon={RefreshCw} variant="secondary" onPress={cargar} style={styles.retry} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={type.title}>Mi perfil</Text>

        <View style={styles.identidad}>
          <View style={styles.avatar}>
            <User size={26} color={colors.primary} strokeWidth={1.75} />
          </View>
          <View style={styles.identidadInfo}>
            <Text style={styles.nombre} numberOfLines={2}>{perfil.nombre}</Text>
            <Text style={type.caption}>Documento {perfil.documento}</Text>
          </View>
        </View>
        <Text style={type.caption}>Para cambiar tu nombre o documento, comunicate con la clínica.</Text>

        <View style={styles.seccion}>
          <Text style={type.heading}>Mis datos</Text>
          <TextField label="Teléfono" value={form.telefono} onChangeText={set('telefono')} error={errors.telefono}
            placeholder="0981 123 456" keyboardType="phone-pad" />
          <TextField label="Email (opcional)" value={form.email} onChangeText={set('email')} error={errors.email}
            placeholder="nombre@correo.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          <TextField label="Dirección (opcional)" value={form.direccion} onChangeText={set('direccion')}
            placeholder="Calle y barrio" autoCapitalize="sentences" />
          <TipoSangreSelector value={tipoSangre} onChange={elegirSangre} />

          {errorGuardar ? <Banner message={errorGuardar.message} tone={errorGuardar.tone} /> : null}
          {exito ? <Banner message={exito} tone="success" /> : null}

          <Button title="Guardar cambios" onPress={guardar} loading={guardando} disabled={!hayCambios} />
        </View>

        <View style={styles.seccion}>
          <Pressable
            onPress={alternarPass}
            accessibilityRole="button"
            accessibilityState={{ expanded: passAbierto }}
            style={({ pressed }) => [styles.passHeader, pressed && styles.passHeaderPressed]}
          >
            <KeyRound size={20} color={colors.primaryMid} strokeWidth={1.75} />
            <Text style={styles.passTitulo}>Cambiar contraseña</Text>
            {passAbierto ? <ChevronUp size={20} color={colors.muted} /> : <ChevronDown size={20} color={colors.muted} />}
          </Pressable>

          {exitoPass ? <Banner message={exitoPass} tone="success" /> : null}

          {passAbierto ? (
            <View style={styles.passForm}>
              <TextField label="Contraseña actual" value={pass.actual} onChangeText={setPassCampo('actual')}
                error={passErrors.actual} secure autoCapitalize="none" autoCorrect={false} maxLength={72} />
              <TextField label="Contraseña nueva" value={pass.nueva} onChangeText={setPassCampo('nueva')}
                error={passErrors.nueva} hint="Entre 6 y 72 caracteres" secure autoCapitalize="none"
                autoCorrect={false} maxLength={72} />
              <TextField label="Confirmar contraseña nueva" value={pass.confirmar} onChangeText={setPassCampo('confirmar')}
                error={passErrors.confirmar} secure autoCapitalize="none" autoCorrect={false} maxLength={72} />

              {errorPass ? <Banner message={errorPass.message} tone={errorPass.tone} /> : null}

              <Button title="Cambiar contraseña" onPress={cambiarPassword} loading={cambiando} />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  errorWrap: { flex: 1, padding: spacing.xl, gap: spacing.lg, backgroundColor: colors.background },
  retry: { alignSelf: 'flex-start' },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxl },
  identidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.tint,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identidadInfo: { flex: 1, gap: 2 },
  nombre: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 23, color: colors.primary },
  seccion: { gap: spacing.md, marginTop: spacing.sm },
  passHeader: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  passHeaderPressed: { backgroundColor: colors.tint },
  passTitulo: { flex: 1, fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  passForm: { gap: spacing.lg },
});
