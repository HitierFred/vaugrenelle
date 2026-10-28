# CLAUDE.md — Démonstrateur « Vaugrenelle, la ville comme scène »

> Brief de développement. Ce fichier est lu par Claude Code au début de chaque session. Il fait foi en cas de divergence avec le cahier des charges (`docs/CDC_Portail_Vaugrenelle.md`), qui reste la référence fonctionnelle.

---

## 1. Ce qu'on construit

Un **démonstrateur fonctionnel**, statique et déployable gratuitement, du futur portail de la Ville fictive de Vaugrenelle. Il sert de **pièce de portfolio** : il doit être cliquable, crédible, accessible et sobre, et montrer les parcours clés du cahier des charges avec des données fictives.

**Ce n'est pas** un site de production. Il n'y a ni back-end réel, ni base de données serveur, ni authentification réelle, ni paiement, ni appel à des API publiques réelles. Tous les services externes sont **simulés côté navigateur**.

### Règles non négociables

- Un **bandeau permanent** en haut de chaque page : « Site de démonstration — collectivité fictive. Aucune donnée réelle n'est collectée. »
- **Aucune reprise d'identité officielle** : pas de Marianne, pas de DSFR, pas de logo ni de bouton FranceConnect, pas de logo de ministère. La connexion s'appelle « Connexion simulée (démonstration) ».
- **Aucun formulaire ne transmet de données** : tout reste en mémoire ou en `localStorage`. Pas de `fetch` vers un domaine tiers.
- **Aucun service tiers** : pas de CDN externe, pas de police Google, pas de traceur, pas d'outil d'analytics.
- Les noms de personnes, de compagnies, d'associations et de lieux sont **fictifs**.

---

## 2. Stack imposée

| Élément | Choix | Raison |
|---|---|---|
| Framework | **Astro 5** (sortie `static`) | Pages en HTML statique, JavaScript seulement où c'est utile |
| Langage | **TypeScript** strict | Fiabilité des schémas de données |
| Données | **Content Collections Astro** + fichiers JSON/Markdown dans `src/content/`, validés par **Zod** | Données fictives typées, sans base de données |
| Interactivité | **Web Components en TypeScript vanilla**, chargés en îlots (`<script>` de composant) | Aucun framework front, poids minimal |
| Styles | **CSS natif** : variables, `@layer`, imbrication (nesting), requêtes de conteneur. Pas de Tailwind, pas de préprocesseur. | Sobriété, maîtrise du design system |
| Recherche | **Pagefind** (index généré au build) | Recherche plein texte statique, sans serveur |
| Images | `astro:assets` (sortie AVIF et WebP, dimensions explicites) | Écoconception |
| Polices | **Atkinson Hyperlegible** auto-hébergée (2 graisses, sous-ensemble latin) pour le texte, **Anton** auto-hébergée pour les titres d'affiche, repli sur la pile système | Lisibilité, accessibilité, identité (révision du 28/10/2026) |
| Tests | **Playwright** + **@axe-core/playwright** | Parcours et accessibilité automatisés |
| Qualité | ESLint, Prettier, `astro check` | — |
| Déploiement | **Netlify** ou **GitHub Pages** (au choix de l'auteur) | Gratuit, lien public |
| Node | Version 22 LTS | — |

Aucune dépendance supplémentaire sans le justifier dans `docs/DECISIONS.md` (poids, utilité, licence).

---

## 3. Arborescence du dépôt

```
/
├── CLAUDE.md
├── docs/
│   ├── CDC_Portail_Vaugrenelle.md     ← cahier des charges (référence fonctionnelle)
│   ├── DECISIONS.md                   ← journal des choix techniques
│   └── AUDIT.md                       ← résultats des audits (accessibilité, poids, EcoIndex)
├── public/
│   ├── fonts/                         ← Atkinson Hyperlegible (woff2, sous-ensemble)
│   └── favicon.svg
├── src/
│   ├── content/                       ← données fictives (voir § 6)
│   │   ├── evenements/  lieux/  materiel/  packs/  demarches/  actualites/
│   ├── components/
│   │   ├── ui/                        ← boutons, champs, cartes, badges, onglets…
│   │   ├── layout/                    ← en-tête, pied de page, fil d'Ariane, bandeau démo
│   │   └── islands/                   ← Web Components interactifs
│   ├── layouts/                       ← BaseLayout, PageLayout, DemarcheLayout
│   ├── lib/                           ← logique métier simulée (voir § 7)
│   │   ├── store.ts                   ← persistance localStorage (try/catch)
│   │   ├── events-bus.ts              ← bus d'événements simulé (format CloudEvents)
│   │   ├── extraction.ts              ← extraction de pièces simulée
│   │   ├── rules.ts                   ← règles de complétude et de cohérence
│   │   └── availability.ts            ← calcul des disponibilités du matériel
│   ├── pages/                         ← routes (voir § 5)
│   └── styles/
│       ├── tokens.css                 ← variables du design system
│       ├── base.css  layout.css  components.css  utilities.css
└── tests/
    ├── a11y.spec.ts  parcours-guichet.spec.ts  parcours-regie.spec.ts
```

---

## 4. Design system

### 4.1 Intention

« La ville comme scène » : une identité **affiche de spectacle de rue**. Elle s'appuie sur des aplats francs, une typographie forte en titres et un accent signalétique orange qui évoque le marquage au sol et les gélatines. La rigueur reste celle d'une administration pour les démarches. Les zones culturelles (Sortir, Filature, Festival) sont plus expressives, les zones de démarches plus calmes.

### 4.2 Variables (référence : `src/styles/tokens.css`)

> **Révision du 28 octobre 2026, validée par l'auteur** : direction « affiche de rue » assumée. Les variables d'origine sont remplacées par la palette ci-dessous ; le détail et les contrastes mesurés sont dans `docs/DECISIONS.md`.

- **Base** : encre `#16142a`, papier `#f6f1e7`, surface `#ffffff`, texte secondaire `#5a5670` (6,2:1), accent texte et focus `#b83a0c` (5,1:1).
- **Aplats d'affiche**, toujours avec du **texte encre** : orange `#ff5a1f`, jaune `#ffcf33`, rose `#ff8db5`, turquoise `#14b8a6`, violet `#b197fc`, vert `#4ade80`.
- **Teintes pâles** pour les fonds secondaires : `--t-orange`, `--t-jaune`, `--t-rose`, `--t-turquoise`, `--t-violet`, `--t-vert`.
- **Sous-chartes** (`--c-zone`) : La Filature en turquoise, le Théâtre Jean-Vilar en violet, Les Échappées en jaune. Une couleur d'aplat par discipline pour l'agenda.
- **Typographie** : `--font-display` (Anton) pour `h1` et `h2`, `--font-sans` (Atkinson Hyperlegible) pour le reste ; échelle `--fs-300` à `--fs-800`.
- **Formes** : rayons 6, 14 et 28 px, pastilles (`--radius-pill`), bordures encre de 2 px, aucune ombre portée.

### 4.3 Règles

- Tous les **contrastes** sont vérifiés : au moins 4,5:1 pour le texte et au moins 3:1 pour les éléments d'interface.
- Le **focus** est toujours visible (`:focus-visible` avec `--focus-ring`), jamais supprimé.
- Les **cibles tactiles** mesurent au moins 44 × 44 px.
- **Aucune information n'est portée par la seule couleur** : chaque badge d'état a un libellé et une icône.
- Les **animations** sont désactivées sous `prefers-reduced-motion: reduce`.
- Les **icônes** sont en SVG inline, avec `aria-hidden="true"` si elles sont décoratives. Pas de bibliothèque d'icônes externe.
- **Pas d'image décorative lourde** : au maximum **une photo par page** (licence libre, AVIF et WebP via `astro:assets`, crédits dans les mentions légales) ; les autres visuels sont des illustrations SVG dessinées pour le projet.
- **Sur un aplat de couleur**, texte, liens et contour de focus passent à l'encre (classe `on-aplat`).

### 4.4 Composants minimum

Boutons (primaire, secondaire, lien) · Champs (texte, date, sélection, case, radio, téléversement de fichier) avec message d'erreur associé par `aria-describedby` · Carte événement · Carte matériel · Badge de statut · Onglets accessibles · Accordéon (`<details>`) · Fil d'Ariane · Pagination · Alerte (info, succès, avertissement, erreur) avec `role="status"` ou `role="alert"` selon le cas · Stepper de formulaire multi-étapes · Calendrier de disponibilité avec alternative en tableau.

---

## 5. Pages et priorités

**P1** est indispensable pour la démonstration, **P2** l'enrichit, **P3** est un bonus.

| Prio | Route | Contenu |
|---|---|---|
| P1 | `/` | Accueil : à la une, agenda des 7 jours, accès rapides (Démarches, Billetterie, Réserver du matériel), bandeau d'alerte festival |
| P1 | `/sortir/agenda/` | Agenda filtrable (date, lieu, discipline, gratuité, accessibilité). Les filtres sont reflétés dans l'URL. Le contenu reste lisible sans JavaScript. |
| P1 | `/sortir/agenda/[slug]/` | Fiche événement : infos, lieu, accessibilité, bouton « Réserver » simulé |
| P1 | `/sortir/festival/` | Les Échappées : programme, carte SVG des sites avec liste textuelle équivalente, infos pratiques |
| P1 | `/agir/` | Catalogue des démarches avec recherche |
| P1 | `/agir/organiser-un-evenement/` | **Parcours vitrine du Guichet Unique** (voir § 7.1) |
| P1 | `/regie/` | Accueil de la Régie partagée |
| P1 | `/regie/catalogue/` | Catalogue du matériel filtrable (famille, disponibilité sur une période) |
| P1 | `/regie/catalogue/[slug]/` | Fiche matériel : caractéristiques, calendrier de disponibilité, ajout au panier de réservation |
| P1 | `/regie/reserver/` | **Parcours vitrine de la Régie** (voir § 7.2) |
| P1 | `/demo/coulisses/` | **Faux back-office** : journal des événements du bus, dossiers déposés, réservations, et explication de chaque automatisme |
| P1 | `/a-propos-du-projet/` | **Page portfolio** : démarche (fiche commune, cahier des charges, brief, réalisation), choix de conception, mesures d'accessibilité et d'écoconception, crédits de l'auteur |
| P2 | `/sortir/la-filature/`, `/sortir/theatre/` | Pages des lieux avec sous-charte (couleur teal ou plum) |
| P2 | `/regie/sites-equipes/` | Les 4 sites de l'espace public : plans SVG, alimentations, accroches |
| P2 | `/mon-compte/` | Tableau de bord simulé : dossiers, réservations, billets |
| P2 | `/habiter/` | Rubrique « Habiter » avec 4 à 6 pages de contenu type |
| P2 | `/agir/organiser-un-evenement/facile-a-lire/` | Version FALC du parcours |
| P2 | Pied de page | Pages Accessibilité, Écoconception, Algorithmes publics, Mentions légales (fictives), Plan du site |
| P3 | `/en/` | Page d'accueil du festival en anglais |
| P3 | `/sortir/actualites/` | Actualités |

**Navigation principale :** Habiter · Sortir & découvrir · Agir & organiser · Régie partagée · Mon compte (simulé). Le lien d'évitement « Aller au contenu » est le premier élément focalisable.

---

## 6. Données fictives

Schémas à définir dans `src/content.config.ts` avec Zod. Volumes minimum entre parenthèses.

```ts
// Événement (30, sur les 3 mois à venir à partir de la date du build, dont 12 pendant le festival)
evenement: {
  titre: string; slug: string; resume: string; description: string (markdown);
  debut: Date; fin: Date; lieu: reference('lieux');
  discipline: 'cirque' | 'theatre-de-rue' | 'musique' | 'danse' | 'marionnette' | 'jeune-public';
  gratuit: boolean; tarifs?: { libelle: string; prix: number }[];
  accessibilite: ('pmr' | 'lsf' | 'audiodescription' | 'boucle-magnetique' | 'relax')[];
  compagnie: string; festival: boolean; jauge?: number; image?: image();
}

// Lieu (6 : Filature-chapiteau, Filature-halle-A, Théâtre Jean-Vilar, place de la Halle, quai des Teinturiers, parc Brossard)
lieu: {
  nom: string; slug: string; type: 'salle' | 'chapiteau' | 'espace-public';
  adresse: string; coords: { x: number; y: number } /* position sur la carte SVG */;
  jauge: number; accessibilite: string;
  alimentations?: { puissance_kva: number; prises: string }[];
  accroches?: { nombre: number; charge_max_kg: number };
}

// Référence matériel (40, réparties en son, lumière, vidéo, structure, énergie, praticable)
materiel: {
  designation: string; slug: string; famille: string; marque_modele: string;
  description: string; quantite: number;
  caracteristiques: { libelle: string; valeur: string }[];
  puissance_w?: number; poids_kg?: number;
  tarifs: { profil: 'interne' | 'association' | 'commune-agglo' | 'compagnie'; jour: number }[];
  caution: number; prestation_technicien_requise: boolean;
  verification?: { type: string; prochaine_echeance: Date }; // au moins 2 articles en échéance proche, 1 dépassée
}

// Pack (6) : { nom, slug, usage, jauge_indicative, composition: { materiel: reference, quantite }[] }
// Démarche (10) : { titre, slug, categorie, delai_indicatif, pieces: string[], en_ligne: boolean }
// Réservation existante (15, en JSON) : { materiel, quantite, debut, fin, demandeur_fictif } → sert au calcul des disponibilités
```

**Ton des contenus :** clair, concret, administratif mais chaleureux, en phrases courtes et à la voix active. Pas de faux texte latin : tous les textes sont rédigés en français plausible. Les associations, compagnies et personnes sont fictives et sans ressemblance volontaire avec des structures réelles.

---

## 7. Logique métier simulée

### 7.1 Parcours « Organiser un événement » (Guichet Unique)

Formulaire en **5 étapes** avec stepper accessible et sauvegarde automatique du brouillon (`localStorage`) :

1. **Organisateur** : connexion simulée (un clic), puis structure pré-remplie depuis un annuaire fictif d'associations.
2. **Événement** : titre, dates, lieu (liste des lieux), jauge estimée, nature.
3. **Besoins** : sonorisation ? buvette ? fermeture de voie ? structures ? matériel municipal ? Chaque réponse **déclenche ou retire des sous-démarches**, affichées en direct dans un encart « Ce dossier comprend : … ».
4. **Pièces** : téléversement des fichiers (traités localement, jamais envoyés). L'**extraction simulée** (`lib/extraction.ts`) :
   - affiche une animation d'analyse de 1 à 2 s, désactivée en mouvement réduit ;
   - déduit le type de pièce du nom de fichier (`assurance`, `statuts`, `plan`…), sinon le classe « non reconnu » ;
   - génère des champs extraits plausibles et un **score de confiance** déterministe, calculé par hachage du nom de fichier ;
   - applique les seuils du cahier des charges (≥ 0,90 pré-validé, 0,70 à 0,89 à vérifier, < 0,70 vérification manuelle) avec badges explicites ;
   - fournit un scénario de démonstration : un fichier nommé `assurance-expiree.pdf` produit une **pièce expirée**, avec un message de régularisation clair.
5. **Récapitulatif et dépôt** : liste des sous-démarches et des contrôles (`lib/rules.ts`) : complétude, conflit de date et de lieu avec les événements existants, délai minimum de 30 jours avant l'événement. Le dépôt crée un dossier fictif avec numéro, statut et **chronologie prévisionnelle**, et publie les événements sur le bus.

### 7.2 Parcours « Réserver du matériel » (Régie partagée)

1. Choix de la période, puis catalogue filtré **sur la disponibilité réelle** calculée par `lib/availability.ts` : quantité totale moins les réservations existantes sur la période.
2. Panier : articles et packs, quantités, alertes « quantité indisponible » avec dates alternatives proposées.
3. **Contrôle de cohérence électrique** : si un site de l'espace public est choisi, la somme des `puissance_w` est comparée à la puissance du site, avec une alerte explicite en cas de dépassement.
4. **Article hors service** : un article dont la vérification réglementaire est dépassée est affiché comme non réservable, avec le motif.
5. Prestation (retrait, livraison, montage, technicien), profil du demandeur, puis calcul du montant et de la caution selon la grille tarifaire.
6. Confirmation : réservation fictive enregistrée, convention de prêt générée en HTML imprimable, événements publiés sur le bus.

### 7.3 Bus d'événements simulé (`lib/events-bus.ts`)

- Format inspiré de **CloudEvents 1.0** (`id`, `source`, `type`, `time`, `subject`, `data`).
- Types émis : `dossier.depose`, `piece.extraite`, `piece.non_conforme`, `avis.requis`, `materiel.prereservation_demandee`, `materiel.indisponible`, `reservation.confirmee`.
- Persisté dans `localStorage`, affiché dans `/demo/coulisses/` sous forme de **journal lisible** : horodatage, type, résumé en français, et charge utile JSON repliable dans un `<details>`.
- Pour chaque type, un texte de **pédagogie** explique ce qui se passerait en production (service destinataire, action, contrôle humain).
- Bouton « Réinitialiser la démonstration ».

### 7.4 Persistance

Toutes les lectures et écritures dans `localStorage` passent par `lib/store.ts`, enveloppées dans `try/catch`. En cas d'échec (navigation privée, stockage bloqué), le site reste fonctionnel en mémoire et l'affiche en une ligne discrète.

---

## 8. Exigences de qualité (définition de « terminé »)

Une page ou une fonctionnalité est terminée quand **toutes** ces conditions sont réunies :

| Domaine | Critère | Vérification |
|---|---|---|
| Build | `npm run build` et `astro check` sans erreur ni avertissement | Commande |
| Accessibilité | 0 violation axe-core (niveaux critique et sérieux) sur la page | `npm run test:a11y` |
| Accessibilité | Navigation complète au clavier, ordre de focus logique, focus visible | Test manuel décrit dans `docs/AUDIT.md` |
| Accessibilité | Titres hiérarchisés, un seul `h1`, `lang="fr"`, `title` de page unique et explicite | axe + relecture |
| Accessibilité | Formulaires : libellés visibles, erreurs reliées aux champs, résumé d'erreurs focalisé à la soumission | Test Playwright |
| Sans JavaScript | Les pages de contenu (agenda, fiches, lieux) restent lisibles et navigables | Test avec JavaScript désactivé |
| Poids | Page médiane < 500 Ko, aucune page > 1 Mo transférée (hors images demandées par l'usager) | Rapport de build ou Lighthouse |
| Requêtes | < 25 requêtes par page | Lighthouse |
| Performance | Lighthouse mobile : Performance ≥ 95, Accessibilité = 100, Bonnes pratiques ≥ 95, SEO ≥ 95 | Lighthouse |
| Écoconception | EcoIndex A ou B sur les pages P1 | Mesure consignée dans `docs/AUDIT.md` |
| Responsive | Rendu correct de 320 px à 1 440 px, sans défilement horizontal, zoom 200 % sans perte | Playwright (captures) |
| Tiers | 0 requête vers un domaine externe | Test Playwright sur les requêtes réseau |

---

## 9. Méthode de travail pour Claude Code

### 9.1 Ordre des phases

Une phase par session ou par groupe de sessions. Chaque phase se termine par un commit et une mise à jour de `docs/DECISIONS.md`.

| Phase | Contenu | Livrable vérifiable |
|---|---|---|
| 0 | Initialisation Astro, TypeScript, lint, Playwright, structure des dossiers, déploiement à vide | Site vide en ligne, CI verte |
| 1 | Design system : tokens, base, composants `ui/`, layouts, en-tête, pied de page, bandeau démo | Page `/demo/composants/` (non indexée) montrant tous les composants |
| 2 | Données fictives : schémas Zod et contenus | `astro check` vert, volumes du § 6 atteints |
| 3 | Accueil, agenda, fiches événement, festival avec carte SVG | Parcours de navigation testés |
| 4 | Guichet Unique : parcours « Organiser un événement » complet | Test Playwright du parcours nominal et des 2 cas d'erreur (pièce expirée, conflit de date) |
| 5 | Régie partagée : catalogue, disponibilités, parcours de réservation | Test Playwright du parcours nominal, de l'indisponibilité et du dépassement électrique |
| 6 | Coulisses (journal du bus) et Mon compte simulé | Les événements des phases 4 et 5 apparaissent dans le journal |
| 7 | Page « À propos du projet » et pages de pied de page | Contenus rédigés |
| 8 | Audits : accessibilité, poids, EcoIndex, responsive ; corrections | `docs/AUDIT.md` complété, tous les critères du § 8 au vert |
| 9 | Pages P2 et P3 selon le temps disponible | — |

### 9.2 Règles de conduite

- **Lire ce fichier et la section concernée du cahier des charges** avant chaque phase.
- **Ne pas anticiper** une phase suivante. Signaler les dépendances plutôt que de les coder en avance.
- **Petites étapes vérifiées** : après chaque composant ou page, lancer le build et les tests concernés.
- **Ne jamais ajouter de dépendance, de service externe ou de requête tierce** sans validation explicite de l'auteur.
- **HTML sémantique d'abord** (`<nav>`, `<main>`, `<article>`, `<fieldset>`, `<legend>`, `<details>`). ARIA seulement quand le HTML natif ne suffit pas.
- **Textes de l'interface en français**, code et noms de variables en anglais, commentaires en français.
- En cas d'ambiguïté, **poser la question** plutôt que de supposer.
- Consigner tout écart volontaire au présent brief dans `docs/DECISIONS.md`, avec la raison.

### 9.3 Commandes attendues

```bash
npm run dev          # serveur local
npm run build        # build + index Pagefind
npm run preview      # prévisualisation du build
npm run check        # astro check + eslint
npm run test         # Playwright (parcours)
npm run test:a11y    # Playwright + axe sur toutes les routes P1
```

---

## 10. Page « À propos du projet » (contenu attendu)

C'est la page qui fait du démonstrateur une pièce de portfolio. Elle doit présenter :

1. **Le cas** : une commune fictive lauréate d'un prix de l'innovation numérique, et pourquoi le spectacle vivant.
2. **La démarche** : fiche commune, arborescence, cahier des charges (lien vers une version téléchargeable), brief, réalisation.
3. **Les partis pris** : portail unique au lieu de 5 sites, automatiser l'instruction sans automatiser la décision, sobriété.
4. **Les preuves** : scores Lighthouse et EcoIndex, résultat axe, poids des pages, en chiffres et datés.
5. **Les limites assumées** : ce qui est simulé et ce qu'il faudrait en production (renvoi aux lots du cahier des charges).
6. **L'auteur** : `[Nom, titre, lien de contact ou de profil]`, à compléter par l'auteur. Claude Code ne doit rien inventer ici.

---

*Brief v1.0 — 28 octobre 2026 — à faire évoluer avec `docs/DECISIONS.md`.*
