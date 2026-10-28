// Annuaire fictif : structures rattachées au compte de démonstration.
// Les numéros RNA commencent par W000, préfixe qui n'est attribué à aucun département.

export interface Structure {
  id: string;
  nom: string;
  rna: string;
  objet: string;
  siege: string;
  representant: string;
  email: string;
  telephone: string;
}

export const COMPTE_DEMO = {
  nom: 'Alex Moreau',
  email: 'alex.moreau@vaugrenelle.example',
};

export const STRUCTURES: Structure[] = [
  {
    id: 'comite-saint-roch',
    nom: 'Comité des fêtes du quartier Saint-Roch',
    rna: 'W000123456',
    objet: 'Animer la vie du quartier Saint-Roch',
    siege: '8 rue des Remparts, 00100 Vaugrenelle',
    representant: 'Alex Moreau',
    email: 'contact@comite-saint-roch.example',
    telephone: '06 00 00 00 01',
  },
  {
    id: 'voix-du-canal',
    nom: 'Chorale Les Voix du Canal',
    rna: 'W000234567',
    objet: 'Pratique du chant choral amateur',
    siege: '2 quai des Teinturiers, 00100 Vaugrenelle',
    representant: 'Alex Moreau',
    email: 'bureau@voix-du-canal.example',
    telephone: '06 00 00 00 02',
  },
  {
    id: 'bel-air-animations',
    nom: 'Association Bel-Air Animations',
    rna: 'W000345678',
    objet: 'Organiser des animations familiales dans le quartier Bel-Air',
    siege: '15 avenue du Parc, 00100 Vaugrenelle',
    representant: 'Alex Moreau',
    email: 'belair@bel-air-animations.example',
    telephone: '06 00 00 00 03',
  },
];
