import { View, ActivityIndicator, Pressable, Alert, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Stethoscope, CalendarDays, LogOut } from 'lucide-react-native';
import { useAuth } from '../context/useAuth';
import { colors, fonts } from '../theme/theme';
import LoginScreen from '../screens/LoginScreen';
import RegistroScreen from '../screens/RegistroScreen';
import DoctoresScreen from '../screens/DoctoresScreen';
import DisponibilidadScreen from '../screens/DisponibilidadScreen';
import MisCitasScreen from '../screens/MisCitasScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const headerBase = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17, color: '#FFFFFF' },
  headerShadowVisible: false,
};

function LogoutButton() {
  const { logout } = useAuth();
  const confirmar = () =>
    Alert.alert('Cerrar sesión', '¿Querés salir de tu cuenta en este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ]);

  return (
    <Pressable
      onPress={confirmar}
      hitSlop={12}
      style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]}
      accessibilityRole="button"
      accessibilityLabel="Cerrar sesión"
    >
      <LogOut size={22} color="#FFFFFF" strokeWidth={1.75} />
    </Pressable>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        ...headerBase,
        headerTitle: 'SistemaDent',
        headerRight: () => <LogoutButton />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen
        name="Doctores"
        component={DoctoresScreen}
        options={{ tabBarIcon: ({ color, size }) => <Stethoscope size={size} color={color} strokeWidth={1.75} /> }}
      />
      <Tab.Screen
        name="MisCitas"
        component={MisCitasScreen}
        options={{
          title: 'Mis citas',
          tabBarIcon: ({ color, size }) => <CalendarDays size={size} color={color} strokeWidth={1.75} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { isSignedIn, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ ...headerBase, contentStyle: { backgroundColor: colors.background } }}>
      {isSignedIn ? (
        <>
          <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="Disponibilidad"
            component={DisponibilidadScreen}
            options={{ title: 'Elegir fecha y horario', headerBackTitle: 'Doctores' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Registro" component={RegistroScreen} options={{ title: 'Crear o activar cuenta', headerBackTitle: 'Volver' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  logout: { padding: 8, marginRight: 4, borderRadius: 20 },
  logoutPressed: { opacity: 0.7 },
});
