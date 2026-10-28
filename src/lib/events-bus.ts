// Bus d'événements simulé, au format CloudEvents 1.0.
// Les événements sont conservés dans le stockage local et affichés dans
// /demo/coulisses/. Minimisation : identifiants et statuts uniquement.
import { KEYS, read, remove, write } from './store';

export type BusEventType =
  | 'dossier.depose'
  | 'piece.extraite'
  | 'piece.non_conforme'
  | 'avis.requis'
  | 'materiel.prereservation_demandee'
  | 'materiel.indisponible'
  | 'reservation.confirmee';

export interface CloudEvent<T = Record<string, unknown>> {
  specversion: '1.0';
  id: string;
  source: string;
  type: BusEventType;
  time: string;
  subject?: string;
  datacontenttype: 'application/json';
  data: T;
}

export const SOURCES = {
  guichet: '/vaugrenelle/guichet-unique',
  extraction: '/vaugrenelle/service-extraction',
  regles: '/vaugrenelle/moteur-de-regles',
  orchestrateur: '/vaugrenelle/orchestrateur',
  regie: '/vaugrenelle/regie-partagee',
} as const;

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function publish<T extends Record<string, unknown>>(
  type: BusEventType,
  source: string,
  data: T,
  subject?: string,
): CloudEvent<T> {
  const event: CloudEvent<T> = {
    specversion: '1.0',
    id: newId(),
    source,
    type,
    time: new Date().toISOString(),
    ...(subject ? { subject } : {}),
    datacontenttype: 'application/json',
    data,
  };
  write(KEYS.bus, [...listEvents(), event]);
  return event;
}

export function listEvents(): CloudEvent[] {
  return read<CloudEvent[]>(KEYS.bus, []);
}

export function resetEvents(): void {
  remove(KEYS.bus);
}
