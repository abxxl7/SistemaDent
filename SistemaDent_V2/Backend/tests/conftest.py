import os
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("SECRET_KEY", "clave-de-pruebas")

from datetime import date, timedelta
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base
from app import models


@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    sesion = sessionmaker(bind=engine)()
    yield sesion
    sesion.close()


@pytest.fixture
def proximo_lunes():
    hoy = date.today()
    return hoy + timedelta(days=7 - hoy.weekday())


@pytest.fixture
def paciente(db):
    p = models.Paciente(nombre="Paciente Prueba", documento="1234567",
                        telefono="0981000000", fecha_registro=date.today())
    db.add(p); db.commit()
    return p


@pytest.fixture
def doctor(db):
    d = models.Doctor(nombre="Doctor Prueba", especialidad="Ortodoncia",
                      email="doctor@prueba.com", activo=True)
    db.add(d); db.commit()
    return d
