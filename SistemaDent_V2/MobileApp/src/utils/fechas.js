// Las fechas del backend son "YYYY-MM-DD" (sin zona horaria). Se parsean a mano para evitar
// corrimientos de día que provoca new Date("YYYY-MM-DD") (interpreta UTC).

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const pad = (n) => String(n).padStart(2, '0');

export const toISO = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parse = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const hoyISO = () => toISO(new Date());

export const addMonthsISO = (iso, months) => {
  const d = parse(iso);
  d.setMonth(d.getMonth() + months);
  return toISO(d);
};

export const esFinDeSemana = (iso) => {
  const dow = parse(iso).getDay();
  return dow === 0 || dow === 6;
};

// Todos los sábados y domingos entre dos fechas (inclusive), para deshabilitarlos en el calendario
export const finesDeSemanaEntre = (desdeISO, hastaISO) => {
  const out = [];
  const d = parse(desdeISO);
  const fin = parse(hastaISO);
  while (d <= fin) {
    const dow = d.getDay();
    if (dow === 0 || dow === 6) out.push(toISO(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
};

// "lunes 28 de septiembre"
export const formatFechaLarga = (iso) => {
  const d = parse(iso);
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
};

// "lun 28 sep"
export const formatFechaCorta = (iso) => {
  const d = parse(iso);
  return `${DIAS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`;
};

export const diaDelMes = (iso) => parse(iso).getDate();
export const mesCorto = (iso) => MESES[parse(iso).getMonth()].slice(0, 3);
export const diaSemanaCorto = (iso) => DIAS[parse(iso).getDay()].slice(0, 3);

// "08:45:00" -> "08:45"
export const formatHora = (hora) => hora.slice(0, 5);
