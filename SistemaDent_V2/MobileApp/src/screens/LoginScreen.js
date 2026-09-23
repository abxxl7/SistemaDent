import { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarCheck } from 'lucide-react-native';
import { useAuth } from '../context/useAuth';
import { parseError } from '../services/errors';
import { colors, fonts, radius, spacing, type } from '../theme/theme';
import TextField from '../components/TextField';
import Button from '../components/Button';
import Banner from '../components/Banner';

export default function LoginScreen({ navigation, route }) {
  const { login } = useAuth();
  const registroOk = route.params?.registroOk;

  const [documento, setDocumento] = useState(route.params?.documento ?? '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Login sigue montado debajo de Registro: al volver llegan los params nuevos
  useEffect(() => {
    if (route.params?.documento) setDocumento(route.params.documento);
  }, [route.params?.documento]);

  const validar = () => {
    const e = {};
    if (!documento.trim()) e.documento = 'Ingresá tu número de documento';
    if (!password) e.password = 'Ingresá tu contraseña';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    setApiError(null);
    if (!validar()) return;
    setLoading(true);
    try {
      await login(documento.trim(), password);
      // Al haber sesión, el navegador cambia solo a las pestañas
    } catch (err) {
      setApiError(parseError(err));
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.brand}>
        <View style={styles.logo}>
          <CalendarCheck size={26} color="#FFFFFF" strokeWidth={1.75} />
        </View>
        <Text style={styles.brandName}>SistemaDent</Text>
        <Text style={styles.tagline}>Reservá tu turno con tu odontólogo sin tener que llamar a la clínica.</Text>
      </SafeAreaView>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={type.title}>Iniciar sesión</Text>

          {registroOk && !apiError ? (
            <Banner tone="success" message="¡Listo! Ya podés iniciar sesión." />
          ) : null}
          {apiError ? <Banner message={apiError.message} tone={apiError.tone} /> : null}

          <TextField
            label="Documento"
            value={documento}
            onChangeText={setDocumento}
            error={errors.documento}
            placeholder="Número de cédula"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <TextField
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            placeholder="Tu contraseña"
            secure
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={onSubmit}
            maxLength={72}
          />

          <Button title="Ingresar" onPress={onSubmit} loading={loading} style={styles.submit} />

          <Pressable
            onPress={() => navigation.navigate('Registro')}
            style={styles.link}
            accessibilityRole="button"
          >
            <Text style={styles.linkText}>
              ¿Primera vez? <Text style={styles.linkStrong}>Creá o activá tu cuenta</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  brand: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.lg + 4,
    borderBottomRightRadius: radius.lg + 4,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brandName: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, color: '#FFFFFF' },
  tagline: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: '#C7D7EF', marginTop: spacing.xs },
  form: { padding: spacing.xl, gap: spacing.lg },
  submit: { marginTop: spacing.sm },
  link: { alignItems: 'center', paddingVertical: spacing.md, minHeight: 48, justifyContent: 'center' },
  linkText: { ...type.body, color: colors.textSecondary },
  linkStrong: { fontFamily: fonts.semibold, color: colors.primaryMid },
});
