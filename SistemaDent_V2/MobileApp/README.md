# SistemaDent - App de pacientes

App móvil (Expo / React Native) para que los pacientes se registren o activen su cuenta, vean la
disponibilidad de los doctores y reserven sus propias citas. Usa los endpoints `/app/*` del Backend.

## Requisitos

- Node.js y npm en la PC.
- La app **Expo Go** instalada en el celular (Play Store / App Store).
- La PC y el celular en la **misma red WiFi**.
- El Backend corriendo con `iniciar_sistema.bat` (escucha en `0.0.0.0:8001`, alcanzable desde la red).

## Paso a paso

### 1. Obtener la IP de la PC

En la PC, abrí `cmd` y ejecutá:

```
ipconfig
```

Buscá el adaptador **Wi-Fi** y copiá el valor de **Dirección IPv4** (por ejemplo `192.168.1.25`).

### 2. Crear el `.env.local`

Dentro de `MobileApp/`, copiá `.env.example` como `.env.local` y reemplazá `TU_IP_LOCAL`:

```
EXPO_PUBLIC_API_URL=http://192.168.1.25:8001
```

Este archivo no se sube a GitHub: la IP cambia según la red de cada persona y lugar.

### 3. Instalar dependencias (solo la primera vez)

```
cd MobileApp
npm install
```

### 4. Levantar la app

```
npx expo start
```

Escaneá el código QR con Expo Go (Android) o con la cámara (iOS). Si cambiás el `.env.local`,
reiniciá con `npx expo start -c` para que tome el valor nuevo.

## Si no conecta

- Comprobá que el celular y la PC estén en la misma red WiFi.
- Abrí `http://TU_IP:8001` en el navegador del celular: debe responder `{"sistema":"SistemaDent", ...}`.
- La primera vez que el Backend escucha en la red, Windows pide permiso en el firewall: permitilo
  solo en **redes privadas**.
- Si la IP de la PC cambió, actualizá `.env.local` y reiniciá Expo con `-c`.

## Cuentas de pacientes

- Paciente que ya cargó la clínica: en "Crear o activar cuenta" usa el mismo documento y elige una
  contraseña. Sus datos existentes se mantienen.
- Paciente nuevo: se crea la cuenta con los datos del formulario.
- La base de datos debe tener aplicadas las migraciones (`alembic upgrade head` en `Backend/`).
