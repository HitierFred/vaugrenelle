// Données de la Régie transmises aux scripts du navigateur (au build).
// Dates en AAAA-MM-JJ, heure de Paris. Module réservé au build.
import { getCollection } from 'astro:content';
import type { MaterielInfo, PackInfo, Profil, ReservationInfo } from './availability';
import { getMateriel, getReservations } from './content';
import { isoDate } from './format';

export interface LieuInfo {
  id: string;
  nom: string;
  espacePublic: boolean;
  puissance_w: number; // somme des alimentations
}

export interface RegieData {
  materiel: MaterielInfo[];
  packs: PackInfo[];
  reservations: ReservationInfo[];
  lieux: LieuInfo[];
}

export const FAMILLES: Record<string, string> = {
  son: 'Son',
  lumiere: 'Lumière',
  video: 'Vidéo',
  structure: 'Structures',
  energie: 'Énergie',
  praticable: 'Praticables',
};

export const PROFILS: Record<Profil, string> = {
  interne: 'Service municipal',
  association: 'Association de Vaugrenelle',
  'commune-agglo': "Commune de l'agglomération",
  compagnie: 'Compagnie accueillie',
};

export async function getRegieData(): Promise<RegieData> {
  const [materiel, packs, reservations, lieux] = await Promise.all([
    getMateriel(),
    getCollection('packs'),
    getReservations(),
    getCollection('lieux'),
  ]);
  return {
    materiel: materiel.map((m) => ({
      id: m.id,
      designation: m.data.designation,
      famille: m.data.famille,
      quantite: m.data.quantite,
      puissance_w: m.data.puissance_w,
      tarifs: Object.fromEntries(m.data.tarifs.map((t) => [t.profil, t.jour])) as Record<
        Profil,
        number
      >,
      caution: m.data.caution,
      technicien: m.data.prestation_technicien_requise,
      echeance: m.data.verification && isoDate(m.data.verification.prochaine_echeance),
      verification: m.data.verification?.type,
    })),
    packs: packs.map((p) => ({
      id: p.id,
      nom: p.data.nom,
      composition: p.data.composition.map((c) => ({
        materiel: c.materiel.id,
        quantite: c.quantite,
      })),
    })),
    reservations: reservations.map((r) => ({
      materiel: r.data.materiel.id,
      quantite: r.data.quantite,
      debut: isoDate(r.data.debut),
      fin: isoDate(r.data.fin),
    })),
    lieux: lieux.map((l) => ({
      id: l.id,
      nom: l.data.nom,
      espacePublic: l.data.type === 'espace-public',
      puissance_w: (l.data.alimentations ?? []).reduce((s, a) => s + a.puissance_kva * 1000, 0),
    })),
  };
}
