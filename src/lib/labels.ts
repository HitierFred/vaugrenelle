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

// Couleur d'aplat de chaque discipline (texte encre obligatoire)
export const DISCIPLINE_COULEURS: Record<Discipline, string> = {
  cirque: 'var(--c-orange)',
  'theatre-de-rue': 'var(--c-jaune)',
  musique: 'var(--c-rose)',
  danse: 'var(--c-turquoise)',
  marionnette: 'var(--c-violet)',
  'jeune-public': 'var(--c-vert)',
};

// Nom de l'aplat de chaque discipline, pour les bandeaux de page
export const DISCIPLINE_TONS: Record<
  Discipline,
  'orange' | 'jaune' | 'rose' | 'turquoise' | 'violet' | 'vert'
> = {
  cirque: 'orange',
  'theatre-de-rue': 'jaune',
  musique: 'rose',
  danse: 'turquoise',
  marionnette: 'violet',
  'jeune-public': 'vert',
};

export const eventUrlPath = (id: string) => `/sortir/agenda/${id}/`;
