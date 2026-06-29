from sqlalchemy import Column, Integer, String, Date, Time, Text, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class RolUsuario(str, enum.Enum):
    admin = "admin"
    doctor = "doctor"
    recepcionista = "recepcionista"

# BUG V1: El estado no tiene restricción de transición — cualquier valor
# puede asignarse directamente sin validar el estado anterior.
class EstadoCita(str, enum.Enum):
    pendiente   = "pendiente"
    confirmada  = "confirmada"
    cancelada   = "cancelada"
    completada  = "completada"

class Usuario(Base):
    __tablename__ = "usuarios"

    id            = Column(Integer, primary_key=True, index=True)
    nombre        = Column(String(100), nullable=False)
    email         = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol           = Column(Enum(RolUsuario), nullable=False)
    activo        = Column(Boolean, default=True)

class Paciente(Base):
    __tablename__ = "pacientes"

    id               = Column(Integer, primary_key=True, index=True)
    nombre           = Column(String(100), nullable=False)
    documento        = Column(String(20), unique=True, nullable=False)
    telefono         = Column(String(20), nullable=False)
    email            = Column(String(100), nullable=True)
    fecha_registro   = Column(Date, nullable=False)

    citas = relationship("Cita", back_populates="paciente")

class Doctor(Base):
    __tablename__ = "doctores"

    id           = Column(Integer, primary_key=True, index=True)
    nombre       = Column(String(100), nullable=False)
    especialidad = Column(String(100), nullable=False)
    email        = Column(String(100), unique=True, nullable=False)
    activo       = Column(Boolean, default=True)

    citas = relationship("Cita", back_populates="doctor")

class Cita(Base):
    __tablename__ = "citas"

    id          = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=True)  # BUG V1: debería ser nullable=False
    doctor_id   = Column(Integer, ForeignKey("doctores.id"), nullable=True)   # BUG V1: debería ser nullable=False
    fecha       = Column(Date, nullable=True)                                  # BUG V1: debería ser nullable=False
    hora        = Column(Time, nullable=True)                                  # BUG V1: debería ser nullable=False
    estado      = Column(Enum(EstadoCita), default=EstadoCita.pendiente)
    notas       = Column(Text, nullable=True)

    paciente = relationship("Paciente", back_populates="citas")
    doctor   = relationship("Doctor", back_populates="citas")
