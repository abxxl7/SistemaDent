from abc import ABC, abstractmethod
from datetime import date, time
from sqlalchemy.orm import Session

class ReglaCita(ABC):
    def __init__(self, nombre: str):
        self._nombre = nombre

    @property
    def nombre(self) -> str:
        return self._nombre

    @abstractmethod
    def validar(self, db: Session, doctor_id: int, fecha: date, hora: time) -> None:
        """Lanza una subclase de ReglaNegocioError si la cita no cumple la regla."""

class ValidadorCitas:
    def __init__(self, reglas: list[ReglaCita]):
        self.__reglas = reglas

    def validar(self, db: Session, doctor_id: int, fecha: date, hora: time) -> None:
        for regla in self.__reglas:
            regla.validar(db, doctor_id, fecha, hora)
