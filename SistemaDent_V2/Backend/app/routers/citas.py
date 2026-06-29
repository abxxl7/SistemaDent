from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import time
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.models import TRANSICIONES_VALIDAS

router = APIRouter(prefix="/citas", tags=["Citas"])

LIMITE_CITAS_POR_DIA = 9
HORA_INICIO = time(8, 0)
HORA_FIN    = time(18, 0)

@router.post("/", response_model=schemas.CitaOut, status_code=201)
def crear_cita(
    data: schemas.CitaCreate,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user)
):
    # V2 FIX 1: Validar horario laboral (también validado en schema)
    if data.hora < HORA_INICIO or data.hora >= HORA_FIN:
        raise HTTPException(
            status_code=400,
            detail="La cita debe agendarse dentro del horario laboral (08:00 - 18:00)"
        )

    # V2 FIX 2: Validar que el paciente existe
    paciente = db.query(models.Paciente).filter(models.Paciente.id == data.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    # V2 FIX 3: Validar que el doctor existe y está activo
    doctor = db.query(models.Doctor).filter(
        models.Doctor.id == data.doctor_id,
        models.Doctor.activo == True
    ).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor no encontrado o inactivo")

    # V2 FIX 4: Validar conflicto de horario
    conflicto = db.query(models.Cita).filter(
        models.Cita.doctor_id == data.doctor_id,
        models.Cita.fecha     == data.fecha,
        models.Cita.hora      == data.hora,
        models.Cita.estado    != models.EstadoCita.cancelada
    ).first()
    if conflicto:
        raise HTTPException(
            status_code=400,
            detail=f"El doctor ya tiene una cita asignada el {data.fecha} a las {data.hora}. Por favor seleccioná otro horario."
        )

    # V2 FIX 5: Validar límite máximo de citas por doctor por día
    total_citas_dia = db.query(func.count(models.Cita.id)).filter(
        models.Cita.doctor_id == data.doctor_id,
        models.Cita.fecha     == data.fecha,
        models.Cita.estado    != models.EstadoCita.cancelada
    ).scalar()

    if total_citas_dia >= LIMITE_CITAS_POR_DIA:
        raise HTTPException(
            status_code=400,
            detail=f"El doctor ya alcanzó el límite máximo de {LIMITE_CITAS_POR_DIA} citas para el {data.fecha}."
        )

    cita = models.Cita(
        paciente_id=data.paciente_id,
        doctor_id=data.doctor_id,
        fecha=data.fecha,
        hora=data.hora,
        notas=data.notas,
        estado=models.EstadoCita.pendiente
    )
    db.add(cita)
    db.commit()
    db.refresh(cita)
    return cita

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
        transiciones = TRANSICIONES_VALIDAS.get(cita.estado, [])
        if data.estado not in transiciones:
            raise HTTPException(
                status_code=400,
                detail=f"Transición inválida: no se puede pasar de '{cita.estado}' a '{data.estado}'. "
                       f"Transiciones permitidas: {[e.value for e in transiciones] or 'ninguna'}"
            )
        cita.estado = data.estado

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