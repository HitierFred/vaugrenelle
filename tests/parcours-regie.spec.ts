import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { dateIn } from './helpers';

const URL = 'regie/reserver/';

const next = (page: Page) =>
  page.getByRole('button', { name: /^(Continuer|Confirmer la réservation)$/ }).click();
const summary = (page: Page) => page.locator('[data-error-summary]');

async function periode(page: Page, du: string, au: string, lieu: string) {
  await page.getByLabel('Date de retrait').fill(du);
  await page.getByLabel('Date de retour').fill(au);
  await page.getByLabel("Lieu d'utilisation").selectOption(lieu);
  await next(page);
  await expect(page.getByRole('heading', { name: 'Matériel', level: 2 })).toBeFocused();
}

async function openFamily(page: Page, label: string) {
  const details = page
    .locator('details.materiel-group')
    .filter({ has: page.locator('summary', { hasText: new RegExp(`${label} \\(`) }) });
  if (!(await details.evaluate((d: HTMLDetailsElement) => d.open)))
    await details.locator('summary').click();
}

/** Fenêtre où l'enceinte 12 pouces est entièrement réservée (données de démonstration) */
async function fenetreSaturee(page: Page) {
  const reservations = await page.evaluate(
    () =>
      JSON.parse(document.querySelector('[data-regie-data]')!.textContent!).reservations as {
        materiel: string;
        debut: string;
        fin: string;
      }[],
  );
  const rs = reservations.filter((r) => r.materiel === 'enceinte-amplifiee-12');
  const debut = rs
    .map((r) => r.debut)
    .sort()
    .at(-1)!;
  const fin = rs.map((r) => r.fin).sort()[0];
  return { debut, fin };
}

test.describe('Régie partagée : réserver du matériel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URL);
  });

  test('parcours nominal : panier, devis et convention de prêt', async ({ page }) => {
    await next(page);
    await expect(summary(page)).toBeFocused();
    await expect(summary(page)).toContainText('Indiquez la date de retrait');

    await periode(page, dateIn(60), dateIn(61), 'place-de-la-halle');
    await expect(page.locator('[data-periode-rappel]')).toContainText('2 jours');

    await next(page);
    await expect(summary(page)).toContainText('Choisissez au moins un pack ou un article');

    await page.getByLabel('Guinguette', { exact: true }).fill('1');
    await openFamily(page, 'Structures');
    await page.getByLabel('Barrière de ville 2 m').fill('2');
    await page.getByLabel('Barrière de ville 2 m').blur();
    const panier = page.locator('[data-panier]');
    await expect(panier).toContainText('1 × pack Guinguette');
    await expect(panier).toContainText('2 × Barrière de ville 2 m');
    await expect(page.locator('[data-power]')).toContainText('1 kW demandés sur 48 kW');
    await next(page);

    await expect(
      page.getByRole('heading', { name: 'Prestation et demandeur', level: 2 }),
    ).toBeFocused();
    await page.getByLabel('Livraison et reprise').check();
    await page.getByLabel('Association de Vaugrenelle').check();
    await page
      .getByLabel('Nom de la structure ou du service')
      .fill('Comité des fêtes du quartier Saint-Roch');
    await page.getByLabel('Adresse électronique').fill('contact@comite-saint-roch.example');
    await next(page);

    // Devis : (4×5 + 2×12 + 2×15 + 2×1 + 2×1) € × 2 jours + 80 € de livraison
    await expect(page.locator('[data-recap] [data-total]')).toHaveText(/^236,00\s€$/);
    await expect(page.locator('[data-recap] [data-caution]')).toHaveText(/^1\s100,00\s€$/);
    await next(page);
    await expect(summary(page)).toContainText('Acceptez le règlement de prêt');
    await page.getByLabel(/J'accepte le règlement de prêt/).check();
    await next(page);

    await expect(
      page.getByRole('heading', { name: 'Votre réservation est confirmée' }),
    ).toBeFocused();
    await expect(page.locator('[data-numero]')).toHaveText(/^RP-\d{4}-\d{6}$/);
    const convention = page.getByRole('article', { name: /Convention de prêt de matériel/ });
    await expect(convention).toContainText('Comité des fêtes du quartier Saint-Roch');
    await expect(convention).toContainText('Caution');
    await expect(
      page.getByRole('button', { name: 'Imprimer la convention de prêt' }),
    ).toBeVisible();

    const bus = await page.evaluate(() => JSON.parse(localStorage.getItem('vg:bus') ?? '[]'));
    expect(bus.map((e: { type: string }) => e.type)).toContain('reservation.confirmee');
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('vg:reservations') ?? '[]'),
    );
    expect(saved).toHaveLength(1);
  });

  test("cas d'erreur : quantité indisponible, dates alternatives proposées", async ({ page }) => {
    const { debut, fin } = await fenetreSaturee(page);
    await periode(page, debut, fin, 'parc-brossard');

    const row = page.locator('[data-item-row="enceinte-amplifiee-12"]');
    await expect(row).toContainText('0 sur 8');
    await page.getByLabel('Enceinte amplifiée 12 pouces').fill('2');
    await page.getByLabel('Enceinte amplifiée 12 pouces').blur();
    await expect(row).toContainText('Quantité indisponible');
    await expect(row).toContainText('aucun disponible');
    await expect(row).toContainText('Périodes possibles pour 2');

    // Le pack qui contient l'enceinte est aussi indisponible
    await page.getByLabel('Sono plein air').fill('1');
    await page.getByLabel('Sono plein air').blur();
    await expect(page.locator('[data-pack-row="sono-plein-air"]')).toContainText(
      'Quantité indisponible',
    );

    await next(page);
    await expect(summary(page)).toBeFocused();
    await expect(summary(page)).toContainText('Enceinte amplifiée 12 pouces');
    await expect(summary(page)).toContainText('0 disponible sur la période');

    const bus = await page.evaluate(() => JSON.parse(localStorage.getItem('vg:bus') ?? '[]'));
    expect(bus.map((e: { type: string }) => e.type)).toContain('materiel.indisponible');
  });

  test("cas d'erreur : dépassement de la puissance électrique du site", async ({ page }) => {
    await periode(page, dateIn(60), dateIn(60), 'esplanade-de-la-gare');
    await page.getByLabel('Sono plein air').fill('1');
    await page.getByLabel('Éclairage de scène').fill('1');
    await openFamily(page, 'Lumière');
    await page.getByLabel('Lyre asservie wash').fill('4');
    await openFamily(page, 'Vidéo');
    await page.getByLabel('Mur LED extérieur 4 × 2,5 m').fill('1');
    await page.getByLabel('Mur LED extérieur 4 × 2,5 m').blur();

    const power = page.locator('[data-power]');
    await expect(power).toContainText('Dépassement de la puissance du site');
    await expect(power).toContainText('13,6 kW');
    await expect(power).toContainText('12 kW');

    await next(page);
    await expect(summary(page)).toContainText('dépasse celle du site');

    // Un groupe électrogène apporte la puissance manquante
    await openFamily(page, 'Énergie');
    await page.getByLabel('Groupe électrogène 20 kVA insonorisé').fill('1');
    await page.getByLabel('Groupe électrogène 20 kVA insonorisé').blur();
    await expect(power).not.toContainText('Dépassement');
    await expect(power).toContainText('dont 20 kW de groupe électrogène');
    await next(page);
    await expect(
      page.getByRole('heading', { name: 'Prestation et demandeur', level: 2 }),
    ).toBeFocused();

    // Ce matériel exige un technicien
    await page.getByLabel('Association de Vaugrenelle').check();
    await page.getByLabel('Nom de la structure ou du service').fill('Collectif Bobine');
    await page.getByLabel('Adresse électronique').fill('bobine@collectif.example');
    await next(page);
    await expect(summary(page)).toContainText('prêté avec un technicien');
  });

  test('un article hors service et le pack qui le contient ne sont pas réservables', async ({
    page,
  }) => {
    await periode(page, dateIn(40), dateIn(40), 'place-de-la-halle');
    await openFamily(page, 'Praticables');
    await expect(page.getByLabel('Praticable 2 × 1 m')).toBeDisabled();
    await expect(page.locator('[data-item-row="praticable-2x1"]')).toContainText('Hors service');
    await expect(page.getByLabel('Scène 6 × 4 m')).toBeDisabled();
    await expect(page.locator('[data-pack-row="scene-6x4"]')).toContainText('Non réservable');
  });

  test('chaque étape est accessible (axe) @a11y', async ({ page }) => {
    const audit = async (etat: string) => {
      const r = await new AxeBuilder({ page }).analyze();
      expect(r.violations.map((v) => `${etat} : ${v.id} (${v.impact})`)).toEqual([]);
    };
    await next(page);
    await audit('étape 1 en erreur');
    await periode(page, dateIn(60), dateIn(60), 'esplanade-de-la-gare');
    await openFamily(page, 'Vidéo');
    await page.getByLabel('Mur LED extérieur 4 × 2,5 m').fill('1');
    await page.getByLabel('Sono plein air').fill('1');
    await page.getByLabel('Éclairage de scène').fill('1');
    await page.getByLabel('Éclairage de scène').blur();
    await openFamily(page, 'Lumière');
    await page.getByLabel('Lyre asservie wash').fill('4');
    await page.getByLabel('Lyre asservie wash').blur();
    await audit('étape 2 avec dépassement');
    await openFamily(page, 'Énergie');
    await page.getByLabel('Groupe électrogène 20 kVA insonorisé').fill('1');
    await page.getByLabel('Groupe électrogène 20 kVA insonorisé').blur();
    await next(page);
    await page.getByLabel(/technicien présent/).check();
    await page.getByLabel('Compagnie accueillie').check();
    await page.getByLabel('Nom de la structure ou du service').fill('Compagnie Luciole');
    await page.getByLabel('Adresse électronique').fill('luciole@compagnie.example');
    await next(page);
    await audit('récapitulatif');
    await page.getByLabel(/J'accepte le règlement de prêt/).check();
    await next(page);
    await audit('confirmation et convention');
  });
});

test.describe('Catalogue et fiche matériel', () => {
  test('le catalogue filtre par famille et calcule la disponibilité sur une période', async ({
    page,
  }) => {
    await page.goto('regie/catalogue/');
    const visible = page.locator('[data-materiel]:not([hidden])');
    await expect(visible).toHaveCount(40);
    await page.getByLabel('Famille').selectOption('son');
    await expect(visible).toHaveCount(8);
    await expect(page).toHaveURL(/famille=son/);

    const { debut, fin } = await fenetreSaturee(page);
    await page.getByLabel('Du').fill(debut);
    await page.getByLabel('Au').fill(fin);
    await page.getByLabel('Au').blur();
    const enceinte = page.locator('[data-materiel="enceinte-amplifiee-12"]');
    await expect(enceinte).toContainText('0 sur 8 disponibles');
    await expect(enceinte).toContainText('Indisponible');
    await page.getByLabel('Seulement le matériel disponible sur la période').check();
    await expect(enceinte).toBeHidden();
  });

  test('la fiche affiche le calendrier et ajoute au panier, repris dans la réservation', async ({
    page,
  }) => {
    await page.goto('regie/catalogue/barnum-3x3/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Barnum pliant 3 × 3 m');
    await expect(page.locator('table.calendar')).toHaveCount(3);
    await page.getByLabel('Du', { exact: true }).fill(dateIn(50));
    await page.getByLabel('Au', { exact: true }).fill(dateIn(52));
    await page.getByLabel('Quantité').fill('3');
    await page.getByRole('button', { name: /Ajouter au panier/ }).click();
    await expect(page.getByRole('status').filter({ hasText: 'ajouté au panier' })).toBeVisible();
    await page.getByRole('link', { name: 'Poursuivre la réservation' }).click();
    await expect(page.getByLabel('Date de retrait')).toHaveValue(dateIn(50));
    await page.getByLabel("Lieu d'utilisation").selectOption('parc-brossard');
    await next(page);
    await expect(page.locator('[data-panier]')).toContainText('3 × Barnum pliant 3 × 3 m');
  });

  test("un article hors service n'a pas de bouton d'ajout", async ({ page }) => {
    await page.goto('regie/catalogue/praticable-2x1/');
    await expect(page.getByRole('heading', { name: /Article hors service/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Ajouter au panier/ })).toHaveCount(0);
  });
});
