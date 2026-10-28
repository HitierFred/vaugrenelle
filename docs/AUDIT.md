# Audits

Résultats datés des audits du démonstrateur, mesurés sur le **site déployé** (GitHub Pages, fichiers compressés) : https://hitierfred.github.io/vaugrenelle/

Date des mesures : **28 octobre 2026**, après la refonte institutionnelle (DM Serif Display, photos de la ville en AVIF, rubrique Habiter).

## Synthèse des critères du brief (§ 8)

| Domaine         | Critère                                                                           | Résultat                                                                                         | Statut                    |
| --------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------- |
| Build           | `npm run build` et `astro check` sans erreur ni avertissement                     | 0 erreur, 0 avertissement (88 pages)                                                             | ✅                        |
| Accessibilité   | 0 violation axe-core critique ou sérieuse                                         | **0 violation, tous niveaux confondus**, sur 24 audits (21 pages et les parcours à chaque étape) | ✅                        |
| Accessibilité   | Navigation au clavier, ordre de focus logique, focus visible                      | Testé automatiquement sur 21 pages (40 tabulations par page) ; procédure manuelle ci-dessous     | ✅ automatique, ⏳ manuel |
| Accessibilité   | Un seul `h1`, `lang="fr"`, `title` unique                                         | Vérifié sur les 88 pages construites                                                             | ✅                        |
| Accessibilité   | Libellés visibles, erreurs reliées, résumé focalisé                               | Tests Guichet et Régie                                                                           | ✅                        |
| Sans JavaScript | Pages de contenu lisibles et navigables                                           | 9 pages testées sans JavaScript                                                                  | ✅                        |
| Poids           | Médiane < 500 Ko, aucune page > 1 Mo                                              | Médiane **77,4 Ko**, maximum **336,9 Ko**                                                        | ✅                        |
| Requêtes        | < 25 par page                                                                     | Maximum **11**                                                                                   | ✅                        |
| Performance     | Lighthouse mobile : Perf ≥ 95, Accessibilité 100, Bonnes pratiques ≥ 95, SEO ≥ 95 | **99–100 / 100 / 100 / 100** sur les 12 pages P1 mesurées                                        | ✅                        |
| Écoconception   | EcoIndex A ou B sur les pages P1                                                  | **A ou B sur les 23 pages** (18 A, 5 B)                                                          | ✅                        |
| Responsive      | 320 à 1 440 px sans défilement horizontal, zoom 200 %                             | 5 largeurs × 21 pages, plus mise en page à 640 px (zoom 200 % d'un écran de 1 280 px)            | ✅                        |
| Tiers           | 0 requête vers un domaine externe                                                 | Vérifié sur chaque page                                                                          | ✅                        |

## Lighthouse (mobile, réglages par défaut, Lighthouse 13.6.0)

| Page            | Performance | Accessibilité | Bonnes pratiques | SEO | LCP   | TBT  | CLS   |
| --------------- | ----------- | ------------- | ---------------- | --- | ----- | ---- | ----- |
| accueil         | 100         | 100           | 100              | 100 | 1,0 s | 0 ms | 0,002 |
| agenda          | 100         | 100           | 100              | 100 | 0,8 s | 0 ms | 0,002 |
| fiche-evenement | 100         | 100           | 100              | 100 | 0,8 s | 0 ms | 0,002 |
| festival        | 100         | 100           | 100              | 100 | 1,0 s | 0 ms | 0,002 |
| demarches       | 100         | 100           | 100              | 100 | 0,8 s | 0 ms | 0,002 |
| guichet         | 100         | 100           | 100              | 100 | 0,9 s | 0 ms | 0,002 |
| regie           | 100         | 100           | 100              | 100 | 0,8 s | 0 ms | 0,002 |
| catalogue       | 100         | 100           | 100              | 100 | 0,8 s | 0 ms | 0,034 |
| fiche-materiel  | 100         | 100           | 100              | 100 | 0,8 s | 0 ms | 0,006 |
| reserver        | 100         | 100           | 100              | 100 | 0,9 s | 0 ms | 0,004 |
| coulisses       | 100         | 100           | 100              | 100 | 0,8 s | 0 ms | 0,019 |
| a-propos        | 100         | 100           | 100              | 100 | 0,8 s | 0 ms | 0,002 |

## Poids, requêtes et EcoIndex

Mesure par Playwright (profil Pixel 7, cache désactivé) : octets transférés et requêtes jusqu'au repos du réseau. L'EcoIndex est calculé avec la **formule ouverte de GreenIT** (ecoindex.fr) : taille du DOM hors descendants SVG, nombre de requêtes et poids, comparés aux quantiles de référence. Script : `tests/audit/mesures.spec.ts`, commande `npx playwright test -c playwright.audit.config.ts`.

| Page                          | Chemin                                    | Requêtes | Poids transféré | Éléments du DOM | EcoIndex | Note  |
| ----------------------------- | ----------------------------------------- | -------- | --------------- | --------------- | -------- | ----- |
| Accueil                       | `/`                                       | 4        | 45,5 Ko         | 222             | 87       | **A** |
| Agenda                        | `/sortir/agenda/`                         | 4        | 47,7 Ko         | 426             | 79       | **B** |
| Fiche événement payant        | `/sortir/agenda/hauts-vols/`              | 4        | 44,7 Ko         | 143             | 90       | **A** |
| Fiche événement du festival   | `/sortir/agenda/ouverture-des-echappees/` | 4        | 44,4 Ko         | 134             | 90       | **A** |
| Festival                      | `/sortir/festival/`                       | 4        | 47,6 Ko         | 356             | 82       | **A** |
| Catalogue des démarches       | `/agir/`                                  | 4        | 46 Ko           | 232             | 87       | **A** |
| Organiser un événement        | `/agir/organiser-un-evenement/`           | 7        | 59,3 Ko         | 308             | 84       | **A** |
| Régie partagée                | `/regie/`                                 | 4        | 44,9 Ko         | 175             | 89       | **A** |
| Catalogue du matériel         | `/regie/catalogue/`                       | 8        | 53 Ko           | 488             | 76       | **B** |
| Fiche matériel                | `/regie/catalogue/enceinte-amplifiee-12/` | 8        | 52,7 Ko         | 552             | 73       | **B** |
| Réserver du matériel          | `/regie/reserver/`                        | 9        | 60,8 Ko         | 462             | 77       | **B** |
| Coulisses                     | `/demo/coulisses/`                        | 7        | 52 Ko           | 191             | 88       | **A** |
| Mon compte                    | `/mon-compte/`                            | 6        | 47,5 Ko         | 107             | 91       | **A** |
| À propos du projet            | `/a-propos-du-projet/`                    | 4        | 46,6 Ko         | 237             | 87       | **A** |
| Accessibilité                 | `/accessibilite/`                         | 4        | 44,9 Ko         | 118             | 91       | **A** |
| Écoconception                 | `/ecoconception/`                         | 4        | 44,4 Ko         | 127             | 90       | **A** |
| Algorithmes publics           | `/algorithmes-publics/`                   | 4        | 45,5 Ko         | 168             | 89       | **A** |
| Mentions légales              | `/mentions-legales/`                      | 4        | 44,3 Ko         | 111             | 91       | **A** |
| Plan du site                  | `/plan-du-site/`                          | 4        | 45,4 Ko         | 288             | 85       | **A** |
| Composants du design system   | `/demo/composants/`                       | 5        | 49,7 Ko         | 617             | 71       | **B** |
| Contrôle des données fictives | `/demo/donnees/`                          | 4        | 44,5 Ko         | 258             | 86       | **A** |

## Corrections apportées pendant l'audit

| Constat                                                                                                                                                                                                          | Correction                                                                                                                                                                                           | Effet                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| EcoIndex **C** sur l'agenda (846 éléments), le catalogue du matériel (743) et la fiche matériel (859)                                                                                                            | Agenda en liste compacte (`EventRow`), catalogue en lignes (`MaterielRow`), calendriers allégés (cases sans conteneur ni icône, cases vides fusionnées, légende unique), chevrons d'accordéon en CSS | Agenda **B** (426), catalogue **B** (488), fiche **B** (552) |
| Lighthouse : décalage de mise en page (CLS 0,376 sur le catalogue, 0,347 sur les coulisses, 0,072 sur la réservation) : les blocs réservés à JavaScript étaient masqués dans le HTML puis affichés par le script | Visibilité décidée en CSS par la classe `js` posée sur `<html>` avant l'affichage (`data-js-only`, `data-nojs`)                                                                                      | CLS ≤ 0,034, Performance 100 partout                         |
| Lighthouse SEO 60 sur les coulisses (page en `noindex`)                                                                                                                                                          | Les coulisses, page P1, deviennent indexables. Les pages de démonstration (composants, données) restent non indexées.                                                                                | SEO 100                                                      |
| Page de démonstration des composants en C (70)                                                                                                                                                                   | Nuanciers et sous-chartes sans éléments superflus                                                                                                                                                    | **B** (71)                                                   |

## Test au clavier

### Vérifications automatisées (`tests/qualite.spec.ts`, `tests/composants.spec.ts`)

- Le lien d'évitement est le premier élément focalisable, visible, et mène au contenu.
- Sur 21 pages, chaque élément atteint par Tab (jusqu'à 40) a un contour de focus visible et une taille non nulle.
- Menu mobile : ouverture, fermeture par Échap, retour du focus au bouton.
- Onglets : flèches, Début, Fin. Formulaires : résumé d'erreurs focalisé, liens vers les champs, y compris d'une étape à l'autre.

### Procédure manuelle (à dérouler par l'auteur)

À dérouler sur chaque page, sans souris, dans Firefox et dans Chrome, puis avec un lecteur d'écran (NVDA ou VoiceOver).

1. **Chargement** : appuyer sur Tab. Le premier élément focalisé est « Aller au contenu », visible à l'écran.
2. **Lien d'évitement** : appuyer sur Entrée. Le focus passe sur `<main>` et la tabulation suivante atteint le premier élément interactif du contenu.
3. **Ordre de focus** : parcourir toute la page avec Tab puis Maj+Tab. L'ordre suit l'ordre visuel et aucun élément masqué ne reçoit le focus.
4. **Focus visible** : chaque élément focalisé porte un contour orange de 3 px, ou orange clair sur fond sombre.
5. **Menu (largeur < 896 px)** : Entrée sur « Menu » ouvre la navigation. Échap la referme et rend le focus au bouton.
6. **Onglets** : Tab entre dans la liste sur l'onglet actif, les flèches changent d'onglet, Début et Fin vont aux extrémités.
7. **Accordéons** : Entrée ou Espace ouvre et ferme le résumé.
8. **Formulaires** : cases et boutons radio à l'Espace, flèches dans un groupe radio, sélecteur de fichier à l'Entrée.
9. **Résumé d'erreurs** : Entrée sur un lien amène le focus sur le champ concerné.
10. **Zoom à 200 %** : refaire les étapes 1 à 5. Aucun contenu tronqué.

| Date                     | Page | Navigateur ou lecteur d'écran | Résultat | Remarques |
| ------------------------ | ---- | ----------------------------- | -------- | --------- |
| _à remplir par l'auteur_ |      |                               |          |           |

## Limites de l'audit

- Les contrôles automatiques (axe, Lighthouse) couvrent une partie seulement des critères RGAA. Un audit RGAA complet et des tests avec des personnes en situation de handicap restent nécessaires : la déclaration d'accessibilité indique donc « non conforme ».
- L'EcoIndex est calculé localement avec la formule publique, et non par le service en ligne ecoindex.fr. Les valeurs peuvent différer légèrement.
- Les mesures sont faites depuis un poste de développement, avec la simulation mobile de Lighthouse : elles varient de quelques points d'une exécution à l'autre.
