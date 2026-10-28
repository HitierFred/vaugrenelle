// Dates au format AAAA-MM-JJ (heure de Paris), utilisables côté navigateur

const TZ = 'Europe/Paris';

export function todayIso(now = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(now);
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  const parse = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((parse(toIso) - parse(fromIso)) / 86_400_000);
}

export function formatIso(iso: string, withWeekday = true): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', {
    ...(withWeekday ? { weekday: 'long' as const } : {}),
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export const isIsoDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
