import { expect, test } from '@playwright/test';
import { ROUTES } from './routes';

for (const route of ROUTES) {
  test.describe(route.name, () => {
    test('affiche le bandeau de démonstration et respecte le socle', async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByTestId('demo-banner')).toContainText(
        "Site de démonstration — collectivité fictive. Aucune donnée réelle n'est collectée.",
      );
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page).toHaveTitle(/\S/);
    });

    test("n'émet aucune requête vers un domaine externe", async ({ page }) => {
      const external: string[] = [];
      page.on('request', (req) => {
        const url = new URL(req.url());
        if (!['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol !== 'data:') {
          external.push(req.url());
        }
      });
      await page.goto(route.path, { waitUntil: 'networkidle' });
      expect(external).toEqual([]);
    });
  });
}
