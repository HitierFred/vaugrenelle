// Rubrique « Habiter » : pages de contenu type (brief § 5, P2). Contenus fictifs.
import type { ImageMetadata } from 'astro';
import aireDeJeux from '../assets/photos/aire-de-jeux.jpg';
import benevoles from '../assets/photos/benevoles.jpg';
import mairie from '../assets/photos/mairie.jpg';
import parc from '../assets/photos/parc-automne.jpg';
import velo from '../assets/photos/velo-paves.jpg';
import type { Ton } from '../lib/labels';

export interface Section {
  titre: string;
  paragraphes: string[];
  liste?: string[];
}

export interface PageHabiter {
  slug: string;
  titre: string;
  resume: string;
  photo: ImageMetadata;
  alt: string;
  ton: Ton;
  sections: Section[];
  pratique: { libelle: string; valeur: string }[];
  liens?: { label: string; href: string }[];
}

export const PAGES_HABITER: PageHabiter[] = [
  {
    slug: 'mairie-et-vie-municipale',
    titre: 'Mairie et vie municipale',
    resume:
      'Horaires de l’hôtel de ville, conseil municipal, état civil et rendez-vous avec les élus.',
    photo: mairie,
    alt: 'L’entrée de la mairie, derrière un portail en fer forgé ouvert, un matin ensoleillé.',
    ton: 'bleu',
    sections: [
      {
        titre: 'L’hôtel de ville',
        paragraphes: [
          'L’accueil de la mairie vous oriente pour toutes vos démarches. Les agents vous reçoivent sans rendez-vous aux heures d’ouverture.',
          'Pour une carte d’identité ou un passeport, prenez rendez-vous en ligne : le délai moyen est de trois semaines.',
        ],
      },
      {
        titre: 'Le conseil municipal',
        paragraphes: [
          'Le conseil municipal se réunit une fois par mois, le jeudi à 19 heures. Les séances sont publiques et retransmises en direct.',
          'Les délibérations sont publiées sur le portail dans les huit jours qui suivent la séance.',
        ],
      },
      {
        titre: 'État civil',
        paragraphes: ['Vous pouvez demander en ligne :'],
        liste: [
          'un acte de naissance, de mariage ou de décès ;',
          'l’inscription sur les listes électorales ;',
          'le recensement citoyen à 16 ans.',
        ],
      },
    ],
    pratique: [
      { libelle: 'Adresse', valeur: '1 place de l’Hôtel-de-Ville, 00100 Vaugrenelle' },
      {
        libelle: 'Horaires',
        valeur: 'Du lundi au vendredi, 8 h 30 à 17 h 30 ; le samedi, 9 h à 12 h',
      },
      { libelle: 'Téléphone', valeur: '01 00 00 00 00 (numéro fictif)' },
    ],
  },
  {
    slug: 'famille-education-jeunesse',
    titre: 'Famille, éducation, jeunesse',
    resume:
      'Crèches, écoles, restauration scolaire, accueils de loisirs et activités pour les jeunes.',
    photo: aireDeJeux,
    alt: 'Une aire de jeux colorée avec un toboggan, entourée d’arbres.',
    ton: 'vert',
    sections: [
      {
        titre: 'Petite enfance',
        paragraphes: [
          'Vaugrenelle compte quatre crèches municipales et un relais petite enfance qui accompagne les assistantes maternelles.',
          'La demande de place se fait en ligne, dès le sixième mois de grossesse.',
        ],
      },
      {
        titre: 'Écoles et restauration scolaire',
        paragraphes: [
          'Les inscriptions scolaires ont lieu au printemps. Les repas des cantines sont cuisinés sur place, avec 60 % de produits durables.',
          'Le tarif de la restauration scolaire dépend du quotient familial.',
        ],
      },
      {
        titre: 'Jeunesse',
        paragraphes: [
          'Les accueils de loisirs ouvrent le mercredi et pendant les vacances. Les 11-17 ans ont leur espace jeunes, en lien avec La Filature pour des ateliers de cirque.',
        ],
      },
    ],
    pratique: [
      { libelle: 'Guichet famille', valeur: 'Mairie, rez-de-chaussée, du lundi au vendredi' },
      { libelle: 'Inscriptions scolaires', valeur: 'Du 1er mars au 30 avril' },
    ],
  },
  {
    slug: 'solidarites',
    titre: 'Solidarités',
    resume:
      'Centre communal d’action sociale, aide aux démarches numériques, seniors et bénévolat.',
    photo: benevoles,
    alt: 'Des bénévoles en t-shirt bleu ramassent des déchets dans un parc.',
    ton: 'prune',
    sections: [
      {
        titre: 'Le centre communal d’action sociale',
        paragraphes: [
          'Le CCAS accompagne les personnes en difficulté : aides d’urgence, logement, accès aux droits. Un travailleur social vous reçoit sur rendez-vous.',
        ],
      },
      {
        titre: 'Aide aux démarches en ligne',
        paragraphes: [
          'Deux espaces d’accompagnement au numérique vous aident à faire vos démarches. Un conseiller peut agir pour votre compte, avec votre accord.',
        ],
      },
      {
        titre: 'Donner de son temps',
        paragraphes: [
          'Plus de 200 associations cherchent des bénévoles : collectes, nettoyages de quartier, accompagnement scolaire, festival Les Échappées.',
        ],
      },
    ],
    pratique: [
      { libelle: 'CCAS', valeur: '4 rue des Remparts, 00100 Vaugrenelle' },
      {
        libelle: 'Accompagnement numérique',
        valeur: 'Mardi et jeudi, 9 h à 17 h, sans rendez-vous',
      },
    ],
  },
  {
    slug: 'cadre-de-vie',
    titre: 'Cadre de vie',
    resume: 'Parcs et jardins, propreté, déchets, circulation et travaux en cours dans la ville.',
    photo: parc,
    alt: 'Une allée du parc Brossard en automne, avec des bancs sous des arbres orangés.',
    ton: 'teal',
    sections: [
      {
        titre: 'Parcs et jardins',
        paragraphes: [
          'Vaugrenelle entretient 48 hectares d’espaces verts sans pesticides. Le parc Brossard est ouvert tous les jours, de 7 h à 21 h en été.',
        ],
      },
      {
        titre: 'Propreté et déchets',
        paragraphes: [
          'La collecte des ordures ménagères a lieu deux fois par semaine. Les encombrants sont ramassés sur rendez-vous, gratuitement.',
        ],
      },
      {
        titre: 'Circulation et travaux',
        paragraphes: [
          'Les fermetures de rues liées aux travaux et aux événements sont annoncées dans l’agenda et sur la carte des travaux.',
        ],
      },
    ],
    pratique: [
      { libelle: 'Déchetterie', valeur: 'Route de la Gare, du mardi au samedi' },
      { libelle: 'Encombrants', valeur: 'Sur rendez-vous, sous 10 jours' },
    ],
  },
  {
    slug: 'signaler-un-probleme',
    titre: 'Signaler un problème',
    resume:
      'Nid-de-poule, lampadaire éteint, dépôt sauvage : signalez-le et suivez sa prise en charge.',
    photo: velo,
    alt: 'Un vélo jaune garé contre un mur, sur une rue pavée.',
    ton: 'terre',
    sections: [
      {
        titre: 'Comment faire ?',
        paragraphes: [
          'Décrivez le problème, ajoutez une photo et indiquez l’adresse. Vous recevez un numéro de suivi et une réponse sous 72 heures.',
        ],
        liste: [
          'voirie et trottoirs ;',
          'éclairage public ;',
          'propreté et dépôts sauvages ;',
          'mobilier urbain abîmé.',
        ],
      },
      {
        titre: 'En cas d’urgence',
        paragraphes: [
          'Pour un danger immédiat, appelez les services d’urgence. Le signalement en ligne ne remplace pas un appel.',
        ],
      },
    ],
    pratique: [
      { libelle: 'Délai de prise en charge', valeur: '72 heures' },
      { libelle: 'Suivi', valeur: 'Dans votre compte, rubrique « Mes demandes »' },
    ],
    liens: [{ label: 'Voir toutes les démarches', href: '/agir/' }],
  },
];
