// Outils partagés par les parcours interactifs (Guichet, Régie) :
// échappement, icônes et badges générés, erreurs de champ et résumé d'erreurs.

export interface FieldError {
  id: string; // champ à focaliser
  message: string;
}

export const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

export const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Tracés des icônes utilisées dans le contenu généré (mêmes tracés que Icon.astro)
const ICONS: Record<string, string> = {
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  alert: '<path d="M12 3L2 20h20L12 3z"/><path d="M12 10v4M12 17.5v.5"/>',
  error: '<circle cx="12" cy="12" r="9"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  file: '<path d="M6 2h8l5 5v15H6V2z"/><path d="M14 2v5h5"/>',
  box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4V7z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
  minus: '<path d="M5 12h14"/>',
};

export const icon = (name: string) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] ?? ''}</svg>`;

export const badge = (cls: string, iconName: string, label: string) =>
  `<span class="badge badge--${cls}">${icon(iconName)}${escapeHtml(label)}</span>`;

/** Affiche ou retire le message d'erreur d'un champ, relié par aria-describedby */
export function setFieldError(id: string, message: string | null) {
  const field = document.getElementById(id);
  if (!field) return;
  const errId = `${id}-error`;
  document.getElementById(errId)?.remove();
  const describedBy = (field.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .filter((x) => x && x !== errId);
  if (message) {
    const p = document.createElement('p');
    p.className = 'field__error';
    p.id = errId;
    p.innerHTML = `${icon('error')}<span><span class="visually-hidden">Erreur : </span>${escapeHtml(message)}</span>`;
    // Le message se place sous le libellé et l'aide, avant le champ
    if (field.tagName === 'FIELDSET') field.querySelector('legend')?.after(p);
    else if (field.tagName === 'BUTTON') field.parentElement?.before(p);
    else field.before(p);
    describedBy.push(errId);
    field.setAttribute('aria-invalid', 'true');
  } else {
    field.removeAttribute('aria-invalid');
  }
  if (describedBy.length) field.setAttribute('aria-describedby', describedBy.join(' '));
  else field.removeAttribute('aria-describedby');
}

/** Remplit le résumé d'erreurs, marque les champs et donne le focus au résumé */
export function showErrorSummary(summary: HTMLElement, errors: FieldError[], skip: string[] = []) {
  const title = summary.querySelector('h2');
  const list = summary.querySelector('ul');
  if (title)
    title.textContent =
      errors.length === 1
        ? 'Le formulaire contient 1 erreur'
        : `Le formulaire contient ${errors.length} erreurs`;
  if (list)
    list.innerHTML = errors
      .map((e) => `<li><a href="#${e.id}">${escapeHtml(e.message)}</a></li>`)
      .join('');
  for (const e of errors) if (!skip.includes(e.id)) setFieldError(e.id, e.message);
  summary.hidden = false;
  summary.focus();
}

/** Un seul message par champ */
export const dedupeErrors = (errors: FieldError[]) => {
  const seen = new Set<string>();
  return errors.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
};

/** Met à jour un stepper rendu par Stepper.astro */
export function updateStepper(root: ParentNode, step: number, names: string[]) {
  const labels = { done: 'terminée', current: 'en cours', todo: 'à venir' } as const;
  root.querySelectorAll<HTMLElement>('.stepper li').forEach((li, i) => {
    const state = i + 1 < step ? 'done' : i + 1 === step ? 'current' : 'todo';
    li.dataset.state = state;
    if (state === 'current') li.setAttribute('aria-current', 'step');
    else li.removeAttribute('aria-current');
    const hidden = li.querySelector('.stepper__state');
    if (hidden) hidden.textContent = ` (${labels[state]})`;
  });
  const status = root.querySelector('[data-stepper-status]');
  if (status) status.textContent = `Étape ${step} sur ${names.length} : ${names[step - 1]}`;
}
