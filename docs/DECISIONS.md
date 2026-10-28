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
