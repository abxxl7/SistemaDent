---
name: frontend-design
description: Usar esta skill al crear o modificar cualquier interfaz de SistemaDent (Login, Dashboard, Pacientes, Citas, Doctores, Usuarios). Aplica a componentes React nuevos, rediseño de pantallas existentes, o ajustes de estilo. Cubre paleta de colores, tipografía, animaciones y reglas de legibilidad para un sistema de gestión de citas usado por personal de clínicas odontológicas sin perfil técnico.
---

# Diseño de interfaz — SistemaDent

## Contexto del producto
Sistema de gestión de citas para clínicas odontológicas pequeñas y medianas en Paraguay. El usuario final NO es técnico — es la recepcionista, el doctor o el administrador de la clínica, muchas veces con pacientes esperando. Cada pantalla prioriza velocidad de lectura y claridad sobre estética pura.

## Estado actual (punto de partida)
El sistema ya tiene una base sólida: sidebar azul oscuro fijo (`#1B3A6B`), cards de estadísticas en el dashboard, tablas con badges de estado por color. Esta skill busca refinar esa base, no reinventarla desde cero.

## Tono visual objetivo
- Limpio, profesional y confiable — coherente con un contexto de salud
- Fácil de entender de un vistazo: jerarquía visual clara, información crítica (hora de la cita, estado, doctor asignado) siempre visible sin scroll
- **Cero emojis de teclado** (🦷📅✅⚙️ etc.) en la interfaz. Reemplazar por iconografía lineal consistente (lucide-react)
- Nada de gradientes cliché ni combinaciones de color genéricas de diseño hecho por IA

## Paleta (base actual del sistema)
- Azul oscuro (sidebar, acentos principales): `#1B3A6B`
- Azul medio (hover, elementos activos): `#2E5FA3`
- Azul claro (fondos suaves, focus): `#4A90D9` / `#EBF2FC`
- Fondo de contenido: `#F8FAFC`
- Texto principal: `#1E293B`
- Texto secundario/muted: `#94A3B8`
- Estados de cita: pendiente (ámbar `#F59E0B`), confirmada (verde `#10B981`), cancelada (rojo `#EF4444`), completada (azul `#3B82F6`)
- Bordes y separadores: `#E2E8F0`

## Tipografía
- Inter (ya en uso) — alta legibilidad para datos y tablas, números tabulares en horarios y listados
- Jerarquía clara: título de página > label de card (mayúsculas, tracking amplio) > valor numérico grande > texto de ayuda pequeño y muted

## Animaciones — regla dura
- Puramente de percepción, nunca deben esperar datos ni bloquear una acción
- Duración máxima: 150–200ms para micro-interacciones (hover, click, cambio de estado), 300ms para transiciones de pantalla
- Solo `transform` y `opacity` (GPU-accelerated) — nunca animar `width`, `height`, `top/left`
- Prohibido: spinners decorativos largos, confetti, celebraciones tipo consumer app
- Sí usar: transición suave al agendar una cita, feedback de click en botones, aparición suave de modales/mensajes de error, resaltado breve de fila actualizada
- Respetar `prefers-reduced-motion` en toda la app

## Jerarquía de información
- La hora y el estado de la cita son SIEMPRE los elementos más visibles en la lista de citas
- Estados de conflicto de horario, límite de citas alcanzado o errores de validación usan un color de alerta cálido (ámbar/naranja) para advertencias, rojo solo para errores bloqueantes
- Tablas (pacientes, citas, doctores): alineación de horarios a la derecha, zebra striping sutil, sin bordes pesados

## Checklist antes de dar por terminada una pantalla
- ¿Una recepcionista apurada entiende la hora y el estado de una cita en menos de 2 segundos?
- ¿Quedó algún emoji de teclado en vez de ícono lineal?
- ¿Alguna animación agrega más de 200ms de espera a una acción frecuente (agendar, cambiar estado)?
- ¿Se distinguen claramente los 4 estados de cita por color sin necesidad de leer el texto?
- ¿Funciona igual de bien en 1366x768 (notebook de oficina típica) como en pantallas más grandes?