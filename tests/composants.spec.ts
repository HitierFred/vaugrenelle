import { expect, test } from '@playwright/test';

test.describe('Socle de mise en page', () => {
  test("le lien d'évitement est le premier élément focalisable", async ({ page }) => {
    await page.goto('./');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Aller au contenu' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#contenu')).toBeFocused();
  });

  test('menu repliable sur petit écran', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('./');
    const toggle = page.getByRole('button', { name: 'Menu' });
    const nav = page.getByRole('navigation', { name: 'Navigation principale' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.getByRole('link', { name: 'Régie partagée' })).toBeVisible();
    await nav.getByRole('link', { name: 'Habiter' }).focus();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });

  test('navigation visible sans JavaScript sur petit écran', async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 375, height: 800 },
    });
    const page = await context.newPage();
    await page.goto('./');
    await expect(
      page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', {
        name: 'Régie partagée',
      }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Menu' })).toBeHidden();
    await context.close();
  });
});

test.describe('Page des composants', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('demo/composants/');
  });

  test("n'est pas indexée", async ({ page }) => {
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('[data-pagefind-body]')).toHaveCount(0);
  });

  test('onglets : navigation au clavier', async ({ page }) => {
    const tablist = page.getByRole('tablist', { name: 'Informations sur le spectacle' });
    const first = tablist.getByRole('tab', { name: 'Infos pratiques' });
    const second = tablist.getByRole('tab', { name: 'Accessibilité' });
    const last = tablist.getByRole('tab', { name: 'Venir' });

    await expect(first).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: 'Infos pratiques' })).toBeVisible();

    await first.focus();
    await page.keyboard.press('ArrowRight');
    await expect(second).toBeFocused();
    await expect(second).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: 'Accessibilité' })).toBeVisible();
    await expect(page.locator('#onglet-infos')).toBeHidden();

    await page.keyboard.press('End');
    await expect(last).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(first).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(last).toBeFocused();
  });

  test('champ en erreur relié à son message', async ({ page }) => {
    const input = page.locator('#demo-titre-erreur');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription(/Indiquez le titre de l'événement/);
  });

  test('stepper : étape courante annoncée', async ({ page }) => {
    const current = page.locator('.stepper [aria-current="step"]');
    await expect(current).toHaveCount(1);
    await expect(current).toContainText('Besoins');
  });

  test('calendrier : alternative en tableau', async ({ page }) => {
    await page.getByText('Voir les disponibilités sous forme de tableau').click();
    const table = page.getByRole('table', { name: /par période/ });
    await expect(table).toBeVisible();
    await expect(table.getByRole('row', { name: /Du 7 au 8 novembre/ })).toContainText('0 sur 4');
  });
});
