from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, time
from app.models import EstadoCita, RolUsuario

# ──────────────────────────────────────────────
# USUARIO
# ──────────────────────────────────────────────
class UsuarioCreate(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    rol: RolUsuario

class UsuarioOut(BaseModel):
    id: int
    nombre: str
    email: str
    rol: RolUsuario
    activo: bool

    class Config:
        from_attributes = True

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class TokenSchema(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class RefreshTokenSchema(BaseModel):
    refresh_token: str

# ──────────────────────────────────────────────
# PACIENTE
# ──────────────────────────────────────────────
class PacienteCreate(BaseModel):
    nombre: str
    documento: str
    telefono: str
    email: Optional[str] = None
    fecha_registro: date

class PacienteOut(PacienteCreate):
    id: int

    class Config:
        from_attributes = True

# ──────────────────────────────────────────────
# DOCTOR
# ──────────────────────────────────────────────
class DoctorCreate(BaseModel):
    nombre: str
    especialidad: str
    email: EmailStr

class DoctorOut(DoctorCreate):
    id: int
    activo: bool

    class Config:
        from_attributes = True

# ──────────────────────────────────────────────
# CITA
# BUG V1: Todos los campos son opcionales — no se exige
# paciente_id, doctor_id, fecha ni hora al crear una cita.
# En V2 serán obligatorios.
# ──────────────────────────────────────────────
class CitaCreate(BaseModel):
    paciente_id: Optional[int] = None   # BUG V1: debería ser int obligatorio
    doctor_id:   Optional[int] = None   # BUG V1: debería ser int obligatorio
    fecha:       Optional[date] = None  # BUG V1: debería ser date obligatorio
    hora:        Optional[time] = None  # BUG V1: debería ser time obligatorio
    notas:       Optional[str] = None

class CitaUpdate(BaseModel):
    # BUG V1: permite cambiar estado libremente sin validar transición
    estado: Optional[EstadoCita] = None
    notas:  Optional[str] = None

class CitaOut(BaseModel):
    id:          int
    paciente_id: Optional[int]
    doctor_id:   Optional[int]
    fecha:       Optional[date]
    hora:        Optional[time]
    estado:      EstadoCita
    notas:       Optional[str]

    class Config:
        from_attributes = True
