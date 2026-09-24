from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import date, time, datetime, timedelta
from app.models import EstadoCita, RolUsuario, TipoSangre, TipoArchivo

# Horario laboral
HORA_INICIO = time(8, 0)   # 08:00
HORA_FIN    = time(18, 0)  # 18:00
DURACION_TURNO_MIN = 45    # Duración fija de cada turno odontológico

def _generar_slots(inicio: time, fin: time, duracion_min: int) -> list[time]:
    slots = []
    actual = datetime.combine(date.today(), inicio)
    while actual.time() < fin:
        slots.append(actual.time())
        actual += timedelta(minutes=duracion_min)
    return slots

# Horarios de turno permitidos: 08:00, 08:45, 09:30, ... 17:45
SLOTS_VALIDOS = _generar_slots(HORA_INICIO, HORA_FIN, DURACION_TURNO_MIN)

# ──────────────────────────────────────────────
# USUARIO
# ──────────────────────────────────────────────
class UsuarioCreate(BaseModel):
    nombre:   str = Field(min_length=1)
    email:    EmailStr
    password: str = Field(min_length=6, max_length=72)
    rol:      RolUsuario

class UsuarioOut(BaseModel):
    id:     int
    nombre: str
    email:  str
    rol:    RolUsuario
    activo: bool

    class Config:
        from_attributes = True

class LoginSchema(BaseModel):
    email:    EmailStr
    password: str

class TokenSchema(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str

class RefreshTokenSchema(BaseModel):
    refresh_token: str

# ──────────────────────────────────────────────
# PACIENTE
# V2: Agrega dirección y tipo de sangre
# ──────────────────────────────────────────────
class PacienteCreate(BaseModel):
    nombre:         str = Field(min_length=1)
    documento:      str = Field(min_length=1)
    telefono:       str = Field(min_length=1)
    email:          Optional[EmailStr] = None
    fecha_registro: date
    direccion:      Optional[str] = None
    tipo_sangre:    Optional[TipoSangre] = None

class PacienteUpdate(BaseModel):
    # V2: Sin eliminación — solo actualización de datos
    nombre:      str = Field(min_length=1)
    telefono:    str = Field(min_length=1)
    email:       Optional[EmailStr] = None
    direccion:   Optional[str] = None
    tipo_sangre: Optional[TipoSangre] = None

class PacienteOut(BaseModel):
    id:             int
    nombre:         str
    documento:      str
    telefono:       str
    email:          Optional[str]
    fecha_registro: date
    direccion:      Optional[str]
    tipo_sangre:    Optional[TipoSangre]
    tiene_cuenta:   bool

    class Config:
        from_attributes = True

# ──────────────────────────────────────────────
# DOCTOR
# ──────────────────────────────────────────────
class DoctorCreate(BaseModel):
    nombre:      str = Field(min_length=1)
    especialidad: str = Field(min_length=1)
    email:       EmailStr

class DoctorOut(DoctorCreate):
    id:     int
    activo: bool

    class Config:
        from_attributes = True

# ──────────────────────────────────────────────
# CITA
# V2: Todos los campos obligatorios + validaciones
# ──────────────────────────────────────────────
def _validar_slot(v: time) -> time:
    if v not in SLOTS_VALIDOS:
        horarios = ', '.join(t.strftime('%H:%M') for t in SLOTS_VALIDOS)
        raise ValueError(
            f'La hora debe coincidir con uno de los turnos disponibles de {DURACION_TURNO_MIN} minutos: {horarios}'
        )
    return v

class CitaCreate(BaseModel):
    paciente_id: int
    doctor_id:   int
    fecha:       date
    hora:        time
    notas:       Optional[str] = None

    @field_validator('hora')
    @classmethod
    def validar_slot_horario(cls, v):
        return _validar_slot(v)

class CitaUpdate(BaseModel):
    # V2: Solo permite cambiar estado y notas
    # La validación de transición se hace en el router
    estado: Optional[EstadoCita] = None
    notas:  Optional[str] = None

class CitaOut(BaseModel):
    id:          int
    paciente_id: int
    doctor_id:   int
    fecha:       date
    hora:        time
    estado:      EstadoCita
    notas:       Optional[str]

    class Config:
        from_attributes = True

# ──────────────────────────────────────────────
# APP PACIENTES (móvil)
# ──────────────────────────────────────────────
class PacienteRegistro(BaseModel):
    documento: str = Field(min_length=1)
    nombre:    str = Field(min_length=1)
    telefono:  str = Field(min_length=1)
    email:     Optional[EmailStr] = None
    direccion:   Optional[str] = None
    tipo_sangre: Optional[TipoSangre] = None
    password:  str = Field(min_length=6, max_length=72)

class PacienteLoginApp(BaseModel):
    documento: str = Field(min_length=1)
    password:  str

class PerfilOut(BaseModel):
    documento:   str
    nombre:      str
    telefono:    str
    email:       Optional[str]
    direccion:   Optional[str]
    tipo_sangre: Optional[TipoSangre]

    class Config:
        from_attributes = True

class PerfilUpdate(BaseModel):
    # documento y nombre son inmutables desde la app
    telefono:    str = Field(min_length=1)
    email:       Optional[EmailStr] = None
    direccion:   Optional[str] = None
    tipo_sangre: Optional[TipoSangre] = None

class CambiarPasswordApp(BaseModel):
    password_actual: str
    password_nueva:  str = Field(min_length=6, max_length=72)

class DoctorAppOut(BaseModel):
    id:           int
    nombre:       str
    especialidad: str

    class Config:
        from_attributes = True

class DisponibilidadOut(BaseModel):
    doctor_id:         int
    fecha:             date
    slots:             list[time]
    limite_alcanzado:  bool

class CitaAppOut(BaseModel):
    id:            int
    paciente_id:   int
    doctor_id:     int
    doctor_nombre: str
    fecha:         date
    hora:          time
    estado:        EstadoCita
    notas:         Optional[str]

    class Config:
        from_attributes = True

class CitaCreateApp(BaseModel):
    # Sin paciente_id: siempre se toma del token; si el body lo trae, se ignora
    doctor_id: int
    fecha:     date
    hora:      time
    notas:     Optional[str] = None

    @field_validator('hora')
    @classmethod
    def validar_slot_horario(cls, v):
        return _validar_slot(v)

# ──────────────────────────────────────────────
# HISTORIAL CLÍNICO
# ──────────────────────────────────────────────
class ArchivoClinicoOut(BaseModel):
    id:             int
    historial_id:   int
    nombre_archivo: str
    ruta_archivo:   str
    tipo:           TipoArchivo
    fecha_subida:   datetime

    class Config:
        from_attributes = True

class HistorialClinicoCreate(BaseModel):
    paciente_id: int
    doctor_id:   int
    cita_id:     Optional[int] = None
    fecha:       date
    diagnostico: str = Field(min_length=1)
    tratamiento: str = Field(min_length=1)
    notas:       Optional[str] = None

class HistorialClinicoOut(BaseModel):
    id:          int
    paciente_id: int
    doctor_id:   int
    cita_id:     Optional[int]
    fecha:       date
    diagnostico: str
    tratamiento: str
    notas:       Optional[str]
    archivos:    list[ArchivoClinicoOut] = []

    class Config:
        from_attributes = True