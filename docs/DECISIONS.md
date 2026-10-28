# Journal des décisions techniques

Chaque entrée : date, décision, raison, alternatives écartées. Les écarts volontaires au brief (`CLAUDE.md`) sont signalés **[Écart]**.

---

## 2026-10-28 — Phase 0 : initialisation

### Emplacement du dépôt

Dépôt créé dans `~/Code/vaugrenelle` (disque local). Le dossier d'origine se trouve sur un volume ExFAT, qui ne gère pas les liens symboliques nécessaires à `node_modules/.bin`. `CLAUDE.md` est copié à la racine et le cahier des charges est copié dans `docs/`.

### Déploiement : GitHub Pages

- URL : `https://hitierfred.github.io/vaugrenelle/`.
- Conséquence : `base: '/vaugrenelle'` dans `astro.config.mjs`. **Tous les liens internes et chemins d'assets passent par `import.meta.env.BASE_URL`** et ne sont jamais écrits en dur sous la forme `/…`.
- `trailingSlash: 'always'`, ce qui correspond aux routes du brief (`/sortir/agenda/`).
- Un seul workflow GitHub Actions (`.github/workflows/ci.yml`) : vérifications sur chaque push et chaque PR, puis déploiement sur `main` si tout est vert.
- Netlify a été écarté : il demande un compte tiers de plus, sans gain pour un site statique.

### Node

**[Écart léger]** Le brief impose Node 22 LTS. `.nvmrc` épingle la version 22, utilisée par la CI, et `engines` accepte `>=22.12.0`. En local, l'auteur travaille avec Node 25, qui est compatible.

### Versions épinglées (exactes)

| Paquet                                           | Version            | Rôle                                              |
| ------------------------------------------------ | ------------------ | ------------------------------------------------- |
| astro                                            | 5.18.2             | Framework (brief : Astro 5)                       |
| typescript                                       | 5.9.3              | `@astrojs/check` 0.9 n'accepte pas TypeScript 7   |
| @astrojs/check                                   | 0.9.12             | `astro check`                                     |
| pagefind                                         | 1.5.2              | Recherche statique (indexée après `astro build`)  |
| eslint / typescript-eslint / eslint-plugin-astro | 10.13 / 8.72 / 3.2 | Lint                                              |
| prettier / prettier-plugin-astro                 | 3.9 / 1.1          | Formatage                                         |
| @playwright/test / @axe-core/playwright          | 1.64 / 4.14        | Tests de parcours et d'accessibilité              |
| globals, @eslint/js                              | —                  | Dépendances de configuration ESLint               |
| @types/node                                      | 22.x               | Types de `process.env` (configuration Playwright) |

Tous ces paquets sont sous licence MIT ou Apache-2.0 et ne servent qu'au développement, sauf `astro`. Le site publié ne charge aucun script tiers.

### Avis de sécurité `npm audit` sur Astro 5

`npm audit` signale des avis sur `astro <= 7.3.1` (XSS dans le rendu, server islands, optimisation AVIF, SSRF sur les pages d'erreur), ainsi que sur `sharp`, `esbuild` et `zod` (dépendances transitives). Les correctifs n'existent que dans Astro 7.4.

**Choix : rester sur Astro 5 comme l'impose le brief.** L'exposition est faible ici :

- le site est 100 % statique, sans SSR, sans server islands et sans entrée utilisateur rendue côté serveur ;
- tous les contenus sont rédigés par l'auteur ;
- l'avis `esbuild` ne concerne que le serveur de développement sous Windows.

**Point de vigilance pour la phase 2 (`astro:assets`)** : l'avis AVIF/sharp touche le traitement d'images. Il est sans risque tant que les images sont fournies par l'auteur. À réévaluer, ou migrer vers Astro 7, avant toute mise en production réelle.

### Tests

- `npm test` : tous les tests sauf ceux étiquetés `@a11y`. Le socle vérifie le bandeau démo, `lang="fr"`, un seul `h1`, un `title` et **aucune requête vers un domaine externe**.
- `npm run test:a11y` : axe-core (WCAG 2.2 AA), échec en cas de violation critique ou sérieuse.
- Les routes testées sont listées dans `tests/routes.ts` et s'enrichiront à chaque phase.
- Les tests tournent contre le build (`astro preview`), pas contre le serveur de développement.

### Page d'accueil provisoire

`src/pages/index.astro` contient une page minimale avec le bandeau démo écrit en dur et des styles inline. Elle sera remplacée par les layouts en phase 1, puis par l'accueil en phase 3.

---

## 2026-10-28 — Phase 1 : design system

### Police

Atkinson Hyperlegible 5.3.0 (licence OFL 1.1, licence jointe dans `public/fonts/OFL.txt`). Les deux fichiers woff2 du sous-ensemble latin (400 et 700, 17 Ko chacun) ont été copiés depuis le paquet `@fontsource/atkinson-hyperlegible`, récupéré une fois avec `npm pack`. **Aucune dépendance n'est ajoutée.** Le sous-ensemble latin couvre le français (accents, œ, €, guillemets, espaces fines).

Les `@font-face` sont injectées dans le `<head>` par `BaseLayout`, parce que leur chemin dépend de la base du site. Seule la graisse 400 est préchargée. `font-display: swap` laisse la pile système s'afficher en attendant.

### Couches CSS

`@layer reset, tokens, base, layout, components, utilities;` est déclaré en tête de `tokens.css`. Les styles de composants vivent dans `components.css` (fichier global, mis en cache) et non dans des `<style>` par composant. Exception : la page de vitrine garde ses styles propres.

Piège rencontré : un sélecteur de la couche `layout` ne peut pas masquer un `.btn`, car la couche `components` est prioritaire. Le bouton de menu est donc masqué via son enveloppe `<vg-nav-toggle>`.

### Ajouts aux tokens du brief

- `--c-success-bg`, `--c-warning-bg`, `--c-danger-bg`, `--c-info-bg` : fonds teintés des badges et alertes. Contraste du texte d'état sur ces fonds : de 5,6 à 6,4:1.
- `--c-zone` : couleur de zone. Elle vaut l'accent par défaut et est redéfinie par `.theme-filature`, `.theme-theatre` et `.theme-festival` (prop `theme` de `BaseLayout`).
- `--target-min` (44 px), `--border-w`, `--shadow-card`.
- Deux couleurs hors tokens : `#ffd7c2` (orange clair sur fond encre, 12:1) pour le bandeau et le pied de page, et `#9a3412` pour le survol du bouton primaire (texte blanc à 7,3:1).

Tous les contrastes des tokens du brief ont été vérifiés par calcul : texte ≥ 4,5:1 sur papier et sur surface, bordure de champ à 3,4:1.

### Accessibilité des composants

- **Bandeau démo** : `<section aria-label>`, une région nommée. axe signalait sinon du contenu hors repère.
- **Champs** : libellé, puis aide, puis erreur, puis champ (ordre de lecture). L'aide et l'erreur sont reliées par `aria-describedby`, l'erreur est préfixée « Erreur : » pour les lecteurs d'écran et le champ porte `aria-invalid`.
- **Résumé d'erreurs** : `tabindex="-1"`, il est destiné à recevoir le focus à la soumission (phase 4). Il n'a pas de `role="alert"`, pour éviter une double annonce avec le focus.
- **Alertes** : `role="status"`, ou `role="alert"` pour une erreur, quand l'alerte apparaît après une action. Prop `live={false}` pour un message statique.
- **Onglets** : Web Component `<vg-tabs>`, motif APG avec activation automatique (flèches, Début, Fin). Sans JavaScript, les panneaux restent empilés avec leur titre.
- **Menu mobile** : `<vg-nav-toggle>`, avec `aria-expanded` et fermeture par Échap. Sans JavaScript, la navigation reste visible : la classe `js` est posée sur `<html>` par un script inline.
- **Stepper** : `aria-current="step"`, état textuel masqué visuellement (« terminée », « en cours », « à venir ») et rappel « Étape n sur N ».
- **Calendrier** : vrai `<table>` avec icône, chiffre et libellé dans chaque case, plus une alternative en tableau par période dans un `<details>`.
- **Cartes** : toute la carte est cliquable via un pseudo-élément sur le lien du titre. Un seul lien par carte, donc un seul arrêt de tabulation.

### Indexation

Les pages indexables portent `data-pagefind-body` sur `<main>`. Avec `noindex`, la page reçoit `<meta name="robots" content="noindex, nofollow">` et n'est pas indexée par Pagefind (c'est le cas de `/demo/composants/`).

### Utilitaires TypeScript

- `src/lib/paths.ts` : `url()` préfixe la base et `isInSection()` sert à `aria-current` dans la navigation.
- `src/lib/format.ts` : dates et prix en français, fuseau Europe/Paris.
- `src/components/ui/types.ts` : types partagés. Exporter un type union multi-lignes depuis le frontmatter d'un `.astro` fait échouer le build Vite.

### Avertissements de build connus

`astro build` émet 6 avertissements `[glob-loader] No files found` : Astro crée automatiquement des collections pour les dossiers vides de `src/content/`. Ils disparaîtront en phase 2 avec `src/content.config.ts`. Créer ce fichier maintenant reviendrait à anticiper la phase 2.

### Liens vers des pages futures

L'en-tête et le pied de page pointent vers les routes prévues au § 5 (`/sortir/agenda/`, `/agir/`, `/regie/`…). Ces liens mènent à une 404 jusqu'à la phase concernée.

---

## 2026-10-28 — Phase 2 : données fictives

### Dates relatives à la date du build

Le brief demande des événements « sur les 3 mois à venir à partir de la date du build ». Toutes les dates des contenus sont donc saisies en **décalage de jours** par rapport à une date de référence (`src/lib/reference-date.ts`) :

| Collection   | Champ saisi                                                           | Champs calculés                   |
| ------------ | --------------------------------------------------------------------- | --------------------------------- |
| Événements   | `quand: { jour }` ou `quand: { festival_jour }`, `heure`, `duree_min` | `debut`, `fin`, `festival`        |
| Matériel     | `verification.echeance_jours` (négatif = dépassée)                    | `verification.prochaine_echeance` |
| Réservations | `jour_debut`, `jour_fin`                                              | `debut`, `fin`                    |
| Actualités   | `publie_jour` (négatif)                                               | `date`                            |

- La référence est la date du jour à Paris. `VG_DATE_REFERENCE=AAAA-MM-JJ` la surcharge pour un build reproductible.
- Les heures sont des heures de Paris, avec gestion des changements d'heure.
- **[Écart]** Le champ `festival` du brief n'est pas saisi : il est déduit de `quand.festival_jour`, ce qui rend toute incohérence impossible.

### Conversion à la lecture, pas dans le schéma

Une première version convertissait les dates dans le `transform` Zod. **Problème constaté** : Astro met en cache le résultat des collections (`node_modules/.astro/data-store.json`) tant que les fichiers source ne changent pas. Un build local fait un autre jour aurait donc gardé des dates périmées.

Solution retenue : les schémas gardent les décalages bruts, et `src/lib/content.ts` (`getEvenements()`, `getMateriel()`, `getReservations()`, `getActualites()`) calcule les dates à chaque lecture.

Une règle ESLint (`no-restricted-syntax`) interdit `getCollection`/`getEntry` sur ces quatre collections en dehors de `src/lib/content.ts`. Écarté : invalider le cache via la configuration Astro. C'est inopérant, car l'empreinte de configuration ne couvre pas `vite.define`.

### Festival « Les Échappées »

**[Écart avec le cahier des charges]** Le CDC situe le festival en été, sur 4 jours. Pour respecter le brief (12 événements dans les 3 mois à venir), il dure bien **4 jours, du jeudi au dimanche**, mais il commence le premier jeudi situé au moins 42 jours après la date du build. Il tombe ainsi toujours dans la fenêtre de l'agenda, en laissant 6 semaines d'événements « de saison » avant lui. Les événements hors festival évitent les jours 40 à 52.

### Rebuild hebdomadaire

La CI reconstruit et redéploie le site chaque lundi à 4 h UTC (`schedule` dans `ci.yml`), pour que le site en ligne reste dans sa fenêtre de 3 mois.

### Lieux : 7 au lieu de 6

Le brief liste 6 lieux, mais le CDC (§ 1.2) et la page P2 `/regie/sites-equipes/` parlent de **4 sites équipés** de l'espace public. J'ai ajouté l'**esplanade de la Gare** : elle n'a que 12 kVA, ce qui sert aussi au scénario de dépassement électrique de la phase 5. Les coordonnées sont exprimées dans un repère 1000 × 700, celui de la future carte SVG.

### Identifiants

- Les entrées Markdown (événements, actualités) prennent comme identifiant le nom du fichier, qui sert de `slug`.
- Les entrées JSON (lieux, matériel, packs, démarches, réservations) portent un champ `id`, imposé par le chargeur `file()` d'Astro, qui tient lieu de `slug`.
- Le schéma impose minuscules et tirets.

### Champs ajoutés au brief

- Événements : `duree_min`, nécessaire pour calculer `fin`.
- Démarches : `resume`, pour le catalogue avec recherche ; `categorie` est une énumération.
- Actualités : `rubrique`.
- Matériel : `famille` est une énumération des 6 familles, au lieu d'un texte libre.

### Contrôles d'intégrité au build

Zod valide chaque entrée. Les règles qui croisent les collections sont dans `src/lib/data-checks.ts`, exécuté par la page `/demo/donnees/` (non indexée). **Le build échoue** si un contrôle bloquant n'est pas respecté :

- volumes minimum ;
- événements dans la fenêtre de 3 mois et festival cohérent ;
- références de lieux et de matériel existantes ;
- quantités des packs au plus égales au stock ;
- réservations jamais supérieures au stock un même jour ;
- au moins 2 échéances de vérification proches et 1 dépassée ;
- 4 sites publics alimentés ;
- au moins 3 événements dans les 7 prochains jours.

Le build a été validé avec 8 dates de référence (changements d'heure, passage d'année, année bissextile).

### Scénarios préparés pour les phases suivantes (données seulement)

- **Indisponibilité** : l'enceinte 12 pouces est entièrement réservée pendant le festival (5 + 3 sur 8).
- **Hors service** : le praticable 2 × 1 m a une vérification dépassée de 26 jours, et il figure dans le pack « Scène 6 × 4 m ».
- **Échéances proches** : tour de levage à J+9, palan électrique à J+21.
- **Dépassement électrique** : l'esplanade de la Gare n'a que 12 kVA, et les packs son et lumière, plus le mur LED, dépassent largement cette puissance.

---

## 2026-10-28 — Phase 3 : accueil, agenda, fiches événement, festival

### Agenda filtrable

- **Sans JavaScript**, la liste complète est affichée, groupée par mois. Le formulaire de filtres porte l'attribut `hidden` et n'apparaît qu'avec JavaScript. Un formulaire qui ne filtre rien (site statique, aucun serveur) serait trompeur.
- **Avec JavaScript**, l'élément `<vg-agenda-filters>` filtre les cartes à partir de leurs attributs `data-*` : début, fin, lieu, discipline, gratuité, festival, accessibilité.
- **URL partageable** : les filtres sont sérialisés tels quels depuis le formulaire (`?periode=festival&lieu=parc-brossard&acces=lsf&acces=pmr`) et appliqués au chargement. `history.replaceState` évite d'empiler l'historique à chaque case cochée.
- **Filtre de date** : périodes prédéfinies (aujourd'hui, ce week-end, 7 jours, 30 jours, pendant le festival), plus simples à utiliser qu'une paire de champs de date. Elles sont calculées sur l'horloge du visiteur.
- **Filtre d'accessibilité** : un événement doit cumuler toutes les options cochées (ET logique).
- **Nombre de résultats** : il est annoncé dans une région `role="status"`. À la soumission du formulaire, le focus passe sur ce compteur. Un message s'affiche quand aucun événement ne correspond.
- **Événements terminés** : ils sont masqués côté client, sur l'agenda comme sur l'accueil. Les pages sont générées au build, alors que la reconstruction n'a lieu qu'une fois par semaine.

### Fiche événement

- **Sous-charte** : elle dépend du lieu (La Filature en teal, le Théâtre en plum) ou du festival, qui l'emporte.
- **Réservation simulée** : le bouton « Réserver des places » n'existe que pour un événement payant. Il affiche dans une région `role="status"` qu'aucune place n'a été réservée et que la billetterie relève du lot 4. Il est masqué sans JavaScript.
- **Événement gratuit** : la fiche indique « Entrée libre, sans réservation ».
- **Bus d'événements** : il n'est pas encore utilisé. Il arrive en phase 6, et le brief ne demande pas d'y publier les réservations de billets.

### Festival

- **Programme** : il est présenté en onglets par jour (`<vg-tabs>`). Sans JavaScript, les quatre jours sont empilés avec leur titre.
- **Carte SVG** : c'est un plan schématique dessiné à la main, sans fond cartographique tiers. Il porte `role="img"`, un `<title>` et une `<desc>` qui renvoient à la **liste numérotée équivalente** (nom, adresse, accessibilité, lien vers l'agenda filtré), conformément à l'exigence EXF-AGE-07.
- **Numérotation des sites** : d'ouest en est, à partir des coordonnées.
- **Étiquettes de la carte** : elles sont à droite des repères, ou au-dessus pour la partie est, afin d'éviter les chevauchements.
- **Coordonnées de La Filature, halle A** : déplacées à (680, 300) pour séparer son repère de celui du chapiteau.

### Accueil

- **Ordre des blocs** : alerte festival (statique, `live={false}`), affiche avec accès rapides, « À la une » (festival puis 3 actualités), puis « Les 7 prochains jours ».
- **Accès rapides** : placés dans l'en-tête de la page, où ils sont plus utiles qu'en fin de page.
- **Lien « Agenda et billetterie »** : il mène à l'agenda, car la billetterie relève du lot 4.
- **Visuels** : compositions SVG géométriques (`PosterArt`), sans aucune photo.

### Mises en page

- **Badges** : `white-space: nowrap` est retiré. À 320 px, « Accessible en fauteuil » faisait déborder la page.
- **Programme du festival** : sur petit écran, l'horaire passe au-dessus du titre.
- **Fil d'Ariane** : un élément intermédiaire sans lien (« Sortir & découvrir », qui n'a pas de page) s'affiche en texte simple, sans `aria-current`.

### Libellés partagés

`src/lib/labels.ts` regroupe les libellés des disciplines et de l'accessibilité (court et long), le thème par lieu et la couleur des cartes. Le type `Theme` est déplacé dans `src/layouts/theme.ts`.
