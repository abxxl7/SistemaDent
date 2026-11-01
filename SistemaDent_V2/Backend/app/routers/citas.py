from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, time
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.excepciones import ReglaNegocioError, TransicionInvalidaError
from app.reglas_cita import (
    ValidadorCitas, ReglaHorarioLaboral, ReglaFechaNoPasada, ReglaDiaHabil,
    ReglaPacienteExiste, ReglaDoctorActivo, ReglaSinConflictoHorario, ReglaLimiteDiario,
)

router = APIRouter(prefix="/citas", tags=["Citas"])

LIMITE_CITAS_POR_DIA = 9
HORA_INICIO = time(8, 0)
HORA_FIN    = time(18, 0)

def _aplicar_reglas(validador: ValidadorCitas, db: Session | None, doctor_id: int | None, fecha: date, hora: time | None) -> None:
    try:
        validador.validar(db, doctor_id, fecha, hora)
    except ReglaNegocioError as e:
        raise HTTPException(status_code=e.codigo_http, detail=e.mensaje)

def validar_fecha_agendable(fecha: date) -> None:
    _aplicar_reglas(ValidadorCitas([ReglaFechaNoPasada(), ReglaDiaHabil()]), None, None, fecha, None)

def crear_cita_validada(
    db: Session,
    paciente_id: int,
    doctor_id: int,
    fecha: date,
    hora: time,
    notas: str | None = None
) -> models.Cita:
    """Lógica de negocio única para crear citas; la usan staff (/citas) y pacientes (/app/citas)."""
    # El orden de la lista es el orden en que se informan los errores
    validador = ValidadorCitas([
        ReglaHorarioLaboral(HORA_INICIO, HORA_FIN),
        ReglaFechaNoPasada(),
        ReglaDiaHabil(),
        ReglaPacienteExiste(paciente_id),
        ReglaDoctorActivo(),
        ReglaSinConflictoHorario(),
        ReglaLimiteDiario(LIMITE_CITAS_POR_DIA),
    ])
    _aplicar_reglas(validador, db, doctor_id, fecha, hora)

    # TODO (mejora futura): la verificación de conflicto y la inserción no son atómicas; dos
    # reservas simultáneas al mismo slot pueden pasar ambas. Solución: índice único parcial
    # en (doctor_id, fecha, hora) WHERE estado != 'cancelada' + manejar IntegrityError.
    cita = models.Cita(
        paciente_id=paciente_id,
        doctor_id=doctor_id,
        fecha=fecha,
        hora=hora,
        notas=notas,
        estado=models.EstadoCita.pendiente
    )
    db.add(cita)
    db.commit()
    db.refresh(cita)
    return cita

@router.post("/", response_model=schemas.CitaOut, status_code=201)
def crear_cita(
    data: schemas.CitaCreate,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user)
):
    return crear_cita_validada(db, data.paciente_id, data.doctor_id, data.fecha, data.hora, data.notas)

@router.get("/", response_model=list[schemas.CitaOut])
def listar_citas(
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user)
):
    return db.query(models.Cita).all()

@router.get("/{cita_id}", response_model=schemas.CitaOut)
def obtener_cita(
    cita_id: int,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user)
):
    cita = db.query(models.Cita).filter(models.Cita.id == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return cita

@router.put("/{cita_id}", response_model=schemas.CitaOut)
def actualizar_cita(
    cita_id: int,
    data: schemas.CitaUpdate,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user)
):
    cita = db.query(models.Cita).filter(models.Cita.id == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    # V2 FIX 6: Validar transición de estado
    if data.estado is not None:
        try:
            cita.cambiar_estado(data.estado)
        except TransicionInvalidaError as e:
            raise HTTPException(status_code=e.codigo_http, detail=e.mensaje)

    if data.notas is not None:
        cita.notas = data.notas

    db.commit()
    db.refresh(cita)
    return cita

@router.delete("/{cita_id}", status_code=204)
def eliminar_cita(
    cita_id: int,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user)
):
    cita = db.query(models.Cita).filter(models.Cita.id == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    db.delete(cita)
    db.commit()