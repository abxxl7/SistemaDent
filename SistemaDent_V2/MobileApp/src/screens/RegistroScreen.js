import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '../context/useAuth';
import { parseError } from '../services/errors';
import { colors, fonts, radius, spacing, type, MIN_TOUCH } from '../theme/theme';
import TextField from '../components/TextField';
import Button from '../components/Button';
import Banner from '../components/Banner';

// Valores exactos del enum TipoSangre del backend
const TIPOS_SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegistroScreen({ navigation }) {
  const { registro } = useAuth();

  const [form, setForm] = useState({
    documento: '', nombre: '', telefono: '', email: '', direccion: '', password: '',
  });
  const [tipoSangre, setTipoSangre] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const validar = () => {
    const e = {};
    if (!form.documento.trim()) e.documento = 'Ingresá tu número de documento';
    if (!form.nombre.trim()) e.nombre = 'Ingresá tu nombre completo';
    if (!form.telefono.trim()) e.telefono = 'Ingresá un teléfono de contacto';
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) e.email = 'El email no parece válido';
    if (form.password.length < 6) e.password = 'La contraseña debe tener al menos 6 caracteres';
    else if (form.password.length > 72) e.password = 'La contraseña no puede superar los 72 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    setApiError(null);
    if (!validar()) return;
    setLoading(true);
    try {
      await registro({
        documento: form.documento.trim(),
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim() || null,
        direccion: form.direccion.trim() || null,
        tipo_sangre: tipoSangre,
        password: form.password,
      });
      // El backend no distingue "cuenta creada" de "cuenta activada": mensaje de éxito genérico en Login
      navigation.navigate('Login', { registroOk: true, documento: form.documento.trim() });
    } catch (err) {
      setApiError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={type.caption}>
          Si la clínica ya te registró, usá el mismo documento para activar tu cuenta: tus datos cargados se mantienen.
        </Text>

        {apiError ? <Banner message={apiError.message} tone={apiError.tone} /> : null}

        <TextField label="Documento" value={form.documento} onChangeText={set('documento')} error={errors.documento}
          placeholder="Número de cédula" autoCapitalize="none" autoCorrect={false} />
        <TextField label="Nombre completo" value={form.nombre} onChangeText={set('nombre')} error={errors.nombre}
          placeholder="Como figura en tu documento" autoCapitalize="words" />
        <TextField label="Teléfono" value={form.telefono} onChangeText={set('telefono')} error={errors.telefono}
          placeholder="0981 123 456" keyboardType="phone-pad" />
        <TextField label="Email (opcional)" value={form.email} onChangeText={set('email')} error={errors.email}
          placeholder="nombre@correo.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
        <TextField label="Dirección (opcional)" value={form.direccion} onChangeText={set('direccion')}
          placeholder="Calle y barrio" autoCapitalize="sentences" />

        <View style={styles.sangre}>
          <Text style={type.label}>Tipo de sangre (opcional)</Text>
          <View style={styles.chips}>
            {TIPOS_SANGRE.map((t) => {
              const activo = tipoSangre === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTipoSangre(activo ? null : t)}
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

        <TextField label="Contraseña" value={form.password} onChangeText={set('password')} error={errors.password}
          hint="Entre 6 y 72 caracteres" placeholder="Elegí una contraseña" secure autoCapitalize="none"
          autoCorrect={false} maxLength={72} />

        <Button title="Crear o activar cuenta" onPress={onSubmit} loading={loading} style={styles.submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  form: { padding: spacing.xl, gap: spacing.lg },
  sangre: { gap: spacing.sm },
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
  submit: { marginTop: spacing.sm },
});
