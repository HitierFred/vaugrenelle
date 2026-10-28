// Contrôles d'intégrité des données fictives, exécutés au build.
// Zod valide chaque entrée ; ces règles croisent les collections (brief § 6).
// Module réservé au build : il lit les collections Astro.
import { getCollection } from 'astro:content';
import { getActualites, getEvenements, getMateriel, getReservations } from './content';
import { FESTIVAL, REFERENCE_DATE, fromReference } from './reference-date';

export interface Check {
  label: string;
  ok: boolean;
  detail: string;
  blocking: boolean; // un contrôle bloquant en échec fait échouer le build
}

const DAY = 86_400_000;

export async function runDataChecks() {
  const [evenements, lieux, materiel, packs, demarches, reservations, actualites] =
    await Promise.all([
      getEvenements(),
      getCollection('lieux'),
      getMateriel(),
      getCollection('packs'),
      getCollection('demarches'),
      getReservations(),
      getActualites(),
    ]);

  const checks: Check[] = [];
  const add = (label: string, ok: boolean, detail: string, blocking = true) =>
    checks.push({ label, ok, detail, blocking });

  const lieuIds = new Set(lieux.map((l) => l.id));
  const stock = new Map(materiel.map((m) => [m.id, m.data.quantite]));
  const festivalEvents = evenements.filter((e) => e.data.festival);
  const horizon = fromReference(93);

  // --- Volumes minimum (brief § 6) ---
  const volumes: [string, number, number][] = [
    ['Événements', evenements.length, 30],
    ['dont pendant le festival', festivalEvents.length, 12],
    ['Lieux', lieux.length, 6],
    ['Références de matériel', materiel.length, 40],
    ['Packs', packs.length, 6],
    ['Démarches', demarches.length, 10],
    ['Réservations existantes', reservations.length, 15],
  ];
  for (const [label, n, min] of volumes) {
    add(`Volume : ${label}`, n >= min, `${n} pour un minimum de ${min}`);
  }

  // --- Événements ---
  const outOfWindow = evenements.filter(
    (e) => e.data.debut < REFERENCE_DATE || e.data.debut >= horizon,
  );
  add(
    'Événements dans les 3 mois à venir',
    outOfWindow.length === 0,
    outOfWindow.length ? `Hors fenêtre : ${outOfWindow.map((e) => e.id).join(', ')}` : 'Tous',
  );

  const inFestival = (d: Date) => d >= FESTIVAL.debut && d < FESTIVAL.fin;
  const festivalMismatch = evenements.filter((e) => e.data.festival !== inFestival(e.data.debut));
  add(
    'Événements du festival dans ses dates, et eux seuls',
    festivalMismatch.length === 0,
    festivalMismatch.length ? festivalMismatch.map((e) => e.id).join(', ') : 'Cohérent',
  );

  const badLieux = evenements.filter((e) => !lieuIds.has(e.data.lieu.id));
  add(
    'Lieux des événements existants',
    badLieux.length === 0,
    badLieux.length ? badLieux.map((e) => `${e.id} → ${e.data.lieu.id}`).join(', ') : 'Tous',
  );

  const nextWeek = evenements.filter((e) => e.data.debut < fromReference(7)).length;
  add('Événements dans les 7 prochains jours (accueil)', nextWeek >= 3, `${nextWeek} événements`);

  const disciplines = new Set(evenements.map((e) => e.data.discipline));
  add('Les 6 disciplines représentées', disciplines.size === 6, `${disciplines.size} disciplines`);

  // --- Lieux ---
  const sitesPublics = lieux.filter((l) => l.data.type === 'espace-public');
  const sansAlim = sitesPublics.filter((l) => !l.data.alimentations?.length);
  add(
    "Sites de l'espace public équipés d'une alimentation",
    sitesPublics.length >= 4 && sansAlim.length === 0,
    `${sitesPublics.length} sites${sansAlim.length ? `, sans alimentation : ${sansAlim.map((l) => l.id).join(', ')}` : ''}`,
  );

  // --- Matériel ---
  const familles = new Set(materiel.map((m) => m.data.famille));
  add('Les 6 familles de matériel représentées', familles.size === 6, `${familles.size} familles`);

  const now = REFERENCE_DATE.getTime();
  const echeances = materiel
    .filter((m) => m.data.verification)
    .map((m) => ({
      id: m.id,
      jours: Math.round((m.data.verification!.prochaine_echeance.getTime() - now) / DAY),
    }));
  const proches = echeances.filter((e) => e.jours >= 0 && e.jours <= 30);
  const depassees = echeances.filter((e) => e.jours < 0);
  add(
    'Vérifications réglementaires à échéance proche (≤ 30 jours)',
    proches.length >= 2,
    proches.map((e) => `${e.id} (J+${e.jours})`).join(', ') || 'Aucune',
  );
  add(
    'Vérification réglementaire dépassée (article hors service)',
    depassees.length >= 1,
    depassees.map((e) => `${e.id} (J${e.jours})`).join(', ') || 'Aucune',
  );

  // --- Packs ---
  const packErrors: string[] = [];
  for (const p of packs) {
    for (const c of p.data.composition) {
      const q = stock.get(c.materiel.id);
      if (q === undefined) packErrors.push(`${p.id} : référence inconnue ${c.materiel.id}`);
      else if (c.quantite > q) packErrors.push(`${p.id} : ${c.quantite} ${c.materiel.id} > ${q}`);
    }
  }
  add(
    'Packs composés de matériel existant, en quantité suffisante',
    !packErrors.length,
    packErrors.join(' ; ') || 'Tous',
  );

  // --- Réservations : jamais plus que le stock un même jour ---
  const resErrors: string[] = [];
  const saturated = new Set<string>();
  for (const r of reservations) {
    if (!stock.has(r.data.materiel.id)) resErrors.push(`${r.id} : référence inconnue`);
  }
  for (const [id, q] of stock) {
    const rs = reservations.filter((r) => r.data.materiel.id === id);
    for (let d = -30; d <= 92; d++) {
      const day = fromReference(d, '12:00');
      const used = rs
        .filter((r) => r.data.debut <= day && r.data.fin >= day)
        .reduce((s, r) => s + r.data.quantite, 0);
      if (used > q)
        resErrors.push(`${id} : ${used} réservés pour ${q} le jour J${d >= 0 ? '+' : ''}${d}`);
      if (used === q) saturated.add(id);
    }
  }
  add(
    'Réservations dans la limite du stock',
    !resErrors.length,
    [...new Set(resErrors)].slice(0, 5).join(' ; ') || 'Toujours',
  );
  add(
    'Au moins une référence entièrement réservée sur une période (scénario « indisponible »)',
    saturated.size >= 1,
    [...saturated].join(', ') || 'Aucune',
  );

  const volumesTable = [
    ...volumes,
    ['Actualités', actualites.length, 0] as [string, number, number],
  ];
  return { checks, volumes: volumesTable, festival: FESTIVAL, reference: REFERENCE_DATE };
}
