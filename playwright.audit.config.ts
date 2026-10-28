// Mesures d'audit (poids, requêtes, EcoIndex) : hors de la suite de tests courante.
// Par défaut sur le site déployé, qui sert les fichiers compressés comme en production.
// AUDIT_URL=http://localhost:4321/vaugrenelle/ pour mesurer le build local.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/audit',
  reporter: 'list',
  workers: 1,
  use: {
    baseURL: process.env.AUDIT_URL ?? 'https://hitierfred.github.io/vaugrenelle/',
  },
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'] } }],
});
