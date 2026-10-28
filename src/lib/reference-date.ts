// Date de référence du démonstrateur : la date du build, en heure de Paris.
// Toutes les dates des contenus fictifs sont exprimées en décalage de jours
// par rapport à elle, pour que la démonstration ne se périme jamais.
// Surcharge possible (builds reproductibles, tests) : VG_DATE_REFERENCE=AAAA-MM-JJ
// Module réservé au build (Node) : ne pas l'importer dans un script client.

const TZ = 'Europe/Paris';

interface YMD {
  y: number;
  m: number; // 1 à 12
  d: number;
}

function parisYMD(date: Date): YMD {
  const [y, m, d] = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ })
    .format(date)
    .split('-')
    .map(Number);
  return { y, m, d };
}

// Décalage horaire de Paris (en minutes) à un instant donné
function parisOffsetMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  return Math.round((asUTC - date.getTime()) / 60000);
}

// Instant correspondant à une date et une heure locales de Paris
function parisInstant(ymd: YMD, hh = 0, mm = 0): Date {
  const guess = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d, hh, mm));
  const offset = parisOffsetMinutes(guess);
  const result = new Date(guess.getTime() - offset * 60000);
  // Second passage pour les changements d'heure
  const offset2 = parisOffsetMinutes(result);
  return offset2 === offset ? result : new Date(guess.getTime() - offset2 * 60000);
}

function addDays(ymd: YMD, days: number): YMD {
  const t = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d + days));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

function readReference(): YMD {
  const raw = typeof process !== 'undefined' ? process.env.VG_DATE_REFERENCE : undefined;
  if (raw) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!match) throw new Error(`VG_DATE_REFERENCE invalide : « ${raw} » (attendu AAAA-MM-JJ)`);
    return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
  }
  return parisYMD(new Date());
}

export const REFERENCE: YMD = readReference();

/** Instant à J + jours, à l'heure de Paris indiquée (« HH:MM », minuit par défaut) */
export function fromReference(days: number, time = '00:00'): Date {
  const [hh, mm] = time.split(':').map(Number);
  return parisInstant(addDays(REFERENCE, days), hh, mm);
}

// Festival « Les Échappées » : 4 jours, du jeudi au dimanche.
// Il commence le premier jeudi situé au moins 42 jours après la référence,
// pour tomber dans la fenêtre de 3 mois de l'agenda.
export const FESTIVAL_DUREE_JOURS = 4;
const refWeekday = new Date(Date.UTC(REFERENCE.y, REFERENCE.m - 1, REFERENCE.d)).getUTCDay();
const THURSDAY = 4;
export const FESTIVAL_DECALAGE = 42 + ((THURSDAY - ((refWeekday + 42) % 7) + 7) % 7);

/** Instant du jour n du festival (1 à 4), à l'heure indiquée */
export function festivalDay(n: number, time = '00:00'): Date {
  return fromReference(FESTIVAL_DECALAGE + n - 1, time);
}

export const FESTIVAL = {
  debut: festivalDay(1),
  fin: fromReference(FESTIVAL_DECALAGE + FESTIVAL_DUREE_JOURS), // minuit après le dernier jour
};

export const REFERENCE_DATE = fromReference(0);
