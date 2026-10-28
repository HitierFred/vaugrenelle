# Cahier des charges fonctionnel et technique
## Refonte du portail numérique de la Ville de Vaugrenelle
### « Vaugrenelle, la ville comme scène » — Portail unique, Guichet Unique et Régie partagée

> **Document de cas d'étude fictif.** La collectivité, les personnes, le prix et les chiffres sont inventés. Les références réglementaires et normatives sont réelles.

| Champ | Valeur |
|---|---|
| Pouvoir adjudicateur | Ville de Vaugrenelle (34 200 hab.) |
| Service porteur | Direction de la Culture, en co-pilotage avec la DSI mutualisée Vaugrenelle Agglomération |
| Référence de consultation | VGR-2026-NUM-014 |
| Version | 1.0 — Diffusion consultation |
| Date | 28 octobre 2026 |
| Procédure envisagée | Appel d'offres ouvert, accord-cadre mono-attributaire par lot, bons de commande pour la TMA |
| Durée | 12 mois ferme (conception, réalisation, mise en service) + 3 reconductions annuelles (maintenance) |

---

## Sommaire

1. Présentation de la collectivité
2. Contexte et objectifs stratégiques
3. Périmètre et allotissement
4. Publics cibles et personas
5. Arborescence cible
6. Spécifications fonctionnelles — Portail, agenda, billetterie, compte usager
7. Spécifications fonctionnelles — Guichet Unique et services citoyens automatisés
8. Spécifications fonctionnelles — Régie partagée (équipements scéniques et audiovisuels)
9. Architecture technique cible
10. Interopérabilité et interfaces
11. Sécurité des systèmes d'information
12. Protection des données personnelles et transparence algorithmique
13. Accessibilité numérique
14. Écoconception
15. Performance, disponibilité et montée en charge
16. Hébergement et exploitation
17. Contenus, reprise de l'existant et migration
18. Gouvernance et méthodologie projet
19. Planning prévisionnel
20. Recette et réception
21. Maintenance, support et niveaux de service
22. Propriété intellectuelle et réversibilité
23. Formation et conduite du changement
24. Indicateurs de succès
25. Budget prévisionnel
26. Contenu attendu des offres et critères d'analyse
27. Annexes

**Conventions de lecture**

| Code | Signification |
|---|---|
| `EXF-XXX-nn` | Exigence fonctionnelle |
| `EXT-XXX-nn` | Exigence technique |
| **M** (Must) | Exigence obligatoire. Une offre qui ne la couvre pas est non conforme. |
| **S** (Should) | Exigence attendue, valorisée à l'analyse |
| **C** (Could) | Option. Elle est chiffrée séparément si proposée. |

---

## 1. Présentation de la collectivité

### 1.1 Données clés

| Indicateur | Valeur |
|---|---|
| Population | 34 200 habitants, bassin de vie de 92 000 |
| Intercommunalité | Vaugrenelle Agglomération (27 communes) |
| Effectif municipal | Environ 620 agents |
| Budget de fonctionnement | 48 M€, dont 9,2 % pour la culture |
| DSI | Mutualisée avec l'agglomération : 14 agents, dont 2 développeurs et 1 référent données |
| Territoire | 3 quartiers prioritaires de la politique de la ville (QPV), environ 18 % de la population éloignée du numérique, 2 espaces France Services |

### 1.2 Écosystème culturel et scénique

| Équipement / dispositif | Caractéristiques |
|---|---|
| La Filature (CNAREP) | Chapiteau permanent de 900 places, halles de création de 1 100 et 800 m², ateliers, 6 logements d'artistes |
| Théâtre municipal Jean-Vilar | Salle à l'italienne de 520 places, plateau de 14 × 11 m, 60 représentations par an |
| Espace public scénographié | 4 sites équipés : bornes électriques escamotables, points d'accroche, coffrets de distribution |
| Parc matériel municipal | Environ 1 900 références : son, lumière, vidéo, structures, praticables, énergie |
| Festival « Les Échappées » | 4 jours, environ 80 000 spectateurs, 120 compagnies, plus de 300 représentations, 25 sites |
| Vie associative | 210 associations culturelles, environ 600 manifestations déclarées par an |

### 1.3 Innovation de référence : le Guichet Unique

La Ville a été distinguée en octobre 2026 (Trophée national de l'innovation numérique territoriale, catégorie « Simplification des démarches ») pour son **Guichet Unique**. Ce dispositif fusionne en un dossier unique les 5 à 7 démarches qu'exige l'organisation d'un événement.

| Indicateur | Avant | Après 18 mois |
|---|---|---|
| Délai moyen d'instruction | 21 jours | 6 jours |
| Dossiers incomplets au dépôt | 42 % | 9 % |
| Heures-agent économisées | — | 3 100 h / an |

**Limite actuelle :** le Guichet Unique est une application isolée, déconnectée du site institutionnel, de l'agenda et de la gestion du matériel. Le présent marché a pour objet de l'intégrer au cœur d'un portail unifié et d'en étendre le modèle.

---

## 2. Contexte et objectifs stratégiques

### 2.1 Constat sur l'existant

| Domaine | Constat |
|---|---|
| Fragmentation | 5 sites distincts (ville, Filature, théâtre, festival, billetterie externe) et 5 identités, comptes et back-offices |
| Technologie | CMS propriétaire de 2014, fin de support éditeur annoncée en 2027, gabarits non responsive |
| Accessibilité | Taux de conformité RGAA mesuré à 38 %, environ 2 400 PDF non accessibles |
| Sobriété | Poids moyen de page de 3,4 Mo, 11 services tiers chargés sur la page d'accueil |
| Données | Agenda ressaisi 3 fois, aucun jeu de données ouvert |
| Matériel | Gestion par tableur partagé et agenda papier, aucun suivi de maintenance tracé |

### 2.2 Objectifs stratégiques

**Pour les usagers**
- Offrir **une porte d'entrée unique** à tous les services, à l'offre culturelle et aux démarches.
- Garantir **un compte unique** et un tableau de bord de toutes les interactions avec la Ville.
- Rendre chaque démarche accessible à tous : conformité RGAA, versions FALC, parcours accompagné en France Services.

**Pour l'administration**
- **Généraliser le principe « dites-le-nous une fois »** à l'ensemble des démarches à fort volume.
- **Automatiser l'instruction** (collecte, extraction, contrôle, routage) sans automatiser la décision.
- **Professionnaliser la gestion du parc scénique** : traçabilité, maintenance réglementaire, mutualisation intercommunale.

**Pour le territoire**
- Faire du portail la **vitrine nationale** du positionnement « ville des arts de la rue ».
- **Ouvrir les données** culturelles et événementielles (agenda, lieux, équipements).
- Réduire l'**empreinte environnementale** du numérique municipal.

**Pour la gouvernance numérique**
- **Reprendre la maîtrise** : briques open source, hébergement en France, réversibilité garantie.
- Ancrer l'**exemplarité** : transparence algorithmique, sécurité homologuée, mesure continue.

### 2.3 Cadre réglementaire et normatif applicable

| Domaine | Référentiel |
|---|---|
| Accessibilité | Loi n° 2005-102, art. 47 · Décret n° 2019-768 · RGAA 4.1.2 |
| Écoconception | Loi n° 2021-1485 (REEN) · Référentiel général d'écoconception de services numériques (RGESN, version 2024) |
| Sécurité | Référentiel général de sécurité (RGS v2) · Recommandations et guide d'hygiène de l'ANSSI |
| Interopérabilité | Référentiel général d'interopérabilité (RGI v2) |
| Données personnelles | RGPD · Loi Informatique et Libertés modifiée |
| Algorithmes publics | Code des relations entre le public et l'administration (CRPA), art. L.311-3-1, L.312-1-3, R.311-3-1-1 et suivants |
| Intelligence artificielle | Règlement (UE) 2024/1689 (AI Act), selon le calendrier d'application |
| Données ouvertes | CRPA, livre III (ouverture des données publiques par défaut) |
| Billetterie | Déclaration SIBIL (système d'information billetterie) au ministère de la Culture |
| Commande publique | Code de la commande publique |

---

## 3. Périmètre et allotissement

### 3.1 Périmètre inclus

- Conception UX/UI, design system de la Ville, déclinaisons graphiques Filature, théâtre et Échappées.
- Réalisation du portail (CMS, front-office, back-office éditorial).
- Intégration du Guichet Unique existant au portail, extension à de nouvelles démarches et refonte de la chaîne d'automatisation.
- Réalisation du module Régie partagée.
- Intégration d'une billetterie en marque blanche.
- Reprise et migration des contenus des 5 sites existants.
- Hébergement, exploitation, maintenance corrective, évolutive et de sécurité.
- Formation des agents et accompagnement au changement.

### 3.2 Périmètre exclu

- Production de contenus éditoriaux originaux, hors gabarits et exemples de démonstration.
- Remplacement des logiciels métiers existants (GED, parapheur, gestion du domaine public, finances).
- Fourniture de matériels : terminaux mobiles et étiquettes QR. Les spécifications sont fournies par le titulaire.

### 3.3 Allotissement

Conformément au principe d'allotissement du Code de la commande publique :

| Lot | Intitulé | Contenu principal |
|---|---|---|
| **Lot 1** | Portail, design system et intégration | CMS, front, compte usager, agenda, migration, hébergement du portail, socle d'identité, orchestration des lots |
| **Lot 2** | Guichet Unique et services automatisés | Moteur de formulaires, chaîne d'extraction et de contrôle, orchestrateur de workflows, back-office instructeur, connecteurs métiers |
| **Lot 3** | Régie partagée | Catalogue, réservation, planning croisé, logistique mobile, maintenance, accueil technique des compagnies |
| **Lot 4** | Billetterie en marque blanche | Solution SaaS de billetterie intégrée au portail et au compte usager |

Le titulaire du Lot 1 est **intégrateur-ensemblier**. Il est responsable de la cohérence de bout en bout du parcours usager, du design system partagé et de la coordination technique des interfaces entre lots. Un candidat peut répondre à plusieurs lots.

---

## 4. Publics cibles et personas

| Persona | Profil | Besoins prioritaires | Contraintes |
|---|---|---|---|
| **Monique, 71 ans** | Retraitée, quartier Gare | Horaires, démarches état civil, agenda des sorties gratuites | Faible aisance numérique, malvoyance légère, usage tablette |
| **Karim, 38 ans** | Parent, quartier QPV | Inscriptions jeunesse, tarifs sociaux spectacle, signalements | Mobile uniquement, forfait data limité |
| **Association « Les Tréteaux du Pilat »** | Bénévoles, 3 à 4 événements par an | Déclarer un événement, réserver du matériel, demander une subvention | Bénévoles peu disponibles, rotation des responsables |
| **Compagnie « Ligne de Fuite »** | Compagnie de rue en tournée | Fiche technique, plans, résidence, logistique d'accueil | Interlocuteur itinérant, échanges en dehors des horaires de bureau |
| **Régisseur général** | Agent municipal, Service technique événementiel | Planning matériel et équipes, état du parc, maintenance | Usage terrain, mains occupées, réseau aléatoire sur site |
| **Instructrice domaine public** | Agente administrative | File de dossiers, avis, génération des arrêtés | Volume élevé, pics avant l'été |
| **Commune de l'agglomération** | Secrétaire de mairie | Emprunter du matériel, suivre une réservation | Interlocuteur occasionnel, pas de technicien sur place |
| **Spectateur extérieur** | Touriste, festivalier | Programme, carte, billets, accès | Non francophone (EN, DE, IT), sur site, réseau saturé |

---

## 5. Arborescence cible

```
vaugrenelle.fr
├── ACCUEIL — À la une · Agenda 7 jours · Alertes · Accès rapides
├── 1. HABITER VAUGRENELLE
│   ├── Mairie & vie municipale
│   ├── Famille, éducation, jeunesse
│   ├── Solidarités & France Services
│   ├── Cadre de vie
│   └── Signaler un problème
├── 2. SORTIR & DÉCOUVRIR
│   ├── Agenda culturel unifié
│   ├── La Filature – Pôle arts de la rue
│   ├── Théâtre Jean-Vilar
│   ├── Les Échappées – Festival
│   ├── Conservatoire · Médiathèque
│   └── Billetterie
├── 3. AGIR & ORGANISER (Guichet Unique)
│   ├── Toutes les démarches
│   ├── Organiser un événement
│   ├── Occuper le domaine public
│   ├── Associations
│   └── Suivre mes dossiers
├── 4. RÉGIE PARTAGÉE
│   ├── Catalogue du parc matériel
│   ├── Réserver du matériel / une prestation
│   ├── Équipements scéniques de l'espace public
│   ├── Accueil technique des compagnies
│   └── Conventions, tarifs, règlement de prêt
├── 5. ESPACE PROFESSIONNEL
│   ├── Compagnies & artistes
│   ├── Communes de l'agglomération
│   ├── Entreprises & marchés publics
│   └── Presse & médias
├── MON COMPTE
└── PIED DE PAGE — Accessibilité · Écoconception · Open data · Mentions légales
    · Données personnelles · Algorithmes publics · Plan du site · FALC · EN/DE/IT
```

**Règles d'arborescence**
- Profondeur maximale de **3 niveaux** pour tout contenu public.
- Toute démarche est accessible en **3 clics maximum** depuis l'accueil, ou en 1 recherche.
- La Filature, le théâtre et les Échappées disposent d'une **sous-charte graphique** au sein du design system commun, sans domaine séparé. Des redirections permanentes (HTTP 301) sont maintenues depuis les anciens domaines.

---

## 6. Spécifications fonctionnelles — Portail, agenda, billetterie, compte usager

### 6.1 Portail et gestion éditoriale (Lot 1)

| ID | Exigence | Prio | Critère d'acceptation |
|---|---|---|---|
| EXF-POR-01 | Gabarits responsive (accueil, rubrique, article, fiche lieu, fiche événement, fiche démarche, actualité, page FALC) | M | Rendu conforme de 320 px à 1 920 px, validé sur 4 navigateurs et 2 lecteurs d'écran |
| EXF-POR-02 | Workflow éditorial : brouillon, relecture, validation, publication, dépublication programmée | M | 3 rôles minimum avec droits paramétrables par rubrique |
| EXF-POR-03 | Contrôles d'accessibilité dans l'éditeur (alternative d'image obligatoire, hiérarchie des titres, contraste, intitulés de liens) | M | Publication bloquée si l'alternative d'une image informative manque |
| EXF-POR-04 | Moteur de recherche unifié (pages, démarches, événements, matériel public) avec tolérance aux fautes et synonymes | M | Pertinence validée sur un jeu de 50 requêtes de référence |
| EXF-POR-05 | Bandeau d'alerte multicanal (portail, push PWA, SMS opt-in) pour vigilance météo, annulation ou incident festival | M | Diffusion en moins de 2 min sur tous les canaux |
| EXF-POR-06 | Multilinguisme FR, EN, DE, IT sur « Sortir & Découvrir » et « Festival » | S | Sélecteur de langue accessible, attribut `lang` correct, traductions gérées dans le CMS |
| EXF-POR-07 | Publication des actes administratifs (délibérations, arrêtés) avec horodatage et recherche | M | Conforme au régime de publicité électronique des actes des collectivités |
| EXF-POR-08 | Médiathèque numérique centralisée avec gestion des droits et des crédits photo, et dates d'expiration des droits | M | Alerte 30 jours avant l'expiration d'un droit d'usage |
| EXF-POR-09 | Gabarit FALC dédié, identifié par le logo européen « Facile à lire » | S | 10 démarches prioritaires livrées en FALC |

### 6.2 Agenda culturel unifié (Lot 1)

| ID | Exigence | Prio | Critère d'acceptation |
|---|---|---|---|
| EXF-AGE-01 | Base événementielle unique alimentée par 3 sources : programmation municipale, Guichet Unique (manifestations validées) et contributions des associations | M | Un événement validé au Guichet est publié automatiquement en brouillon, en moins de 5 min |
| EXF-AGE-02 | Modération des contributions associatives avant publication | M | File de modération avec motifs de refus paramétrables |
| EXF-AGE-03 | Filtres par date, lieu, discipline, public, gratuité, accessibilité (PMR, LSF, audiodescription, boucle magnétique) | M | Combinaison de filtres reflétée dans une URL partageable |
| EXF-AGE-04 | Export open data au schéma DATAtourisme et en flux iCal | M | Jeu de données publié sur data.gouv.fr, mis à jour quotidiennement |
| EXF-AGE-05 | API publique de lecture (REST, JSON) documentée en OpenAPI | S | Limitation de débit, clé gratuite sur inscription |
| EXF-AGE-06 | Carte interactive du festival, consultable hors ligne en PWA | M | Programme, carte et favoris accessibles sans réseau après une première visite |
| EXF-AGE-07 | Alternative textuelle accessible à toute carte | M | Liste des sites et accès équivalente à la carte, conforme RGAA |

### 6.3 Billetterie en marque blanche (Lot 4)

| ID | Exigence | Prio | Critère d'acceptation |
|---|---|---|---|
| EXF-BIL-01 | Intégration visuelle et fonctionnelle au portail, sans rupture de parcours | M | Parcours complet sans changement apparent de site, aux couleurs du design system |
| EXF-BIL-02 | Authentification par le compte usager du portail (SSO OpenID Connect) | M | Aucune création de compte supplémentaire |
| EXF-BIL-03 | Tarification sociale automatique par vérification du quotient familial via API Particulier, avec consentement explicite | M | Habilitation DataPass obtenue, aucune pièce justificative demandée à l'usager |
| EXF-BIL-04 | Réservation de jauges gratuites sur créneau (festival), avec liste d'attente | M | Libération automatique des places non confirmées 2 h avant |
| EXF-BIL-05 | File d'attente virtuelle lors des ouvertures de billetterie | M | Supporte 5 000 utilisateurs simultanés sans dégradation |
| EXF-BIL-06 | Déclaration SIBIL automatisée | M | Export conforme au format en vigueur, sans ressaisie |
| EXF-BIL-07 | Billets en PDF accessible et au format Wallet, contrôle d'accès par application mobile hors ligne | M | Contrôle d'accès opérationnel sans réseau, synchronisation différée |
| EXF-BIL-08 | Paiement en ligne via le dispositif de paiement de la DGFiP ou un prestataire compatible avec la régie de recettes | M | Rapprochement comptable automatique avec la régie |
| EXF-BIL-09 | Billets suspendus (solidarité) et pass culture | C | Lot optionnel chiffré séparément |

### 6.4 Compte usager « Mon compte » (Lot 1)

| ID | Exigence | Prio | Critère d'acceptation |
|---|---|---|---|
| EXF-CPT-01 | Connexion via FranceConnect ou compte local (adresse e-mail et MFA facultative) | M | Rattachement possible d'un compte local à FranceConnect |
| EXF-CPT-02 | Comptes « structure » (association, compagnie, commune) avec plusieurs membres et rôles | M | Transfert de la responsabilité d'une structure sans perte d'historique |
| EXF-CPT-03 | Tableau de bord unifié : dossiers, billets, réservations de matériel, documents délivrés, paiements, notifications | M | Agrégation des données des 4 lots en une vue unique |
| EXF-CPT-04 | Préférences de notification (e-mail, SMS, push) par type d'événement | M | Désinscription en 1 clic |
| EXF-CPT-05 | Mode « aidant » France Services : un agent agit pour le compte d'un usager, avec consentement tracé et limité dans le temps | M | Journalisation de chaque action réalisée en mode aidant |
| EXF-CPT-06 | Coffre de pièces justificatives réutilisables, avec dates de validité | S | Proposition automatique d'une pièce valide lors d'une nouvelle démarche |
| EXF-CPT-07 | Export de ses données (portabilité RGPD) et suppression de compte | M | Export JSON et PDF en libre-service |

---

## 7. Spécifications fonctionnelles — Guichet Unique et services citoyens automatisés (Lot 2)

### 7.1 Principes directeurs

- **Automatiser l'instruction, jamais la décision.** Toute décision individuelle (accord, refus, arrêté) est prise par un agent ou un élu habilité. Les automatismes préparent, contrôlent et routent.
- **Rejet automatique limité aux critères objectifs.** Seuls des critères vérifiables, comme une pièce expirée ou un délai légal dépassé, peuvent déclencher une demande de régularisation automatique. L'usager garde toujours la possibilité de contester auprès d'un agent.
- **Explicabilité.** Chaque contrôle automatique produit un motif lisible par l'usager et par l'agent.
- **Réversibilité des briques.** OCR, classification et orchestration sont des composants remplaçables derrière des interfaces stables.

### 7.2 Catalogue des démarches couvertes

| Démarche | Volume annuel | Existant | Cible |
|---|---|---|---|
| Organiser un événement (dossier unique) | Environ 600 | Guichet v1 | Refonte et intégration au portail |
| Occupation du domaine public (terrasse, tournage, chantier, ambulant) | Environ 1 400 | Guichet v1 | Calcul automatique de la redevance |
| Autorisation de débit de boissons temporaire | Environ 350 | Intégrée au dossier événement | Contrôle automatique du quota annuel réglementaire par association |
| Demande de subvention associative | Environ 180 | Formulaire PDF | Nouvelle démarche |
| Demande de tournage | Environ 40 | Mail | Nouvelle démarche |
| Signalement géolocalisé (voirie, propreté, éclairage) | Environ 4 500 | Outil séparé | Intégration au compte usager |
| Prêt de matériel | Environ 950 | Tableur | Voir Lot 3, déclenché depuis le Guichet |

### 7.3 Chaîne de traitement de bout en bout

| # | Étape | Traitement | Composant | Contrôle humain |
|---|---|---|---|---|
| 1 | Identification | FranceConnect ou compte local. Pré-remplissage depuis le RNA (associations) et SIRENE via API Entreprise. | Socle d'identité (Lot 1), connecteurs API | — |
| 2 | Formulaire dynamique | Arbre de questions conditionnelles : jauge, lieu, alcool, voirie, sonorisation, structures, restauration | Moteur de formulaires (JSON Schema) | — |
| 3 | Détection des démarches induites | Le formulaire déduit les sous-démarches nécessaires (arrêté de circulation, débit de boissons, prêt de matériel, déclaration préfectorale selon les seuils de jauge) | Moteur de règles | — |
| 4 | Ingestion des pièces | Upload, analyse antivirale, normalisation PDF/A, empreinte SHA-256 | Service d'ingestion | — |
| 5 | Extraction | OCR, classification du type de pièce, extraction des champs structurés | Service d'extraction | Selon le seuil de confiance (§ 7.5) |
| 6 | Contrôles | Complétude, validité, cohérence inter-pièces et inter-dossiers, conflits de planning | Moteur de règles | Alerte à l'usager en temps réel |
| 7 | Routage | Publication d'événements métier vers les services instructeurs | Bus d'événements, orchestrateur | — |
| 8 | Instruction parallèle | Avis de la police municipale, de la voirie, de la culture, de la régie technique et du référent sécurité | Back-office instructeur | **Oui : avis motivés** |
| 9 | Décision | Génération des projets d'actes, circuit de signature | Générateur de documents, parapheur | **Oui : signature** |
| 10 | Effets en aval | Publication agenda, confirmation de réservation matériel, transmission préfecture, notification usager | Webhooks sortants | — |
| 11 | Archivage | Versement en GED, journal d'audit, durées de conservation | Connecteur GED | — |

### 7.4 Exigences fonctionnelles du Guichet

| ID | Exigence | Prio | Critère d'acceptation |
|---|---|---|---|
| EXF-GU-01 | Formulaire unique « Organiser un événement » remplaçant les 7 démarches historiques | M | Un seul dépôt génère toutes les sous-démarches nécessaires |
| EXF-GU-02 | Sauvegarde automatique du brouillon et reprise multi-appareils | M | Aucune perte de saisie après fermeture du navigateur |
| EXF-GU-03 | Contrôles de complétude bloquants avant dépôt, avec messages explicites | M | Chaque message nomme la pièce et le motif, en langage clair |
| EXF-GU-04 | Détection des conflits (même site, même créneau, matériel indisponible) dès la saisie | M | Alternatives de date ou de site proposées |
| EXF-GU-05 | Calcul automatique des redevances d'occupation selon la grille tarifaire délibérée, paramétrable sans développement | M | Grille modifiable par un administrateur fonctionnel, historisation des versions |
| EXF-GU-06 | Back-office instructeur : file de travail, filtres, délais, alertes d'échéance, vue synthétique du dossier | M | Indicateur de délai restant visible sur chaque dossier |
| EXF-GU-07 | Avis inter-services en parallèle avec délai de réponse paramétrable et relance automatique | M | Relance à J-2 de l'échéance, escalade au chef de service à J |
| EXF-GU-08 | Échange sécurisé usager–instructeur dans le dossier (messagerie, demande de pièce complémentaire) | M | Aucune donnée du dossier transmise par e-mail en clair |
| EXF-GU-09 | Génération des projets d'arrêtés et de courriers à partir de modèles paramétrables, en PDF/UA | M | Modèles éditables par les services, sans développement |
| EXF-GU-10 | Suivi de l'avancement côté usager (statut, étape, prochaine action attendue) | M | Notification à chaque changement de statut |
| EXF-GU-11 | Studio de démarches : création de nouvelles démarches par l'administrateur fonctionnel (formulaire, règles, circuit) | S | Une démarche simple créée en moins d'une journée, sans développeur |
| EXF-GU-12 | Tableaux de bord de pilotage (volumes, délais, taux d'incomplétude, motifs de rejet) | M | Export CSV, rafraîchissement quotidien |

### 7.5 Extraction et traitement des pièces justificatives

**Règles d'extraction par type de pièce**

| Type de pièce | Champs extraits | Contrôle automatique | Action si non conforme |
|---|---|---|---|
| Attestation d'assurance responsabilité civile | Assureur, assuré, n° de contrat, période de validité, garanties et plafonds | Validité couvrant la date de l'événement, assuré correspondant à la structure | Demande de régularisation automatique (critère objectif) |
| Statuts d'association | Dénomination, objet, siège, date | Cohérence avec le RNA | Mise en file de vérification manuelle |
| Récépissé de déclaration en préfecture | N° RNA, date | Correspondance avec le RNA | Mise en file de vérification manuelle |
| Plan d'implantation | Présence d'une échelle, emprise, issues de secours (détection d'éléments graphiques) | Plan présent et lisible | Mise en file de vérification manuelle |
| Fiche technique (compagnie ou organisateur) | Besoins électriques, son, lumière, plateau, accroches | Transmission au Lot 3 pour rapprochement avec le parc | Signalement des manques à la régie |
| Kbis ou avis de situation SIRENE (prestataires) | SIREN, raison sociale, date | Vérification via API Entreprise | Demande de régularisation automatique |
| RIB (subventions) | Titulaire, IBAN, BIC | Titulaire identique à la structure, IBAN valide | Mise en file de vérification manuelle |

**Seuils de confiance et intervention humaine**

| Score de confiance de l'extraction | Traitement |
|---|---|
| ≥ 0,90 | Champs pré-validés, affichés à l'agent avec un indicateur « contrôle automatique » |
| 0,70 – 0,89 | Champs pré-remplis, vérification obligatoire par l'agent avant tout effet |
| < 0,70 | Aucune valeur pré-remplie. Pièce mise en file de vérification manuelle. |

Les seuils sont paramétrables. Ils sont recalibrés trimestriellement sur un échantillon contrôlé d'au moins 200 pièces.

**Exigences sur les modèles d'IA**

| ID | Exigence | Prio |
|---|---|---|
| EXT-IA-01 | Modèles d'OCR et de classification hébergés en France ou dans l'UE, sans transfert de données hors UE | M |
| EXT-IA-02 | Aucune réutilisation des données des usagers pour l'entraînement de modèles tiers | M |
| EXT-IA-03 | Jeu d'évaluation de référence fourni par le titulaire, avec précision et rappel par type de pièce. Précision minimale de 95 % sur les champs de date et d'identité | M |
| EXT-IA-04 | Journalisation de chaque inférence (version du modèle, score, horodatage), conservée sur la durée de vie du dossier | M |
| EXT-IA-05 | Remplacement du modèle possible sans modification des workflows (interface d'abstraction) | M |
| EXT-IA-06 | Documentation de conformité au règlement (UE) 2024/1689 : qualification du niveau de risque et obligations de transparence applicables | M |
| EXT-IA-07 | Option de modèle de langage souverain pour la synthèse de dossiers à destination des agents | C |

### 7.6 Orchestration et contrat d'événements (webhooks)

**Spécifications techniques des événements**

| Élément | Exigence |
|---|---|
| Format | CloudEvents 1.0, charge utile JSON validée par JSON Schema versionné |
| Transport | HTTPS (TLS 1.2 minimum, 1.3 recommandé) |
| Authentification | Signature HMAC-SHA256 dans un en-tête dédié, rotation des secrets tous les 12 mois |
| Idempotence | Identifiant unique par événement, déduplication côté consommateur |
| Rejeu | Tentatives à intervalle exponentiel (1 min, 5 min, 30 min, 2 h, 12 h), puis file de lettres mortes avec alerte |
| Ordre | Garanti par dossier (clé de partition = identifiant du dossier) |
| Données | Minimisation : les événements transportent des identifiants et des statuts. Les données détaillées sont récupérées par appel d'API authentifié. |
| Supervision | Tableau de bord des flux : taux de succès, latence, file d'erreurs |

**Catalogue minimal d'événements**

| Événement | Émetteur | Consommateurs |
|---|---|---|
| `dossier.depose` | Guichet | Orchestrateur, services instructeurs |
| `piece.extraite` | Service d'extraction | Moteur de règles |
| `piece.non_conforme` | Moteur de règles | Notification usager, back-office |
| `avis.requis` / `avis.rendu` | Orchestrateur / Back-office | Services concernés / Orchestrateur |
| `materiel.prereservation_demandee` | Guichet | Régie partagée (Lot 3) |
| `materiel.indisponible` | Régie partagée | Guichet, notification usager |
| `dossier.decision_signee` | Parapheur | Guichet, agenda, Régie, GED |
| `evenement.publie` | Agenda | Open data, office de tourisme |
| `reservation.confirmee` / `reservation.annulee` | Régie partagée | Compte usager, planning |
| `paiement.recu` | Billetterie / paiement | Compte usager, finances |

**Orchestrateur de workflows**

| ID | Exigence | Prio |
|---|---|---|
| EXT-ORC-01 | Orchestrateur auto-hébergé, open source ou à licence compatible avec l'usage par une collectivité (par exemple Windmill, n8n, Node-RED ou équivalent) | M |
| EXT-ORC-02 | Workflows versionnés dans un dépôt Git de la Ville, avec un environnement de recette distinct | M |
| EXT-ORC-03 | Secrets stockés dans un coffre dédié, jamais en clair dans les workflows | M |
| EXT-ORC-04 | Documentation de chaque workflow (déclencheur, étapes, systèmes appelés, responsable fonctionnel) | M |
| EXT-ORC-05 | Reprise automatique sur erreur et alerte de l'astreinte en cas d'échec persistant | M |

---

## 8. Spécifications fonctionnelles — Régie partagée (Lot 3)

### 8.1 Objet

La Régie partagée est le portail de gestion technique et de réservation des équipements scéniques et audiovisuels municipaux. Elle couvre le parc matériel, les équipements fixes de l'espace public, les prestations techniques (livraison, montage, technicien) et l'accueil technique des compagnies. Elle est ouverte aux services internes, aux associations, aux compagnies et aux 26 autres communes de l'agglomération.

### 8.2 Modèle de données principal

| Entité | Attributs clés |
|---|---|
| Référence (modèle) | Désignation, famille (son, lumière, vidéo, structure, énergie, praticable), marque et modèle, fiche technique (puissance, poids, connectique, consommation électrique), photos, documentation, tarifs par profil |
| Article (unité physique) | N° d'inventaire, n° de série, QR code, état, localisation, date d'acquisition, valeur, statut (disponible, réservé, sorti, en maintenance, hors service, réformé) |
| Pack | Composition (références et quantités), usage type, jauge indicative |
| Site équipé (espace public) | Localisation, plan, alimentations disponibles (puissance, type de prise), points d'accroche et charges admissibles, contraintes d'accès |
| Réservation | Demandeur (structure), événement lié (dossier Guichet), articles et packs, période (sortie, retour), prestations, caution, convention, statut |
| Ressource humaine | Agent ou intermittent, qualifications et habilitations (électrique, travail en hauteur, CACES), disponibilités |
| Véhicule | Type, charge utile, permis requis, disponibilités |
| Intervention de maintenance | Article, type (préventive, corrective, vérification réglementaire), date, intervenant, résultat, documents |
| Fiche technique de compagnie | Spectacle, besoins extraits, plans, contacts techniques, statut du rapprochement |

### 8.3 Cycle de vie d'une réservation

```
Demandée ──► Pré-réservée (bloquante) ──► Validée ──► Préparée ──► Sortie ──► Retournée ──► Clôturée
    │               │                         │                       │            │
    └─► Refusée     └─► Expirée (dossier      └─► Annulée            └─► Retour   └─► Litige
                        Guichet non validé)                              partiel       (casse/perte)
```

### 8.4 Exigences fonctionnelles

**Catalogue et réservation**

| ID | Exigence | Prio | Critère d'acceptation |
|---|---|---|---|
| EXF-REG-01 | Catalogue public consultable sans compte (références, packs, sites équipés), avec disponibilité par période | M | Disponibilité affichée en temps réel |
| EXF-REG-02 | Réservation authentifiée selon des règles d'éligibilité par profil (service interne, association de la commune, commune de l'agglomération, compagnie accueillie) | M | Règles paramétrables sans développement |
| EXF-REG-03 | Règles de priorité (programmation municipale > festival > associations de la commune > communes de l'agglomération), quotas annuels et délais minimum de réservation | M | Arbitrage tracé en cas de conflit |
| EXF-REG-04 | Tarification par profil, caution, gratuité délibérée, calcul automatique du montant | M | Grille historisée |
| EXF-REG-05 | Options de prestation : retrait, livraison, livraison et montage, mise à disposition d'un technicien | M | Contrôle automatique de la disponibilité véhicule et agent |
| EXF-REG-06 | Pré-réservation automatique depuis le Guichet (`materiel.prereservation_demandee`), confirmée à la signature de la décision | M | Libération automatique en cas de refus ou d'expiration du dossier |
| EXF-REG-07 | Contrôle de cohérence technique : un pack son ou lumière réservé pour un site de l'espace public est vérifié contre la puissance électrique disponible sur ce site | S | Alerte si la puissance totale dépasse la capacité du site |
| EXF-REG-08 | Génération automatique de la convention de prêt et signature électronique par le demandeur | M | Aucune sortie de matériel sans convention signée |

**Planning et logistique**

| ID | Exigence | Prio | Critère d'acceptation |
|---|---|---|---|
| EXF-REG-10 | Planning croisé matériel, véhicules, salles, sites et personnel technique, en vues jour, semaine et mois et en vue Gantt | M | Détection et affichage des conflits de ressources |
| EXF-REG-11 | Affectation du personnel technique selon les qualifications et habilitations requises par la prestation | M | Blocage si aucune personne affectée ne détient l'habilitation requise |
| EXF-REG-12 | Bons de préparation et listes de colisage générés automatiquement | M | Export PDF et affichage mobile |
| EXF-REG-13 | Application mobile (PWA) de sortie et de retour par scan de QR code, fonctionnant hors ligne | M | Synchronisation différée, aucune perte de scan sans réseau |
| EXF-REG-14 | État des lieux contradictoire avec photos et signature du demandeur sur mobile | M | Document horodaté joint à la réservation |
| EXF-REG-15 | Gestion des retours partiels, des retards, des casses et des pertes, avec génération du titre de recette ou de la retenue sur caution | M | Circuit de validation par le régisseur général |
| EXF-REG-16 | Optimisation des tournées de livraison sur une journée | C | Proposition d'ordre de passage |

**Maintenance et conformité réglementaire**

| ID | Exigence | Prio | Critère d'acceptation |
|---|---|---|---|
| EXF-REG-20 | Historique complet par article : sorties, incidents, réparations, vérifications | M | Consultable depuis le scan du QR code |
| EXF-REG-21 | Plans de vérifications périodiques par famille, notamment les appareils et accessoires de levage (arrêté du 1er mars 2004), les structures et les équipements électriques | M | Alertes à J-30 et J-7 avant échéance |
| EXF-REG-22 | Mise hors service automatique d'un article dont la vérification réglementaire est dépassée | M | Article non réservable et signalé au scan |
| EXF-REG-23 | Stockage des rapports de vérification et des certificats (organisme agréé), liés à l'article | M | Accessibles au régisseur et exportables pour un contrôle |
| EXF-REG-24 | Signalement d'une panne depuis le mobile, créant un ticket de maintenance corrective | M | Article passé automatiquement au statut « en maintenance » |
| EXF-REG-25 | Inventaire annuel assisté par scan, avec rapprochement des écarts | S | Rapport d'écarts exportable |
| EXF-REG-26 | Suivi du coût complet par article (acquisition, maintenance, recettes de prêt) | S | Tableau de bord de rentabilité et d'usage |

**Accueil technique des compagnies**

| ID | Exigence | Prio | Critère d'acceptation |
|---|---|---|---|
| EXF-REG-30 | Espace de dépôt des fiches techniques et des plans par la compagnie, depuis son compte structure | M | Versionnage des fiches |
| EXF-REG-31 | Extraction des besoins depuis la fiche technique (via le service d'extraction du Lot 2) et rapprochement avec le parc | S | Liste des besoins couverts, manquants et à sous-louer, validée par le régisseur |
| EXF-REG-32 | Fiches techniques des lieux (Filature, théâtre, sites de l'espace public) : plans, inventaire scénique, puissances, accroches, accès, au téléchargement | M | Documents à jour, date de révision affichée |
| EXF-REG-33 | Feuille de route d'accueil générée (horaires, contacts, accès, stationnement, logements) | S | Envoyée à la compagnie et à l'équipe technique |

**Pilotage**

| ID | Exigence | Prio | Critère d'acceptation |
|---|---|---|---|
| EXF-REG-40 | Tableaux de bord : taux d'utilisation par famille, références les plus demandées, refus pour indisponibilité, casses et pertes, échéances de maintenance | M | Rafraîchissement quotidien, export CSV |
| EXF-REG-41 | Statistiques de mutualisation intercommunale (prêts par commune, recettes) | M | Rapport annuel généré automatiquement |

---

## 9. Architecture technique cible

### 9.1 Vue d'ensemble

```
                       ┌──────────────────────────────────────────────┐
  Usagers ────────────►│  Front portail (CMS + design system)         │◄──── Agents
  (web, mobile, PWA)   │  Pages · Agenda · Mon compte · Carte festival│     (back-offices)
                       └───────────────┬──────────────────────────────┘
                                       │
          FranceConnect ──► [Socle d'identité : SSO OpenID Connect] ◄── ProConnect (agents)
                                       │
                               [API Gateway]
            ┌──────────────┬───────────┼───────────────┬──────────────────┐
            ▼              ▼           ▼               ▼                  ▼
     [Guichet Unique] [Régie partagée] [Base événementielle] [Billetterie SaaS] [Recherche]
            │              ▲           │                    │
            ▼              │           ▼                    ▼
   [Service d'extraction]  │   [Open data DATAtourisme]   [SIBIL] [Paiement]
            │              │
            ▼              │
   [Moteur de règles]──►[Bus d'événements / Orchestrateur]──► GED · Parapheur · Domaine public
                                                              Préfecture · Finances · SMS/e-mail
  ──────────────────────────────────────────────────────────────────────────────
  Socle transverse : hébergement France · journal d'audit · supervision · sauvegardes · coffre de secrets
```

### 9.2 Exigences d'architecture

| ID | Exigence | Prio |
|---|---|---|
| EXT-ARC-01 | Architecture modulaire : chaque lot expose et consomme des API documentées (OpenAPI 3.x). Aucun accès direct d'un lot à la base de données d'un autre. | M |
| EXT-ARC-02 | Briques open source sous licence approuvée OSI pour le CMS, le socle d'identité, le moteur de formulaires et la recherche | M |
| EXT-ARC-03 | Conteneurisation (OCI) et déploiement reproductible (infrastructure as code) | M |
| EXT-ARC-04 | 3 environnements minimum : développement, recette (données anonymisées), production | M |
| EXT-ARC-05 | Code source déposé dans un dépôt Git propriété de la Ville, avec intégration et déploiement continus | M |
| EXT-ARC-06 | Séparation stricte des données du Guichet et de la Régie (bases et sauvegardes distinctes, chiffrées) | M |
| EXT-ARC-07 | Front-office rendu côté serveur ou statique pour les pages publiques. JavaScript limité aux composants interactifs (amélioration progressive). | M |

### 9.3 Socle technologique attendu

Les références citées sont indicatives et s'entendent « ou équivalent ».

| Composant | Exigence | Exemples de solutions |
|---|---|---|
| CMS | Open source, communauté active, LTS ≥ 3 ans, gestion multisite et multilingue native, API de contenu | Drupal, Wagtail, ou équivalent |
| Socle d'identité | OpenID Connect, fédération FranceConnect et ProConnect, MFA agents | Keycloak, ou équivalent |
| Moteur de formulaires | Formulaires déclaratifs (JSON Schema), logique conditionnelle, versionnage | Solution open source ou développement spécifique |
| Moteur de règles | Règles métier externalisées, éditables et testables par un administrateur fonctionnel | Moteur de règles déclaratif |
| OCR et classification | Modèles exécutables sur infrastructure hébergée en France | docTR, Tesseract, modèles de classification open source |
| Orchestrateur | Auto-hébergé, workflows versionnés | Windmill, n8n, Node-RED, ou équivalent |
| Bus d'événements | Persistance, rejeu, partitionnement | RabbitMQ, NATS JetStream, ou équivalent |
| Recherche | Plein texte, tolérance aux fautes, facettes | Meilisearch, OpenSearch, ou équivalent |
| Base de données | Relationnelle, chiffrement au repos | PostgreSQL |
| Stockage de fichiers | Objet, compatible S3, chiffré, versionné | Stockage objet de l'hébergeur |
| Supervision | Métriques, journaux centralisés, alerting | Prometheus, Grafana, OpenSearch, ou équivalent |

---

## 10. Interopérabilité et interfaces

| Système | Sens | Protocole / format | Fréquence | Lot |
|---|---|---|---|---|
| FranceConnect | Entrant | OpenID Connect | Temps réel | 1 |
| ProConnect (agents) | Entrant | OpenID Connect | Temps réel | 1 |
| API Particulier (quotient familial) | Entrant | REST, habilitation DataPass | Temps réel, à la demande | 4 |
| API Entreprise (RNA, SIRENE, associations) | Entrant | REST, habilitation DataPass | Temps réel, à la demande | 2 |
| GED municipale | Sortant | API REST ou CMIS | Événementiel | 2 |
| Parapheur électronique | Bidirectionnel | API REST, webhooks | Événementiel | 2 |
| Logiciel de gestion du domaine public | Bidirectionnel | API REST, ou échange de fichiers SFTP en solution transitoire | Événementiel ou quotidien | 2 |
| Logiciel financier (titres de recette) | Sortant | Format d'échange de l'éditeur | Quotidien | 2, 3 |
| Plateforme de paiement en ligne | Bidirectionnel | API du prestataire | Temps réel | 4 |
| SIBIL | Sortant | Format ministériel en vigueur | Selon le calendrier réglementaire | 4 |
| data.gouv.fr | Sortant | API data.gouv.fr, schéma DATAtourisme | Quotidien | 1 |
| Office de tourisme | Sortant | Flux DATAtourisme / API | Quotidien | 1 |
| Passerelle SMS et e-mail | Sortant | API REST, SMTP authentifié | Événementiel | 1 |
| Préfecture (déclarations de manifestations) | Sortant | Démarche dématérialisée de l'État disponible, ou dossier généré | Événementiel | 2 |

**Exigences transverses d'interopérabilité**

| ID | Exigence | Prio |
|---|---|---|
| EXT-INT-01 | Conformité au RGI v2 (formats ouverts, protocoles standards) | M |
| EXT-INT-02 | Documentation OpenAPI publiée pour chaque API exposée, avec environnement de test (bac à sable) | M |
| EXT-INT-03 | Versionnage sémantique des API, maintien de la version N-1 pendant 12 mois minimum | M |
| EXT-INT-04 | Encodage UTF-8, dates ISO 8601, géodonnées en WGS 84 (EPSG:4326) | M |

---

## 11. Sécurité des systèmes d'information

| ID | Exigence | Prio |
|---|---|---|
| EXT-SEC-01 | Démarche d'homologation de sécurité selon le RGS v2. Le titulaire fournit l'analyse de risques (méthode EBIOS Risk Manager) et le dossier d'homologation. | M |
| EXT-SEC-02 | Authentification multifacteur obligatoire pour tous les comptes agents et administrateurs | M |
| EXT-SEC-03 | Gestion fine des droits (RBAC) par rôle, par service et par démarche. Principe du moindre privilège. | M |
| EXT-SEC-04 | Chiffrement TLS 1.2 minimum (1.3 recommandé), HSTS, chiffrement des données au repos (AES-256) | M |
| EXT-SEC-05 | En-têtes de sécurité HTTP : Content-Security-Policy stricte, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | M |
| EXT-SEC-06 | Développement conforme à OWASP ASVS niveau 2 pour le Guichet, la Régie et le compte usager | M |
| EXT-SEC-07 | Test d'intrusion par un prestataire indépendant avant mise en production, puis annuellement. Corrections des vulnérabilités critiques avant mise en ligne. | M |
| EXT-SEC-08 | Pare-feu applicatif (WAF) et protection contre le déni de service | M |
| EXT-SEC-09 | Journalisation des accès et des actions sensibles, horodatée et non modifiable, conservée 12 mois | M |
| EXT-SEC-10 | Délais de correction : vulnérabilité critique sous 72 h, élevée sous 7 jours, moyenne sous 30 jours | M |
| EXT-SEC-11 | Analyse antivirale de tout fichier déposé, avec mise en quarantaine | M |
| EXT-SEC-12 | Veille de sécurité sur les dépendances (inventaire des composants logiciels SBOM, analyse automatisée dans l'intégration continue) | M |

---

## 12. Protection des données personnelles et transparence algorithmique

### 12.1 Registre des traitements concernés

| Traitement | Finalité | Base légale | Durée de conservation indicative |
|---|---|---|---|
| Compte usager | Accès aux services | Exécution d'une mission d'intérêt public | Durée d'activité + 3 ans d'inactivité |
| Instruction des démarches | Délivrance des autorisations | Mission d'intérêt public, obligation légale | Selon le référentiel de conservation des archives publiques |
| Extraction automatisée des pièces | Pré-instruction | Mission d'intérêt public | Durée de vie du dossier |
| Billetterie | Vente et contrôle d'accès | Exécution d'un contrat | 3 ans (commercial), 10 ans (pièces comptables) |
| Tarification sociale | Application du tarif réduit | Consentement | Le résultat de vérification seul est conservé, jamais le justificatif |
| Régie partagée | Gestion des prêts | Mission d'intérêt public, exécution d'une convention | 5 ans après la clôture de la réservation |
| Mesure d'audience | Statistiques | Exemption de consentement selon les conditions de la CNIL | 13 mois maximum |

### 12.2 Exigences

| ID | Exigence | Prio |
|---|---|---|
| EXT-RGP-01 | Analyse d'impact relative à la protection des données (AIPD) pour le Guichet Unique et sa chaîne d'extraction, réalisée avec le délégué à la protection des données de la Ville | M |
| EXT-RGP-02 | Protection des données dès la conception et par défaut : minimisation, pseudonymisation des environnements de recette | M |
| EXT-RGP-03 | Hébergement et traitement des données exclusivement dans l'UE, en France de préférence. Aucun sous-traitant soumis à une législation extra-européenne d'accès aux données sans garanties équivalentes. | M |
| EXT-RGP-04 | Aucun traceur tiers soumis à consentement sur le portail | M |
| EXT-RGP-05 | Purge automatique selon les durées de conservation paramétrées | M |
| EXT-RGP-06 | Contrat de sous-traitance conforme à l'article 28 du RGPD, liste exhaustive des sous-traitants ultérieurs | M |

### 12.3 Transparence algorithmique

| ID | Exigence | Prio |
|---|---|---|
| EXT-ALG-01 | Mention explicite, sur chaque décision individuelle préparée par un traitement algorithmique, de l'existence de ce traitement et du droit d'obtenir communication de ses règles (CRPA, L.311-3-1) | M |
| EXT-ALG-02 | Publication en ligne des règles définissant les principaux traitements algorithmiques : contrôles de complétude, calcul des redevances, priorités de réservation (CRPA, L.312-1-3) | M |
| EXT-ALG-03 | Page « Algorithmes publics » rédigée en langage clair, avec une fiche par traitement : finalité, données, règles, part d'intervention humaine | M |
| EXT-ALG-04 | Capacité à fournir sur demande, pour un dossier donné, le détail des règles appliquées et des données utilisées | M |

---

## 13. Accessibilité numérique

| ID | Exigence | Prio | Vérification |
|---|---|---|---|
| EXT-ACC-01 | Conformité totale au RGAA 4.1.2 (100 % des critères applicables) sur l'échantillon d'audit | M | Audit indépendant avant mise en production |
| EXT-ACC-02 | Conformité des composants complexes : formulaires multi-étapes, carte, planning, sélecteurs de date, téléversement de fichiers | M | Tests avec NVDA, JAWS, VoiceOver et TalkBack |
| EXT-ACC-03 | Documents générés (arrêtés, conventions, billets) au format PDF/UA ou en alternative HTML accessible | M | Contrôle par échantillon |
| EXT-ACC-04 | Bibliothèque de composants accessibles documentée, réutilisable par les 4 lots | M | Livrable du Lot 1 |
| EXT-ACC-05 | Tests utilisateurs avec au moins 6 personnes en situation de handicap (visuel, moteur, cognitif) pendant la conception | M | Rapport de tests |
| EXT-ACC-06 | Rédaction de la déclaration d'accessibilité et du schéma pluriannuel 2027-2029 | M | Pages publiées |
| EXT-ACC-07 | Vidéos sous-titrées, transcription textuelle, et audiodescription pour les contenus de présentation des spectacles | S | Contrôle par échantillon |
| EXT-ACC-08 | Contrôles d'accessibilité automatisés dans l'intégration continue, sans régression bloquante | M | Rapport à chaque livraison |

---

## 14. Écoconception

**Budget environnemental par page**

| Indicateur | Cible | Mesure |
|---|---|---|
| Poids médian des pages | < 1 Mo (pages publiques) | Outil de mesure en intégration continue, sur 30 pages de référence |
| Poids maximal | < 2 Mo, hors carte et médias explicitement demandés par l'usager | Idem |
| Nombre de requêtes HTTP | < 40 par page | Idem |
| Score EcoIndex | Note B minimum sur 80 % des pages de référence | Mesure trimestrielle |
| Services tiers | 0 chargement tiers non essentiel | Audit |

| ID | Exigence | Prio |
|---|---|---|
| EXT-ECO-01 | Application du RGESN. Déclaration d'écoconception publiée, avec la grille d'évaluation renseignée. | M |
| EXT-ECO-02 | Images en formats modernes (AVIF, WebP), dimensionnées côté serveur, chargement différé hors écran | M |
| EXT-ECO-03 | Vidéos sans lecture automatique, hébergées sur une plateforme sans traceurs, en définition adaptée | M |
| EXT-ECO-04 | Polices système, ou une seule famille de polices auto-hébergée en sous-ensemble | S |
| EXT-ECO-05 | Mise en cache agressive des ressources statiques, CDN européen | M |
| EXT-ECO-06 | Compatibilité avec des terminaux anciens : navigateurs des 5 dernières années, appareils Android 8 et plus | M |
| EXT-ECO-07 | Hébergeur engagé sur l'efficacité énergétique (indicateur PUE publié) et la durée de vie du matériel | S |
| EXT-ECO-08 | Purge des contenus obsolètes intégrée au workflow éditorial (alerte de révision à 18 mois) | S |

---

## 15. Performance, disponibilité et montée en charge

| Indicateur | Période courante | Période festival (du J-15 au J+3) |
|---|---|---|
| Disponibilité mensuelle (hors maintenance programmée) | ≥ 99,8 % | ≥ 99,95 % |
| LCP (Largest Contentful Paint), mobile 4G | < 2,5 s | < 2,5 s |
| INP (Interaction to Next Paint) | < 200 ms | < 200 ms |
| CLS (Cumulative Layout Shift) | < 0,1 | < 0,1 |
| Temps de réponse des API (95e centile) | < 500 ms | < 800 ms |
| Utilisateurs simultanés supportés | 1 000 | 15 000 sur le portail, 5 000 sur la billetterie |
| Fenêtre de maintenance programmée | Mardi de 6 h à 8 h | **Gel des mises en production du 1er juillet au 15 septembre**, sauf correctif de sécurité |

| ID | Exigence | Prio |
|---|---|---|
| EXT-PERF-01 | Tests de charge réalisés avant chaque édition du festival, sur un scénario validé par la Ville | M |
| EXT-PERF-02 | Mise à l'échelle horizontale du portail et de la billetterie | M |
| EXT-PERF-03 | Mode dégradé : programme du festival et alertes servis en pages statiques en cas d'indisponibilité du CMS | M |

---

## 16. Hébergement et exploitation

| ID | Exigence | Prio |
|---|---|---|
| EXT-HEB-01 | Hébergement en France, chez un prestataire certifié ISO/IEC 27001. La qualification SecNumCloud est valorisée. | M |
| EXT-HEB-02 | Sauvegardes quotidiennes chiffrées, rétention de 30 jours, copie sur un second site géographiquement distinct | M |
| EXT-HEB-03 | Plan de reprise d'activité : RPO 24 h et RTO 8 h pour le portail ; RPO 1 h et RTO 4 h pour le Guichet, la Régie et la billetterie | M |
| EXT-HEB-04 | Test de restauration réel au moins 2 fois par an, avec procès-verbal | M |
| EXT-HEB-05 | Supervision 24 h/24 et 7 j/7, astreinte du titulaire pendant la période festival | M |
| EXT-HEB-06 | Accès en lecture aux tableaux de bord de supervision pour la DSI | M |
| EXT-HEB-07 | Rapport mensuel d'exploitation : disponibilité, incidents, performances, sécurité, empreinte environnementale | M |

---

## 17. Contenus, reprise de l'existant et migration

### 17.1 Volumétrie

| Site source | Pages | Médias | Documents (PDF) | Domaine |
|---|---|---|---|---|
| Site ville | Environ 1 800 | Environ 7 500 | Environ 1 900 | vaugrenelle.fr |
| La Filature | Environ 350 | Environ 2 200 | Environ 180 | lafilature-vaugrenelle.fr |
| Théâtre Jean-Vilar | Environ 280 | Environ 1 300 | Environ 120 | theatre-vaugrenelle.fr |
| Les Échappées | Environ 420 | Environ 1 000 | Environ 200 | lesechappees.fr |
| Billetterie actuelle | — | — | — | Sous-domaine de l'éditeur |
| Guichet v1 | Dossiers en cours et historiques sur 5 ans | — | Pièces jointes associées | guichet.vaugrenelle.fr |
| Tableau du parc matériel | Environ 1 900 lignes | — | — | Tableur partagé |

### 17.2 Exigences

| ID | Exigence | Prio |
|---|---|---|
| EXF-MIG-01 | Audit de contenus avec la Ville : chaque page classée « conserver, réécrire, fusionner ou supprimer ». Objectif : réduire d'au moins 40 % le nombre de pages. | M |
| EXF-MIG-02 | Migration automatisée des contenus conservés, avec contrôle qualité par échantillon | M |
| EXF-MIG-03 | Plan de redirections HTTP 301 pour toutes les URL indexées des anciens domaines, maintenu au moins 3 ans | M |
| EXF-MIG-04 | Traitement des PDF : conversion en HTML pour les 200 documents les plus consultés, archivage des autres avec mention de non-accessibilité et possibilité de demander une version accessible | M |
| EXF-MIG-05 | Reprise des dossiers du Guichet v1 en cours, sans interruption de service pour les usagers | M |
| EXF-MIG-06 | Reprise du parc matériel : nettoyage des données, création des articles, génération des QR codes et procédure d'étiquetage | M |
| EXF-MIG-07 | Conservation des comptes et de l'historique de billetterie, sous réserve de la réversibilité offerte par l'éditeur sortant | S |

---

## 18. Gouvernance et méthodologie projet

### 18.1 Organisation

| Instance | Composition | Fréquence | Rôle |
|---|---|---|---|
| Comité de pilotage | Adjoint Culture et espace public, conseillère déléguée Ville numérique, DGS, directeurs Culture et DSI, chefs de projet des titulaires | Mensuelle | Arbitrages, budget, planning |
| Comité de projet | Chefs de projet Ville (Culture et DSI), titulaires des 4 lots, DPO selon l'ordre du jour | Hebdomadaire | Suivi opérationnel, risques, dépendances |
| Comité d'usagers | Panel d'habitants, 3 associations, 2 compagnies, 1 secrétaire de mairie de l'agglomération, 2 agents France Services | 3 sessions minimum | Tests et retours sur les maquettes et versions |
| Atelier métier | Régisseur général, instructeurs, éditeurs | Selon les sprints | Spécifications détaillées, recette fonctionnelle |

### 18.2 Méthodologie

- Démarche **agile** en sprints de 2 semaines, avec démonstration en fin de sprint.
- **Backlog unique** partagé entre les lots, priorisé par la Ville. Le titulaire du Lot 1 anime la synchronisation inter-lots.
- **Conception centrée sur l'usager** : entretiens, tests de maquettes et tests utilisateurs sur les parcours critiques.
- **Définition de « terminé »** commune à tous les lots : tests automatisés, accessibilité vérifiée, budget environnemental respecté, documentation à jour.

---

## 19. Planning prévisionnel

| Phase | Période | Jalons |
|---|---|---|
| Consultation | Novembre 2026 – janvier 2027 | Publication, remise des offres, analyse, notification fin janvier 2027 |
| Cadrage | Février 2027 | Réunion de lancement, plan projet, audit de contenus, ateliers usagers |
| Conception | Février – mars 2027 | Design system, maquettes validées, spécifications détaillées des interfaces |
| Réalisation – incrément 1 | Mars – mai 2027 | Portail, agenda, compte usager, Guichet intégré, billetterie, catalogue et réservation de la Régie |
| Recette et audits | Mai – mi-juin 2027 | Recette fonctionnelle, audit RGAA, test d'intrusion, tests de charge |
| **Mise en production 1** | **Fin juin 2027** | Bascule des 5 sites, avant l'édition 2027 des Échappées |
| Gel festival | 1er juillet – 15 septembre 2027 | Correctifs uniquement, astreinte renforcée |
| Réalisation – incrément 2 | Septembre – décembre 2027 | Logistique mobile, maintenance réglementaire, accueil technique des compagnies, studio de démarches, open data complet |
| **Mise en production 2** | **Décembre 2027** | Régie partagée complète, ouverture aux 26 communes de l'agglomération |
| Vérification de service régulier | Janvier 2028 | Réception définitive |

**Chemin critique :** habilitations DataPass (API Particulier, API Entreprise), raccordement FranceConnect, interfaces avec le parapheur et la GED. Ces démarches sont engagées par la Ville dès la notification.

---

## 20. Recette et réception

| Étape | Contenu | Responsable | Critère de passage |
|---|---|---|---|
| Recette interne du titulaire | Tests unitaires, d'intégration et de bout en bout, couverture ≥ 70 % sur le code métier | Titulaire | Rapport de tests transmis |
| Vérification d'aptitude (VA) | Recette fonctionnelle sur l'environnement de recette, scénarios fournis par la Ville | Ville | 0 anomalie bloquante, ≤ 5 anomalies majeures |
| Audits de conformité | RGAA, sécurité (test d'intrusion), écoconception, performance | Prestataires indépendants | Conformité aux exigences des sections 11, 13, 14 et 15 |
| Homologation de sécurité | Dossier d'homologation, décision de l'autorité d'homologation | Ville | Décision d'homologation signée |
| Mise en production | Bascule, redirections, supervision | Titulaire | Plan de bascule et de retour arrière validés |
| Vérification de service régulier (VSR) | 30 jours d'exploitation sans anomalie bloquante | Ville | Procès-verbal de réception |

**Classification des anomalies**

| Niveau | Définition |
|---|---|
| Bloquante | Fonction critique indisponible (dépôt de dossier, paiement, réservation, connexion) ou faille de sécurité, sans contournement |
| Majeure | Fonction dégradée avec contournement, ou non-conformité réglementaire (RGAA, RGPD) |
| Mineure | Défaut sans impact sur le service rendu |

---

## 21. Maintenance, support et niveaux de service

| Priorité | Exemple | Prise en charge | Contournement | Résolution |
|---|---|---|---|---|
| P1 – Critique | Portail, billetterie ou Guichet indisponible, faille exploitée | 30 min (24 h/24 et 7 j/7) | 4 h | 24 h |
| P2 – Majeure | Fonction importante dégradée, flux inter-systèmes en erreur | 2 h ouvrées | 1 jour ouvré | 3 jours ouvrés |
| P3 – Mineure | Défaut d'affichage, anomalie sans impact sur le service | 1 jour ouvré | — | Prochaine version |
| P4 – Demande | Question, assistance à l'usage | 2 jours ouvrés | — | Selon la planification |

En période festival, la prise en charge P1 est ramenée à 15 minutes et la résolution P2 à 1 jour ouvré.

**Pénalités :** le non-respect des engagements P1 et P2 et de la disponibilité donne lieu à des pénalités définies au CCAP (cahier des clauses administratives particulières), plafonnées à 10 % du montant annuel de maintenance.

**Maintenance évolutive :** les évolutions sont commandées par bons de commande, sur la base d'un bordereau de prix unitaires (jour-homme par profil) remis avec l'offre.

**Maintenance de sécurité et mises à jour :** les versions majeures des briques logicielles sont appliquées dans les 6 mois suivant leur publication, sans coût supplémentaire.

---

## 22. Propriété intellectuelle et réversibilité

| ID | Exigence | Prio |
|---|---|---|
| EXT-PI-01 | Cession à la Ville des droits patrimoniaux sur les développements spécifiques, le design system et les contenus produits | M |
| EXT-PI-02 | Publication des développements spécifiques sous licence libre, au choix de la Ville, dans une logique de mutualisation entre collectivités | S |
| EXT-PI-03 | Fourniture du code source, de la documentation d'architecture, d'exploitation et d'administration, des scripts d'infrastructure et des workflows de l'orchestrateur | M |
| EXT-REV-01 | Plan de réversibilité remis 3 mois après la notification et mis à jour annuellement | M |
| EXT-REV-02 | Export complet des données dans des formats ouverts et documentés (SQL, JSON, CSV, fichiers originaux) | M |
| EXT-REV-03 | Accompagnement à la réversibilité de 3 mois au prix du marché, avec transfert de connaissances vers le nouveau titulaire ou la DSI | M |
| EXT-REV-04 | Pour la billetterie SaaS (Lot 4) : export des comptes spectateurs, de l'historique des ventes et des paramétrages, sans frais | M |

---

## 23. Formation et conduite du changement

| Public | Contenu | Format | Volume |
|---|---|---|---|
| Éditeurs web (environ 25 agents) | CMS, écriture web, accessibilité éditoriale, écoconception des contenus | Ateliers en présentiel et tutoriels vidéo | 2 sessions d'une journée |
| Instructeurs (environ 30 agents) | Back-office du Guichet, avis, génération d'actes, lecture des contrôles automatiques | Ateliers sur cas réels | 3 sessions d'une demi-journée |
| Équipe technique (régie, environ 15 personnes dont intermittents) | Planning, application mobile, maintenance, inventaire | Formation sur site, en situation | 2 sessions et accompagnement au premier montage |
| Administrateurs fonctionnels (4 agents) | Studio de démarches, règles, tarifs, workflows | Formation avancée | 3 jours |
| Agents France Services (6 agents) | Mode aidant, parcours usagers, accompagnement | Atelier | 1 demi-journée |
| Associations et communes de l'agglomération | Dépôt de dossier, réservation de matériel | Webinaires enregistrés et guide pas à pas | 4 webinaires |

**Livrables :** guides utilisateurs par profil, tutoriels vidéo sous-titrés de 3 minutes maximum, base de connaissances en ligne, et kit de communication pour le lancement (vidéo, affiches, communication aux associations).

---

## 24. Indicateurs de succès

| Indicateur | Référence 2026 | Cible fin 2027 | Cible fin 2028 |
|---|---|---|---|
| Délai moyen d'instruction d'un dossier événement | 6 jours | 5 jours | 4 jours |
| Taux de dossiers incomplets au dépôt | 9 % | 6 % | 5 % |
| Part des démarches déposées en ligne | 68 % | 85 % | 90 % |
| Taux de conformité RGAA | 38 % | 100 % | 100 % |
| Poids médian des pages | 3,4 Mo | < 1 Mo | < 1 Mo |
| Saisies multiples de l'agenda | 3 | 1 | 1 |
| Taux d'utilisation du parc matériel | Non mesuré | Mesuré (référence) | + 15 % |
| Pertes et casses de matériel (valeur annuelle) | Non mesurées | Mesurées (référence) | – 30 % |
| Vérifications réglementaires réalisées dans les délais | Non tracé | 100 % | 100 % |
| Communes de l'agglomération utilisatrices de la Régie | 3 (informel) | 12 | 20 |
| Satisfaction usagers (enquête intégrée aux parcours) | — | ≥ 7,5/10 | ≥ 8/10 |
| Bénéficiaires de la tarification sociale | Environ 900 | + 25 % | + 40 % |

---

## 25. Budget prévisionnel

| Lot | Investissement (HT) | Maintenance et hébergement annuels (HT) |
|---|---|---|
| Lot 1 — Portail, design system, intégration, migration | 105 000 € | 14 000 € |
| Lot 2 — Guichet Unique et services automatisés | 60 000 € | 9 000 € |
| Lot 3 — Régie partagée | 50 000 € | 6 000 € |
| Lot 4 — Billetterie en marque blanche (paramétrage et intégration) | 15 000 € | 6 000 € (abonnement, hors commissions éventuelles) |
| **Total** | **230 000 €** | **35 000 € / an** |
| Prestations externes Ville (hors marché) : audits RGAA, test d'intrusion, AIPD accompagnée | 22 000 € | 8 000 € / an |

**Financements mobilisables envisagés :** dotation de soutien à l'investissement local (DSIL), fonds européens (FEDER, volet numérique), programmes nationaux de soutien à la transformation numérique des collectivités selon les appels en cours.

---

## 26. Contenu attendu des offres et critères d'analyse

### 26.1 Pièces techniques attendues

- Mémoire technique structuré selon le plan du présent cahier des charges, avec réponse exigence par exigence (tableau de conformité fourni en annexe A).
- Architecture proposée, schémas et justification des choix technologiques.
- Méthodologie projet, planning détaillé et organisation de l'équipe (CV des profils clés).
- Démarche accessibilité, écoconception et sécurité, avec références vérifiables.
- Plan de réversibilité préliminaire.
- Pour le Lot 2 : protocole d'évaluation des modèles d'extraction et résultats sur un jeu de pièces anonymisées fourni par la Ville.
- Pour le Lot 3 : démonstration de l'application mobile hors ligne.
- Au moins 2 références comparables (collectivité ou établissement culturel) des 3 dernières années.

### 26.2 Critères d'analyse

| Critère | Pondération |
|---|---|
| Valeur technique | **55 %** |
| — Pertinence de l'architecture et de la réponse fonctionnelle | 20 % |
| — Accessibilité, écoconception, sécurité et protection des données | 15 % |
| — Méthodologie, planning, équipe et accompagnement au changement | 12 % |
| — Réversibilité, ouverture, part de briques open source | 8 % |
| Prix | **35 %** |
| Démonstration ou soutenance (candidats retenus en phase finale) | **10 %** |

---

## 27. Annexes

| Annexe | Contenu |
|---|---|
| A | Tableau de conformité aux exigences (à compléter par le candidat) |
| B | Audit RGAA du site actuel (2026) |
| C | Inventaire du parc matériel (extrait anonymisé, 1 900 lignes) |
| D | Description fonctionnelle et technique du Guichet Unique v1 |
| E | Grilles tarifaires délibérées (domaine public, prêt de matériel) |
| F | Fiches techniques de la Filature, du théâtre et des 4 sites de l'espace public |
| G | Charte graphique actuelle et éléments d'identité des Échappées |
| H | Jeu de 100 pièces justificatives anonymisées pour l'évaluation du Lot 2 |
| I | Statistiques de fréquentation des 5 sites (12 derniers mois) |
| J | Cartographie des logiciels métiers et de leurs interfaces disponibles |
| K | Règlement de prêt de matériel en vigueur |

---

*Fin du document — Ville de Vaugrenelle — VGR-2026-NUM-014 — Version 1.0*
