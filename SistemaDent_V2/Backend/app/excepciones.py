# ──────────────────────────────────────────────
# ERRORES DE NEGOCIO
# Cada uno conserva el código HTTP que devuelve el sistema en ese caso
# ──────────────────────────────────────────────
class ReglaNegocioError(Exception):
    codigo_http = 400

    def __init__(self, mensaje: str):
        super().__init__(mensaje)
        self.mensaje = mensaje

class HorarioFueraDeRangoError(ReglaNegocioError):
    codigo_http = 400

class FechaPasadaError(ReglaNegocioError):
    codigo_http = 400

class FinDeSemanaError(ReglaNegocioError):
    codigo_http = 400

class PacienteNoEncontradoError(ReglaNegocioError):
    codigo_http = 404

class DoctorNoDisponibleError(ReglaNegocioError):
    codigo_http = 404

class ConflictoHorarioError(ReglaNegocioError):
    codigo_http = 400

class LimiteDiarioError(ReglaNegocioError):
    codigo_http = 400

class TransicionInvalidaError(ReglaNegocioError):
    codigo_http = 400
