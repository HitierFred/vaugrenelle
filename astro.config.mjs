// @ts-check
import { defineConfig } from 'astro/config';

// Déploiement GitHub Pages : https://hitierfred.github.io/vaugrenelle/
export default defineConfig({
  site: 'https://hitierfred.github.io',
  base: '/vaugrenelle',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  // Aucun traceur, aucune télémétrie côté site
  devToolbar: { enabled: false },
});
