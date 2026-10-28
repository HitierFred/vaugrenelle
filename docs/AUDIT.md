# Audits

Résultats datés des audits d'accessibilité, de poids, d'EcoIndex et de responsive. Ce fichier sera complété en phase 8.

## Contrôles automatisés (état au 2026-10-28, phase 1)

| Page                | axe (tous niveaux) | 320 px sans défilement horizontal | Requêtes tierces |
| ------------------- | ------------------ | --------------------------------- | ---------------- |
| `/`                 | 0 violation        | Oui                               | 0                |
| `/demo/composants/` | 0 violation        | Oui                               | 0                |

## Test manuel au clavier (procédure)

À dérouler sur chaque page, sans souris, dans Firefox et dans Chrome.

1. **Chargement** : appuyer sur Tab. Le premier élément focalisé est « Aller au contenu », visible à l'écran.
2. **Lien d'évitement** : appuyer sur Entrée. Le focus passe sur `<main>` et la tabulation suivante atteint le premier élément interactif du contenu.
3. **Ordre de focus** : parcourir toute la page avec Tab puis Maj+Tab. L'ordre suit l'ordre visuel (bandeau, logo, menu, fil d'Ariane, contenu, pied de page) et aucun élément masqué ne reçoit le focus.
4. **Focus visible** : chaque élément focalisé porte un contour orange de 3 px, ou orange clair sur fond sombre. Il n'est jamais masqué par un autre élément.
5. **Menu (largeur < 896 px)** : Entrée sur « Menu » ouvre la navigation. Échap la referme et rend le focus au bouton.
6. **Onglets** : Tab entre dans la liste sur l'onglet actif, les flèches changent d'onglet, Début et Fin vont aux extrémités, puis Tab passe au panneau.
7. **Accordéons** : Entrée ou Espace ouvre et ferme le `<summary>`.
8. **Formulaires** : les cases et boutons radio se cochent à l'Espace. Les flèches changent de bouton radio dans un groupe. Le sélecteur de fichier s'ouvre à l'Entrée.
9. **Liens du résumé d'erreurs** : Entrée amène le focus sur le champ concerné.
10. **Zoom à 200 %** : refaire les étapes 1 à 5. Aucun contenu n'est tronqué et aucun défilement horizontal n'apparaît.

| Date        | Page | Navigateur | Résultat | Remarques |
| ----------- | ---- | ---------- | -------- | --------- |
| _à remplir_ |      |            |          |           |
