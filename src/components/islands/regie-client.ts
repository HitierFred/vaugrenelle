// Accès côté navigateur aux données de la Régie : données du build
// et réservations confirmées dans cette démonstration (stockage local).
import type { ReservationInfo } from '../../lib/availability';
import type { RegieData } from '../../lib/regie-data';
import { KEYS, read } from '../../lib/store';

export interface ReservationConfirmee {
  numero: string;
  confirmeeLe: string;
  debut: string;
  fin: string;
  lieu: string;
  demandeur: string;
  profil: string;
  prestation: string;
  quantites: [string, number][];
  articles: { materiel: string; quantite: number }[];
  packs: { pack: string; quantite: number }[];
  total: number;
  caution: number;
}

export interface Panier {
  debut?: string;
  fin?: string;
  articles: { materiel: string; quantite: number }[];
}

export function readRegieData(root: ParentNode = document): RegieData | null {
  const raw = root.querySelector('[data-regie-data]')?.textContent;
  return raw ? (JSON.parse(raw) as RegieData) : null;
}

/** Réservations du build et réservations confirmées dans cette démonstration */
export function allReservations(data: RegieData): ReservationInfo[] {
  const locales = read<ReservationConfirmee[]>(KEYS.reservations, []).flatMap((r) =>
    r.quantites.map(([materiel, quantite]) => ({ materiel, quantite, debut: r.debut, fin: r.fin })),
  );
  return [...data.reservations, ...locales];
}
