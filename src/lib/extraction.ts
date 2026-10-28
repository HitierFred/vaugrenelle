// Extraction simulée des pièces justificatives (CDC § 7.5).
// Aucun fichier n'est lu ni envoyé : seul son nom est utilisé.
// Le type est déduit du nom, le score de confiance est déterministe (hachage du nom).
import { addDaysIso, formatIso, todayIso } from './dates-client';

export type PieceType =
  | 'assurance'
  | 'statuts'
  | 'recepisse'
  | 'plan'
  | 'fiche-technique'
  | 'kbis'
  | 'rib'
  | 'non-reconnu';

export const PIECE_LABELS: Record<PieceType, string> = {
  assurance: "Attestation d'assurance responsabilité civile",
  statuts: "Statuts d'association",
  recepisse: 'Récépissé de déclaration en préfecture',
  plan: "Plan d'implantation",
  'fiche-technique': 'Fiche technique',
  kbis: 'Extrait Kbis ou avis de situation SIRENE',
  rib: "Relevé d'identité bancaire",
  'non-reconnu': 'Pièce non reconnue',
};

// Seuils du cahier des charges
export const SEUILS = { preValide: 0.9, aVerifier: 0.7 } as const;

export type Niveau = 'pre-valide' | 'a-verifier' | 'manuel';
export type Conformite = 'conforme' | 'expiree' | 'a-controler';

export interface ExtractionResult {
  fileName: string;
  type: PieceType;
  label: string;
  confidence: number; // 0 à 1, deux décimales
  niveau: Niveau;
  conformite: Conformite;
  fields: { libelle: string; valeur: string }[];
  message: string; // motif lisible par l'usager
}

export interface ExtractionContext {
  structure: string;
  dateEvenement?: string; // AAAA-MM-JJ
  today?: string;
}

const PATTERNS: [PieceType, RegExp][] = [
  ['assurance', /assurance|attestation-?rc|responsabilite/],
  ['statuts', /statut/],
  ['recepisse', /recepisse|prefecture/],
  ['plan', /plan|implantation/],
  ['fiche-technique', /fiche-?technique|rider/],
  ['kbis', /kbis|sirene/],
  ['rib', /\brib\b|iban/],
];

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-');

/** Hachage FNV-1a 32 bits : même nom, même résultat */
export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export function classify(fileName: string): PieceType {
  const n = normalize(fileName);
  return PATTERNS.find(([, re]) => re.test(n))?.[0] ?? 'non-reconnu';
}

export function niveauFor(confidence: number): Niveau {
  if (confidence >= SEUILS.preValide) return 'pre-valide';
  if (confidence >= SEUILS.aVerifier) return 'a-verifier';
  return 'manuel';
}

const pick = <T>(list: T[], h: number) => list[h % list.length];
const ASSUREURS = [
  'Mutuelle des Arts et Loisirs (fictive)',
  'Assurances du Pont-Neuf (fictives)',
  'Caisse associative de prévoyance (fictive)',
];

export function extract(fileName: string, ctx: ExtractionContext): ExtractionResult {
  const h = hash(normalize(fileName));
  const type = classify(fileName);
  const today = ctx.today ?? todayIso();
  // Score entre 0,55 et 0,99
  let confidence = Math.round((0.55 + (h % 4500) / 10000) * 100) / 100;
  if (type === 'non-reconnu') confidence = Math.min(confidence, 0.6);
  const niveau = niveauFor(confidence);
  const expired = type === 'assurance' && /expire/.test(normalize(fileName));

  let fields: ExtractionResult['fields'] = [];
  if (niveau !== 'manuel') {
    switch (type) {
      case 'assurance': {
        const debut = addDaysIso(today, -200);
        const fin = expired
          ? addDaysIso(today, -15)
          : addDaysIso(ctx.dateEvenement ?? today, 120 + (h % 60));
        fields = [
          { libelle: 'Assureur', valeur: pick(ASSUREURS, h) },
          { libelle: 'Assuré', valeur: ctx.structure || 'Non lisible' },
          { libelle: 'Numéro de contrat', valeur: `RC-${String(h % 1_000_000).padStart(6, '0')}` },
          {
            libelle: 'Période de validité',
            valeur: `Du ${formatIso(debut, false)} au ${formatIso(fin, false)}`,
          },
          { libelle: 'Plafond de garantie', valeur: `${(2 + (h % 8)).toString()} 000 000 €` },
        ];
        break;
      }
      case 'statuts':
        fields = [
          { libelle: 'Dénomination', valeur: ctx.structure || 'Non lisible' },
          { libelle: 'Siège', valeur: 'Vaugrenelle' },
          {
            libelle: 'Date des statuts',
            valeur: formatIso(addDaysIso(today, -365 * (2 + (h % 10))), false),
          },
        ];
        break;
      case 'plan':
        fields = [
          { libelle: 'Échelle détectée', valeur: h % 2 ? 'Oui (1/200)' : 'Oui (1/500)' },
          { libelle: 'Emprise', valeur: `${200 + (h % 800)} m²` },
          { libelle: 'Issues de secours', valeur: `${2 + (h % 3)} repérées` },
        ];
        break;
      case 'recepisse':
        fields = [
          { libelle: 'Numéro RNA', valeur: `W000${String(h % 1_000_000).padStart(6, '0')}` },
        ];
        break;
      default:
        fields = [{ libelle: 'Document', valeur: PIECE_LABELS[type] }];
    }
  }

  const conformite: Conformite = expired
    ? 'expiree'
    : niveau === 'pre-valide'
      ? 'conforme'
      : 'a-controler';

  let message: string;
  if (expired) {
    const fin = fields.find((f) => f.libelle === 'Période de validité')?.valeur ?? '';
    message = `Cette attestation n'est plus valide (${fin.toLowerCase()}). Demandez une attestation à jour à votre assureur, puis déposez-la ici à la place de celle-ci.`;
  } else if (type === 'non-reconnu') {
    message =
      "Le type de cette pièce n'a pas été reconnu. Un agent la vérifiera à la main : vous pouvez continuer.";
  } else if (niveau === 'pre-valide') {
    message = 'Les informations ont été lues automatiquement et pré-validées.';
  } else if (niveau === 'a-verifier') {
    message = 'Les informations ont été pré-remplies. Un agent les vérifiera avant toute décision.';
  } else {
    message =
      "La lecture automatique n'est pas assez fiable. Aucune valeur n'est pré-remplie : un agent vérifiera la pièce à la main.";
  }

  return {
    fileName,
    type,
    label: PIECE_LABELS[type],
    confidence,
    niveau,
    conformite,
    fields,
    message,
  };
}
