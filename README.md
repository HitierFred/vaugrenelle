# Vaugrenelle, la ville comme scène — démonstrateur

Démonstrateur statique du portail d'une **collectivité fictive**. Pièce de portfolio : aucune donnée réelle n'est collectée.

- Brief de développement : [`CLAUDE.md`](CLAUDE.md)
- Cahier des charges : [`docs/CDC_Portail_Vaugrenelle.md`](docs/CDC_Portail_Vaugrenelle.md)
- Décisions techniques : [`docs/DECISIONS.md`](docs/DECISIONS.md)

```bash
npm install
npm run dev          # serveur local
npm run build        # build + index Pagefind
npm run preview      # prévisualisation du build
npm run check        # astro check + eslint
npm run test         # Playwright (parcours)
npm run test:a11y    # Playwright + axe
```

Node 22 LTS (voir `.nvmrc`).
