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
