import { expect, test, type Page } from '@playwright/test';

const visibleEvents = (page: Page) => page.locator('[data-event]:not([hidden])');
const countText = (page: Page) => page.locator('[data-count]');

test.describe('Parcours « Sortir »', () => {
  test("de l'accueil à l'agenda", async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Vaugrenelle, la ville comme scène',
    );
    const semaine = page.getByRole('region', { name: 'Les 7 prochains jours' });
    await expect(semaine.getByRole('article').first()).toBeVisible();
    await page.getByRole('link', { name: /Agenda et billetterie/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Agenda culturel');
  });

  test("l'agenda filtre par discipline et gratuité, et reflète les filtres dans l'URL", async ({
    page,
  }) => {
    await page.goto('sortir/agenda/');
    const total = await visibleEvents(page).count();
    expect(total).toBeGreaterThan(20);
    await expect(countText(page)).toHaveText(`${total} événements correspondent à vos critères.`);

    await page.getByLabel('Discipline').selectOption('cirque');
    await expect(page).toHaveURL(/discipline=cirque/);
    const cirque = await visibleEvents(page).count();
    expect(cirque).toBeLessThan(total);
    for (const card of await visibleEvents(page).all()) {
      await expect(card).toContainText('Cirque');
    }

    await page.getByLabel('Gratuit uniquement').check();
    await expect(page).toHaveURL(/gratuit=1/);
    expect(await visibleEvents(page).count()).toBeLessThanOrEqual(cirque);
    for (const card of await visibleEvents(page).all()) {
      await expect(card).toContainText('Gratuit');
    }

    await page.getByRole('button', { name: 'Effacer les filtres' }).click();
    await expect(page).not.toHaveURL(/\?/);
    await expect(visibleEvents(page)).toHaveCount(total);
  });

  test('une adresse filtrée est partageable (festival, accessibilité)', async ({ page }) => {
    await page.goto('sortir/agenda/?periode=festival');
    await expect(page.getByLabel('Date')).toHaveValue('festival');
    await expect(visibleEvents(page)).toHaveCount(12);

    await page.goto('sortir/agenda/?periode=festival&acces=lsf');
    await expect(page.getByLabel('Traduit en LSF')).toBeChecked();
    for (const card of await visibleEvents(page).all()) {
      await expect(card).toContainText('Traduit en LSF');
    }
  });

  test('message explicite quand aucun événement ne correspond', async ({ page }) => {
    await page.goto('sortir/agenda/?lieu=esplanade-de-la-gare&discipline=danse');
    await expect(visibleEvents(page)).toHaveCount(0);
    await expect(countText(page)).toHaveText('Aucun événement ne correspond à vos critères.');
    await expect(page.locator('[data-empty]')).toBeVisible();
  });

  test("sans JavaScript, l'agenda reste lisible et complet", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('sortir/agenda/');
    await expect(page.locator('[data-event]')).toHaveCount(30);
    await expect(page.locator('form[data-filters]')).toBeHidden();
    await page.getByRole('link', { name: 'Hauts vols' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hauts vols');
    await context.close();
  });

  test("de l'agenda à la fiche, puis réservation simulée", async ({ page }) => {
    await page.goto('sortir/agenda/');
    await page.getByRole('link', { name: 'Hauts vols' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hauts vols');
    await expect(page.getByRole('navigation', { name: "Fil d'Ariane" })).toContainText('Agenda');
    await expect(page.getByText('Plein tarif')).toBeVisible();

    await page.getByRole('button', { name: /Réserver des places/ }).click();
    const status = page.getByRole('status').filter({ hasText: 'Réservation simulée' });
    await expect(status).toContainText("Aucune place n'a été réservée");
  });

  test("un événement gratuit n'a pas de bouton de réservation", async ({ page }) => {
    await page.goto('sortir/agenda/les-funambules-du-quai/');
    await expect(page.getByRole('button', { name: /Réserver/ })).toHaveCount(0);
    await expect(page.getByText('Entrée libre, sans réservation')).toBeVisible();
  });
});

test.describe('Festival Les Échappées', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('sortir/festival/');
  });

  test('programme sur 4 jours, 12 spectacles', async ({ page }) => {
    const tabs = page.getByRole('tablist', { name: 'Programme par jour' }).getByRole('tab');
    await expect(tabs).toHaveCount(4);
    let total = 0;
    for (const tab of await tabs.all()) {
      await tab.click();
      const panel = page.getByRole('tabpanel');
      total += await panel.locator('.programme > li').count();
    }
    expect(total).toBe(12);
  });

  test('la carte a une alternative textuelle équivalente', async ({ page }) => {
    const map = page.getByRole('img', { name: /Plan schématique des sites/ });
    await expect(map).toBeVisible();
    const markers = await page.locator('.festival-map__marker').count();
    await expect(page.locator('.sites-list > li')).toHaveCount(markers);
    await page.getByRole('link', { name: 'Liste des sites' }).click();
    await expect(page.locator('#liste-sites')).toBeFocused();
  });

  test("un site renvoie vers l'agenda filtré", async ({ page }) => {
    await page.getByRole('link', { name: /Spectacles sur ce site \(Parc Brossard\)/ }).click();
    await expect(page).toHaveURL(/periode=festival&lieu=parc-brossard/);
    await expect(page.getByLabel('Lieu')).toHaveValue('parc-brossard');
    for (const card of await visibleEvents(page).all()) {
      await expect(card).toContainText('Parc Brossard');
    }
  });
});
