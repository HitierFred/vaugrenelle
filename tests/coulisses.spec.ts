import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { deposerDossier, reserverMateriel } from './helpers';

test.describe('Coulisses et Mon compte', () => {
  test('sans activité, le journal invite à faire un parcours', async ({ page }) => {
    await page.goto('demo/coulisses/');
    await expect(page.locator('[data-empty]')).toBeVisible();
    await expect(page.locator('[data-count]')).toHaveText('0 événement');
    // Le tableau pédagogique couvre les 7 types d'événements
    await expect(page.locator('section:has(#automatismes) tbody tr')).toHaveCount(7);
  });

  test('les événements des phases 4 et 5 apparaissent dans le journal', async ({ page }) => {
    const dossier = await deposerDossier(page);
    const reservation = await reserverMateriel(page);

    await page.goto('demo/coulisses/');
    const journal = page.locator('[data-journal]');
    for (const type of [
      'piece.extraite',
      'dossier.depose',
      'avis.requis',
      'materiel.prereservation_demandee',
      'reservation.confirmee',
    ]) {
      await expect(journal.locator(`[data-type="${type}"]`).first()).toBeVisible();
    }

    // Résumé en français, contrôle humain et charge utile CloudEvents
    const depot = journal.locator('[data-type="dossier.depose"]');
    await expect(depot).toContainText(`Le dossier ${dossier} est déposé`);
    await expect(depot).toContainText('En production');
    await depot.getByText('Charge utile JSON').click();
    await expect(depot.locator('pre')).toContainText('"specversion": "1.0"');
    await expect(depot.locator('pre')).toContainText(`"subject": "${dossier}"`);
    await expect(journal.locator('[data-type="avis.requis"]').first()).toContainText(
      'Police municipale',
    );
    await expect(journal.locator('[data-type="reservation.confirmee"]')).toContainText(reservation);

    // Le plus récent en premier
    await expect(journal.locator('li').first()).toHaveAttribute(
      'data-type',
      'reservation.confirmee',
    );

    // Filtre par type
    await page.getByLabel("Type d'événement").selectOption('avis.requis');
    await expect(journal.locator('li')).toHaveCount(
      await journal.locator('[data-type="avis.requis"]').count(),
    );
    await expect(page.locator('[data-count]')).toContainText('sur');

    // Dossiers et réservations
    await expect(page.locator('[data-dossiers]')).toContainText(dossier);
    await expect(page.locator('[data-reservations]')).toContainText(reservation);

    // Mon compte : le même dossier et la même réservation
    await page.goto('mon-compte/');
    await expect(page.locator('[data-dossiers]')).toContainText(dossier);
    await expect(page.locator('[data-dossiers]')).toContainText('Prochaine étape');
    await expect(page.locator('[data-reservations]')).toContainText(reservation);
    await expect(page.locator('[data-reservations]')).toContainText('Confirmée');
  });

  test('la démonstration se réinitialise en deux temps', async ({ page }) => {
    await reserverMateriel(page);
    await page.goto('demo/coulisses/');
    await expect(page.locator('[data-journal] li')).not.toHaveCount(0);

    await page.getByRole('button', { name: 'Réinitialiser la démonstration' }).click();
    await page.getByRole('button', { name: 'Annuler' }).click();
    await expect(
      page.getByRole('button', { name: 'Réinitialiser la démonstration' }),
    ).toBeFocused();
    await expect(page.locator('[data-journal] li')).not.toHaveCount(0);

    await page.getByRole('button', { name: 'Réinitialiser la démonstration' }).click();
    await page.getByRole('button', { name: 'Oui, réinitialiser' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'est réinitialisée' })).toBeVisible();
    await expect(page.locator('[data-journal] li')).toHaveCount(0);
    await expect(page.locator('[data-reservations]')).toContainText('Aucune réservation');
    const stored = await page.evaluate(() =>
      ['vg:bus', 'vg:dossiers', 'vg:reservations'].map((k) => localStorage.getItem(k)),
    );
    expect(stored).toEqual([null, null, null]);
  });

  test('Mon compte signale un brouillon en cours', async ({ page }) => {
    await page.goto('agir/organiser-un-evenement/');
    await page.getByRole('button', { name: 'Connexion simulée (démonstration)' }).click();
    await page.goto('mon-compte/');
    await expect(page.getByRole('link', { name: 'Reprendre le dossier' })).toBeVisible();
    await expect(page.locator('[data-dossiers]')).toContainText('Aucun dossier');
  });

  test('coulisses et compte remplis restent accessibles (axe) @a11y', async ({ page }) => {
    await deposerDossier(page);
    await reserverMateriel(page);
    for (const path of ['demo/coulisses/', 'mon-compte/']) {
      await page.goto(path);
      await page
        .locator('details')
        .first()
        .evaluate((d: HTMLDetailsElement) => (d.open = true));
      const r = await new AxeBuilder({ page }).analyze();
      expect(r.violations.map((v) => `${path} : ${v.id} (${v.impact})`)).toEqual([]);
    }
  });
});
