// Audit Lighthouse (mobile, réglages par défaut) des pages P1 du site déployé.
// Usage : CHROME_PATH=/chemin/vers/chrome node scripts/lighthouse.mjs [URL de base]
// Lighthouse est lancé avec npx, sans être ajouté aux dépendances du projet.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'https://hitierfred.github.io/vaugrenelle/';
const PAGES = [
  ['accueil', ''],
  ['agenda', 'sortir/agenda/'],
  ['fiche-evenement', 'sortir/agenda/hauts-vols/'],
  ['festival', 'sortir/festival/'],
  ['demarches', 'agir/'],
  ['guichet', 'agir/organiser-un-evenement/'],
  ['regie', 'regie/'],
  ['catalogue', 'regie/catalogue/'],
  ['fiche-materiel', 'regie/catalogue/enceinte-amplifiee-12/'],
  ['reserver', 'regie/reserver/'],
  ['coulisses', 'demo/coulisses/'],
  ['a-propos', 'a-propos-du-projet/'],
];

const results = [];
for (const [name, path] of PAGES) {
  const out = `docs/audit/lighthouse/${name}.json`;
  execFileSync(
    'npx',
    [
      '-y',
      'lighthouse@13.6.0',
      BASE + path,
      '--quiet',
      '--output=json',
      `--output-path=${out}`,
      '--only-categories=performance,accessibility,best-practices,seo',
      '--chrome-flags=--headless=new',
    ],
    { stdio: 'inherit' },
  );
  const report = JSON.parse(readFileSync(out, 'utf-8'));
  const score = (id) => Math.round(report.categories[id].score * 100);
  results.push({
    page: name,
    performance: score('performance'),
    accessibilite: score('accessibility'),
    bonnesPratiques: score('best-practices'),
    seo: score('seo'),
    lcp: report.audits['largest-contentful-paint'].displayValue,
    tbt: report.audits['total-blocking-time'].displayValue,
    cls: report.audits['cumulative-layout-shift'].displayValue,
  });
  // Le rapport complet est volumineux : on ne garde que la synthèse
  writeFileSync(out, JSON.stringify({ url: BASE + path, date: report.fetchTime, ...results.at(-1) }, null, 2) + '\n');
}
writeFileSync(
  'docs/audit/lighthouse.json',
  JSON.stringify({ date: new Date().toISOString().slice(0, 10), base: BASE, outil: 'Lighthouse 13.6.0, mobile', pages: results }, null, 2) + '\n',
);
console.table(results);
