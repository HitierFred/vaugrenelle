// Routes vérifiées par les tests. Chemins relatifs à la base /vaugrenelle/.
// La liste s'enrichit à chaque phase (routes P1 du brief, § 5).
export const ROUTES: { path: string; name: string }[] = [
  { path: './', name: 'Accueil' },
  { path: 'sortir/agenda/', name: 'Agenda' },
  { path: 'sortir/agenda/hauts-vols/', name: 'Fiche événement payant' },
  { path: 'sortir/agenda/ouverture-des-echappees/', name: 'Fiche événement du festival' },
  { path: 'sortir/festival/', name: 'Festival' },
  { path: 'demo/composants/', name: 'Composants du design system' },
  { path: 'demo/donnees/', name: 'Contrôle des données fictives' },
];
