from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/doctores", tags=["Doctores"])

@router.post("/", response_model=schemas.DoctorOut, status_code=201)
def crear_doctor(
    data: schemas.DoctorCreate,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(require_roles("admin"))
):
    existing = db.query(models.Doctor).filter(models.Doctor.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un doctor con ese email")

    doctor = models.Doctor(**data.model_dump())
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor

@router.get("/", response_model=list[schemas.DoctorOut])
def listar_doctores(
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user)
):
    return db.query(models.Doctor).all()

@router.get("/{doctor_id}", response_model=schemas.DoctorOut)
def obtener_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user)
):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor no encontrado")
    return doctor

@router.put("/{doctor_id}", response_model=schemas.DoctorOut)
def actualizar_doctor(
    doctor_id: int,
    data: schemas.DoctorCreate,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(require_roles("admin"))
):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor no encontrado")

    for key, value in data.model_dump().items():
        setattr(doctor, key, value)

    db.commit()
    db.refresh(doctor)
    return doctor

@router.delete("/{doctor_id}", status_code=204)
def eliminar_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(require_roles("admin"))
):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor no encontrado")

    db.delete(doctor)
    db.commit()

# BUG V1: No existe endpoint GET /doctores/{id}/agenda
# El doctor no tiene forma de consultar sus citas del día.
# Este endpoint se implementa en V2.
