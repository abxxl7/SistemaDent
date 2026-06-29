from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/pacientes", tags=["Pacientes"])

@router.post("/", response_model=schemas.PacienteOut, status_code=201)
def crear_paciente(
    data: schemas.PacienteCreate,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user)
):
    existing = db.query(models.Paciente).filter(models.Paciente.documento == data.documento).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un paciente con ese documento")

    paciente = models.Paciente(**data.model_dump())
    db.add(paciente)
    db.commit()
    db.refresh(paciente)
    return paciente

@router.get("/", response_model=list[schemas.PacienteOut])
def listar_pacientes(
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user)
):
    return db.query(models.Paciente).all()

@router.get("/{paciente_id}", response_model=schemas.PacienteOut)
def obtener_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user)
):
    paciente = db.query(models.Paciente).filter(models.Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    return paciente

@router.put("/{paciente_id}", response_model=schemas.PacienteOut)
def actualizar_paciente(
    paciente_id: int,
    data: schemas.PacienteCreate,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user)
):
    paciente = db.query(models.Paciente).filter(models.Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    for key, value in data.model_dump().items():
        setattr(paciente, key, value)

    db.commit()
    db.refresh(paciente)
    return paciente

@router.delete("/{paciente_id}", status_code=204)
def eliminar_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user)
):
    paciente = db.query(models.Paciente).filter(models.Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    db.delete(paciente)
    db.commit()
