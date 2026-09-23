from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import pacientes, doctores, citas, usuarios, historial

# El esquema de la base de datos ahora lo maneja Alembic (carpeta alembic/),
# no la app al arrancar. Ver Backend/alembic para las migraciones.

app = FastAPI(
    title="SistemaDent API",
    description="Sistema de Gestión de Citas para Clínica Odontológica — Versión 2.0",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "https://sistemadent.vercel.app",
    ],  # Puerto Vite para V2
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(usuarios.router)
app.include_router(pacientes.router)
app.include_router(doctores.router)
app.include_router(citas.router)
app.include_router(historial.router)

@app.get("/")
def root():
    return {"sistema": "SistemaDent", "version": "2.0.0", "estado": "activo"}