// Collections de contenu fictif, validées par Zod (brief § 6).
// Les dates sont saisies en décalage de jours par rapport à la date du build.
// Elles restent brutes ici : Astro met en cache les données des collections,
// et des dates converties se périmeraient d'un build à l'autre. La conversion
// en objets Date se fait à la lecture, dans src/lib/content.ts.
import { defineCollection, reference, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

const heure = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure attendue au format HH:MM');
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Identifiant en minuscules et tirets');

// ---------- Lieux ----------
const lieux = defineCollection({
  loader: file('src/content/lieux/lieux.json'),
  schema: z.object({
    id: slug,
    nom: z.string(),
    type: z.enum(['salle', 'chapiteau', 'espace-public']),
    adresse: z.string(),
    coords: z.object({ x: z.number().min(0).max(1000), y: z.number().min(0).max(700) }),
    jauge: z.number().int().positive(),
    accessibilite: z.string(),
    alimentations: z
      .array(z.object({ puissance_kva: z.number().positive(), prises: z.string() }))
      .optional(),
    accroches: z
      .object({ nombre: z.number().int().positive(), charge_max_kg: z.number().positive() })
      .optional(),
  }),
});

// ---------- Événements ----------
const disciplines = [
  'cirque',
  'theatre-de-rue',
  'musique',
  'danse',
  'marionnette',
  'jeune-public',
] as const;
const accessibilites = ['pmr', 'lsf', 'audiodescription', 'boucle-magnetique', 'relax'] as const;

const evenements = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/evenements' }),
  schema: ({ image }) =>
    z
      .object({
        titre: z.string(),
        resume: z.string().max(200),
        // Soit un décalage en jours depuis le build, soit un jour du festival (1 à 4)
        quand: z.union([
          z.object({ jour: z.number().int().min(0).max(92) }),
          z.object({ festival_jour: z.number().int().min(1).max(4) }),
        ]),
        heure,
        duree_min: z.number().int().positive(),
        lieu: reference('lieux'),
        discipline: z.enum(disciplines),
        gratuit: z.boolean(),
        tarifs: z
          .array(z.object({ libelle: z.string(), prix: z.number().nonnegative() }))
          .optional(),
        accessibilite: z.array(z.enum(accessibilites)).default([]),
        compagnie: z.string(),
        jauge: z.number().int().positive().optional(),
        image: image().optional(),
      })
      .refine((e) => e.gratuit || (e.tarifs?.length ?? 0) > 0, {
        message: 'Un événement payant doit avoir au moins un tarif',
      }),
});

// ---------- Matériel de la Régie ----------
const profils = ['interne', 'association', 'commune-agglo', 'compagnie'] as const;

const materiel = defineCollection({
  loader: file('src/content/materiel/materiel.json'),
  schema: z
    .object({
      id: slug,
      designation: z.string(),
      famille: z.enum(['son', 'lumiere', 'video', 'structure', 'energie', 'praticable']),
      marque_modele: z.string(),
      description: z.string(),
      quantite: z.number().int().positive(),
      caracteristiques: z.array(z.object({ libelle: z.string(), valeur: z.string() })).min(1),
      puissance_w: z.number().nonnegative().optional(),
      poids_kg: z.number().positive().optional(),
      tarifs: z
        .array(z.object({ profil: z.enum(profils), jour: z.number().nonnegative() }))
        .length(profils.length),
      caution: z.number().nonnegative(),
      prestation_technicien_requise: z.boolean(),
      // Échéance en jours depuis le build : négative = vérification dépassée
      verification: z.object({ type: z.string(), echeance_jours: z.number().int() }).optional(),
    })
    .refine((m) => new Set(m.tarifs.map((t) => t.profil)).size === profils.length, {
      message: 'Un tarif par profil est attendu',
    }),
});

// ---------- Packs ----------
const packs = defineCollection({
  loader: file('src/content/packs/packs.json'),
  schema: z.object({
    id: slug,
    nom: z.string(),
    usage: z.string(),
    jauge_indicative: z.number().int().positive(),
    composition: z
      .array(z.object({ materiel: reference('materiel'), quantite: z.number().int().positive() }))
      .min(2),
  }),
});

// ---------- Démarches ----------
const demarches = defineCollection({
  loader: file('src/content/demarches/demarches.json'),
  schema: z.object({
    id: slug,
    titre: z.string(),
    categorie: z.enum(['evenements', 'domaine-public', 'associations', 'cadre-de-vie', 'culture']),
    resume: z.string().max(200),
    delai_indicatif: z.string(),
    pieces: z.array(z.string()),
    en_ligne: z.boolean(),
  }),
});

// ---------- Réservations existantes (calcul des disponibilités) ----------
const reservations = defineCollection({
  loader: file('src/content/reservations/reservations.json'),
  schema: z
    .object({
      id: slug,
      materiel: reference('materiel'),
      quantite: z.number().int().positive(),
      jour_debut: z.number().int().min(-30).max(92),
      jour_fin: z.number().int().min(-30).max(92),
      demandeur_fictif: z.string(),
    })
    .refine((r) => r.jour_fin >= r.jour_debut, { message: 'La fin précède le début' }),
});

// ---------- Actualités ----------
const actualites = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/actualites' }),
  schema: z.object({
    titre: z.string(),
    resume: z.string().max(200),
    publie_jour: z.number().int().max(0), // décalage en jours, dans le passé
    rubrique: z.enum(['sortir', 'agir', 'regie', 'habiter']),
  }),
});

export const collections = {
  lieux,
  evenements,
  materiel,
  packs,
  demarches,
  reservations,
  actualites,
};
