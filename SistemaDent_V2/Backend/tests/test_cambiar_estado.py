import pytest
from app import models
from app.excepciones import TransicionInvalidaError
 
EstadoCita = models.EstadoCita
 
 
def test_pendiente_puede_pasar_a_confirmada():
    cita = models.Cita(estado=EstadoCita.pendiente)
    cita.cambiar_estado(EstadoCita.confirmada)
    assert cita.estado == EstadoCita.confirmada
 
 
def test_confirmada_puede_pasar_a_completada():
    cita = models.Cita(estado=EstadoCita.confirmada)
    cita.cambiar_estado(EstadoCita.completada)
    assert cita.estado == EstadoCita.completada
 
 
def test_completada_no_puede_volver_a_pendiente():
    cita = models.Cita(estado=EstadoCita.completada)
    with pytest.raises(TransicionInvalidaError):
        cita.cambiar_estado(EstadoCita.pendiente)
    assert cita.estado == EstadoCita.completada   # el estado no cambió
 
 
def test_mensaje_de_transicion_invalida_es_legible():
    cita = models.Cita(estado=EstadoCita.cancelada)
    with pytest.raises(TransicionInvalidaError) as error:
        cita.cambiar_estado(EstadoCita.confirmada)
    assert "'cancelada'" in error.value.mensaje
    assert "EstadoCita." not in error.value.mensaje
