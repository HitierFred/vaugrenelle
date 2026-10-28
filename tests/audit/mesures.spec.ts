// Poids transféré, nombre de requêtes et EcoIndex de chaque page.
// EcoIndex calculé avec la formule ouverte de GreenIT (ecoindex.fr) :
// taille du DOM, nombre de requêtes et poids, comparés à des quantiles de référence.
import { test } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { ROUTES } from '../routes';

const Q_DOM = [
  0, 47, 75, 159, 233, 298, 358, 417, 476, 537, 603, 674, 753, 843, 949, 1076, 1237, 1459, 1801,
  2479, 594601,
];
const Q_REQ = [
  0, 2, 15, 25, 34, 42, 49, 56, 63, 70, 78, 86, 95, 105, 117, 130, 147, 170, 205, 281, 3920,
];
const Q_SIZE = [
  0, 1.37, 144.7, 319.53, 479.46, 631.97, 783.38, 937.91, 1098.62, 1265.47, 1448.32, 1648.27,
  1876.08, 2142.06, 2465.37, 2866.31, 3401.59, 4155.73, 5400.08, 8037.54, 223212.26,
];

function quantile(q: number[], v: number) {
  for (let i = 1; i < q.length; i++)
    if (v < q[i]) return i - 1 + (v - q[i - 1]) / (q[i] - q[i - 1]);
  return q.length - 1;
}
function ecoindex(dom: number, req: number, sizeKo: number) {
  const score =
    100 -
    (5 * (3 * quantile(Q_DOM, dom) + 2 * quantile(Q_REQ, req) + quantile(Q_SIZE, sizeKo))) / 6;
  const grade =
    score > 80
      ? 'A'
      : score > 70
        ? 'B'
        : score > 55
          ? 'C'
          : score > 40
            ? 'D'
            : score > 25
              ? 'E'
              : score > 10
                ? 'F'
                : 'G';
  return { score: Math.round(score), grade };
}

interface Mesure {
  page: string;
  chemin: string;
  requetes: number;
  ko: number;
  dom: number;
  ecoindex: number;
  note: string;
}

const results: Mesure[] = [];

for (const route of ROUTES) {
  test(route.name, async ({ page, context }) => {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    let bytes = 0;
    let requests = 0;
    cdp.on('Network.requestWillBeSent', () => requests++);
    cdp.on('Network.loadingFinished', (e) => (bytes += e.encodedDataLength));
    await page.goto(route.path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    // Éléments du DOM, sans les descendants des SVG (règle EcoIndex)
    const dom = await page.evaluate(
      () => document.querySelectorAll('*').length - document.querySelectorAll('svg *').length,
    );
    const ko = Math.round((bytes / 1024) * 10) / 10;
    const e = ecoindex(dom, requests, ko);
    results.push({
      page: route.name,
      chemin: route.path,
      requetes: requests,
      ko,
      dom,
      ecoindex: e.score,
      note: e.grade,
    });
  });
}

test.afterAll(() => {
  const date = new Date().toISOString().slice(0, 10);
  writeFileSync(
    'docs/audit/mesures.json',
    JSON.stringify({ date, source: test.info().project.use.baseURL, pages: results }, null, 2) +
      '\n',
  );
  console.table(results);
});
