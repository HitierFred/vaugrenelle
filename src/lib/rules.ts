// Règles du Guichet Unique : sous-démarches induites, pièces requises,
// contrôles de complétude, de conflit et de délai (CDC § 7.3 et 7.4).
// Chaque contrôle produit un motif lisible (principe d'explicabilité).
import { addDaysIso, daysBetween, formatIso } from './dates-client';
import type { ExtractionResult, PieceType } from './extraction';

export const DELAI_MINIMUM_JOURS = 30;

export interface Besoins {
  son: boolean;
  buvette: boolean;
  voie: boolean;
  structures: boolean;
  materiel: boolean;
}

export interface SousDemarche {
  id: string;
  titre: string;
  service: string;
  avis: boolean; // nécessite un avis motivé d'un service
}

export function sousDemarches(besoins: Besoins, espacePublic: boolean): SousDemarche[] {
  const list: SousDemarche[] = [
    {
      id: 'declaration',
      titre: 'Déclaration de manifestation',
      service: 'Service événements',
      avis: false,
    },
  ];
  if (espacePublic)
    list.push({
      id: 'occupation',
      titre: "Autorisation d'occupation du domaine public",
      service: 'Service du domaine public',
      avis: false,
    });
  if (besoins.son)
    list.push({
      id: 'son',
      titre: 'Déclaration de diffusion sonore',
      service: 'Service hygiène et santé',
      avis: true,
    });
  if (besoins.buvette)
    list.push({
      id: 'buvette',
      titre: 'Autorisation de débit de boissons temporaire',
      service: 'Police municipale',
      avis: true,
    });
  if (besoins.voie)
    list.push({
      id: 'voie',
      titre: 'Arrêté de circulation et de stationnement',
      service: 'Service voirie',
      avis: true,
    });
  if (besoins.structures)
    list.push({
      id: 'structures',
      titre: 'Avis sur les structures provisoires',
      service: 'Référent sécurité',
      avis: true,
    });
  if (besoins.materiel)
    list.push({
      id: 'materiel',
      titre: 'Pré-réservation de matériel',
      service: 'Régie partagée',
      avis: false,
    });
  return list;
}

export interface PieceRequise {
  slot: 'statuts' | 'assurance' | 'plan';
  type: PieceType;
  label: string;
  raison: string;
}

export function piecesRequises(besoins: Besoins, espacePublic: boolean): PieceRequise[] {
  const list: PieceRequise[] = [
    {
      slot: 'statuts',
      type: 'statuts',
      label: "Statuts de l'association",
      raison: 'Pour tout dossier',
    },
    {
      slot: 'assurance',
      type: 'assurance',
      label: "Attestation d'assurance responsabilité civile",
      raison: "Elle doit couvrir la date de l'événement",
    },
  ];
  if (espacePublic || besoins.structures || besoins.voie)
    list.push({
      slot: 'plan',
      type: 'plan',
      label: "Plan d'implantation",
      raison: espacePublic
        ? "L'événement a lieu dans l'espace public"
        : 'Structures ou fermeture de voie',
    });
  return list;
}

export interface AgendaItem {
  titre: string;
  lieu: string;
  debut: string; // AAAA-MM-JJ
  fin: string;
}

export interface Conflit {
  titre: string;
  jour: string;
}

/** Événements existants sur le même lieu, aux mêmes jours */
export function conflits(
  lieu: string,
  debut: string,
  fin: string,
  agenda: AgendaItem[],
): Conflit[] {
  return agenda
    .filter((e) => e.lieu === lieu && e.debut <= fin && e.fin >= debut)
    .map((e) => ({ titre: e.titre, jour: e.debut }));
}

/** Dates libres les plus proches (même durée), à partir du délai minimum */
export function datesAlternatives(
  lieu: string,
  debut: string,
  fin: string,
  agenda: AgendaItem[],
  today: string,
  count = 3,
): string[] {
  const duree = Math.max(0, daysBetween(debut, fin));
  const min = addDaysIso(today, DELAI_MINIMUM_JOURS);
  const out: string[] = [];
  for (let offset = 1; offset <= 60 && out.length < count; offset++) {
    for (const sign of [1, -1]) {
      const d = addDaysIso(debut, sign * offset);
      if (d < min || out.includes(d)) continue;
      if (!conflits(lieu, d, addDaysIso(d, duree), agenda).length) out.push(d);
      if (out.length >= count) break;
    }
  }
  return out.sort();
}

/** Lieux libres aux mêmes dates */
export function lieuxAlternatifs(
  lieux: { id: string; nom: string }[],
  current: string,
  debut: string,
  fin: string,
  agenda: AgendaItem[],
): { id: string; nom: string }[] {
  return lieux.filter((l) => l.id !== current && !conflits(l.id, debut, fin, agenda).length);
}

export type CheckStatus = 'ok' | 'erreur' | 'attention';

export interface Controle {
  id: string;
  label: string;
  status: CheckStatus;
  message: string;
  champ?: string; // identifiant du champ à corriger
}

export interface ControleInput {
  lieu: string;
  lieuNom: string;
  debut: string;
  fin: string;
  pieces: Partial<Record<PieceRequise['slot'], ExtractionResult>>;
  requises: PieceRequise[];
  agenda: AgendaItem[];
  today: string;
}

export function controles(input: ControleInput): Controle[] {
  const out: Controle[] = [];

  // Complétude des pièces
  const manquantes = input.requises.filter((p) => !input.pieces[p.slot]);
  const expirees = input.requises.filter((p) => input.pieces[p.slot]?.conformite === 'expiree');
  const aVerifier = input.requises.filter((p) => {
    const r = input.pieces[p.slot];
    return r && r.conformite === 'a-controler';
  });
  if (manquantes.length) {
    out.push({
      id: 'completude',
      label: 'Complétude du dossier',
      status: 'erreur',
      message: `Pièce manquante : ${manquantes.map((p) => p.label).join(', ')}.`,
      champ: `piece-${manquantes[0].slot}`,
    });
  } else {
    out.push({
      id: 'completude',
      label: 'Complétude du dossier',
      status: 'ok',
      message: 'Toutes les pièces demandées sont jointes.',
    });
  }
  for (const p of expirees) {
    out.push({
      id: `validite-${p.slot}`,
      label: `Validité : ${p.label}`,
      status: 'erreur',
      message: `${p.label} : la pièce est expirée. Remplacez-la par une attestation valide à la date de l'événement.`,
      champ: `piece-${p.slot}`,
    });
  }
  if (aVerifier.length) {
    out.push({
      id: 'verification',
      label: 'Vérification par un agent',
      status: 'attention',
      message: `Un agent vérifiera : ${aVerifier.map((p) => p.label).join(', ')}. Cela ne bloque pas le dépôt.`,
    });
  }

  // Conflit de date et de lieu
  const found = conflits(input.lieu, input.debut, input.fin, input.agenda);
  out.push(
    found.length
      ? {
          id: 'conflit',
          label: 'Disponibilité du lieu',
          status: 'erreur',
          message: `${input.lieuNom} est déjà occupé le ${formatIso(found[0].jour)} par « ${found[0].titre} ». Choisissez une autre date ou un autre lieu.`,
          champ: 'evt-debut',
        }
      : {
          id: 'conflit',
          label: 'Disponibilité du lieu',
          status: 'ok',
          message: `${input.lieuNom} est libre à ces dates.`,
        },
  );

  // Délai minimum
  const delai = daysBetween(input.today, input.debut);
  out.push(
    delai < DELAI_MINIMUM_JOURS
      ? {
          id: 'delai',
          label: 'Délai de dépôt',
          status: 'erreur',
          message: `L'événement a lieu dans ${delai} jour${delai > 1 ? 's' : ''}. Le dossier doit être déposé au moins ${DELAI_MINIMUM_JOURS} jours avant, soit pour un événement à partir du ${formatIso(addDaysIso(input.today, DELAI_MINIMUM_JOURS))}.`,
          champ: 'evt-debut',
        }
      : {
          id: 'delai',
          label: 'Délai de dépôt',
          status: 'ok',
          message: `Dépôt ${delai} jours avant l'événement : le délai de ${DELAI_MINIMUM_JOURS} jours est respecté.`,
        },
  );

  return out;
}
