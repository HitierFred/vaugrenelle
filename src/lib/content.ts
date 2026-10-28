// Accès aux collections datées : convertit les décalages en jours en objets Date.
// Les pages passent toujours par ce module pour les événements, le matériel,
// les réservations et les actualités (règle ESLint dans eslint.config.js).
// Module réservé au build.
import { getCollection, type CollectionEntry } from 'astro:content';
import { festivalDay, fromReference } from './reference-date';

type Dated<C extends 'evenements' | 'materiel' | 'reservations' | 'actualites', Extra> = Omit<
  CollectionEntry<C>,
  'data'
> & { data: CollectionEntry<C>['data'] & Extra };

export type Evenement = Dated<'evenements', { debut: Date; fin: Date; festival: boolean }>;
export type Materiel = Dated<
  'materiel',
  { verification?: { type: string; echeance_jours: number; prochaine_echeance: Date } }
>;
export type Reservation = Dated<'reservations', { debut: Date; fin: Date }>;
export type Actualite = Dated<'actualites', { date: Date }>;

export function toEvenement(entry: CollectionEntry<'evenements'>): Evenement {
  const { quand, heure, duree_min } = entry.data;
  const festival = 'festival_jour' in quand;
  const debut = festival
    ? festivalDay(quand.festival_jour, heure)
    : fromReference(quand.jour, heure);
  const fin = new Date(debut.getTime() + duree_min * 60000);
  return { ...entry, data: { ...entry.data, debut, fin, festival } };
}

/** Événements triés par date de début */
export async function getEvenements(): Promise<Evenement[]> {
  const all = (await getCollection('evenements')).map(toEvenement);
  return all.sort((a, b) => a.data.debut.getTime() - b.data.debut.getTime());
}

export async function getMateriel(): Promise<Materiel[]> {
  return (await getCollection('materiel')).map((entry) => {
    const v = entry.data.verification;
    return {
      ...entry,
      data: {
        ...entry.data,
        verification: v && { ...v, prochaine_echeance: fromReference(v.echeance_jours) },
      },
    };
  });
}

export async function getReservations(): Promise<Reservation[]> {
  return (await getCollection('reservations')).map((entry) => ({
    ...entry,
    data: {
      ...entry.data,
      debut: fromReference(entry.data.jour_debut),
      fin: fromReference(entry.data.jour_fin, '23:59'),
    },
  }));
}

/** Actualités, de la plus récente à la plus ancienne */
export async function getActualites(): Promise<Actualite[]> {
  const all = (await getCollection('actualites')).map((entry) => ({
    ...entry,
    data: { ...entry.data, date: fromReference(entry.data.publie_jour, '09:00') },
  }));
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
