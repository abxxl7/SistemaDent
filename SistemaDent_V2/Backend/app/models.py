from sqlalchemy import Column, Integer, String, Date, Time, DateTime, Text, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import enum
from app.excepciones import TransicionInvalidaError

class RolUsuario(str, enum.Enum):
    admin         = "admin"
    doctor        = "doctor"
    recepcionista = "recepcionista"

class EstadoCita(str, enum.Enum):
    pendiente  = "pendiente"
    confirmada = "confirmada"
    cancelada  = "cancelada"
    completada = "completada"

# V2: Transiciones de estado válidas
TRANSICIONES_VALIDAS = {
    EstadoCita.pendiente:  [EstadoCita.confirmada, EstadoCita.cancelada],
    EstadoCita.confirmada: [EstadoCita.completada, EstadoCita.cancelada],
    EstadoCita.cancelada:  [],
    EstadoCita.completada: [],
}

class TipoSangre(str, enum.Enum):
    a_pos  = "A+"
    a_neg  = "A-"
    b_pos  = "B+"
    b_neg  = "B-"
    ab_pos = "AB+"
    ab_neg = "AB-"
    o_pos  = "O+"
    o_neg  = "O-"

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

    id             = Column(Integer, primary_key=True, index=True)
    nombre         = Column(String(100), nullable=False)
    documento      = Column(String(20), unique=True, nullable=False)
    telefono       = Column(String(20), nullable=False)
    email          = Column(String(100), nullable=True)
    fecha_registro = Column(Date, nullable=False)
    # V2: Nuevos campos
    direccion      = Column(String(255), nullable=True)
    tipo_sangre    = Column(Enum(TipoSangre), nullable=True)
    # NULL = paciente sin cuenta en la app móvil (creado por recepción)
    password_hash  = Column(String(255), nullable=True)

    citas = relationship("Cita", back_populates="paciente")
    historiales = relationship("HistorialClinico", back_populates="paciente")

    @property
    def tiene_cuenta(self) -> bool:
        return self.password_hash is not None

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
    # V2: Todos los campos obligatorios
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    doctor_id   = Column(Integer, ForeignKey("doctores.id"), nullable=False)
    fecha       = Column(Date, nullable=False)
    hora        = Column(Time, nullable=False)
    estado      = Column(Enum(EstadoCita), default=EstadoCita.pendiente)
    notas       = Column(Text, nullable=True)
    paciente = relationship("Paciente", back_populates="citas")
    doctor   = relationship("Doctor", back_populates="citas")

    def cambiar_estado(self, nuevo_estado: EstadoCita) -> None:
        transiciones = TRANSICIONES_VALIDAS.get(self.estado, [])
        if nuevo_estado not in transiciones:
            raise TransicionInvalidaError(
                f"Transición inválida: no se puede pasar de '{self.estado.value}' a '{nuevo_estado.value}'. "
                f"Transiciones permitidas: {[e.value for e in transiciones] or 'ninguna'}"
            )
        self.estado = nuevo_estado

class TipoArchivo(str, enum.Enum):
    radiografia = "radiografia"
    foto        = "foto"
    documento   = "documento"

class HistorialClinico(Base):
    __tablename__ = "historial_clinico"

    id          = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    doctor_id   = Column(Integer, ForeignKey("doctores.id"), nullable=False)
    cita_id     = Column(Integer, ForeignKey("citas.id"), nullable=True)
    fecha       = Column(Date, nullable=False)
    diagnostico = Column(Text, nullable=False)
    tratamiento = Column(Text, nullable=False)
    notas       = Column(Text, nullable=True)

    paciente = relationship("Paciente", back_populates="historiales")
    doctor   = relationship("Doctor")
    cita     = relationship("Cita")
    archivos = relationship("ArchivoClinico", back_populates="historial")

class ArchivoClinico(Base):
    __tablename__ = "archivo_clinico"

    id             = Column(Integer, primary_key=True, index=True)
    historial_id   = Column(Integer, ForeignKey("historial_clinico.id"), nullable=False)
    nombre_archivo = Column(String(255), nullable=False)
    ruta_archivo   = Column(String(500), nullable=False)
    tipo           = Column(Enum(TipoArchivo), nullable=False)
    fecha_subida   = Column(DateTime, default=datetime.utcnow)

    historial = relationship("HistorialClinico", back_populates="archivos")