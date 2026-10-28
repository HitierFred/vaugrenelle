// Pédagogie du bus d'événements : pour chaque type, ce qui se passerait en
// production (service destinataire, action, contrôle humain), et un résumé
// en français de chaque événement du journal. Module pur, sans DOM.
import { formatIso, isIsoDate } from './dates-client';
import type { BusEventType, CloudEvent } from './events-bus';

export interface Pedagogie {
  titre: string;
  emetteur: string;
  destinataires: string;
  action: string;
  controleHumain: string;
}

export const PEDAGOGIE: Record<BusEventType, Pedagogie> = {
  'dossier.depose': {
    titre: 'Dossier déposé',
    emetteur: 'Guichet Unique',
    destinataires: 'Orchestrateur de workflows, services instructeurs',
    action:
      "L'orchestrateur crée le dossier dans le back-office, calcule les échéances et ouvre une instruction par sous-démarche.",
    controleHumain:
      "Un agent instructeur prend le dossier en charge. Aucune décision n'est automatique.",
  },
  'piece.extraite': {
    titre: 'Pièce analysée',
    emetteur: "Service d'extraction (OCR et classification)",
    destinataires: 'Moteur de règles',
    action:
      'Les champs lus sont confrontés aux règles : validité, correspondance avec la structure, cohérence entre pièces.',
    controleHumain:
      'Sous 0,90 de confiance, un agent vérifie les champs ; sous 0,70, il reprend la pièce entièrement à la main.',
  },
  'piece.non_conforme': {
    titre: 'Pièce non conforme',
    emetteur: 'Moteur de règles',
    destinataires: 'Notification usager, back-office instructeur',
    action:
      "L'usager reçoit une demande de régularisation qui nomme la pièce et le motif. Seul un critère objectif (pièce expirée) la déclenche.",
    controleHumain: "L'usager peut contester auprès d'un agent, qui peut lever le blocage.",
  },
  'avis.requis': {
    titre: 'Avis demandé à un service',
    emetteur: 'Orchestrateur de workflows',
    destinataires: 'Service concerné (police municipale, voirie, référent sécurité…)',
    action:
      'Le service reçoit la demande dans sa file de travail, avec un délai de réponse. Une relance part à J-2, puis une escalade au chef de service.',
    controleHumain: 'Oui : un agent du service rend un avis motivé.',
  },
  'materiel.prereservation_demandee': {
    titre: 'Pré-réservation de matériel',
    emetteur: 'Guichet Unique',
    destinataires: 'Régie partagée',
    action:
      "La Régie bloque le matériel jusqu'à la décision. Il est libéré automatiquement si le dossier est refusé ou expire.",
    controleHumain: 'Le régisseur arbitre en cas de conflit, selon les règles de priorité.',
  },
  'materiel.indisponible': {
    titre: 'Matériel indisponible',
    emetteur: 'Régie partagée',
    destinataires: 'Guichet Unique, notification usager, tableau de bord de la Régie',
    action:
      'La demande non satisfaite est comptée dans les indicateurs de refus pour indisponibilité, qui orientent les achats.',
    controleHumain: 'Le régisseur peut proposer une sous-location ou un prêt intercommunal.',
  },
  'reservation.confirmee': {
    titre: 'Réservation confirmée',
    emetteur: 'Régie partagée',
    destinataires: 'Compte usager, planning de la Régie',
    action:
      'La réservation apparaît dans le compte usager et le planning. Les bons de préparation et la convention à signer sont générés.',
    controleHumain:
      'Aucune sortie de matériel sans convention signée et sans état des lieux au retrait.',
  },
};

const NIVEAUX: Record<string, string> = {
  'pre-valide': 'pré-validée',
  'a-verifier': 'à vérifier par un agent',
  manuel: 'vérification manuelle',
};

const str = (v: unknown) => (typeof v === 'string' ? v : v === undefined ? '' : String(v));
const date = (v: unknown) => (isIsoDate(str(v)) ? formatIso(str(v), false) : str(v));

/** Résumé en français d'un événement du journal */
export function resume(e: CloudEvent): string {
  const d = e.data as Record<string, unknown>;
  switch (e.type) {
    case 'dossier.depose': {
      const n = Array.isArray(d.sous_demarches) ? d.sous_demarches.length : 0;
      return `Le dossier ${str(d.dossier)} est déposé. Il regroupe ${n} démarche${n > 1 ? 's' : ''}.`;
    }
    case 'piece.extraite':
      return `La pièce « ${str(d.piece)} » est lue comme « ${str(d.type)} », avec une confiance de ${Math.round(Number(d.confiance) * 100)} % (${NIVEAUX[str(d.niveau)] ?? str(d.niveau)}).`;
    case 'piece.non_conforme':
      return `La pièce « ${str(d.piece)} » est non conforme : ${str(d.motif) === 'piece_expiree' ? 'elle est expirée' : str(d.motif)}. Une régularisation est demandée.`;
    case 'avis.requis':
      return `L'avis de « ${str(d.service)} » est demandé pour le dossier ${str(d.dossier)}, avant le ${date(d.echeance)}.`;
    case 'materiel.prereservation_demandee': {
      const n = Array.isArray(d.packs) ? d.packs.length : 0;
      return `Le dossier ${str(d.dossier)} demande ${n} pack${n > 1 ? 's' : ''} de matériel, du ${date(d.debut)} au ${date(d.fin)}.`;
    }
    case 'materiel.indisponible':
      return `${str(d.demande)} « ${str(d.reference)} » demandé${Number(d.demande) > 1 ? 's' : ''}, ${str(d.disponible)} disponible${Number(d.disponible) > 1 ? 's' : ''} du ${date(d.debut)} au ${date(d.fin)}.`;
    case 'reservation.confirmee':
      return `La réservation ${str(d.reservation)} est confirmée : ${str(d.references)} référence${Number(d.references) > 1 ? 's' : ''}, du ${date(d.debut)} au ${date(d.fin)}.`;
    default:
      return e.type;
  }
}
