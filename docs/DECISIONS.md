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

---

## 2026-10-28 — Phase 4 : Guichet Unique

### Architecture

- **Logique métier en modules TypeScript purs**, sans dépendance au DOM :
  - `lib/store.ts` : persistance ;
  - `lib/events-bus.ts` : bus CloudEvents ;
  - `lib/extraction.ts` : extraction simulée ;
  - `lib/rules.ts` : sous-démarches, pièces requises et contrôles ;
  - `lib/annuaire.ts` : structures fictives ;
  - `lib/dates-client.ts` : dates au format AAAA-MM-JJ côté navigateur.
- **Interface** : la page `agir/organiser-un-evenement/` rend tout le balisage au build, avec les composants du design system. Le Web Component `<vg-guichet>` (`components/islands/guichet/guichet.ts`) gère les étapes, la validation, le brouillon, l'extraction et le dépôt.
- **Données transmises au script** : un bloc `<script type="application/json">` contient les lieux, les packs et l'agenda existant, réduit au titre, au lieu et aux dates.
- **Bus d'événements avancé d'une phase** : `lib/events-bus.ts` est créé dès la phase 4, car le dépôt doit publier sur le bus (brief § 7.1). Son affichage reste prévu pour la phase 6 (`/demo/coulisses/`).

### Sans JavaScript

Le parcours ne fonctionne qu'avec JavaScript : tout est simulé dans le navigateur, sans serveur. Sans JavaScript, une alerte l'explique et le formulaire reste masqué. Le brief n'exige la lisibilité sans JavaScript que pour les pages de contenu.

### Formulaire en 5 étapes

- **Une étape à la fois.** Le stepper est mis à jour (`aria-current="step"`, état textuel masqué), ainsi que le titre de la page (« Étape 2 sur 5 : Événement — … »). Le focus passe sur le titre `h2` de l'étape.
- **Validation à chaque « Continuer ».**
  - Les erreurs sont reliées à leur champ par `aria-describedby`, avec `aria-invalid` sur le champ.
  - Un **résumé d'erreurs** reçoit le focus. Ses liens mènent au champ concerné, en changeant d'étape si besoin (cas d'une erreur détectée au récapitulatif).
- **Étape 1, connexion simulée** : un clic, compte « Alex Moreau (compte fictif) ». Le choix d'une structure pré-remplit les champs depuis l'annuaire (RNA en W000…, préfixe qui ne correspond à aucun département ; adresses en `.example`).
- **Étape 2, conflit de lieu (EXF-GU-04)** : il est **détecté dès la saisie**, avec 3 dates libres proches (au moins 30 jours plus tard) et les lieux libres du même type. Le conflit bloque le passage à l'étape suivante.
- **Étape 3, sous-démarches** : l'encart « Ce dossier comprend » (`aria-live="polite"`) se met à jour en direct. L'occupation du domaine public s'ajoute automatiquement pour un lieu de l'espace public. Les packs de matériel ne sont demandés que si « Du matériel municipal » est coché.
- **Étape 4, pièces requises** : statuts et assurance dans tous les cas, plus un plan d'implantation pour l'espace public, les structures ou une fermeture de voie.
- **Étape 5, contrôles de `lib/rules.ts`** : complétude, validité des pièces, conflit de lieu, délai de 30 jours. Une **erreur bloque le dépôt**. Une pièce « à vérifier » ou « vérification manuelle » donne seulement un avertissement : l'agent la contrôlera (CDC § 7.1, « automatiser l'instruction, jamais la décision »).
- **Délai minimum** : il est contrôlé au récapitulatif. Le lien du résumé ramène à la date de l'étape 2.

### Extraction simulée

- **Type de pièce** : déduit du nom normalisé (sans accents, en minuscules).
- **Score de confiance** : hachage FNV-1a du nom, ramené entre 0,55 et 0,99, et plafonné à 0,60 pour une pièce non reconnue. Le même nom donne toujours le même résultat.
- **Seuils du CDC** : ≥ 0,90 pré-validé, de 0,70 à 0,89 à vérifier, < 0,70 vérification manuelle (aucune valeur pré-remplie).
- **Scénario de démonstration** : un nom contenant « expire » donne une assurance périmée de 15 jours. Cela bloque l'étape 4, publie `piece.non_conforme`, et affiche un message de régularisation qui nomme la pièce, la période et l'action à faire.
- **Animation d'analyse** : 1,4 s, avec un indicateur rotatif supprimé en mouvement réduit. Le délai d'attente est conservé, mais le texte « Analyse en cours » reste affiché.
- **Remplacement d'un fichier pendant son analyse** : un jeton annule l'analyse précédente, qui ne peut plus écraser la nouvelle.
- **Pièce inattendue** : si le fichier ressemble à un autre type de pièce, un avertissement le signale.

### Brouillon

Il est sauvegardé à chaque saisie dans `vg:guichet:brouillon` : étape, connexion, valeurs et résultats d'extraction. Les fichiers eux-mêmes ne sont jamais stockés. À la reprise, un message en `role="status"` l'annonce et propose de recommencer. Le brouillon est supprimé au dépôt.

### Dépôt

- **Dossier fictif** : numéro `GU-AAAA-nnnnnn`, statut « En instruction », chronologie prévisionnelle (dépôt, contrôles, avis des services à J+3, décision à J+6 par un agent, publication dans l'agenda, événement). Il est enregistré dans `vg:dossiers` pour « Mon compte » (phase 6).
- **Événements publiés** :
  - à l'extraction, `piece.extraite` et, le cas échéant, `piece.non_conforme` ;
  - au dépôt, `dossier.depose`, un `avis.requis` par service consulté et `materiel.prereservation_demandee` si des packs sont demandés.
- **Contenu des événements** : identifiants et statuts uniquement (minimisation, CDC § 7.6).

### Catalogue des démarches

`/agir/` propose une recherche instantanée côté client, insensible aux accents et à la casse, reflétée dans l'URL (`?q=`). Elle couvre le titre, le résumé et la catégorie. Sans JavaScript, le champ reste masqué et la liste complète est affichée.

Pagefind reste réservé à une recherche transversale. Pour 10 démarches, un filtre local est plus rapide et plus léger.

Les démarches absentes du démonstrateur portent un badge « Hors démonstration » ou « Sur rendez-vous en mairie ».

### Tests

`tests/parcours-guichet.spec.ts` couvre :

- le parcours nominal jusqu'au dépôt, avec vérification du bus et du stockage ;
- la pièce expirée, puis sa régularisation ;
- le conflit de date et de lieu, avec les alternatives proposées et le lien du résumé ;
- le délai trop court ;
- la restauration du brouillon ;
- la recherche dans le catalogue ;
- un audit axe à 5 états du parcours : erreurs, packs, pièce expirée, récapitulatif, confirmation.

---

## 2026-10-28 — Phase 5 : Régie partagée

### Modules

- `lib/availability.ts` (pur, sans DOM) regroupe les calculs de la Régie :
  - **Disponibilités** : quantité en parc moins le **pic jour par jour** des réservations qui chevauchent la période. Ce calcul est plus juste qu'une simple somme : deux réservations successives ne se cumulent pas.
  - **Packs** : nombre de packs complets disponibles, limité par le composant le plus rare.
  - **Périodes alternatives** : les 3 périodes de même durée les plus proches où la quantité demandée est libre.
  - **Puissance** : puissance totale appelée par le matériel, et puissance apportée par un groupe électrogène loué.
  - **Devis** : selon la grille tarifaire par profil et la prestation choisie.
- `lib/regie-data.ts` prépare au build les données transmises aux scripts : matériel, packs, réservations et lieux, avec la puissance des sites en watts.
- `components/islands/regie-client.ts` lit ces données et y **ajoute les réservations confirmées dans la démonstration** (`vg:reservations`). Une réservation confirmée réduit donc les disponibilités du catalogue et du parcours.
- `components/islands/form-kit.ts` factorise ce que le Guichet et la Régie partagent : échappement, icônes, badges, erreurs de champ, résumé d'erreurs, stepper. Le Guichet a été adapté, sans régression (ses 8 tests passent).

### Règles

- **Hors service** : un article dont la vérification réglementaire est dépassée (échéance antérieure à aujourd'hui) n'est pas réservable. Il en va de même pour un pack qui le contient (« Scène 6 × 4 m »). Le motif est affiché, conformément à l'exigence EXF-REG-22.
- **Quantité indisponible** : une alerte en `aria-live` donne la quantité disponible et propose des périodes alternatives, ainsi qu'un bouton « Réserver les N disponibles ». Si la quantité demandée dépasse le parc entier, le message le dit. L'événement `materiel.indisponible` est publié une seule fois par demande.
- **Contrôle de l'étape 2** : il porte sur les **quantités totales développées**, articles et packs réunis, et non ligne par ligne.
- **Contrôle électrique** :
  - Il ne s'applique qu'aux **sites équipés de l'espace public**. La capacité d'un site est la somme de ses alimentations (1 kVA compté pour 1 kW). Pour une salle, la vérification relève de la régie du lieu ; pour un « autre lieu », un message recommande une alimentation adaptée.
  - Une jauge `<meter>` montre la puissance demandée face à la capacité.
  - Un dépassement est **bloquant**, avec un message explicite. Ajouter un groupe électrogène de 20 kVA lève le blocage.
- **Technicien obligatoire** : si une référence est prêtée avec un technicien, la prestation « technicien présent » est exigée.
- **Montant** : prix par jour du profil × quantité × nombre de jours (bornes incluses), plus la prestation (forfait ou prix par jour pour le technicien). Le service municipal ne paie ni le prêt ni la prestation, et ne verse pas de caution (gratuité délibérée).
- **Durée de prêt** : limitée à 31 jours.

### Parcours en 4 étapes

1. Période et lieu.
2. Matériel, filtré sur la disponibilité réelle de la période.
3. Prestation et demandeur.
4. Récapitulatif avec devis.

La confirmation crée une réservation `RP-AAAA-nnnnnn`, publie `reservation.confirmee` et affiche une **convention de prêt en HTML imprimable** : parties, articles, matériel et montant, caution, signatures. Une feuille `@media print` masque l'en-tête, le pied de page, l'encart et les boutons, mais conserve le bandeau de démonstration.

### Panier

Le panier (`vg:regie:panier`) est partagé entre la fiche matériel (« Ajouter au panier ») et le parcours, qui le reprend : période et quantités. Il est vidé à la confirmation. L'encart « Votre panier » est mis à jour en direct.

### Catalogue et fiche

- **Catalogue** : filtres par famille et par période, et option « disponible uniquement », reflétés dans l'URL. Sans JavaScript, le catalogue complet reste affiché. Sans période choisie, les cartes indiquent « Réservable » : un nouvel état de `MaterielCard`, qui évite d'afficher « Disponible » sans période de référence.
- **Fiche** : caractéristiques, tarifs par profil, alertes de vérification (dépassée ou dans moins de 30 jours) et 3 calendriers mensuels calculés au build.
- **Calendrier** : nouvel état « Passé » pour les jours antérieurs au build (prop `from`). Ces jours sont exclus du tableau équivalent.

### Tests

`tests/parcours-regie.spec.ts` couvre :

- le parcours nominal, avec un devis vérifié à l'euro près (236 € et 1 100 € de caution), la convention, le bus et le stockage ;
- l'**indisponibilité** : fenêtre où l'enceinte est entièrement réservée, alternatives, pack concerné, `materiel.indisponible` ;
- le **dépassement électrique** sur l'esplanade de la Gare (13,6 kW pour 12 kW), levé par un groupe électrogène, puis l'exigence d'un technicien ;
- l'article et le pack hors service ;
- le catalogue filtré par famille et par période ;
- la fiche avec ajout au panier repris dans la réservation ;
- un audit axe à 4 états du parcours.

---

## 2026-10-28 — Phase 6 : Coulisses et Mon compte

### Coulisses (`/demo/coulisses/`, non indexée)

- **Journal du bus** : du plus récent au plus ancien (`<ol reversed>`). Chaque entrée affiche :
  - l'horodatage (heure de Paris), le type en code et le sujet (numéro de dossier ou de réservation) ;
  - un **résumé en français** généré par `lib/bus-pedagogie.ts` ;
  - une ligne « En production » (destinataires et contrôle humain) ;
  - la **charge utile CloudEvents complète** dans un `<details>`. Le `<pre>` est focalisable pour défiler au clavier.
- **Filtre par type** : le compteur indique « n sur N ».
- **Tableaux** des dossiers déposés et des réservations confirmées.
- **Tableau « Les automatismes et le contrôle humain »** pour les 7 types du brief : émetteur, destinataires, ce qui se passerait en production, contrôle humain. Il est rendu au build et reste lisible sans JavaScript.
- **Réinitialisation en deux temps** (« Oui, réinitialiser » ou « Annuler »), sans `confirm()` natif. Le focus est géré et le résultat annoncé dans une région `role="status"`. Elle efface le bus, les dossiers, les réservations, le brouillon et le panier.
- **Mise à jour automatique** : l'événement `storage` rafraîchit l'affichage quand un parcours est mené dans un autre onglet.
- **Lien externe** : la mention de CloudEvents renvoie vers cloudevents.io. C'est un simple lien, sans aucune requête au chargement.

### Mon compte (`/mon-compte/`, non indexée)

- **Tableau de bord simulé** du compte fictif d'Alex Moreau :
  - « En cours » : brouillon du Guichet et panier de la Régie, avec un lien pour reprendre ;
  - « Mes dossiers » : statut, prochaine étape de la chronologie prévisionnelle, démarches incluses ;
  - « Mes réservations » : confirmée, matériel sorti ou terminée selon la date, montant et caution ;
  - « Mes billets » : un état vide qui renvoie au lot 4.
- **Pas de seconde connexion simulée** : la page présente directement le compte de démonstration. L'avertissement du chapeau et le bandeau permanent suffisent à l'identifier comme fictif.

### Tests

- `tests/helpers.ts` regroupe `dateIn`, `pdf`, `deposerDossier` et `reserverMateriel`. Les fichiers de tests du Guichet et de la Régie l'utilisent aussi.
- `tests/coulisses.spec.ts` couvre :
  - l'état vide ;
  - les **événements des phases 4 et 5 dans le journal**, à partir d'un dépôt de dossier et d'une réservation réels : résumés, charge utile, ordre, filtre, tableaux ;
  - la même information dans Mon compte ;
  - la réinitialisation, annulation comprise ;
  - le brouillon signalé dans Mon compte ;
  - un audit axe des deux pages remplies.
