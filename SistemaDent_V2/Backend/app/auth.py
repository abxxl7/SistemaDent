from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt as _bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY         = os.getenv("SECRET_KEY")
ALGORITHM          = os.getenv("ALGORITHM", "HS256")
EXPIRE_MIN         = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
REFRESH_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/usuarios/login")

def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode(), hashed.encode())

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=EXPIRE_MIN)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_refresh_token(token: str) -> str:
    """Decodifica un refresh token y devuelve el email del usuario."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: se esperaba un refresh token"
            )
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: sin sujeto"
            )
        return email
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido o expirado"
        )

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise credentials_exception
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if user is None or not user.activo:
        raise credentials_exception
    return user

AUD_PACIENTE = "paciente"
oauth2_scheme_paciente = OAuth2PasswordBearer(tokenUrl="/app/login")

def create_paciente_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=EXPIRE_MIN)
    to_encode.update({"exp": expire, "type": "access", "aud": AUD_PACIENTE})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_paciente_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh", "aud": AUD_PACIENTE})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_paciente_refresh_token(token: str) -> str:
    """Decodifica un refresh token de paciente y devuelve su documento."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], audience=AUD_PACIENTE)
        if payload.get("type") != "refresh" or payload.get("aud") != AUD_PACIENTE:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: se esperaba un refresh token de paciente"
            )
        documento: str = payload.get("sub")
        if not documento:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: sin sujeto"
            )
        return documento
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido o expirado"
        )

def get_current_paciente(
    token: str = Depends(oauth2_scheme_paciente),
    db: Session = Depends(get_db)
) -> models.Paciente:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], audience=AUD_PACIENTE)
        if payload.get("type") != "access" or payload.get("aud") != AUD_PACIENTE:
            raise credentials_exception
        documento: str = payload.get("sub")
        if documento is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    paciente = db.query(models.Paciente).filter(models.Paciente.documento == documento).first()
    if paciente is None:
        raise credentials_exception
    return paciente

def require_roles(*roles):
    def role_checker(current_user: models.Usuario = Depends(get_current_user)):
        if current_user.rol not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenés permisos para realizar esta acción"
            )
        return current_user
    return role_checker