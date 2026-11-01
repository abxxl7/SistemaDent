from datetime import time, timedelta
import pytest
from app import models
from app.reglas_cita import (
    ReglaCita, ValidadorCitas, ReglaHorarioLaboral, ReglaFechaNoPasada,
    ReglaDiaHabil, ReglaPacienteExiste, ReglaDoctorActivo,
    ReglaSinConflictoHorario, ReglaLimiteDiario,
)
from app.excepciones import (
    HorarioFueraDeRangoError, FechaPasadaError, FinDeSemanaError,
    PacienteNoEncontradoError, DoctorNoDisponibleError,
    ConflictoHorarioError, LimiteDiarioError,
)
 
HORARIO = ReglaHorarioLaboral(time(8, 0), time(18, 0))
 
 
def test_horario_dentro_de_rango_es_valido(proximo_lunes):
    HORARIO.validar(None, None, proximo_lunes, time(9, 30))   # no debe lanzar error
 
 
def test_horario_fuera_de_rango_es_rechazado(proximo_lunes):
    with pytest.raises(HorarioFueraDeRangoError) as error:
        HORARIO.validar(None, None, proximo_lunes, time(19, 0))
    assert error.value.codigo_http == 400
 
 
def test_fecha_pasada_es_rechazada(proximo_lunes):
    with pytest.raises(FechaPasadaError):
        ReglaFechaNoPasada().validar(None, None, proximo_lunes - timedelta(days=14), time(9, 30))
 
 
def test_sabado_es_rechazado(proximo_lunes):
    sabado = proximo_lunes + timedelta(days=5)
    with pytest.raises(FinDeSemanaError):
        ReglaDiaHabil().validar(None, None, sabado, time(9, 30))
 
 
def test_paciente_inexistente_devuelve_404(db, doctor, proximo_lunes):
    with pytest.raises(PacienteNoEncontradoError) as error:
        ReglaPacienteExiste(9999).validar(db, doctor.id, proximo_lunes, time(9, 30))
    assert error.value.codigo_http == 404
 
 
def test_doctor_inactivo_es_rechazado(db, doctor, proximo_lunes):
    doctor.activo = False
    db.commit()
    with pytest.raises(DoctorNoDisponibleError):
        ReglaDoctorActivo().validar(db, doctor.id, proximo_lunes, time(9, 30))
 
 
def test_conflicto_de_horario_es_rechazado(db, paciente, doctor, proximo_lunes):
    db.add(models.Cita(paciente_id=paciente.id, doctor_id=doctor.id,
                       fecha=proximo_lunes, hora=time(9, 30),
                       estado=models.EstadoCita.pendiente))
    db.commit()
    with pytest.raises(ConflictoHorarioError):
        ReglaSinConflictoHorario().validar(db, doctor.id, proximo_lunes, time(9, 30))
 
 
def test_cita_cancelada_no_genera_conflicto(db, paciente, doctor, proximo_lunes):
    db.add(models.Cita(paciente_id=paciente.id, doctor_id=doctor.id,
                       fecha=proximo_lunes, hora=time(9, 30),
                       estado=models.EstadoCita.cancelada))
    db.commit()
    ReglaSinConflictoHorario().validar(db, doctor.id, proximo_lunes, time(9, 30))
 
 
def test_limite_diario_alcanzado_es_rechazado(db, paciente, doctor, proximo_lunes):
    for hora in (time(8, 0), time(8, 45)):
        db.add(models.Cita(paciente_id=paciente.id, doctor_id=doctor.id,
                           fecha=proximo_lunes, hora=hora,
                           estado=models.EstadoCita.pendiente))
    db.commit()
    with pytest.raises(LimiteDiarioError):
        ReglaLimiteDiario(2).validar(db, doctor.id, proximo_lunes, time(9, 30))
 
 
def test_limite_es_privado_y_de_solo_lectura():
    regla = ReglaLimiteDiario(9)
    assert regla.limite == 9
    with pytest.raises(AttributeError):
        regla.__limite
 
 
def test_regla_cita_no_se_puede_instanciar():
    with pytest.raises(TypeError):
        ReglaCita("regla abstracta")
 
 
def test_validador_se_detiene_en_la_primera_regla_que_falla(proximo_lunes):
    validador = ValidadorCitas([HORARIO, ReglaFechaNoPasada()])
    fecha_pasada = proximo_lunes - timedelta(days=14)
    # Fallan las dos reglas, pero debe responder la primera de la lista
    with pytest.raises(HorarioFueraDeRangoError):
        validador.validar(None, None, fecha_pasada, time(19, 0))
