from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import pacientes, doctores, citas, usuarios

# Crea las tablas en la base de datos al iniciar
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SistemaDent API",
    description="Sistema de Gestión de Citas para Clínica Odontológica — Versión 1.0",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Puerto por defecto de Vite + React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(usuarios.router)
app.include_router(pacientes.router)
app.include_router(doctores.router)
app.include_router(citas.router)

@app.get("/")
def root():
    return {"sistema": "SistemaDent", "version": "1.0.0", "estado": "activo"}
