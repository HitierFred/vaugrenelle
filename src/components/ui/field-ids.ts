// Identifiants des textes d'aide et d'erreur, reliés au champ par aria-describedby
export function describedBy(id: string, hint?: string, error?: string): string | undefined {
  const ids = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}
