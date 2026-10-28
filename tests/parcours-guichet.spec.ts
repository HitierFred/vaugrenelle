import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const URL = 'agir/organiser-un-evenement/';

// Date AAAA-MM-JJ à J + n, en heure de Paris
function dateIn(days: number): string {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date());
  const [y, m, d] = today.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

const pdf = (name: string) => ({
  name,
  mimeType: 'application/pdf',
  buffer: Buffer.from('%PDF-1.4 démo'),
});
const next = (page: Page) =>
  page.getByRole('button', { name: /^(Continuer|Déposer le dossier)$/ }).click();
const summary = (page: Page) => page.locator('[data-error-summary]');

async function stepOrganisateur(page: Page) {
  await page.getByRole('button', { name: 'Connexion simulée (démonstration)' }).click();
  await page.getByLabel('Structure organisatrice').selectOption('comite-saint-roch');
  await expect(page.getByLabel('Nom de la structure')).toHaveValue(
    'Comité des fêtes du quartier Saint-Roch',
  );
  await next(page);
  await expect(page.getByRole('heading', { name: 'Événement', level: 2 })).toBeFocused();
}

async function stepEvenement(page: Page, opts: { lieu: string; debut: string }) {
  await page.getByLabel("Titre de l'événement").fill('Fête de la rue des Remparts');
  await page.getByLabel("Nature de l'événement").selectOption('fete');
  await page.getByLabel('Date de début').fill(opts.debut);
  await page.getByLabel('Lieu').selectOption(opts.lieu);
  await page.getByLabel('Nombre de personnes attendues').fill('300');
}

async function uploadAll(page: Page, assurance = 'assurance.pdf') {
  await page.getByLabel("Statuts de l'association").setInputFiles(pdf('statuts.pdf'));
  await page
    .getByLabel("Attestation d'assurance responsabilité civile")
    .setInputFiles(pdf(assurance));
  await page.getByLabel("Plan d'implantation").setInputFiles(pdf('plan-implantation.pdf'));
  await expect(page.locator('.extraction')).toHaveCount(3);
}

async function readStore<T>(page: Page, key: string): Promise<T> {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), key);
}

test.describe('Guichet Unique : organiser un événement', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URL);
  });

  test("parcours nominal jusqu'au dépôt", async ({ page }) => {
    // Étape 1 : la connexion est obligatoire, l'erreur est résumée et focalisée
    await next(page);
    await expect(summary(page)).toBeFocused();
    await expect(summary(page)).toContainText('Connectez-vous pour continuer');
    await stepOrganisateur(page);

    // Étape 2
    await stepEvenement(page, { lieu: 'esplanade-de-la-gare', debut: dateIn(60) });
    await next(page);
    await expect(page.getByRole('heading', { name: 'Besoins', level: 2 })).toBeFocused();

    // Étape 3 : les besoins ajoutent et retirent des sous-démarches
    const box = page.locator('[data-sous-demarches]');
    await expect(box).toContainText("Autorisation d'occupation du domaine public");
    await page.getByLabel(/Une sonorisation/).check();
    await page.getByLabel(/Une buvette/).check();
    await expect(box).toContainText('Déclaration de diffusion sonore');
    await expect(box).toContainText('Autorisation de débit de boissons temporaire');
    await page.getByLabel(/Une buvette/).uncheck();
    await expect(box).not.toContainText('débit de boissons');
    await page.getByLabel(/Du matériel municipal/).check();
    await next(page);
    await expect(summary(page)).toContainText('Choisissez au moins un pack');
    await page.getByLabel(/Sono plein air/).check();
    await expect(box).toContainText('Pré-réservation de matériel');
    await next(page);

    // Étape 4 : extraction simulée
    await expect(
      page.getByRole('heading', { name: 'Pièces justificatives', level: 2 }),
    ).toBeFocused();
    await next(page);
    await expect(summary(page)).toContainText("Ajoutez : Statuts de l'association");
    await uploadAll(page);
    await expect(page.locator('.extraction').first()).toContainText('Confiance de la lecture');
    await next(page);

    // Étape 5 : récapitulatif et contrôles
    await expect(page.getByRole('heading', { name: 'Récapitulatif', level: 2 })).toBeFocused();
    const checks = page.locator('[data-controles]');
    await expect(checks).toContainText('Esplanade de la Gare est libre');
    await expect(checks).toContainText('le délai de 30 jours est respecté');
    await expect(checks.getByText('Bloquant')).toHaveCount(0);
    await next(page);
    await expect(summary(page)).toContainText("Cochez l'attestation sur l'honneur");
    await page.getByLabel(/J'atteste que les informations/).check();
    await next(page);

    // Confirmation
    const titre = page.getByRole('heading', { name: 'Votre dossier est déposé' });
    await expect(titre).toBeFocused();
    await expect(page.locator('[data-numero]')).toHaveText(/^GU-\d{4}-\d{6}$/);
    await expect(page.getByRole('heading', { name: 'Chronologie prévisionnelle' })).toBeVisible();

    // Bus d'événements et persistance
    const bus = await readStore<{ type: string; specversion: string }[]>(page, 'vg:bus');
    const types = bus.map((e) => e.type);
    expect(types).toContain('piece.extraite');
    expect(types).toContain('dossier.depose');
    expect(types).toContain('avis.requis');
    expect(types).toContain('materiel.prereservation_demandee');
    expect(bus.every((e) => e.specversion === '1.0')).toBe(true);
    expect(await readStore<unknown[]>(page, 'vg:dossiers')).toHaveLength(1);
    expect(await readStore(page, 'vg:guichet:brouillon')).toBeNull();
  });

  test("cas d'erreur : attestation d'assurance expirée", async ({ page }) => {
    await stepOrganisateur(page);
    await stepEvenement(page, { lieu: 'esplanade-de-la-gare', debut: dateIn(60) });
    await next(page);
    await next(page);
    await uploadAll(page, 'assurance-expiree.pdf');

    const piece = page.locator('[data-piece="assurance"]');
    await expect(piece).toContainText('Pièce expirée');
    await expect(piece).toContainText("Cette attestation n'est plus valide");
    await expect(piece).toContainText('Demandez une attestation à jour à votre assureur');

    await next(page);
    await expect(summary(page)).toBeFocused();
    await expect(summary(page)).toContainText('la pièce est expirée, remplacez-la');

    const bus = await readStore<{ type: string }[]>(page, 'vg:bus');
    expect(bus.map((e) => e.type)).toContain('piece.non_conforme');

    // Régularisation : une attestation valide débloque l'étape
    await page
      .getByLabel("Attestation d'assurance responsabilité civile")
      .setInputFiles(pdf('assurance-2027.pdf'));
    await expect(piece.locator('.extraction')).toContainText('assurance-2027.pdf');
    await expect(piece).not.toContainText('Pièce expirée');
    await next(page);
    await expect(page.getByRole('heading', { name: 'Récapitulatif', level: 2 })).toBeFocused();
  });

  test("cas d'erreur : conflit de date et de lieu", async ({ page }) => {
    // Un événement existant place de la Halle, au moins 31 jours après aujourd'hui
    const agenda = await page.evaluate(
      () =>
        JSON.parse(document.querySelector('[data-guichet-data]')!.textContent!).agenda as {
          lieu: string;
          debut: string;
          titre: string;
        }[],
    );
    const occupe = agenda.find((e) => e.lieu === 'place-de-la-halle' && e.debut >= dateIn(31));
    expect(occupe).toBeDefined();

    await stepOrganisateur(page);
    await stepEvenement(page, { lieu: 'place-de-la-halle', debut: occupe!.debut });

    const conflict = page.locator('[data-conflict]');
    await expect(conflict).toContainText('Lieu déjà occupé');
    await expect(conflict).toContainText(occupe!.titre);
    await expect(conflict).toContainText('Dates libres proches');

    await next(page);
    await expect(summary(page)).toBeFocused();
    await expect(summary(page)).toContainText('Place de la Halle est déjà occupé à cette date');
    await expect(page.getByLabel('Date de début')).toHaveAttribute('aria-invalid', 'true');

    // Le lien du résumé ramène au champ
    await summary(page).getByRole('link').click();
    await expect(page.getByLabel('Date de début')).toBeFocused();

    // Une autre date libère le lieu
    await page.getByLabel('Date de début').fill(dateIn(70));
    await expect(conflict).toBeEmpty();
    await next(page);
    await expect(page.getByRole('heading', { name: 'Besoins', level: 2 })).toBeFocused();
  });

  test('délai trop court : bloquant au récapitulatif, lien vers la date', async ({ page }) => {
    await stepOrganisateur(page);
    await stepEvenement(page, { lieu: 'esplanade-de-la-gare', debut: dateIn(10) });
    await next(page);
    await next(page);
    await uploadAll(page);
    await next(page);
    await expect(page.locator('[data-controles]')).toContainText('au moins 30 jours avant');
    await page.getByLabel(/J'atteste que les informations/).check();
    await next(page);
    await expect(summary(page)).toContainText('au moins 30 jours avant');
    await summary(page)
      .getByRole('link', { name: /30 jours/ })
      .click();
    await expect(page.getByRole('heading', { name: 'Événement', level: 2 })).toBeVisible();
    await expect(page.getByLabel('Date de début')).toBeFocused();
  });

  test('le brouillon est sauvegardé et restauré', async ({ page }) => {
    await stepOrganisateur(page);
    await page.getByLabel("Titre de l'événement").fill('Brouillon à reprendre');
    await page.reload();
    await expect(page.locator('[data-restored]')).toContainText('a été restauré');
    await expect(page.getByLabel("Titre de l'événement")).toHaveValue('Brouillon à reprendre');
    await expect(page.locator('[data-stepper-status]')).toHaveText('Étape 2 sur 5 : Événement');
    await page.getByRole('button', { name: 'Recommencer un nouveau dossier' }).click();
    await expect(page.locator('[data-stepper-status]')).toHaveText('Étape 1 sur 5 : Organisateur');
    await expect(page.locator('[data-restored]')).toBeHidden();
  });
});

test('chaque étape du parcours est accessible (axe) @a11y', async ({ page }) => {
  const audit = async (etat: string) => {
    const r = await new AxeBuilder({ page }).analyze();
    expect(r.violations.map((v) => `${etat} : ${v.id} (${v.impact})`)).toEqual([]);
  };
  await page.goto(URL);
  await next(page);
  await audit('étape 1 en erreur');
  await stepOrganisateur(page);
  await stepEvenement(page, { lieu: 'esplanade-de-la-gare', debut: dateIn(60) });
  await next(page);
  await page.getByLabel(/Du matériel municipal/).check();
  await audit('étape 3 avec packs');
  await page.getByLabel(/Sono plein air/).check();
  await next(page);
  await uploadAll(page, 'assurance-expiree.pdf');
  await audit('étape 4 avec pièce expirée');
  await page
    .getByLabel("Attestation d'assurance responsabilité civile")
    .setInputFiles(pdf('assurance.pdf'));
  await expect(page.locator('[data-piece="assurance"] .extraction')).toContainText('assurance.pdf');
  await next(page);
  await audit('étape 5');
  await page.getByLabel(/J'atteste que les informations/).check();
  await next(page);
  await expect(page.getByRole('heading', { name: 'Votre dossier est déposé' })).toBeVisible();
  await audit('confirmation');
});

test.describe('Catalogue des démarches', () => {
  test("la recherche filtre la liste et reflète la requête dans l'URL", async ({ page }) => {
    await page.goto('agir/');
    const items = page.locator('[data-item]:not([hidden])');
    await expect(items).toHaveCount(10);
    await page.getByLabel('Rechercher une démarche').fill('tournage');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Tourner un film dans la ville');
    await expect(page).toHaveURL(/q=tournage/);
    // Recherche insensible aux accents et à la casse (la catégorie compte aussi)
    await page.getByLabel('Rechercher une démarche').fill('BUVETTE evenement');
    await expect(items).toHaveCount(2);
    await expect(items.filter({ hasText: 'Organiser un événement' })).toHaveCount(1);
    await expect(items.filter({ hasText: 'Ouvrir une buvette temporaire' })).toHaveCount(1);
    await page.getByLabel('Rechercher une démarche').fill('zzz');
    await expect(page.getByRole('status')).toContainText('Aucune démarche ne correspond');
  });

  test('mène au parcours « Organiser un événement »', async ({ page }) => {
    await page.goto('agir/');
    await page.getByRole('link', { name: 'Organiser un événement' }).first().click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Organiser un événement');
  });
});
