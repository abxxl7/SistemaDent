from abc import ABC, abstractmethod
from datetime import date, time
from sqlalchemy import func
from sqlalchemy.orm import Session
from app import models
from app.excepciones import (
    HorarioFueraDeRangoError, FechaPasadaError, FinDeSemanaError,
    PacienteNoEncontradoError, DoctorNoDisponibleError,
    ConflictoHorarioError, LimiteDiarioError,
)

class ReglaCita(ABC):
    def __init__(self, nombre: str):
        self._nombre = nombre

    @property
    def nombre(self) -> str:
        return self._nombre

    @abstractmethod
    def validar(self, db: Session, doctor_id: int, fecha: date, hora: time) -> None:
        """Lanza una subclase de ReglaNegocioError si la cita no cumple la regla."""

# --- Reglas concretas (se escriben en la sesión) ---

class ReglaFechaNoPasada(ReglaCita):
    def __init__(self):
        super().__init__("Fecha no pasada")
 
    def validar(self, db, doctor_id, fecha, hora):
        if fecha < date.today():
            raise FechaPasadaError("No se pueden agendar citas en fechas pasadas")

class ReglaDiaHabil(ReglaCita):
    def __init__(self):
        super().__init__("Día hábil")
 
    def validar(self, db, doctor_id, fecha, hora):
        if fecha.weekday() >= 5:
            raise FinDeSemanaError("No se agendan citas los fines de semana")

class ReglaHorarioLaboral(ReglaCita):
    def __init__(self, hora_inicio: time, hora_fin: time):
        super().__init__("Horario laboral")
        self._hora_inicio = hora_inicio
        self._hora_fin = hora_fin
 
    def validar(self, db, doctor_id, fecha, hora):
        if hora < self._hora_inicio or hora >= self._hora_fin:
            raise HorarioFueraDeRangoError(
                "La cita debe agendarse dentro del horario laboral (08:00 - 18:00)"
            )

class ReglaSinConflictoHorario(ReglaCita):
    def __init__(self):
        super().__init__("Sin conflicto de horario")
 
    def validar(self, db, doctor_id, fecha, hora):
        conflicto = db.query(models.Cita).filter(
            models.Cita.doctor_id == doctor_id,
            models.Cita.fecha     == fecha,
            models.Cita.hora      == hora,
            models.Cita.estado    != models.EstadoCita.cancelada
        ).first()
        if conflicto:
            raise ConflictoHorarioError(
                f"El doctor ya tiene una cita asignada el {fecha} a las {hora}. Por favor seleccioná otro horario."
            )

class ReglaLimiteDiario(ReglaCita):
    def __init__(self, limite: int):
        super().__init__("Límite diario")
        self.__limite = limite
 
    @property
    def limite(self) -> int:
        return self.__limite
 
    def validar(self, db, doctor_id, fecha, hora):
        total_citas_dia = db.query(func.count(models.Cita.id)).filter(
            models.Cita.doctor_id == doctor_id,
            models.Cita.fecha     == fecha,
            models.Cita.estado    != models.EstadoCita.cancelada
        ).scalar()
 
        if total_citas_dia >= self.__limite:
            raise LimiteDiarioError(
                f"El doctor ya alcanzó el límite máximo de {self.__limite} citas para el {fecha}."
            )

class ValidadorCitas:
    def __init__(self, reglas: list[ReglaCita]):
        self.__reglas = reglas

    def validar(self, db: Session, doctor_id: int, fecha: date, hora: time) -> None:
        for regla in self.__reglas:
            regla.validar(db, doctor_id, fecha, hora)
