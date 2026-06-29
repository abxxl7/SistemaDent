from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import date, time
from app.models import EstadoCita, RolUsuario, TipoSangre

# Horario laboral
HORA_INICIO = time(8, 0)   # 08:00
HORA_FIN    = time(18, 0)  # 18:00

# ──────────────────────────────────────────────
# USUARIO
# ──────────────────────────────────────────────
class UsuarioCreate(BaseModel):
    nombre:   str
    email:    EmailStr
    password: str
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
    nombre:         str
    documento:      str
    telefono:       str
    email:          Optional[str] = None
    fecha_registro: date
    direccion:      Optional[str] = None
    tipo_sangre:    Optional[TipoSangre] = None

class PacienteUpdate(BaseModel):
    # V2: Sin eliminación — solo actualización de datos
    nombre:      str
    telefono:    str
    email:       Optional[str] = None
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

    class Config:
        from_attributes = True

# ──────────────────────────────────────────────
# DOCTOR
# ──────────────────────────────────────────────
class DoctorCreate(BaseModel):
    nombre:      str
    especialidad: str
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
class CitaCreate(BaseModel):
    paciente_id: int
    doctor_id:   int
    fecha:       date
    hora:        time
    notas:       Optional[str] = None

    @field_validator('hora')
    @classmethod
    def validar_horario_laboral(cls, v):
        if v < HORA_INICIO or v >= HORA_FIN:
            raise ValueError('La hora debe estar dentro del horario laboral (08:00 - 18:00)')
        return v

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