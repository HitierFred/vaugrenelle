import { expect, type Page } from '@playwright/test';

/** Date AAAA-MM-JJ à J + n, en heure de Paris */
export function dateIn(days: number): string {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date());
  const [y, m, d] = today.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export const pdf = (name: string) => ({
  name,
  mimeType: 'application/pdf',
  buffer: Buffer.from('%PDF-1.4 démo'),
});

const nextButton = (page: Page) =>
  page.getByRole('button', { name: /^(Continuer|Déposer le dossier|Confirmer la réservation)$/ });

/** Dépose un dossier complet au Guichet Unique (avec un pack de matériel) ; renvoie son numéro */
export async function deposerDossier(page: Page): Promise<string> {
  await page.goto('agir/organiser-un-evenement/');
  await page.getByRole('button', { name: 'Connexion simulée (démonstration)' }).click();
  await page.getByLabel('Structure organisatrice').selectOption('comite-saint-roch');
  await nextButton(page).click();
  await page.getByLabel("Titre de l'événement").fill('Fête de la rue des Remparts');
  await page.getByLabel("Nature de l'événement").selectOption('fete');
  await page.getByLabel('Date de début').fill(dateIn(60));
  await page.getByLabel('Lieu').selectOption('esplanade-de-la-gare');
  await page.getByLabel('Nombre de personnes attendues').fill('300');
  await nextButton(page).click();
  await page.getByLabel(/Une buvette/).check();
  await page.getByLabel(/Du matériel municipal/).check();
  await page.getByLabel(/Guinguette/).check();
  await nextButton(page).click();
  await page.getByLabel("Statuts de l'association").setInputFiles(pdf('statuts.pdf'));
  await page
    .getByLabel("Attestation d'assurance responsabilité civile")
    .setInputFiles(pdf('assurance.pdf'));
  await page.getByLabel("Plan d'implantation").setInputFiles(pdf('plan.pdf'));
  await expect(page.locator('.extraction')).toHaveCount(3);
  await nextButton(page).click();
  await page.getByLabel(/J'atteste que les informations/).check();
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: 'Votre dossier est déposé' })).toBeVisible();
  return (await page.locator('[data-numero]').textContent()) ?? '';
}

/** Confirme une réservation de matériel à la Régie ; renvoie son numéro */
export async function reserverMateriel(page: Page): Promise<string> {
  await page.goto('regie/reserver/');
  await page.getByLabel('Date de retrait').fill(dateIn(70));
  await page.getByLabel('Date de retour').fill(dateIn(70));
  await page.getByLabel("Lieu d'utilisation").selectOption('parc-brossard');
  await nextButton(page).click();
  await page.getByLabel('Guinguette', { exact: true }).fill('1');
  await page.getByLabel('Guinguette', { exact: true }).blur();
  await nextButton(page).click();
  await page.getByLabel('Retrait au dépôt de la Régie').check();
  await page.getByLabel('Association de Vaugrenelle').check();
  await page.getByLabel('Nom de la structure ou du service').fill('Association Bel-Air Animations');
  await page.getByLabel('Adresse électronique').fill('belair@bel-air-animations.example');
  await nextButton(page).click();
  await page.getByLabel(/J'accepte le règlement de prêt/).check();
  await nextButton(page).click();
  await expect(
    page.getByRole('heading', { name: 'Votre réservation est confirmée' }),
  ).toBeVisible();
  return (await page.locator('[data-numero]').textContent()) ?? '';
}
