// Libellés français des valeurs codées des données fictives
import type { Accessibilite } from '../components/ui/types';
import type { Theme } from '../layouts/theme';

export const DISCIPLINES = {
  cirque: 'Cirque',
  'theatre-de-rue': 'Théâtre de rue',
  musique: 'Musique',
  danse: 'Danse',
  marionnette: 'Marionnette',
  'jeune-public': 'Jeune public',
} as const;
export type Discipline = keyof typeof DISCIPLINES;

export const ACCESSIBILITE: Record<Accessibilite, { court: string; long: string }> = {
  pmr: { court: 'Accessible en fauteuil', long: 'Accessible aux personnes en fauteuil roulant' },
  lsf: { court: 'Traduit en LSF', long: 'Traduit en langue des signes française (LSF)' },
  audiodescription: { court: 'Audiodécrit', long: 'Audiodescription disponible' },
  'boucle-magnetique': {
    court: 'Boucle magnétique',
    long: 'Boucle magnétique pour les personnes appareillées',
  },
  relax: {
    court: 'Séance relax',
    long: 'Séance relax : on peut bouger, parler et sortir librement',
  },
};

// Sous-charte graphique associée à un lieu
export function themeForLieu(lieuId: string): Theme {
  if (lieuId.startsWith('filature-')) return 'filature';
  if (lieuId === 'theatre-jean-vilar') return 'theatre';
  return 'default';
}

// Teinte de chaque discipline (fond pâle, texte encre)
export const DISCIPLINE_COULEURS: Record<Discipline, string> = {
  cirque: 'var(--t-terre)',
  'theatre-de-rue': 'var(--t-or)',
  musique: 'var(--t-prune)',
  danse: 'var(--t-teal)',
  marionnette: 'var(--t-bleu)',
  'jeune-public': 'var(--t-vert)',
};

// Teinte de chaque discipline, pour les bandeaux de page
export type Ton = 'terre' | 'or' | 'prune' | 'teal' | 'bleu' | 'vert' | 'sable';
export const DISCIPLINE_TONS: Record<Discipline, Ton> = {
  cirque: 'terre',
  'theatre-de-rue': 'or',
  musique: 'prune',
  danse: 'teal',
  marionnette: 'bleu',
  'jeune-public': 'vert',
};

export const eventUrlPath = (id: string) => `/sortir/agenda/${id}/`;
