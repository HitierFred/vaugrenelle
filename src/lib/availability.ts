// Disponibilités du matériel de la Régie (brief § 7.2).
// Disponible sur une période = quantité en parc − pic des réservations
// qui chevauchent la période (jour par jour). Module pur, sans DOM.
import { addDaysIso, daysBetween } from './dates-client';

export type Profil = 'interne' | 'association' | 'commune-agglo' | 'compagnie';

export interface MaterielInfo {
  id: string;
  designation: string;
  famille: string;
  quantite: number;
  puissance_w?: number;
  tarifs: Record<Profil, number>; // prix par jour
  caution: number;
  technicien: boolean;
  echeance?: string; // prochaine vérification réglementaire (AAAA-MM-JJ)
  verification?: string; // type de vérification
}

export interface PackInfo {
  id: string;
  nom: string;
  composition: { materiel: string; quantite: number }[];
}

export interface ReservationInfo {
  materiel: string;
  quantite: number;
  debut: string; // AAAA-MM-JJ
  fin: string;
}

/** Article hors service : vérification réglementaire dépassée (EXF-REG-22) */
export function horsService(m: MaterielInfo, today: string): boolean {
  return !!m.echeance && m.echeance < today;
}

/** Quantité réservée le jour le plus chargé de la période */
export function picReserve(
  id: string,
  debut: string,
  fin: string,
  reservations: ReservationInfo[],
): number {
  const rs = reservations.filter((r) => r.materiel === id && r.debut <= fin && r.fin >= debut);
  if (!rs.length) return 0;
  let pic = 0;
  for (let d = debut; d <= fin; d = addDaysIso(d, 1)) {
    const used = rs.filter((r) => r.debut <= d && r.fin >= d).reduce((s, r) => s + r.quantite, 0);
    pic = Math.max(pic, used);
  }
  return pic;
}

export function disponible(
  m: MaterielInfo,
  debut: string,
  fin: string,
  reservations: ReservationInfo[],
  today: string,
): number {
  if (horsService(m, today)) return 0;
  return Math.max(0, m.quantite - picReserve(m.id, debut, fin, reservations));
}

/** Nombre de packs complets disponibles sur la période */
export function packDisponible(
  p: PackInfo,
  materiel: Map<string, MaterielInfo>,
  debut: string,
  fin: string,
  reservations: ReservationInfo[],
  today: string,
): number {
  return Math.min(
    ...p.composition.map((c) => {
      const m = materiel.get(c.materiel);
      return m ? Math.floor(disponible(m, debut, fin, reservations, today) / c.quantite) : 0;
    }),
  );
}

/** Périodes de même durée, les plus proches, où la quantité voulue est disponible */
export function periodesAlternatives(
  m: MaterielInfo,
  quantite: number,
  debut: string,
  fin: string,
  reservations: ReservationInfo[],
  today: string,
  count = 3,
): { debut: string; fin: string }[] {
  if (horsService(m, today) || quantite > m.quantite) return [];
  const duree = daysBetween(debut, fin);
  const out: { debut: string; fin: string }[] = [];
  for (let offset = 1; offset <= 90 && out.length < count; offset++) {
    for (const sign of [1, -1]) {
      const d = addDaysIso(debut, sign * offset);
      if (d < today) continue;
      const f = addDaysIso(d, duree);
      if (disponible(m, d, f, reservations, today) >= quantite && !out.some((o) => o.debut === d)) {
        out.push({ debut: d, fin: f });
        if (out.length >= count) break;
      }
    }
  }
  return out.sort((a, b) => a.debut.localeCompare(b.debut));
}

export interface Ligne {
  materiel: string;
  quantite: number;
}

/** Développe le panier (articles et packs) en quantités par référence */
export function developper(
  articles: Ligne[],
  packs: { pack: string; quantite: number }[],
  packInfos: Map<string, PackInfo>,
): Map<string, number> {
  const total = new Map<string, number>();
  const add = (id: string, q: number) => total.set(id, (total.get(id) ?? 0) + q);
  for (const a of articles) add(a.materiel, a.quantite);
  for (const p of packs)
    for (const c of packInfos.get(p.pack)?.composition ?? [])
      add(c.materiel, c.quantite * p.quantite);
  return total;
}

/** Puissance totale appelée par le matériel (en watts) */
export function puissanceTotale(
  quantites: Map<string, number>,
  materiel: Map<string, MaterielInfo>,
): number {
  let w = 0;
  for (const [id, q] of quantites) w += (materiel.get(id)?.puissance_w ?? 0) * q;
  return w;
}

// Puissance apportée par un groupe électrogène loué avec le matériel
export const GROUPES: Record<string, number> = { 'groupe-electrogene-20': 20_000 };

export function puissanceGroupes(quantites: Map<string, number>): number {
  let w = 0;
  for (const [id, q] of quantites) w += (GROUPES[id] ?? 0) * q;
  return w;
}

export const PRESTATIONS = {
  retrait: { label: 'Retrait au dépôt de la Régie', prix: 0, parJour: false },
  livraison: { label: 'Livraison et reprise', prix: 80, parJour: false },
  montage: { label: 'Livraison, montage et démontage', prix: 230, parJour: false },
  technicien: { label: 'Livraison, montage et technicien présent', prix: 230 + 250, parJour: true },
} as const;
export type Prestation = keyof typeof PRESTATIONS;

export interface Devis {
  jours: number;
  lignes: {
    materiel: string;
    designation: string;
    quantite: number;
    prixJour: number;
    total: number;
  }[];
  location: number;
  prestation: number;
  total: number;
  caution: number;
}

/** Montant selon la grille tarifaire par profil, et caution */
export function devis(
  quantites: Map<string, number>,
  materiel: Map<string, MaterielInfo>,
  profil: Profil,
  prestation: Prestation,
  debut: string,
  fin: string,
): Devis {
  const jours = daysBetween(debut, fin) + 1;
  const lignes = [...quantites]
    .map(([id, quantite]) => {
      const m = materiel.get(id)!;
      const prixJour = m.tarifs[profil];
      return {
        materiel: id,
        designation: m.designation,
        quantite,
        prixJour,
        total: prixJour * quantite * jours,
      };
    })
    .sort((a, b) => a.designation.localeCompare(b.designation, 'fr'));
  const location = lignes.reduce((s, l) => s + l.total, 0);
  const p = PRESTATIONS[prestation];
  // Gratuité délibérée pour les services municipaux : prestation incluse
  const prestationPrix = profil === 'interne' ? 0 : p.parJour ? p.prix * jours : p.prix;
  const caution =
    profil === 'interne'
      ? 0
      : [...quantites].reduce((s, [id, q]) => s + (materiel.get(id)?.caution ?? 0) * q, 0);
  return {
    jours,
    lignes,
    location,
    prestation: prestationPrix,
    total: location + prestationPrix,
    caution,
  };
}
