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



class ValidadorCitas:
    def __init__(self, reglas: list[ReglaCita]):
        self.__reglas = reglas

    def validar(self, db: Session, doctor_id: int, fecha: date, hora: time) -> None:
        for regla in self.__reglas:
            regla.validar(db, doctor_id, fecha, hora)

