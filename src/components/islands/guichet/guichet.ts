// Parcours « Organiser un événement » (Guichet Unique), côté navigateur.
// Formulaire en 5 étapes : validation par étape, résumé d'erreurs focalisé,
// brouillon sauvegardé, extraction simulée des pièces, contrôles et dépôt.
// Aucune donnée ne quitte le navigateur.
import { COMPTE_DEMO, STRUCTURES } from '../../../lib/annuaire';
import { addDaysIso, formatIso, isIsoDate, todayIso } from '../../../lib/dates-client';
import { SOURCES, publish } from '../../../lib/events-bus';
import { extract, type ExtractionResult, type Niveau } from '../../../lib/extraction';
import {
  conflits,
  controles,
  datesAlternatives,
  lieuxAlternatifs,
  piecesRequises,
  sousDemarches,
  type AgendaItem,
  type Besoins,
  type Controle,
  type PieceRequise,
} from '../../../lib/rules';
import { KEYS, isPersistent, read, remove, write } from '../../../lib/store';

interface PageData {
  etapes: string[];
  lieux: { id: string; nom: string; espacePublic: boolean }[];
  packs: { id: string; nom: string }[];
  agenda: AgendaItem[];
}

type Slot = PieceRequise['slot'];

interface Draft {
  step: number;
  connected: boolean;
  values: Record<string, string | string[]>;
  pieces: Partial<Record<Slot, ExtractionResult>>;
  savedAt: string;
}

export interface Dossier {
  numero: string;
  deposeLe: string;
  statut: string;
  titre: string;
  structure: string;
  lieu: string;
  debut: string;
  fin: string;
  sousDemarches: string[];
  packs: string[];
  chronologie: { date: string; etape: string; detail: string }[];
}

interface FieldError {
  id: string; // champ à focaliser
  message: string;
}

const STEP_COUNT = 5;
const ANALYSE_MS = 1400;

const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const NIVEAU_BADGE: Record<Niveau, { cls: string; icon: string; label: string }> = {
  'pre-valide': { cls: 'success', icon: 'check', label: 'Pré-validé' },
  'a-verifier': { cls: 'warning', icon: 'alert', label: 'À vérifier par un agent' },
  manuel: { cls: 'info', icon: 'user', label: 'Vérification manuelle' },
};

// Tracés des icônes utilisées dans le contenu généré (mêmes tracés que Icon.astro)
const ICONS: Record<string, string> = {
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  alert: '<path d="M12 3L2 20h20L12 3z"/><path d="M12 10v4M12 17.5v.5"/>',
  error: '<circle cx="12" cy="12" r="9"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  file: '<path d="M6 2h8l5 5v15H6V2z"/><path d="M14 2v5h5"/>',
};
const icon = (name: string) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] ?? ''}</svg>`;
const badge = (cls: string, iconName: string, label: string) =>
  `<span class="badge badge--${cls}">${icon(iconName)}${escapeHtml(label)}</span>`;

class Guichet extends HTMLElement {
  private data!: PageData;
  private form!: HTMLFormElement;
  private step = 1;
  private connected = false;
  private pieces: Partial<Record<Slot, ExtractionResult>> = {};
  private analysing = new Set<Slot>();
  private analysisToken: Partial<Record<Slot, number>> = {};
  private baseTitle = document.title;

  connectedCallback() {
    const json = this.querySelector('[data-guichet-data]')?.textContent;
    const form = this.querySelector<HTMLFormElement>('[data-form]');
    if (!json || !form) return;
    this.data = JSON.parse(json) as PageData;
    this.form = form;

    this.q('[data-nojs]').hidden = true;
    form.hidden = false;
    if (!isPersistent()) this.q('[data-storage-notice]').hidden = false;

    this.bind();
    this.restoreDraft();
    this.refreshDerived();
    this.showStep(this.step, false);
  }

  // ---------- Utilitaires DOM ----------
  private q<T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = this): T {
    const el = root.querySelector<T>(sel);
    if (!el) throw new Error(`Élément introuvable : ${sel}`);
    return el;
  }
  private input(id: string) {
    return document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
  }
  private val(id: string): string {
    return (this.input(id)?.value ?? '').trim();
  }
  private checked(name: string): string[] {
    return Array.from(
      this.form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`),
    ).map((i) => i.value);
  }
  private besoins(): Besoins {
    const b = this.checked('besoins');
    return {
      son: b.includes('son'),
      buvette: b.includes('buvette'),
      voie: b.includes('voie'),
      structures: b.includes('structures'),
      materiel: b.includes('materiel'),
    };
  }
  private lieu() {
    return this.data.lieux.find((l) => l.id === this.val('evt-lieu'));
  }
  private dates(): { debut: string; fin: string } {
    const debut = this.val('evt-debut');
    const fin = this.val('evt-fin') || debut;
    return { debut, fin };
  }
  private structureNom() {
    return (
      this.val('org-nom') || STRUCTURES.find((s) => s.id === this.val('org-structure'))?.nom || ''
    );
  }
  private requises(): PieceRequise[] {
    return piecesRequises(this.besoins(), this.lieu()?.espacePublic ?? false);
  }

  // ---------- Événements ----------
  private bind() {
    this.q('[data-login]').addEventListener('click', () => this.login());
    this.input('org-structure')?.addEventListener('change', () => this.fillStructure());
    this.q('[data-prev]').addEventListener('click', () => this.showStep(this.step - 1));
    this.q('[data-restart]').addEventListener('click', () => this.restart());

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.next();
    });
    this.form.addEventListener('input', () => this.saveDraft());
    this.form.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.type === 'file') return this.onFile(target);
      this.refreshDerived();
      if (['evt-lieu', 'evt-debut', 'evt-fin'].includes(target.id)) this.renderConflict();
      this.saveDraft();
    });
    // Liens du résumé d'erreurs : changement d'étape si nécessaire
    this.q('[data-error-summary]').addEventListener('click', (e) => {
      const link = (e.target as HTMLElement).closest('a');
      if (!link) return;
      e.preventDefault();
      this.focusField(link.getAttribute('href')!.slice(1));
    });
  }

  private login() {
    this.connected = true;
    this.renderLogin();
    this.input('org-structure')?.focus();
    this.saveDraft();
  }

  private renderLogin() {
    this.q('[data-before-login]').hidden = this.connected;
    this.q('[data-after-login]').hidden = !this.connected;
    this.q('[data-connected]').innerHTML =
      `${icon('check')}<span>Connecté en tant que ${escapeHtml(COMPTE_DEMO.nom)} (compte fictif)</span>`;
    this.q('[data-structure-details]').hidden = !this.val('org-structure');
  }

  private fillStructure() {
    const s = STRUCTURES.find((x) => x.id === this.val('org-structure'));
    this.q('[data-structure-details]').hidden = !s;
    if (!s) return;
    const set = (id: string, v: string) => {
      const el = this.input(id);
      if (el) el.value = v;
    };
    set('org-nom', s.nom);
    set('org-rna', s.rna);
    set('org-representant', s.representant);
    set('org-email', s.email);
    set('org-telephone', s.telephone);
  }

  // ---------- Étapes ----------
  private showStep(n: number, focus = true) {
    this.step = Math.min(Math.max(n, 1), STEP_COUNT);
    this.form.querySelectorAll<HTMLElement>('[data-step]').forEach((s) => {
      s.hidden = Number(s.dataset.step) !== this.step;
    });
    this.q('[data-prev]').hidden = this.step === 1;
    this.q('[data-next]').textContent =
      this.step === STEP_COUNT ? 'Déposer le dossier' : 'Continuer';

    // Stepper
    const labels = { done: 'terminée', current: 'en cours', todo: 'à venir' } as const;
    this.form.querySelectorAll<HTMLElement>('.stepper li').forEach((li, i) => {
      const state = i + 1 < this.step ? 'done' : i + 1 === this.step ? 'current' : 'todo';
      li.dataset.state = state;
      if (state === 'current') li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
      const hidden = li.querySelector('.stepper__state');
      if (hidden) hidden.textContent = ` (${labels[state]})`;
    });
    const name = this.data.etapes[this.step - 1];
    this.q('[data-stepper-status]').textContent = `Étape ${this.step} sur ${STEP_COUNT} : ${name}`;
    document.title = `Étape ${this.step} sur ${STEP_COUNT} : ${name} — ${this.baseTitle}`;

    if (this.step === 4) this.renderPieces();
    if (this.step === 5) this.renderRecap();
    this.clearSummary();
    this.saveDraft();
    if (focus) this.q(`#etape-${this.step}`).focus();
  }

  private next() {
    const errors = this.validate(this.step);
    if (errors.length) return this.showErrors(errors);
    if (this.step < STEP_COUNT) return this.showStep(this.step + 1);
    this.deposit();
  }

  // ---------- Validation ----------
  private validate(step: number): FieldError[] {
    const errors: FieldError[] = [];
    const require = (id: string, message: string) => {
      if (!this.val(id)) errors.push({ id, message });
    };
    this.form.querySelectorAll('[data-step="' + step + '"] [aria-invalid]').forEach((el) => {
      this.setFieldError(el.id, null);
    });

    if (step === 1) {
      if (!this.connected)
        errors.push({ id: 'connexion', message: 'Connectez-vous pour continuer' });
      else {
        require('org-structure', 'Choisissez la structure organisatrice');
        if (this.val('org-structure')) {
          require('org-nom', 'Indiquez le nom de la structure');
          require('org-representant', 'Indiquez la personne responsable');
          const email = this.val('org-email');
          if (!email)
            errors.push({ id: 'org-email', message: 'Indiquez une adresse électronique' });
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errors.push({
              id: 'org-email',
              message: 'Indiquez une adresse électronique valide, par exemple nom@exemple.fr',
            });
        }
      }
    }

    if (step === 2) {
      require('evt-titre', "Indiquez le titre de l'événement");
      require('evt-nature', "Choisissez la nature de l'événement");
      const { debut, fin } = this.dates();
      if (!debut) errors.push({ id: 'evt-debut', message: 'Indiquez la date de début' });
      else if (!isIsoDate(debut))
        errors.push({ id: 'evt-debut', message: 'Indiquez une date de début valide' });
      if (this.val('evt-fin') && isIsoDate(debut) && fin < debut)
        errors.push({ id: 'evt-fin', message: 'La date de fin doit être après la date de début' });
      require('evt-lieu', 'Choisissez un lieu');
      const jauge = this.val('evt-jauge');
      if (!jauge)
        errors.push({ id: 'evt-jauge', message: 'Indiquez le nombre de personnes attendues' });
      else if (!/^\d+$/.test(jauge) || Number(jauge) < 1)
        errors.push({
          id: 'evt-jauge',
          message: 'Indiquez un nombre entier de personnes, par exemple 200',
        });
      // Conflit de lieu, détecté dès la saisie (EXF-GU-04)
      const lieu = this.lieu();
      if (lieu && isIsoDate(debut) && conflits(lieu.id, debut, fin, this.data.agenda).length)
        errors.push({
          id: 'evt-debut',
          message: `${lieu.nom} est déjà occupé à cette date : choisissez une autre date ou un autre lieu`,
        });
    }

    if (step === 3 && this.besoins().materiel && !this.checked('packs').length)
      errors.push({ id: 'packs', message: 'Choisissez au moins un pack de matériel' });

    if (step === 4) {
      for (const p of this.requises()) {
        const r = this.pieces[p.slot];
        if (this.analysing.has(p.slot))
          errors.push({
            id: `piece-${p.slot}`,
            message: `Patientez : ${p.label} est en cours d'analyse`,
          });
        else if (!r) errors.push({ id: `piece-${p.slot}`, message: `Ajoutez : ${p.label}` });
        else if (r.conformite === 'expiree')
          errors.push({
            id: `piece-${p.slot}`,
            message: `${p.label} : la pièce est expirée, remplacez-la`,
          });
      }
    }

    if (step === 5) {
      for (const c of this.runControles().filter((c) => c.status === 'erreur'))
        errors.push({ id: c.champ ?? 'etape-5', message: c.message });
      if (!(this.input('attestation') as HTMLInputElement | null)?.checked)
        errors.push({ id: 'attestation', message: "Cochez l'attestation sur l'honneur" });
    }

    // Un seul message par champ
    const seen = new Set<string>();
    return errors.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
  }

  private setFieldError(id: string, message: string | null) {
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
      // Le message se place avant le champ, sous le libellé et l'aide
      const anchor =
        field.tagName === 'FIELDSET'
          ? field.querySelector('legend')
          : field.tagName === 'BUTTON'
            ? null
            : field;
      if (field.tagName === 'FIELDSET') anchor?.after(p);
      else if (anchor) anchor.before(p);
      else field.parentElement?.before(p);
      describedBy.push(errId);
      field.setAttribute('aria-invalid', 'true');
    } else {
      field.removeAttribute('aria-invalid');
    }
    if (describedBy.length) field.setAttribute('aria-describedby', describedBy.join(' '));
    else field.removeAttribute('aria-describedby');
  }

  private showErrors(errors: FieldError[]) {
    const summary = this.q('[data-error-summary]');
    this.q('h2', summary).textContent =
      errors.length === 1
        ? 'Le formulaire contient 1 erreur'
        : `Le formulaire contient ${errors.length} erreurs`;
    this.q('ul', summary).innerHTML = errors
      .map((e) => `<li><a href="#${e.id}">${escapeHtml(e.message)}</a></li>`)
      .join('');
    for (const e of errors) if (e.id !== 'etape-5') this.setFieldError(e.id, e.message);
    summary.hidden = false;
    summary.focus();
  }

  private clearSummary() {
    this.q('[data-error-summary]').hidden = true;
  }

  private focusField(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const stepEl = el.closest<HTMLElement>('[data-step]');
    const target = Number(stepEl?.dataset.step ?? this.step);
    if (target !== this.step) {
      this.showStep(target, false);
      // L'erreur reste affichée à côté du champ après le changement d'étape
      const msg = this.validate(target).find((e) => e.id === id);
      if (msg) this.setFieldError(id, msg.message);
    }
    const focusable =
      el.tagName === 'FIELDSET' ? el.querySelector<HTMLElement>('input') : (el as HTMLElement);
    focusable?.focus();
  }

  // ---------- Contenus dérivés ----------
  private refreshDerived() {
    const besoins = this.besoins();
    const espacePublic = this.lieu()?.espacePublic ?? false;
    this.q('[data-packs]').hidden = !besoins.materiel;
    const list = document.querySelector<HTMLElement>('[data-sous-demarches]');
    if (list)
      list.innerHTML = sousDemarches(besoins, espacePublic)
        .map((d) => `<li>${escapeHtml(d.titre)}</li>`)
        .join('');
  }

  private renderConflict() {
    const box = this.q('[data-conflict]');
    const lieu = this.lieu();
    const { debut, fin } = this.dates();
    if (!lieu || !isIsoDate(debut)) return void (box.innerHTML = '');
    const found = conflits(lieu.id, debut, fin, this.data.agenda);
    if (!found.length) return void (box.innerHTML = '');
    const today = todayIso();
    const dates = datesAlternatives(lieu.id, debut, fin, this.data.agenda, today);
    const lieux = lieuxAlternatifs(
      this.data.lieux.filter((l) => l.espacePublic === lieu.espacePublic),
      lieu.id,
      debut,
      fin,
      this.data.agenda,
    ).slice(0, 3);
    box.innerHTML = `<div class="alert alert--warning">
      ${icon('alert')}
      <div class="stack stack-s">
        <p class="alert__title"><strong>Lieu déjà occupé</strong></p>
        <p>${escapeHtml(lieu.nom)} accueille « ${escapeHtml(found[0].titre)} » le ${escapeHtml(formatIso(found[0].jour))}.</p>
        ${dates.length ? `<p>Dates libres proches : ${dates.map((d) => escapeHtml(formatIso(d))).join(' ; ')}.</p>` : ''}
        ${lieux.length ? `<p>Lieux libres à ces dates : ${lieux.map((l) => escapeHtml(l.nom)).join(', ')}.</p>` : ''}
      </div>
    </div>`;
  }

  // ---------- Pièces ----------
  private renderPieces() {
    const requises = this.requises();
    this.form.querySelectorAll<HTMLElement>('[data-piece]').forEach((el) => {
      const slot = el.dataset.piece as Slot;
      const req = requises.find((p) => p.slot === slot);
      el.hidden = !req;
      if (req) this.renderResult(slot);
    });
  }

  private onFile(input: HTMLInputElement) {
    const slot = input.closest<HTMLElement>('[data-piece]')?.dataset.piece as Slot | undefined;
    const file = input.files?.[0];
    if (!slot) return;
    if (!file) {
      delete this.pieces[slot];
      this.renderResult(slot);
      return this.saveDraft();
    }
    this.setFieldError(input.id, null);
    this.analysing.add(slot);
    // Un nouveau fichier annule l'analyse en cours du précédent
    const token = (this.analysisToken[slot] ?? 0) + 1;
    this.analysisToken[slot] = token;
    const box = this.q(`[data-piece="${slot}"] [data-result]`);
    box.innerHTML = prefersReducedMotion()
      ? `<p class="analysing">Analyse de « ${escapeHtml(file.name)} » en cours…</p>`
      : `<p class="analysing"><span class="spinner" aria-hidden="true"></span>Analyse de « ${escapeHtml(file.name)} » en cours…</p>`;

    const result = extract(file.name, {
      structure: this.structureNom(),
      dateEvenement: this.dates().debut,
    });
    setTimeout(() => {
      if (this.analysisToken[slot] !== token) return;
      this.analysing.delete(slot);
      this.pieces[slot] = result;
      this.renderResult(slot);
      this.saveDraft();
      const dossierRef = `brouillon:${slot}`;
      publish(
        'piece.extraite',
        SOURCES.extraction,
        { piece: slot, type: result.type, confiance: result.confidence, niveau: result.niveau },
        dossierRef,
      );
      if (result.conformite === 'expiree')
        publish(
          'piece.non_conforme',
          SOURCES.regles,
          { piece: slot, motif: 'piece_expiree' },
          dossierRef,
        );
    }, ANALYSE_MS);
  }

  private renderResult(slot: Slot) {
    const box = this.form.querySelector<HTMLElement>(`[data-piece="${slot}"] [data-result]`);
    if (!box || this.analysing.has(slot)) return;
    const r = this.pieces[slot];
    if (!r) return void (box.innerHTML = '');
    const expected = this.requises().find((p) => p.slot === slot);
    const mismatch = expected && r.type !== 'non-reconnu' && r.type !== expected.type;
    const b = NIVEAU_BADGE[r.niveau];
    const pct = `${Math.round(r.confidence * 100)} %`;
    box.innerHTML = `<div class="extraction${r.conformite === 'expiree' ? ' extraction--expiree' : ''}">
      <p class="cluster">${icon('file')}<strong>${escapeHtml(r.fileName)}</strong></p>
      <p>Type détecté : <strong>${escapeHtml(r.label)}</strong></p>
      <p class="confidence">Confiance de la lecture : <strong>${pct}</strong> ${
        r.conformite === 'expiree'
          ? badge('danger', 'error', 'Pièce expirée')
          : badge(b.cls, b.icon, b.label)
      }</p>
      ${
        r.fields.length
          ? `<dl>${r.fields.map((f) => `<dt>${escapeHtml(f.libelle)}</dt><dd>${escapeHtml(f.valeur)}</dd>`).join('')}</dl>`
          : ''
      }
      <p${r.conformite === 'expiree' ? ' class="field__error"' : ''}>${r.conformite === 'expiree' ? icon('error') : ''}<span>${escapeHtml(r.message)}</span></p>
      ${
        mismatch
          ? `<p class="text-small"><strong>Attention :</strong> ce fichier ressemble à « ${escapeHtml(r.label)} » et non à « ${escapeHtml(expected.label)} ». Un agent vérifiera.</p>`
          : ''
      }
    </div>`;
  }

  // ---------- Récapitulatif et contrôles ----------
  private runControles(): Controle[] {
    const lieu = this.lieu();
    const { debut, fin } = this.dates();
    return controles({
      lieu: lieu?.id ?? '',
      lieuNom: lieu?.nom ?? 'Le lieu',
      debut,
      fin,
      pieces: this.pieces,
      requises: this.requises(),
      agenda: this.data.agenda,
      today: todayIso(),
    });
  }

  private renderRecap() {
    const lieu = this.lieu();
    const { debut, fin } = this.dates();
    const nature =
      (this.input('evt-nature') as HTMLSelectElement | null)?.selectedOptions[0]?.text ?? '';
    const packs = this.checked('packs').map(
      (id) => this.data.packs.find((p) => p.id === id)?.nom ?? id,
    );
    const besoinsLabels = Array.from(
      this.form.querySelectorAll<HTMLInputElement>('input[name="besoins"]:checked'),
    ).map(
      (i) =>
        this.form.querySelector(`label[for="${i.id}"]`)?.childNodes[0]?.textContent?.trim() ??
        i.value,
    );
    const block = (title: string, step: number, rows: [string, string][]) => `
      <section class="recap__block" aria-labelledby="recap-${step}">
        <h3 id="recap-${step}">${escapeHtml(title)}
          <button class="btn btn--link" type="button" data-goto="${step}">Modifier<span class="visually-hidden"> : ${escapeHtml(title)}</span></button>
        </h3>
        <dl>${rows.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v || '—')}</dd>`).join('')}</dl>
      </section>`;

    const recap = this.q('[data-recap]');
    recap.innerHTML = `<div class="recap">
      ${block('Organisateur', 1, [
        ['Structure', this.structureNom()],
        ['Responsable', this.val('org-representant')],
        ['Adresse électronique', this.val('org-email')],
      ])}
      ${block('Événement', 2, [
        ['Titre', this.val('evt-titre')],
        ['Nature', nature],
        ['Dates', debut === fin ? formatIso(debut) : `Du ${formatIso(debut)} au ${formatIso(fin)}`],
        ['Lieu', lieu?.nom ?? ''],
        ['Personnes attendues', this.val('evt-jauge')],
      ])}
      ${block('Besoins', 3, [
        ['Besoins', besoinsLabels.join(', ') || 'Aucun besoin particulier'],
        ...(packs.length ? [['Matériel', packs.join(', ')] as [string, string]] : []),
      ])}
      ${block(
        'Pièces',
        4,
        this.requises().map((p) => {
          const r = this.pieces[p.slot];
          return [
            p.label,
            r
              ? `${r.fileName} (${r.conformite === 'expiree' ? 'expirée' : NIVEAU_BADGE[r.niveau].label.toLowerCase()})`
              : 'Manquante',
          ];
        }),
      )}
      <section class="recap__block" aria-labelledby="recap-demarches">
        <h3 id="recap-demarches">Démarches incluses</h3>
        <ul>${sousDemarches(this.besoins(), lieu?.espacePublic ?? false)
          .map(
            (d) =>
              `<li>${escapeHtml(d.titre)} <span class="muted text-small">(${escapeHtml(d.service)})</span></li>`,
          )
          .join('')}</ul>
      </section>
    </div>`;
    recap
      .querySelectorAll<HTMLButtonElement>('[data-goto]')
      .forEach((b) => b.addEventListener('click', () => this.showStep(Number(b.dataset.goto))));

    const statusBadge: Record<Controle['status'], string> = {
      ok: badge('success', 'check', 'Conforme'),
      attention: badge('warning', 'alert', 'À vérifier'),
      erreur: badge('danger', 'error', 'Bloquant'),
    };
    this.q('[data-controles]').innerHTML = this.runControles()
      .map(
        (c) =>
          `<li><p class="cluster"><strong>${escapeHtml(c.label)}</strong>${statusBadge[c.status]}</p><p>${escapeHtml(c.message)}</p></li>`,
      )
      .join('');
  }

  // ---------- Dépôt ----------
  private deposit() {
    const lieu = this.lieu()!;
    const { debut, fin } = this.dates();
    const today = todayIso();
    const besoins = this.besoins();
    const demarches = sousDemarches(besoins, lieu.espacePublic);
    const packs = this.checked('packs');
    const numero = `GU-${today.slice(0, 4)}-${String(Math.floor(Date.now() / 1000) % 1_000_000).padStart(6, '0')}`;
    const avis = demarches.filter((d) => d.avis);

    const chronologie: Dossier['chronologie'] = [
      {
        date: today,
        etape: 'Dossier déposé',
        detail: 'Accusé de réception envoyé dans votre compte.',
      },
      {
        date: today,
        etape: 'Contrôles automatiques',
        detail: 'Complétude, validité des pièces, disponibilité du lieu et délai : réalisés.',
      },
      ...(avis.length
        ? [
            {
              date: addDaysIso(today, 3),
              etape: 'Avis des services',
              detail:
                avis.map((a) => a.service).join(', ') +
                (avis.length > 1 ? ' rendent' : ' rend') +
                ' un avis motivé.',
            },
          ]
        : []),
      ...(packs.length
        ? [
            {
              date: addDaysIso(today, 3),
              etape: 'Pré-réservation du matériel',
              detail: 'La Régie partagée bloque le matériel jusqu’à la décision.',
            },
          ]
        : []),
      {
        date: addDaysIso(today, 6),
        etape: 'Décision',
        detail: 'Un agent habilité signe la décision. Aucune décision n’est automatique.',
      },
      {
        date: addDaysIso(debut, -7),
        etape: 'Publication dans l’agenda',
        detail: 'Si votre dossier est accepté et si vous l’avez souhaité.',
      },
      { date: debut, etape: 'Votre événement', detail: lieu.nom },
    ];

    const dossier: Dossier = {
      numero,
      deposeLe: new Date().toISOString(),
      statut: 'En instruction',
      titre: this.val('evt-titre'),
      structure: this.structureNom(),
      lieu: lieu.nom,
      debut,
      fin,
      sousDemarches: demarches.map((d) => d.titre),
      packs,
      chronologie,
    };
    write(KEYS.dossiers, [...read<Dossier[]>(KEYS.dossiers, []), dossier]);

    // Routage vers les services (identifiants et statuts uniquement)
    publish(
      'dossier.depose',
      SOURCES.guichet,
      { dossier: numero, sous_demarches: demarches.map((d) => d.id), statut: 'depose' },
      numero,
    );
    for (const a of avis)
      publish(
        'avis.requis',
        SOURCES.orchestrateur,
        {
          dossier: numero,
          sous_demarche: a.id,
          service: a.service,
          echeance: addDaysIso(today, 3),
        },
        numero,
      );
    if (packs.length)
      publish(
        'materiel.prereservation_demandee',
        SOURCES.guichet,
        { dossier: numero, packs, debut, fin, lieu: lieu.id },
        numero,
      );

    remove(KEYS.brouillonGuichet);
    this.renderConfirmation(dossier);
  }

  private renderConfirmation(d: Dossier) {
    this.form.hidden = true;
    this.q('[data-restored]').hidden = true;
    const box = this.q('[data-confirmation]');
    box.innerHTML = `
      <div class="alert alert--success">
        ${icon('check')}
        <div class="stack stack-s">
          <h2 id="confirmation-titre" tabindex="-1">Votre dossier est déposé</h2>
          <p>Numéro de dossier : <strong data-numero>${escapeHtml(d.numero)}</strong></p>
          <p>Statut : ${badge('info', 'info', d.statut)}</p>
        </div>
      </div>
      <p>Démonstration : aucune donnée n'a été transmise. Le dossier est enregistré dans votre navigateur.</p>
      <section class="stack" aria-labelledby="chrono-titre">
        <h3 id="chrono-titre">Chronologie prévisionnelle</h3>
        <ol class="timeline">${d.chronologie
          .map(
            (c) =>
              `<li><span class="timeline__date">${escapeHtml(formatIso(c.date))}</span><strong>${escapeHtml(c.etape)}</strong><span>${escapeHtml(c.detail)}</span></li>`,
          )
          .join('')}</ol>
      </section>
      <p><button class="btn btn--secondary" type="button" data-new>Déposer un autre dossier</button></p>`;
    box.hidden = false;
    this.q('[data-new]', box).addEventListener('click', () => this.restart());
    document.title = `Dossier déposé — ${this.baseTitle}`;
    this.q('#confirmation-titre', box).focus();
  }

  // ---------- Brouillon ----------
  private saveDraft() {
    if (!this.form || this.form.hidden) return;
    const values: Draft['values'] = {};
    for (const el of Array.from(this.form.elements)) {
      if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement) || !el.name)
        continue;
      if (el instanceof HTMLInputElement && el.type === 'file') continue;
      if (el instanceof HTMLInputElement && el.type === 'checkbox') {
        const arr = (values[el.name] as string[] | undefined) ?? [];
        if (el.checked) arr.push(el.value);
        values[el.name] = arr;
      } else values[el.name] = el.value;
    }
    const draft: Draft = {
      step: this.step,
      connected: this.connected,
      values,
      pieces: this.pieces,
      savedAt: new Date().toISOString(),
    };
    write(KEYS.brouillonGuichet, draft);
  }

  private restoreDraft() {
    const draft = read<Draft | null>(KEYS.brouillonGuichet, null);
    if (!draft) return;
    this.connected = draft.connected;
    this.pieces = draft.pieces ?? {};
    for (const el of Array.from(this.form.elements)) {
      if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement) || !el.name)
        continue;
      const v = draft.values[el.name];
      if (v === undefined) continue;
      if (el instanceof HTMLInputElement && el.type === 'checkbox')
        el.checked = Array.isArray(v) && v.includes(el.value);
      else if (!(el instanceof HTMLInputElement && el.type === 'file')) el.value = String(v);
    }
    this.step = draft.step || 1;
    this.renderLogin();
    this.renderConflict();
    const when = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(
      new Date(draft.savedAt),
    );
    this.q('[data-restored-text]').textContent = `Votre brouillon du ${when} a été restauré.`;
    this.q('[data-restored]').hidden = false;
  }

  private restart() {
    remove(KEYS.brouillonGuichet);
    location.reload();
  }
}

export function defineGuichet() {
  if (!customElements.get('vg-guichet')) customElements.define('vg-guichet', Guichet);
}
