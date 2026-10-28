// Construit un chemin interne préfixé par la base du site (/vaugrenelle/).
// Ne jamais écrire de lien interne en dur sous la forme « /… ».
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function url(path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}${clean}`;
}

// Indique si le chemin courant correspond à une rubrique (pour aria-current)
export function isInSection(currentPath: string, sectionPath: string): boolean {
  const target = url(sectionPath);
  return currentPath === target || currentPath.startsWith(target);
}
