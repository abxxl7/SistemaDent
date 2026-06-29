from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/citas", tags=["Citas"])

@router.post("/", response_model=schemas.CitaOut, status_code=201)
def crear_cita(
    data: schemas.CitaCreate,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user)
):
    # BUG V1: No se validan campos obligatorios.
    # Es posible crear una cita sin paciente_id, doctor_id, fecha u hora.

    # BUG V1: No se verifica si ya existe una cita para el mismo doctor
    # en la misma fecha y hora. Esto permite duplicidad de horarios.

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

    # BUG V1: No existe validación de transición de estados.
    # Se puede pasar de CANCELADA a COMPLETADA o cualquier combinación inválida.
    # En V2 se implementa la máquina de estados con transiciones controladas.
    if data.estado is not None:
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
