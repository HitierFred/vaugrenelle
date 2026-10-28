// Critères de qualité du brief (§ 8) non couverts par les tests de parcours
import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROUTES } from './routes';

const DIST = join(process.cwd(), 'dist');

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

test('chaque page a lang="fr", un seul h1 et un titre unique', () => {
  const titles = new Map<string, string[]>();
  const problems: string[] = [];
  for (const file of htmlFiles(DIST)) {
    const html = readFileSync(file, 'utf-8');
    const page = file.slice(DIST.length);
    if (!/<html lang="fr"/.test(html)) problems.push(`${page} : lang="fr" absent`);
    const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
    if (h1 !== 1) problems.push(`${page} : ${h1} h1`);
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ?? '';
    if (!title) problems.push(`${page} : titre vide`);
    titles.set(title, [...(titles.get(title) ?? []), page]);
  }
  for (const [title, pages] of titles)
    if (pages.length > 1) problems.push(`Titre en double « ${title} » : ${pages.join(', ')}`);
  expect(problems).toEqual([]);
});

const WIDTHS = [320, 375, 768, 1024, 1440];

for (const route of ROUTES) {
  test(`${route.name} : responsive de 320 à 1 440 px, sans défilement horizontal`, async ({
    page,
  }) => {
    const overflows: string[] = [];
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route.path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (overflow > 0) overflows.push(`${width} px : ${overflow} px de trop`);
    }
    expect(overflows).toEqual([]);
  });
}

// Zoom à 200 % d'un écran de 1 280 px = mise en page sur 640 px CSS
test('zoom à 200 % : aucun contenu tronqué sur les pages principales', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 450 });
  const problems: string[] = [];
  for (const route of ROUTES) {
    await page.goto(route.path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 0) problems.push(`${route.name} : ${overflow} px`);
  }
  expect(problems).toEqual([]);
});

for (const route of ROUTES) {
  test(`${route.name} : le focus clavier est toujours visible`, async ({ page }) => {
    await page.goto(route.path);
    const invisible: string[] = [];
    let previous: unknown = null;
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const visible = (node: Element) => {
          const s = getComputedStyle(node);
          const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2;
          return outline || s.boxShadow !== 'none';
        };
        // Carte entièrement cliquable : le contour est porté par la carte
        const ok = visible(el) || !!(el.closest('.card') && visible(el.closest('.card')!));
        const r = el.getBoundingClientRect();
        return {
          key: el.outerHTML.slice(0, 80),
          ok,
          shown: r.width > 0 && r.height > 0,
        };
      });
      if (!info || info.key === previous) break;
      previous = info.key;
      if (!info.ok || !info.shown) invisible.push(info.key);
    }
    expect(invisible).toEqual([]);
  });
}

test.describe('Sans JavaScript, les pages de contenu restent lisibles', () => {
  test.use({ javaScriptEnabled: false });
  for (const path of [
    './',
    'sortir/agenda/hauts-vols/',
    'sortir/festival/',
    'regie/',
    'regie/catalogue/',
    'regie/catalogue/projecteur-led-200/',
    'agir/',
    'a-propos-du-projet/',
    'plan-du-site/',
  ]) {
    test(path, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const text = (await page.locator('main').innerText()).trim();
      expect(text.length).toBeGreaterThan(300);
      await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
    });
  }
});
