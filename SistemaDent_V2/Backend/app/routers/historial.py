import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import require_roles
from app.storage import guardar_archivo, obtener_archivo

router = APIRouter(tags=["Historial Clínico"])


@router.post("/historial", response_model=schemas.HistorialClinicoOut, status_code=201)
def crear_historial(
    data: schemas.HistorialClinicoCreate,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(require_roles("admin", "doctor"))
):
    paciente = db.query(models.Paciente).filter(models.Paciente.id == data.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    doctor = db.query(models.Doctor).filter(models.Doctor.id == data.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor no encontrado")

    if data.cita_id is not None:
        cita = db.query(models.Cita).filter(models.Cita.id == data.cita_id).first()
        if not cita:
            raise HTTPException(status_code=404, detail="Cita no encontrada")

    historial = models.HistorialClinico(**data.model_dump())
    db.add(historial)
    db.commit()
    db.refresh(historial)
    return historial


@router.get("/pacientes/{paciente_id}/historial", response_model=list[schemas.HistorialClinicoOut])
def listar_historial_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(require_roles("admin", "doctor"))
):
    paciente = db.query(models.Paciente).filter(models.Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    return (
        db.query(models.HistorialClinico)
        .filter(models.HistorialClinico.paciente_id == paciente_id)
        .order_by(models.HistorialClinico.fecha.desc(), models.HistorialClinico.id.desc())
        .all()
    )


@router.get("/historial/{id}", response_model=schemas.HistorialClinicoOut)
def obtener_historial(
    id: int,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(require_roles("admin", "doctor"))
):
    historial = db.query(models.HistorialClinico).filter(models.HistorialClinico.id == id).first()
    if not historial:
        raise HTTPException(status_code=404, detail="Entrada de historial no encontrada")
    return historial


@router.post("/historial/{id}/archivos", response_model=list[schemas.ArchivoClinicoOut], status_code=201)
def subir_archivos(
    id: int,
    tipo: models.TipoArchivo = Form(...),
    archivos: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(require_roles("admin", "doctor"))
):
    historial = db.query(models.HistorialClinico).filter(models.HistorialClinico.id == id).first()
    if not historial:
        raise HTTPException(status_code=404, detail="Entrada de historial no encontrada")

    creados = []
    for archivo in archivos:
        nombre_unico = f"{uuid.uuid4().hex}_{archivo.filename}"
        ruta_relativa = f"historial/{id}/{nombre_unico}"
        guardar_archivo(archivo, ruta_relativa)

        registro = models.ArchivoClinico(
            historial_id=id,
            nombre_archivo=archivo.filename,
            ruta_archivo=ruta_relativa,
            tipo=tipo,
        )
        db.add(registro)
        creados.append(registro)

    db.commit()
    for registro in creados:
        db.refresh(registro)
    return creados


@router.get("/archivos/{id}")
def ver_archivo(
    id: int,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(require_roles("admin", "doctor"))
):
    archivo = db.query(models.ArchivoClinico).filter(models.ArchivoClinico.id == id).first()
    if not archivo:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    ruta = obtener_archivo(archivo.ruta_archivo)
    if not os.path.exists(ruta):
        raise HTTPException(status_code=404, detail="El archivo no existe en el servidor")

    return FileResponse(ruta, filename=archivo.nombre_archivo)
