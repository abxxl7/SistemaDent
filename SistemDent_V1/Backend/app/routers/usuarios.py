from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token, create_refresh_token, decode_refresh_token, get_current_user, require_roles

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.post("/registro", response_model=schemas.UsuarioOut, status_code=201)
def registrar_usuario(
    data: schemas.UsuarioCreate,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(require_roles("admin"))
):
    existing = db.query(models.Usuario).filter(models.Usuario.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    usuario = models.Usuario(
        nombre=data.nombre,
        email=data.email,
        password_hash=hash_password(data.password),
        rol=data.rol
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario

@router.post("/login", response_model=schemas.TokenSchema)
def login(data: schemas.LoginSchema, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == data.email).first()
    if not usuario or not verify_password(data.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    if not usuario.activo:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    access_token  = create_access_token({"sub": usuario.email, "rol": usuario.rol})
    refresh_token = create_refresh_token({"sub": usuario.email})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/refresh", response_model=schemas.TokenSchema)
def refresh_token(data: schemas.RefreshTokenSchema, db: Session = Depends(get_db)):
    email = decode_refresh_token(data.refresh_token)
    usuario = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not usuario or not usuario.activo:
        raise HTTPException(status_code=401, detail="Usuario no encontrado o inactivo")

    access_token  = create_access_token({"sub": usuario.email, "rol": usuario.rol})
    refresh_token = create_refresh_token({"sub": usuario.email})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UsuarioOut)
def get_me(current_user: models.Usuario = Depends(get_current_user)):
    return current_user

@router.get("/", response_model=list[schemas.UsuarioOut])
def listar_usuarios(
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(require_roles("admin"))
):
    return db.query(models.Usuario).all()
