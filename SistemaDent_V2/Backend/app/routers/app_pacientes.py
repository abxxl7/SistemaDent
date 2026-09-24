from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import (
    hash_password, verify_password,
    create_paciente_access_token, create_paciente_refresh_token,
    decode_paciente_refresh_token, get_current_paciente,
)
from app.routers.citas import crear_cita_validada, validar_fecha_agendable, LIMITE_CITAS_POR_DIA

router = APIRouter(prefix="/app", tags=["App Pacientes"])

def _tokens(paciente: models.Paciente) -> dict:
    return {
        "access_token":  create_paciente_access_token({"sub": paciente.documento}),
        "refresh_token": create_paciente_refresh_token({"sub": paciente.documento}),
        "token_type":    "bearer",
    }

# TODO (mejora futura): el registro no verifica identidad; quien conozca el documento de un
# paciente sin cuenta puede activarla. Agregar código de activación (dado por recepción) o
# verificación por teléfono/email antes de setear el password_hash.
@router.post("/registro", response_model=schemas.PacienteOut, status_code=201)
def registro(data: schemas.PacienteRegistro, db: Session = Depends(get_db)):
    paciente = db.query(models.Paciente).filter(models.Paciente.documento == data.documento).first()

    if paciente:
        if paciente.password_hash is not None:
            raise HTTPException(
                status_code=400,
                detail="Ya existe una cuenta con ese documento, iniciá sesión."
            )
        # Activación de un paciente creado por recepción: solo se setea la contraseña
        paciente.password_hash = hash_password(data.password)
    else:
        paciente = models.Paciente(
            documento=data.documento,
            nombre=data.nombre,
            telefono=data.telefono,
            email=data.email,
            direccion=data.direccion,
            tipo_sangre=data.tipo_sangre,
            fecha_registro=date.today(),
            password_hash=hash_password(data.password),
        )
        db.add(paciente)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Ya existe una cuenta con ese documento, iniciá sesión."
        )
    db.refresh(paciente)
    return paciente

@router.post("/login", response_model=schemas.TokenSchema)
def login(data: schemas.PacienteLoginApp, db: Session = Depends(get_db)):
    paciente = db.query(models.Paciente).filter(models.Paciente.documento == data.documento).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    if paciente.password_hash is None:
        raise HTTPException(status_code=403, detail="Todavía no activaste tu cuenta")
    if not verify_password(data.password, paciente.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    return _tokens(paciente)

@router.post("/refresh", response_model=schemas.TokenSchema)
def refresh(data: schemas.RefreshTokenSchema, db: Session = Depends(get_db)):
    documento = decode_paciente_refresh_token(data.refresh_token)
    paciente = db.query(models.Paciente).filter(models.Paciente.documento == documento).first()
    if not paciente or paciente.password_hash is None:
        raise HTTPException(status_code=401, detail="Paciente no encontrado o sin cuenta activa")
    return _tokens(paciente)

@router.get("/perfil", response_model=schemas.PerfilOut)
def obtener_perfil(paciente: models.Paciente = Depends(get_current_paciente)):
    return paciente

@router.put("/perfil", response_model=schemas.PerfilOut)
def actualizar_perfil(
    data: schemas.PerfilUpdate,
    db: Session = Depends(get_db),
    paciente: models.Paciente = Depends(get_current_paciente)
):
    # Reemplaza los 4 campos editables (un opcional en null se borra); documento y nombre no se tocan
    paciente.telefono = data.telefono
    paciente.email = data.email
    paciente.direccion = data.direccion
    paciente.tipo_sangre = data.tipo_sangre
    db.commit()
    db.refresh(paciente)
    return paciente

@router.put("/perfil/password", status_code=204)
def cambiar_password(
    data: schemas.CambiarPasswordApp,
    db: Session = Depends(get_db),
    paciente: models.Paciente = Depends(get_current_paciente)
):
    if paciente.password_hash is None or not verify_password(data.password_actual, paciente.password_hash):
        raise HTTPException(status_code=401, detail="La contraseña actual es incorrecta")
    paciente.password_hash = hash_password(data.password_nueva)
    db.commit()

@router.get("/doctores", response_model=list[schemas.DoctorAppOut])
def listar_doctores(
    db: Session = Depends(get_db),
    _: models.Paciente = Depends(get_current_paciente)
):
    return db.query(models.Doctor).filter(models.Doctor.activo == True).order_by(models.Doctor.nombre).all()

@router.get("/disponibilidad", response_model=schemas.DisponibilidadOut)
def disponibilidad(
    doctor_id: int,
    fecha: date,
    db: Session = Depends(get_db),
    _: models.Paciente = Depends(get_current_paciente)
):
    doctor = db.query(models.Doctor).filter(
        models.Doctor.id == doctor_id,
        models.Doctor.activo == True
    ).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor no encontrado o inactivo")

    validar_fecha_agendable(fecha)

    ocupadas = {
        hora for (hora,) in db.query(models.Cita.hora).filter(
            models.Cita.doctor_id == doctor_id,
            models.Cita.fecha     == fecha,
            models.Cita.estado    != models.EstadoCita.cancelada
        ).all()
    }

    if len(ocupadas) >= LIMITE_CITAS_POR_DIA:
        return {"doctor_id": doctor_id, "fecha": fecha, "slots": [], "limite_alcanzado": True}

    slots = [s for s in schemas.SLOTS_VALIDOS if s not in ocupadas]
    return {"doctor_id": doctor_id, "fecha": fecha, "slots": slots, "limite_alcanzado": False}

@router.post("/citas", response_model=schemas.CitaOut, status_code=201)
def crear_cita(
    data: schemas.CitaCreateApp,
    db: Session = Depends(get_db),
    paciente: models.Paciente = Depends(get_current_paciente)
):
    return crear_cita_validada(db, paciente.id, data.doctor_id, data.fecha, data.hora, data.notas)

@router.get("/mis-citas", response_model=list[schemas.CitaAppOut])
def mis_citas(
    db: Session = Depends(get_db),
    paciente: models.Paciente = Depends(get_current_paciente)
):
    # Join sin filtrar por Doctor.activo: las citas de doctores inactivos conservan su nombre
    filas = (
        db.query(models.Cita, models.Doctor.nombre)
        .join(models.Doctor, models.Doctor.id == models.Cita.doctor_id)
        .filter(models.Cita.paciente_id == paciente.id)
        .order_by(models.Cita.fecha.desc(), models.Cita.hora.desc())
        .all()
    )
    return [
        {
            "id": c.id, "paciente_id": c.paciente_id, "doctor_id": c.doctor_id,
            "doctor_nombre": nombre, "fecha": c.fecha, "hora": c.hora,
            "estado": c.estado, "notas": c.notas,
        }
        for c, nombre in filas
    ]
