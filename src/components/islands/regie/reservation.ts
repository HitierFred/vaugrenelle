// Parcours « Réserver du matériel » (Régie partagée), côté navigateur.
// Catalogue filtré sur la disponibilité réelle, alertes d'indisponibilité avec
// périodes alternatives, contrôle électrique, devis, convention de prêt imprimable.
// Aucune donnée ne quitte le navigateur.
import {
  PRESTATIONS,
  devis,
  developper,
  disponible,
  horsService,
  packDisponible,
  periodesAlternatives,
  puissanceGroupes,
  puissanceTotale,
  type Devis,
  type MaterielInfo,
  type PackInfo,
  type Prestation,
  type Profil,
  type ReservationInfo,
} from '../../../lib/availability';
import { addDaysIso, daysBetween, formatIso, isIsoDate, todayIso } from '../../../lib/dates-client';
import { SOURCES, publish } from '../../../lib/events-bus';
import type { RegieData } from '../../../lib/regie-data';
import { KEYS, read, remove, write } from '../../../lib/store';
import {
  badge,
  dedupeErrors,
  escapeHtml,
  icon,
  setFieldError,
  showErrorSummary,
  updateStepper,
  type FieldError,
} from '../form-kit';
import {
  allReservations,
  readRegieData,
  type Panier,
  type ReservationConfirmee,
} from '../regie-client';

const STEP_COUNT = 4;
const PROFILS: Record<Profil, string> = {
  interne: 'Service municipal',
  association: 'Association de Vaugrenelle',
  'commune-agglo': "Commune de l'agglomération",
  compagnie: 'Compagnie accueillie',
};

const euros = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
const kw = (w: number) => `${(w / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} kW`;
const plural = (n: number, s: string, p = `${s}s`) => `${n} ${n > 1 ? p : s}`;

class RegieReservation extends HTMLElement {
  private data!: RegieData;
  private etapes: string[] = [];
  private form!: HTMLFormElement;
  private step = 1;
  private today = todayIso();
  private reservations: ReservationInfo[] = [];
  private materiel = new Map<string, MaterielInfo>();
  private packs = new Map<string, PackInfo>();
  private signaled = new Set<string>(); // indisponibilités déjà publiées sur le bus
  private baseTitle = document.title;

  connectedCallback() {
    const data = readRegieData(this);
    const form = this.querySelector<HTMLFormElement>('[data-form]');
    if (!data || !form) return;
    this.data = data;
    this.etapes = JSON.parse(this.querySelector('[data-etapes]')?.textContent ?? '[]');
    this.form = form;
    this.reservations = allReservations(data);
    this.materiel = new Map(data.materiel.map((m) => [m.id, m]));
    this.packs = new Map(data.packs.map((p) => [p.id, p]));

    this.q('[data-nojs]').hidden = true;
    form.hidden = false;
    this.restorePanier();
    this.bind();
    this.showStep(1, false);
  }

  // ---------- Utilitaires ----------
  private q<T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = this): T {
    const el = root.querySelector<T>(sel);
    if (!el) throw new Error(`Élément introuvable : ${sel}`);
    return el;
  }
  private val(id: string) {
    return ((document.getElementById(id) as HTMLInputElement | null)?.value ?? '').trim();
  }
  private radio(name: string) {
    return this.form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value ?? '';
  }
  private periode(): { du: string; au: string } {
    const du = this.val('r-du');
    const au = this.val('r-au') || du;
    return { du, au };
  }
  private lieu() {
    return this.data.lieux.find((l) => l.id === this.val('r-lieu'));
  }
  private qty(input: HTMLInputElement | null) {
    const n = Number(input?.value ?? 0);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }
  private articles() {
    return this.data.materiel
      .map((m) => ({ materiel: m.id, quantite: this.qty(this.input(`q-${m.id}`)) }))
      .filter((a) => a.quantite > 0);
  }
  private packLines() {
    return this.data.packs
      .map((p) => ({ pack: p.id, quantite: this.qty(this.input(`p-${p.id}`)) }))
      .filter((p) => p.quantite > 0);
  }
  private input(id: string) {
    return document.getElementById(id) as HTMLInputElement | null;
  }
  private quantites() {
    return developper(this.articles(), this.packLines(), this.packs);
  }
  private dispo(id: string) {
    const m = this.materiel.get(id)!;
    const { du, au } = this.periode();
    return disponible(m, du, au, this.reservations, this.today);
  }

  // ---------- Événements ----------
  private bind() {
    this.q('[data-prev]').addEventListener('click', () => this.showStep(this.step - 1));
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.next();
    });
    this.form.addEventListener('change', (e) => {
      const t = e.target as HTMLInputElement;
      if (t.id.startsWith('q-') || t.id.startsWith('p-')) this.checkRow(t);
      this.renderPower();
      this.renderPanier();
      this.savePanier();
    });
    this.form.addEventListener('input', (e) => {
      const t = e.target as HTMLInputElement;
      if (t.id.startsWith('q-') || t.id.startsWith('p-')) {
        this.renderPower();
        this.renderPanier();
      }
    });
    this.q('[data-error-summary]').addEventListener('click', (e) => {
      const link = (e.target as HTMLElement).closest('a');
      if (!link) return;
      e.preventDefault();
      this.focusField(link.getAttribute('href')!.slice(1));
    });
  }

  // ---------- Étapes ----------
  private showStep(n: number, focus = true) {
    this.step = Math.min(Math.max(n, 1), STEP_COUNT);
    this.form.querySelectorAll<HTMLElement>('[data-step]').forEach((s) => {
      s.hidden = Number(s.dataset.step) !== this.step;
    });
    this.q('[data-prev]').hidden = this.step === 1;
    this.q('[data-next]').textContent =
      this.step === STEP_COUNT ? 'Confirmer la réservation' : 'Continuer';
    updateStepper(this.form, this.step, this.etapes);
    document.title = `Étape ${this.step} sur ${STEP_COUNT} : ${this.etapes[this.step - 1]} — ${this.baseTitle}`;
    if (this.step === 2) this.renderCatalogue();
    if (this.step === 4) this.renderRecap();
    this.q('[data-error-summary]').hidden = true;
    this.renderPanier();
    if (focus) this.q(`#etape-${this.step}`).focus();
  }

  private next() {
    const errors = dedupeErrors(this.validate(this.step));
    if (errors.length)
      return showErrorSummary(this.q('[data-error-summary]'), errors, ['puissance']);
    if (this.step < STEP_COUNT) return this.showStep(this.step + 1);
    this.confirm();
  }

  private focusField(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const details = el.closest('details');
    if (details) details.open = true;
    const focusable =
      el.tagName === 'FIELDSET' ? el.querySelector<HTMLElement>('input:not(:disabled)') : el;
    focusable?.focus();
  }

  // ---------- Validation ----------
  private validate(step: number): FieldError[] {
    const errors: FieldError[] = [];
    this.form
      .querySelectorAll(`[data-step="${step}"] [aria-invalid]`)
      .forEach((el) => setFieldError(el.id, null));

    if (step === 1) {
      const du = this.val('r-du');
      const au = this.val('r-au');
      if (!isIsoDate(du)) errors.push({ id: 'r-du', message: 'Indiquez la date de retrait' });
      else if (du < this.today)
        errors.push({ id: 'r-du', message: 'La date de retrait est passée' });
      if (!isIsoDate(au)) errors.push({ id: 'r-au', message: 'Indiquez la date de retour' });
      else if (isIsoDate(du) && au < du)
        errors.push({
          id: 'r-au',
          message: 'La date de retour doit être après la date de retrait',
        });
      else if (isIsoDate(du) && daysBetween(du, au) > 30)
        errors.push({ id: 'r-au', message: 'La durée de prêt est limitée à 31 jours' });
      if (!this.val('r-lieu'))
        errors.push({ id: 'r-lieu', message: "Choisissez le lieu d'utilisation" });
    }

    if (step === 2) {
      const quantites = this.quantites();
      if (!quantites.size)
        errors.push({ id: 'packs', message: 'Choisissez au moins un pack ou un article' });
      for (const [id, q] of quantites) {
        const m = this.materiel.get(id)!;
        const d = this.dispo(id);
        if (horsService(m, this.today))
          errors.push({
            id: this.rowInputFor(id),
            message: `${m.designation} est hors service et ne peut pas être réservé`,
          });
        else if (q > d)
          errors.push({
            id: this.rowInputFor(id),
            message: `${m.designation} : ${q} demandé${q > 1 ? 's' : ''}, ${d} disponible${d > 1 ? 's' : ''} sur la période`,
          });
      }
      const power = this.powerState();
      if (power?.depasse)
        errors.push({
          id: 'puissance',
          message: `La puissance demandée (${kw(power.demande)}) dépasse celle du site (${kw(power.capacite)})`,
        });
    }

    if (step === 3) {
      const prestation = this.radio('prestation') as Prestation;
      if (!prestation) errors.push({ id: 'prestation', message: 'Choisissez une prestation' });
      const besoinTech = [...this.quantites().keys()]
        .map((id) => this.materiel.get(id)!)
        .filter((m) => m.technicien);
      if (besoinTech.length && prestation && prestation !== 'technicien')
        errors.push({
          id: 'prestation',
          message: `${besoinTech[0].designation} est prêté avec un technicien : choisissez « ${PRESTATIONS.technicien.label} »`,
        });
      if (!this.radio('profil')) errors.push({ id: 'profil', message: 'Indiquez votre profil' });
      if (!this.val('r-structure'))
        errors.push({
          id: 'r-structure',
          message: 'Indiquez le nom de la structure ou du service',
        });
      const email = this.val('r-email');
      if (!email) errors.push({ id: 'r-email', message: 'Indiquez une adresse électronique' });
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        errors.push({
          id: 'r-email',
          message: 'Indiquez une adresse électronique valide, par exemple nom@exemple.fr',
        });
    }

    if (step === 4 && !this.input('r-attestation')?.checked)
      errors.push({ id: 'r-attestation', message: 'Acceptez le règlement de prêt pour confirmer' });

    return errors;
  }

  /** Champ de quantité où corriger une référence (article, sinon premier pack qui la contient) */
  private rowInputFor(id: string): string {
    if (this.qty(this.input(`q-${id}`)) > 0) return `q-${id}`;
    const pack = this.packLines().find((p) =>
      this.packs.get(p.pack)?.composition.some((c) => c.materiel === id),
    );
    return pack ? `p-${pack.pack}` : `q-${id}`;
  }

  // ---------- Catalogue filtré sur la période ----------
  private renderCatalogue() {
    const { du, au } = this.periode();
    const lieu = this.lieu();
    const jours = daysBetween(du, au) + 1;
    this.q('[data-periode-rappel]').innerHTML =
      `Du <strong>${escapeHtml(formatIso(du))}</strong> au <strong>${escapeHtml(formatIso(au))}</strong> (${plural(jours, 'jour')}), ${escapeHtml(lieu?.nom ?? 'autre lieu')}.`;

    for (const m of this.data.materiel) {
      const row = this.q(`[data-item-row="${m.id}"]`);
      const input = this.input(`q-${m.id}`)!;
      const hint = this.q('[data-hint]', row);
      const hs = horsService(m, this.today);
      row.classList.toggle('qty-row--off', hs);
      input.disabled = hs;
      if (hs) {
        input.value = '0';
        hint.innerHTML = `${badge('danger', 'error', 'Hors service')} ${escapeHtml(m.verification ?? 'Vérification')} dépassée depuis le ${escapeHtml(formatIso(m.echeance!, false))} : non réservable.`;
      } else {
        const d = this.dispo(m.id);
        hint.textContent = `${d} sur ${m.quantite} disponible${d > 1 ? 's' : ''} sur la période`;
        if (d === 0)
          hint.innerHTML = `${badge('danger', 'error', 'Indisponible')} 0 sur ${m.quantite} sur la période`;
      }
      this.checkRow(input, false);
    }
    for (const p of this.data.packs) {
      const row = this.q(`[data-pack-row="${p.id}"]`);
      const input = this.input(`p-${p.id}`)!;
      const hint = this.q('[data-hint]', row);
      const hs = p.composition
        .map((c) => this.materiel.get(c.materiel)!)
        .find((m) => horsService(m, this.today));
      row.classList.toggle('qty-row--off', !!hs);
      input.disabled = !!hs;
      const contenu = p.composition
        .map((c) => `${c.quantite} × ${this.materiel.get(c.materiel)?.designation}`)
        .join(', ');
      if (hs) {
        input.value = '0';
        hint.innerHTML = `${badge('danger', 'error', 'Non réservable')} Contient « ${escapeHtml(hs.designation)} », hors service (vérification dépassée). ${escapeHtml(contenu)}.`;
      } else {
        const d = packDisponible(p, this.materiel, du, au, this.reservations, this.today);
        hint.textContent = `${d} pack${d > 1 ? 's' : ''} complet${d > 1 ? 's' : ''} disponible${d > 1 ? 's' : ''}. ${contenu}.`;
      }
      this.checkRow(input, false);
    }
    this.renderPower();
  }

  /** Alerte « quantité indisponible » avec périodes alternatives */
  private checkRow(input: HTMLInputElement, signal = true) {
    const row = input.closest<HTMLElement>('.qty-row');
    const box = row?.querySelector<HTMLElement>('[data-alert]');
    if (!row || !box) return;
    setFieldError(input.id, null);
    const q = this.qty(input);
    const { du, au } = this.periode();
    const isPack = input.id.startsWith('p-');
    const id = input.id.slice(2);
    if (!q || input.disabled) return void (box.innerHTML = '');

    let d: number;
    let alternatives: { debut: string; fin: string }[];
    let nom: string;
    if (isPack) {
      const p = this.packs.get(id)!;
      nom = p.nom;
      d = packDisponible(p, this.materiel, du, au, this.reservations, this.today);
      alternatives = this.packAlternatives(p, q, du, au);
    } else {
      const m = this.materiel.get(id)!;
      nom = m.designation;
      d = this.dispo(id);
      alternatives = periodesAlternatives(m, q, du, au, this.reservations, this.today);
    }
    if (q <= d) return void (box.innerHTML = '');

    box.innerHTML = `<div class="alert alert--warning">${icon('alert')}<div class="stack stack-s">
      <p class="alert__title"><strong>Quantité indisponible</strong></p>
      <p>${escapeHtml(nom)} : ${q} demandé${q > 1 ? 's' : ''}, ${d === 0 ? 'aucun disponible' : `seulement ${d} disponible${d > 1 ? 's' : ''}`} sur la période.</p>
      ${
        alternatives.length
          ? `<p>Périodes possibles pour ${q} : ${alternatives
              .map((a) =>
                a.debut === a.fin
                  ? `le ${escapeHtml(formatIso(a.debut, false))}`
                  : `du ${escapeHtml(formatIso(a.debut, false))} au ${escapeHtml(formatIso(a.fin, false))}`,
              )
              .join(' ; ')}.</p>`
          : !isPack && q > this.materiel.get(id)!.quantite
            ? `<p>Le parc ne compte que ${this.materiel.get(id)!.quantite} exemplaires : réduisez la quantité.</p>`
            : '<p>Aucune période proche ne permet cette quantité : réduisez-la.</p>'
      }
      ${d > 0 ? `<p><button class="btn btn--link" type="button" data-set-max>Réserver les ${d} disponibles</button></p>` : ''}
    </div></div>`;
    box.querySelector('[data-set-max]')?.addEventListener('click', () => {
      input.value = String(d);
      box.innerHTML = '';
      this.renderPower();
      this.renderPanier();
      this.savePanier();
      input.focus();
    });

    const key = `${input.id}|${q}|${du}|${au}`;
    if (signal && !this.signaled.has(key)) {
      this.signaled.add(key);
      publish('materiel.indisponible', SOURCES.regie, {
        reference: id,
        type: isPack ? 'pack' : 'article',
        demande: q,
        disponible: d,
        debut: du,
        fin: au,
      });
    }
  }

  private packAlternatives(p: PackInfo, q: number, du: string, au: string) {
    const duree = daysBetween(du, au);
    const out: { debut: string; fin: string }[] = [];
    for (let offset = 1; offset <= 90 && out.length < 3; offset++)
      for (const sign of [1, -1]) {
        const d = addDaysIso(du, sign * offset);
        if (d < this.today || out.some((o) => o.debut === d)) continue;
        const f = addDaysIso(d, duree);
        if (packDisponible(p, this.materiel, d, f, this.reservations, this.today) >= q) {
          out.push({ debut: d, fin: f });
          if (out.length >= 3) break;
        }
      }
    return out.sort((a, b) => a.debut.localeCompare(b.debut));
  }

  // ---------- Contrôle électrique ----------
  private powerState() {
    const lieu = this.lieu();
    if (!lieu?.espacePublic) return null;
    const quantites = this.quantites();
    const demande = puissanceTotale(quantites, this.materiel);
    const capacite = lieu.puissance_w + puissanceGroupes(quantites);
    return { lieu, demande, capacite, depasse: demande > capacite };
  }

  private renderPower() {
    const box = this.q('[data-power]');
    const lieu = this.lieu();
    if (!lieu || this.step !== 2) return;
    const state = this.powerState();
    if (!state) {
      box.innerHTML = `<p class="text-small muted" id="puissance" tabindex="-1">${icon('bolt')} ${
        this.val('r-lieu') === 'autre'
          ? 'Hors site équipé : prévoyez une alimentation adaptée ou un groupe électrogène.'
          : `${escapeHtml(lieu.nom)} : la puissance est vérifiée par la régie du lieu.`
      }</p>`;
      return;
    }
    const { demande, capacite, depasse } = state;
    const groupe =
      capacite > lieu.puissance_w
        ? ` (dont ${kw(capacite - lieu.puissance_w)} de groupe électrogène)`
        : '';
    box.innerHTML = `<div id="puissance" tabindex="-1" class="stack stack-s">
      <p><strong>Puissance électrique :</strong> ${kw(demande)} demandés sur ${kw(capacite)} disponibles à ${escapeHtml(lieu.nom)}${groupe}.</p>
      <meter class="meter" min="0" max="${capacite}" low="${capacite * 0.8}" high="${capacite}" optimum="0" value="${Math.min(demande, capacite)}" aria-label="Puissance demandée par rapport à la puissance du site">${kw(demande)} sur ${kw(capacite)}</meter>
      ${
        depasse
          ? `<div class="alert alert--error">${icon('error')}<div class="stack stack-s">
              <p class="alert__title"><strong>Dépassement de la puissance du site</strong></p>
              <p>Le matériel choisi appelle ${kw(demande)}, mais ${escapeHtml(lieu.nom)} ne fournit que ${kw(capacite)}. Retirez du matériel, choisissez un autre site, ou ajoutez un groupe électrogène (famille Énergie).</p>
            </div></div>`
          : ''
      }
    </div>`;
  }

  // ---------- Panier ----------
  private renderPanier() {
    const box = document.querySelector<HTMLElement>('[data-panier]');
    if (!box) return;
    const articles = this.articles();
    const packs = this.packLines();
    if (!articles.length && !packs.length) {
      box.innerHTML = '<p class="text-small muted">Aucun matériel pour l’instant.</p>';
      return;
    }
    const { du, au } = this.periode();
    box.innerHTML = `${
      isIsoDate(du)
        ? `<p class="text-small">Du ${escapeHtml(formatIso(du, false))} au ${escapeHtml(formatIso(au, false))}</p>`
        : ''
    }<ul class="panier-list">${[
      ...packs.map(
        (p) => `<li>${p.quantite} × pack ${escapeHtml(this.packs.get(p.pack)!.nom)}</li>`,
      ),
      ...articles.map(
        (a) => `<li>${a.quantite} × ${escapeHtml(this.materiel.get(a.materiel)!.designation)}</li>`,
      ),
    ].join('')}</ul>`;
  }

  private savePanier() {
    const { du, au } = this.periode();
    const panier: Panier & { packs: { pack: string; quantite: number }[] } = {
      debut: isIsoDate(du) ? du : undefined,
      fin: isIsoDate(au) ? au : undefined,
      articles: this.articles(),
      packs: this.packLines(),
    };
    write(KEYS.panierRegie, panier);
  }

  private restorePanier() {
    const panier = read<Panier & { packs?: { pack: string; quantite: number }[] }>(
      KEYS.panierRegie,
      {
        articles: [],
      },
    );
    if (panier.debut && panier.debut >= this.today) {
      this.input('r-du')!.value = panier.debut;
      this.input('r-au')!.value = panier.fin ?? panier.debut;
    }
    for (const a of panier.articles) {
      const el = this.input(`q-${a.materiel}`);
      if (el) el.value = String(a.quantite);
    }
    for (const p of panier.packs ?? []) {
      const el = this.input(`p-${p.pack}`);
      if (el) el.value = String(p.quantite);
    }
  }

  // ---------- Récapitulatif ----------
  private currentDevis(): Devis {
    const { du, au } = this.periode();
    return devis(
      this.quantites(),
      this.materiel,
      this.radio('profil') as Profil,
      this.radio('prestation') as Prestation,
      du,
      au,
    );
  }

  private devisTable(d: Devis, caption: string) {
    const prestation = PRESTATIONS[this.radio('prestation') as Prestation];
    return `<div class="table-wrap"><table class="table devis">
      <caption>${escapeHtml(caption)}</caption>
      <thead><tr><th scope="col">Matériel</th><th scope="col" class="num">Quantité</th><th scope="col" class="num">Prix par jour</th><th scope="col" class="num">Jours</th><th scope="col" class="num">Total</th></tr></thead>
      <tbody>
        ${d.lignes
          .map(
            (l) =>
              `<tr><th scope="row">${escapeHtml(l.designation)}</th><td class="num">${l.quantite}</td><td class="num">${euros(l.prixJour)}</td><td class="num">${d.jours}</td><td class="num">${euros(l.total)}</td></tr>`,
          )
          .join('')}
        <tr><th scope="row">${escapeHtml(prestation.label)}</th><td></td><td></td><td></td><td class="num">${euros(d.prestation)}</td></tr>
      </tbody>
      <tfoot>
        <tr><th scope="row" colspan="4">Montant total</th><td class="num" data-total>${euros(d.total)}</td></tr>
        <tr><th scope="row" colspan="4">Caution (restituée au retour du matériel)</th><td class="num" data-caution>${euros(d.caution)}</td></tr>
      </tfoot>
    </table></div>`;
  }

  private renderRecap() {
    const { du, au } = this.periode();
    const d = this.currentDevis();
    const profil = this.radio('profil') as Profil;
    const block = (title: string, step: number, rows: [string, string][]) => `
      <section class="recap__block" aria-labelledby="recap-${step}">
        <h3 id="recap-${step}">${escapeHtml(title)}
          <button class="btn btn--link" type="button" data-goto="${step}">Modifier<span class="visually-hidden"> : ${escapeHtml(title)}</span></button>
        </h3>
        <dl>${rows.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v || '—')}</dd>`).join('')}</dl>
      </section>`;
    const recap = this.q('[data-recap]');
    recap.innerHTML = `<div class="recap">
      ${block('Période et lieu', 1, [
        ['Période', `Du ${formatIso(du)} au ${formatIso(au)} (${plural(d.jours, 'jour')})`],
        ['Lieu', this.lieu()?.nom ?? 'Autre lieu'],
      ])}
      ${block('Demandeur', 3, [
        ['Structure', this.val('r-structure')],
        ['Profil', PROFILS[profil]],
        ['Adresse électronique', this.val('r-email')],
      ])}
      <section class="recap__block stack" aria-labelledby="recap-montant">
        <h3 id="recap-montant">Montant
          <button class="btn btn--link" type="button" data-goto="2">Modifier le matériel</button>
        </h3>
        ${this.devisTable(d, 'Détail du montant selon la grille tarifaire')}
        ${profil === 'interne' ? '<p class="text-small">Services municipaux : prêt et prestation gratuits.</p>' : ''}
      </section>
    </div>`;
    recap
      .querySelectorAll<HTMLButtonElement>('[data-goto]')
      .forEach((b) => b.addEventListener('click', () => this.showStep(Number(b.dataset.goto))));
  }

  // ---------- Confirmation ----------
  private confirm() {
    const { du, au } = this.periode();
    const d = this.currentDevis();
    const quantites = this.quantites();
    const numero = `RP-${this.today.slice(0, 4)}-${String(Math.floor(Date.now() / 1000) % 1_000_000).padStart(6, '0')}`;
    const reservation: ReservationConfirmee = {
      numero,
      confirmeeLe: new Date().toISOString(),
      debut: du,
      fin: au,
      lieu: this.lieu()?.nom ?? 'Autre lieu',
      demandeur: this.val('r-structure'),
      profil: PROFILS[this.radio('profil') as Profil],
      prestation: PRESTATIONS[this.radio('prestation') as Prestation].label,
      quantites: [...quantites],
      articles: this.articles(),
      packs: this.packLines(),
      total: d.total,
      caution: d.caution,
    };
    write(KEYS.reservations, [...read<ReservationConfirmee[]>(KEYS.reservations, []), reservation]);
    publish(
      'reservation.confirmee',
      SOURCES.regie,
      { reservation: numero, debut: du, fin: au, references: quantites.size, statut: 'confirmee' },
      numero,
    );
    remove(KEYS.panierRegie);
    this.renderConfirmation(reservation, d);
  }

  private renderConfirmation(r: ReservationConfirmee, d: Devis) {
    this.form.hidden = true;
    const box = this.q('[data-confirmation]');
    const signedOn = formatIso(this.today);
    box.innerHTML = `
      <div class="alert alert--success no-print">
        ${icon('check')}
        <div class="stack stack-s">
          <h2 id="confirmation-titre" tabindex="-1">Votre réservation est confirmée</h2>
          <p>Numéro : <strong data-numero>${escapeHtml(r.numero)}</strong></p>
          <p>Démonstration : aucune donnée n'a été transmise. Le matériel est bloqué dans les disponibilités de ce navigateur.</p>
        </div>
      </div>
      <p class="no-print"><button class="btn btn--primary" type="button" data-print>Imprimer la convention de prêt</button></p>
      <article class="convention" aria-labelledby="convention-titre">
        <header class="stack stack-s">
          <p class="event-kicker">Ville de Vaugrenelle (collectivité fictive) — Régie partagée</p>
          <h2 id="convention-titre">Convention de prêt de matériel n° ${escapeHtml(r.numero)}</h2>
          <p class="text-small muted">Document de démonstration, sans valeur juridique.</p>
        </header>
        <section class="stack stack-s" aria-labelledby="conv-parties">
          <h3 id="conv-parties">Entre les parties</h3>
          <p>La Ville de Vaugrenelle, représentée par le régisseur général de la Régie partagée, ci-après « le prêteur » ;</p>
          <p>et ${escapeHtml(r.demandeur)} (${escapeHtml(r.profil.toLowerCase())}), ci-après « l'emprunteur ».</p>
        </section>
        <section class="stack stack-s" aria-labelledby="conv-objet">
          <h3 id="conv-objet">Article 1 — Objet et période</h3>
          <p>Le prêteur met à disposition le matériel ci-dessous, du ${escapeHtml(formatIso(r.debut))} au ${escapeHtml(formatIso(r.fin))}, pour une utilisation à : ${escapeHtml(r.lieu)}. Prestation : ${escapeHtml(r.prestation.toLowerCase())}.</p>
          ${this.devisTable(d, 'Matériel prêté et montant')}
        </section>
        <section class="stack stack-s" aria-labelledby="conv-obligations">
          <h3 id="conv-obligations">Article 2 — Obligations de l'emprunteur</h3>
          <ol>
            <li>Utiliser le matériel conformément à sa destination et aux consignes de sécurité remises au retrait.</li>
            <li>Être assuré en responsabilité civile pour la durée du prêt.</li>
            <li>Signaler sans délai toute panne, casse ou perte à la Régie partagée.</li>
            <li>Restituer le matériel propre et complet à la date prévue. Un état des lieux contradictoire est réalisé au retrait et au retour.</li>
          </ol>
        </section>
        <section class="stack stack-s" aria-labelledby="conv-caution">
          <h3 id="conv-caution">Article 3 — Caution</h3>
          <p>Une caution de ${euros(r.caution)} est déposée au retrait. Elle est restituée au retour, déduction faite des éventuels frais de remise en état, après avis du régisseur général.</p>
        </section>
        <section class="stack stack-s" aria-labelledby="conv-signatures">
          <h3 id="conv-signatures">Signatures</h3>
          <p>Fait à Vaugrenelle, le ${escapeHtml(signedOn)}.</p>
          <div class="signatures">
            <div><p class="text-small">Pour le prêteur</p></div>
            <div><p class="text-small">Pour l'emprunteur</p></div>
          </div>
        </section>
      </article>
      <p class="no-print"><a href="${escapeHtml(location.pathname)}">Faire une autre réservation</a></p>`;
    box.hidden = false;
    this.q('[data-print]', box).addEventListener('click', () => window.print());
    document.title = `Réservation confirmée — ${this.baseTitle}`;
    this.q('#confirmation-titre', box).focus();
    const panier = document.querySelector<HTMLElement>('[data-panier]');
    if (panier)
      panier.innerHTML = '<p class="text-small muted">Panier vidé après confirmation.</p>';
  }
}

export function defineRegieReservation() {
  if (!customElements.get('vg-regie-reservation'))
    customElements.define('vg-regie-reservation', RegieReservation);
}
