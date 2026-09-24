from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, require_roles

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
    data: schemas.PacienteUpdate,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user)
):
    paciente = db.query(models.Paciente).filter(models.Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    # V2: Solo se actualizan los campos permitidos (no el documento)
    for key, value in data.model_dump().items():
        setattr(paciente, key, value)

    db.commit()
    db.refresh(paciente)
    return paciente

# TODO (mejoras futuras):
# - El reset no revoca sesiones abiertas: el access token vale hasta expirar y un refresh token
#   emitido antes del reset vuelve a funcionar cuando el paciente reactiva la cuenta. Requiere una
#   versión de token (columna + migración) validada en los tokens de paciente.
# - Tras el reset, quien conozca el documento puede activar la cuenta desde la app (ver TODO en
#   POST /app/registro): falta un código de activación o verificación por teléfono/email.
@router.put("/{paciente_id}/resetear-password")
def resetear_password(
    paciente_id: int,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(require_roles("admin", "recepcionista"))
):
    paciente = db.query(models.Paciente).filter(models.Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    paciente.password_hash = None
    db.commit()
    return {"detail": "Acceso reseteado. El paciente puede reactivar su cuenta desde la app con su documento."}

# V2: No existe endpoint DELETE para pacientes
# Se preserva el historial médico completo