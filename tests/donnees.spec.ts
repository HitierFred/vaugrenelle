import { expect, test } from '@playwright/test';

// Volumes minimum du brief (§ 6). La page échoue au build si un contrôle bloquant
// n'est pas respecté ; ce test vérifie en plus les volumes publiés.
const MINIMUMS: Record<string, number> = {
  Événements: 30,
  'dont pendant le festival': 12,
  Lieux: 6,
  'Références de matériel': 40,
  Packs: 6,
  Démarches: 10,
  'Réservations existantes': 15,
};

test.describe('Données fictives', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('demo/donnees/');
  });

  for (const [label, min] of Object.entries(MINIMUMS)) {
    test(`volume « ${label} » ≥ ${min}`, async ({ page }) => {
      const cell = page.locator(`[data-volume="${label}"]`);
      expect(Number(await cell.textContent())).toBeGreaterThanOrEqual(min);
    });
  }

  test('tous les contrôles de cohérence sont conformes', async ({ page }) => {
    await expect(page.locator('main').getByText('Non conforme')).toHaveCount(0);
    await expect(page.getByText('Conforme', { exact: true }).first()).toBeVisible();
  });

  test("n'est pas indexée", async ({ page }) => {
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});
