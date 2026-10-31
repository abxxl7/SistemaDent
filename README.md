# SistemaDent

Sistema de gestión de citas para clínicas odontológicas. Este repositorio contiene la versión
actual (**V2**) y la versión anterior (**V1**).

La V2 tiene tres partes que comparten una misma API y una misma base de datos:

| Parte | Para quién | Tecnología |
|---|---|---|
| **Backend** | Servidor de la API | Python 3.11, FastAPI, SQLAlchemy, Alembic, PostgreSQL |
| **Frontend** | Personal de la clínica (administrador, doctor, recepcionista) | React 19, Vite |
| **MobileApp** | Pacientes | Expo (React Native), React Navigation |

## Estructura del repositorio

```
SistemaDent/
├── SistemaDent_V2/
│   ├── Backend/          API (FastAPI) + migraciones (Alembic)
│   ├── Frontend/         Sistema web administrativo (React + Vite)
│   ├── MobileApp/        App de pacientes (Expo)  -> tiene su propio README
│   ├── iniciar_sistema.bat
│   ├── detener_sistema.bat
│   └── actualizar_sistema.bat
├── SistemaDent_V1/       Versión anterior (no se documenta acá)
└── Documentacion/        Documentos del proyecto (.docx)
```

## Qué hace la V2

**Sistema web (personal de la clínica)**
- Login con roles: `admin`, `doctor` y `recepcionista`.
- Gestión de pacientes, doctores, usuarios y citas, con dashboard.
- Historial clínico por paciente, con archivos adjuntos (radiografías, fotos, documentos).
  Solo lo ven `admin` y `doctor`.
- Solo el `admin` crea usuarios y gestiona doctores.
- `admin` y `recepcionista` pueden resetear el acceso de un paciente que olvidó su contraseña
  (botón "Resetear acceso" en Pacientes, visible solo si el paciente tiene cuenta en la app).

**App móvil (pacientes)**
- Registro o activación de cuenta: un paciente que ya cargó la clínica usa su mismo documento y
  elige una contraseña; sus datos existentes no se modifican.
- Ver doctores, elegir fecha y horario libre, y reservar su propia cita.
- Ver sus citas con el estado de cada una y editar su perfil y contraseña.
- Los pacientes no pueden cancelar citas desde la app (es intencional).

## Reglas de negocio de las citas

Las aplica el backend, tanto para el personal como para los pacientes:

- Horario laboral de 08:00 a 18:00, en turnos fijos de 45 minutos (08:00, 08:45, 09:30 ... 17:45).
- Solo de lunes a viernes; no se agendan citas los fines de semana ni en fechas pasadas.
- Un doctor no puede tener dos citas en el mismo horario (las canceladas no cuentan).
- Máximo 9 citas activas por doctor por día.
- Estados y transiciones válidas: `pendiente` -> `confirmada` o `cancelada`;
  `confirmada` -> `completada` o `cancelada`. `cancelada` y `completada` son finales.

## Requisitos

- Python 3.11
- Node.js y npm
- PostgreSQL
- Git
- Para la app móvil: la app **Expo Go** en el celular

## Instalación

### 1. Clonar el repositorio

```
git clone https://github.com/Abelff7/SistemaDent.git
cd SistemaDent
```

### 2. Base de datos

Creá una base de datos vacía en PostgreSQL. Las tablas se crean con las migraciones de Alembic
(ver más abajo); no hace falta restaurar ningún respaldo.

### 3. Backend

```
cd SistemaDent_V2/Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Creá el archivo `Backend/.env` (no se sube a GitHub) con:

```
DATABASE_URL=postgresql://USUARIO:CLAVE@localhost:5432/NOMBRE_BD
SECRET_KEY=una-clave-larga-y-aleatoria
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
APP_NAME=SistemaDent
APP_VERSION=2.0.0
```

Después preparás el esquema con Alembic (ver [Migraciones](#migraciones)).

### 4. Frontend

```
cd SistemaDent_V2/Frontend
npm install
```

Si el Backend no está en `http://localhost:8001`, creá `Frontend/.env.local` con
`VITE_API_URL=http://DIRECCION:8001`.

### 5. App móvil

Seguí el paso a paso de [SistemaDent_V2/MobileApp/README.md](SistemaDent_V2/MobileApp/README.md).

## Uso diario (Windows)

Los tres `.bat` están en `SistemaDent_V2/` y se ejecutan con doble clic:

| Archivo | Qué hace |
|---|---|
| `iniciar_sistema.bat` | Abre el Backend (puerto 8001) y el Frontend (puerto 5174) en dos ventanas |
| `detener_sistema.bat` | Detiene lo que esté escuchando en los puertos 8001 y 5174 |
| `actualizar_sistema.bat` | `git pull`, actualiza dependencias del Backend y del Frontend y aplica migraciones pendientes |

Una vez iniciado:

- Sistema web: <http://localhost:5174>
- API: <http://localhost:8001> (documentación interactiva en <http://localhost:8001/docs>)

El Backend escucha en `0.0.0.0` para que el celular pueda alcanzarlo por la red WiFi. Eso lo expone a
toda esa red: usalo solo en redes de confianza. Windows pedirá permiso en el firewall la primera
vez; permitilo solo en redes privadas.

Para ejecutarlo a mano, sin los `.bat`:

```
# Backend (desde SistemaDent_V2/Backend, con el venv activado)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# Frontend (desde SistemaDent_V2/Frontend)
npm run dev
```

## Migraciones

El esquema de la base lo maneja **Alembic**; la app ya no crea las tablas al arrancar. Los
comandos se ejecutan en `SistemaDent_V2/Backend` con el venv activado:

```
alembic upgrade head                      # aplica las migraciones pendientes
alembic revision --autogenerate -m "msg"  # genera una migración tras cambiar app/models.py
alembic current                           # muestra la revisión aplicada en la base
```

- **Base nueva y vacía:** `alembic upgrade head`.
- **Base que ya tenía las tablas** (por ejemplo, restaurada desde un respaldo propio, creada antes de
  Alembic): la primera vez marcá solo el punto de partida con `alembic stamp 17625902e577`
  (la migración *baseline*, que está vacía) y después ejecutá `alembic upgrade head`. No uses
  `alembic stamp head`: marcaría también las migraciones posteriores como aplicadas sin
  ejecutarlas y a la base le faltarían columnas (por ejemplo `pacientes.password_hash`).
- Los archivos de `alembic/versions/` **sí se suben a GitHub**: son la forma de que todas las
  máquinas tengan el mismo esquema. Cada persona aplica las migraciones en su propia base.

## Primer usuario administrador

La ruta para crear usuarios exige ser `admin`, así que en una base **vacía** el primer
administrador se inserta directamente en la tabla `usuarios`, con un hash bcrypt como
`password_hash`. `Backend/hash_test.py` genera uno de ejemplo (`python hash_test.py`). Una vez
dentro, los demás usuarios se crean desde la pantalla Usuarios del sistema web.

## API

La referencia completa e interactiva está en `/docs`. Resumen:

| Prefijo | Quién la usa | Autenticación |
|---|---|---|
| `/usuarios` | Personal: login, refresh, usuarios | JWT de personal |
| `/pacientes`, `/doctores`, `/citas`, `/historial` | Personal | JWT de personal (algunas rutas exigen `admin` o `doctor`) |
| `/app/*` | App móvil de pacientes | JWT de paciente |

Los tokens de pacientes y de personal **no son intercambiables**: los de pacientes llevan el
claim `aud: "paciente"` y cada tipo se rechaza en las rutas del otro.

Rutas de la app móvil: `POST /app/registro`, `POST /app/login`, `POST /app/refresh`,
`GET /app/doctores`, `GET /app/disponibilidad`, `POST /app/citas`, `GET /app/mis-citas`,
`GET /app/perfil`, `PUT /app/perfil` y `PUT /app/perfil/password`.

## Archivos que no se suben a GitHub

Cada máquina tiene los suyos: `Backend/.env`, `Backend/venv/`, `Backend/uploads/` (archivos
clínicos), `Frontend/.env.local`, `node_modules/` y, en la app móvil, `.env` y `.env.local`
(la IP cambia según la red).

## Limitaciones conocidas

- La activación de cuenta de un paciente no verifica su identidad: quien conozca el documento de
  un paciente sin cuenta puede activarla. Falta agregar un código de activación o una
  verificación por teléfono o email.
- No hay una restricción única en la base contra dos reservas simultáneas al mismo horario; la
  validación existe en la API pero no es atómica.
- Cambiar la contraseña no cierra las otras sesiones: un token ya emitido vale hasta que expire.
- Lo mismo con "Resetear acceso" (personal, en Pacientes): el access token vigente sigue valiendo
  y un refresh token anterior al reset vuelve a funcionar cuando el paciente reactiva su cuenta.
  Revocarlos requiere una versión de token (columna + migración). Además, tras el reset, quien
  conozca el documento puede activar esa cuenta desde la app: conviene avisar al paciente que
  la reactive enseguida.
- No hay límite de intentos de login.
