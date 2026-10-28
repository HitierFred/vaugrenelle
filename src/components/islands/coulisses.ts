// Faux back-office : affiche le journal du bus, les dossiers et les réservations
// conservés dans le navigateur, et permet de réinitialiser la démonstration.
import { PEDAGOGIE, resume } from '../../lib/bus-pedagogie';
import { formatIso } from '../../lib/dates-client';
import { listEvents, resetEvents, type BusEventType } from '../../lib/events-bus';
import { KEYS, read, remove } from '../../lib/store';
import { escapeHtml } from './form-kit';
import type { Dossier } from './guichet/guichet';
import type { ReservationConfirmee } from './regie-client';

const euros = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
const horodatage = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'Europe/Paris',
  }).format(new Date(iso));

class Coulisses extends HTMLElement {
  connectedCallback() {
    this.q('[data-nojs]').hidden = true;
    this.querySelectorAll<HTMLElement>('[data-live]').forEach((s) => (s.hidden = false));
    this.q('[data-filter]').addEventListener('change', () => this.renderJournal());
    this.q('[data-reset]').addEventListener('click', () => this.askReset());
    // Mise à jour si un parcours est mené dans un autre onglet
    addEventListener('storage', () => this.render());
    this.render();
  }

  private q<T extends HTMLElement = HTMLElement>(sel: string): T {
    const el = this.querySelector<T>(sel);
    if (!el) throw new Error(`Élément introuvable : ${sel}`);
    return el;
  }

  private render() {
    this.renderJournal();
    this.renderDossiers();
    this.renderReservations();
  }

  private renderJournal() {
    const all = listEvents();
    const type = (this.q<HTMLSelectElement>('[data-filter]').value || '') as BusEventType | '';
    const events = all.filter((e) => !type || e.type === type).reverse();
    const n = events.length;
    this.q('[data-count]').textContent = type
      ? `${n} événement${n > 1 ? 's' : ''} sur ${all.length}`
      : `${n} événement${n > 1 ? 's' : ''}`;
    this.q('[data-empty]').hidden = all.length > 0;
    this.q('[data-journal]').innerHTML = events
      .map((e) => {
        const p = PEDAGOGIE[e.type];
        return `<li class="journal__item" data-type="${escapeHtml(e.type)}">
          <p class="journal__meta"><time datetime="${escapeHtml(e.time)}">${escapeHtml(horodatage(e.time))}</time>
            <code class="journal__type">${escapeHtml(e.type)}</code>
            ${e.subject ? `<span class="muted">Sujet : ${escapeHtml(e.subject)}</span>` : ''}</p>
          <p class="journal__resume"><strong>${escapeHtml(p?.titre ?? e.type)}.</strong> ${escapeHtml(resume(e))}</p>
          ${p ? `<p class="text-small"><strong>En production :</strong> ${escapeHtml(p.destinataires)}. ${escapeHtml(p.controleHumain)}</p>` : ''}
          <details class="journal__payload">
            <summary>Charge utile JSON<span class="visually-hidden"> de l'événement ${escapeHtml(e.type)} de ${escapeHtml(horodatage(e.time))}</span></summary>
            <pre tabindex="0" aria-label="Événement au format CloudEvents"><code>${escapeHtml(JSON.stringify(e, null, 2))}</code></pre>
          </details>
        </li>`;
      })
      .join('');
  }

  private renderDossiers() {
    const dossiers = read<Dossier[]>(KEYS.dossiers, []).slice().reverse();
    this.q('[data-dossiers]').innerHTML = dossiers.length
      ? `<div class="table-wrap"><table class="table">
          <caption class="visually-hidden">Dossiers déposés</caption>
          <thead><tr><th scope="col">Numéro</th><th scope="col">Événement</th><th scope="col">Structure</th><th scope="col">Dates</th><th scope="col">Démarches</th><th scope="col">Statut</th></tr></thead>
          <tbody>${dossiers
            .map(
              (d) =>
                `<tr><th scope="row">${escapeHtml(d.numero)}</th><td>${escapeHtml(d.titre)}<br><span class="text-small muted">${escapeHtml(d.lieu)}</span></td><td>${escapeHtml(d.structure)}</td><td>${escapeHtml(formatIso(d.debut, false))}${d.fin !== d.debut ? ` au ${escapeHtml(formatIso(d.fin, false))}` : ''}</td><td>${d.sousDemarches.length}</td><td>${escapeHtml(d.statut)}</td></tr>`,
            )
            .join('')}</tbody></table></div>`
      : '<p class="muted">Aucun dossier déposé.</p>';
  }

  private renderReservations() {
    const reservations = read<ReservationConfirmee[]>(KEYS.reservations, []).slice().reverse();
    this.q('[data-reservations]').innerHTML = reservations.length
      ? `<div class="table-wrap"><table class="table">
          <caption class="visually-hidden">Réservations confirmées</caption>
          <thead><tr><th scope="col">Numéro</th><th scope="col">Demandeur</th><th scope="col">Période</th><th scope="col">Lieu</th><th scope="col" class="num">Montant</th><th scope="col" class="num">Caution</th></tr></thead>
          <tbody>${reservations
            .map(
              (r) =>
                `<tr><th scope="row">${escapeHtml(r.numero)}</th><td>${escapeHtml(r.demandeur)}<br><span class="text-small muted">${escapeHtml(r.profil)}</span></td><td>${escapeHtml(formatIso(r.debut, false))} au ${escapeHtml(formatIso(r.fin, false))}</td><td>${escapeHtml(r.lieu)}</td><td class="num">${euros(r.total)}</td><td class="num">${euros(r.caution)}</td></tr>`,
            )
            .join('')}</tbody></table></div>`
      : '<p class="muted">Aucune réservation confirmée.</p>';
  }

  // Réinitialisation en deux temps, sans boîte de dialogue native
  private askReset() {
    const zone = this.q('[data-reset-zone]');
    zone.innerHTML = `<p><strong>Tout effacer de ce navigateur ?</strong></p>
      <button class="btn btn--primary" type="button" data-reset-confirm>Oui, réinitialiser</button>
      <button class="btn btn--secondary" type="button" data-reset-cancel>Annuler</button>`;
    zone
      .querySelector<HTMLElement>('[data-reset-confirm]')!
      .addEventListener('click', () => this.reset());
    zone
      .querySelector<HTMLElement>('[data-reset-cancel]')!
      .addEventListener('click', () => this.restoreResetButton(true));
    zone.querySelector<HTMLElement>('[data-reset-confirm]')!.focus();
  }

  private restoreResetButton(focus: boolean) {
    const zone = this.q('[data-reset-zone]');
    zone.innerHTML =
      '<button class="btn btn--secondary" type="button" data-reset>Réinitialiser la démonstration</button>';
    const btn = zone.querySelector<HTMLElement>('[data-reset]')!;
    btn.addEventListener('click', () => this.askReset());
    if (focus) btn.focus();
  }

  private reset() {
    resetEvents();
    for (const key of [KEYS.dossiers, KEYS.reservations, KEYS.brouillonGuichet, KEYS.panierRegie])
      remove(key);
    this.render();
    this.restoreResetButton(true);
    this.q('[data-reset-status]').innerHTML =
      '<p class="alert alert--success">La démonstration est réinitialisée : journal, dossiers, réservations, brouillon et panier sont effacés.</p>';
  }
}

export function defineCoulisses() {
  if (!customElements.get('vg-coulisses')) customElements.define('vg-coulisses', Coulisses);
}
