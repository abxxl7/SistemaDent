import os
import shutil
from fastapi import UploadFile

# Backend/uploads — se crea sola en cualquier máquina nueva (ver guardar_archivo)
UPLOAD_ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")


def guardar_archivo(file: UploadFile, ruta_relativa: str) -> str:
    """Guarda un UploadFile en uploads/{ruta_relativa}. Crea las carpetas si no existen.

    Reemplazar esta función por una que suba a Supabase Storage (manteniendo la
    misma firma) es todo lo que hace falta para migrar de almacenamiento local
    a la nube sin tocar los routers.
    """
    destino = os.path.join(UPLOAD_ROOT, ruta_relativa)
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    with open(destino, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return destino


def obtener_archivo(ruta_relativa: str) -> str:
    """Devuelve la ruta absoluta local del archivo para servirlo."""
    return os.path.join(UPLOAD_ROOT, ruta_relativa)
