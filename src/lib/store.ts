// Persistance locale : toutes les lectures et écritures passent par ici.
// Si localStorage est indisponible (navigation privée, stockage bloqué),
// les données restent en mémoire le temps de la visite.

export const KEYS = {
  brouillonGuichet: 'vg:guichet:brouillon',
  dossiers: 'vg:dossiers',
  bus: 'vg:bus',
  panierRegie: 'vg:regie:panier',
  reservations: 'vg:reservations',
} as const;

const memory = new Map<string, string>();
let persistent: boolean | null = null;

/** Indique si les données survivent à la fermeture de l'onglet */
export function isPersistent(): boolean {
  if (persistent === null) {
    try {
      const probe = '__vg_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      persistent = true;
    } catch {
      persistent = false;
    }
  }
  return persistent;
}

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = isPersistent() ? localStorage.getItem(key) : (memory.get(key) ?? null);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function write(key: string, value: unknown): void {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  if (!isPersistent()) return;
  try {
    localStorage.setItem(key, raw);
  } catch {
    // Quota dépassé ou stockage révoqué : on bascule en mémoire
    persistent = false;
  }
}

export function remove(key: string): void {
  memory.delete(key);
  if (!isPersistent()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    persistent = false;
  }
}
