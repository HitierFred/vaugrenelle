import { expect, test } from '@playwright/test';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Pages prévues dans une phase ultérieure (brief § 5, P2)
const A_VENIR = ['/habiter/'];
const BASE = '/vaugrenelle';
const DIST = join(process.cwd(), 'dist');

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

function exists(href: string): boolean {
  const path = decodeURI(href.split(/[?#]/)[0]).slice(BASE.length) || '/';
  const target = join(DIST, path);
  return path.endsWith('/') ? existsSync(join(target, 'index.html')) : existsSync(target);
}

test('aucun lien interne cassé dans le site construit', () => {
  const broken = new Set<string>();
  for (const file of htmlFiles(DIST)) {
    const html = readFileSync(file, 'utf-8');
    for (const [, href] of html.matchAll(/href="(\/[^"]*)"/g)) {
      if (!href.startsWith(`${BASE}/`)) {
        broken.add(`${href} (hors base) dans ${file.slice(DIST.length)}`);
        continue;
      }
      const path = href.slice(BASE.length).split(/[?#]/)[0];
      if (A_VENIR.includes(path)) continue;
      if (!exists(href)) broken.add(`${href} dans ${file.slice(DIST.length)}`);
    }
  }
  expect([...broken]).toEqual([]);
});

test.describe('Pages de pied de page et page portfolio', () => {
  test("À propos : les 6 sections du brief et l'auteur à compléter", async ({ page }) => {
    await page.goto('a-propos-du-projet/');
    for (const titre of [
      'Le cas',
      'La démarche',
      'Les partis pris',
      'Les preuves',
      'Les limites assumées',
      "L'auteur",
    ]) {
      await expect(page.getByRole('heading', { name: titre, level: 2 })).toBeVisible();
    }
    await expect(page.locator('[data-auteur-a-completer]')).toContainText(
      '[Nom, titre, lien de contact ou de profil]',
    );
  });

  test("le cahier des charges est téléchargeable, le brief ne l'est pas", async ({
    page,
    request,
  }) => {
    await page.goto('a-propos-du-projet/');
    const href = await page
      .getByRole('link', { name: /Télécharger le cahier des charges/ })
      .getAttribute('href');
    const res = await request.get(href!);
    expect(res.status()).toBe(200);
    expect(await res.text()).toMatch(/^# /);
    await expect(page.getByRole('link', { name: /Télécharger le brief/ })).toHaveCount(0);
  });

  test('les algorithmes publics affichent les seuils réellement appliqués', async ({ page }) => {
    await page.goto('algorithmes-publics/');
    await expect(page.locator('main section.card > h2')).toHaveCount(5);
    await expect(page.locator('main')).toContainText('À partir de 0,90');
    await expect(page.locator('main')).toContainText('au moins 30 jours avant');
  });

  test('le plan du site liste les 30 événements et les 40 références', async ({ page }) => {
    await page.goto('plan-du-site/');
    const plan = page.getByRole('navigation', { name: 'Plan du site' });
    await expect(
      plan.locator('a[href*="/sortir/agenda/"][href$="/"]:not([href$="/agenda/"])'),
    ).toHaveCount(30);
    await expect(
      plan.locator('a[href*="/regie/catalogue/"][href$="/"]:not([href$="/catalogue/"])'),
    ).toHaveCount(40);
  });

  test('le pied de page mène à chaque page', async ({ page }) => {
    await page.goto('./');
    const footer = page.getByRole('contentinfo');
    for (const [name, h1] of [
      [/Accessibilité/, 'Accessibilité'],
      [/Écoconception/, 'Écoconception'],
      [/Algorithmes publics/, 'Algorithmes publics'],
      [/Plan du site/, 'Plan du site'],
      [/Mentions légales/, 'Mentions légales (fictives)'],
      [/À propos du projet/, 'À propos du projet'],
    ] as const) {
      await footer.getByRole('link', { name }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
      await page.goBack();
    }
  });
});
