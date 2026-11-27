import { get, set } from 'idb-keyval';
import { signalerModification } from './synchro.svelte.js';

/**
 * @typedef {'mcchouffe' | 'jc'} UtilisateurId
 */

/**
 * @typedef {Object} Avis
 * @property {number} note
 * @property {boolean} coeur
 * @property {string} commentaire
 * @property {string} [maj]
 */

/** @type {Record<UtilisateurId, string>} */
export const UTILISATEURS = {
  mcchouffe: 'McChouffe',
  jc: 'JC',
};

export const LONGUEUR_MAX_COMMENTAIRE = 500;

/**
 * @param {string | null} valeur
 * @returns {UtilisateurId | null}
 */
function lireUtilisateur(valeur) {
  return valeur === 'mcchouffe' || valeur === 'jc' ? valeur : null;
}

// Qui utilise ce téléphone, et le code secret (envoyé dans X-App-Secret)
export const session = $state({
  /** @type {UtilisateurId | null} */
  utilisateur: lireUtilisateur(localStorage.getItem('utilisateur')),
  secret: localStorage.getItem('secret') ?? '',
});

/**
 * @param {UtilisateurId} utilisateur
 * @param {string} secret
 */
export function seConnecter(utilisateur, secret) {
  session.utilisateur = utilisateur;
  session.secret = secret;
  localStorage.setItem('utilisateur', utilisateur);
  localStorage.setItem('secret', secret);
}

export function seDeconnecter() {
  if (minuterie) {
    clearTimeout(minuterie);
    minuterie = undefined;
    void enregistrer();
  }
  session.utilisateur = null;
  localStorage.removeItem('utilisateur');
}

// Notes des deux utilisateurs : { mcchouffe: { slug: {...} }, jc: { slug: {...} } }
/** @type {Record<UtilisateurId, Record<string, Avis>>} */
export const notes = $state({
  mcchouffe: {},
  jc: {},
});

/** @type {Promise<void> | null} */
let promesseChargement = null;

export function chargerNotes() {
  if (!promesseChargement) {
    promesseChargement = (async () => {
      /** @type {UtilisateurId[]} */
      const ids = ['mcchouffe', 'jc'];
      for (const u of ids) {
        const donnees = await get(`notes-${u}`);
        if (donnees && typeof donnees === 'object') {
          notes[u] = donnees;
        }
      }
    })();
  }
  return promesseChargement;
}

/** @type {Readonly<Avis>} */
const VIDE = Object.freeze({ note: 0, coeur: false, commentaire: '' });

/**
 * Avis d'un utilisateur sur un groupe (toujours un objet complet).
 * @param {UtilisateurId | null | undefined} utilisateur
 * @param {string} slug
 * @returns {Avis}
 */
export const avis = (utilisateur, slug) => {
  if (!utilisateur) return VIDE;
  return notes[utilisateur]?.[slug] ?? VIDE;
};

/** @type {ReturnType<typeof setTimeout> | undefined} */
let minuterie;
/** @type {UtilisateurId | null} */
let utilisateurAEnregistrer = null;

/**
 * Modifie mon avis sur un groupe, puis enregistre en local 500 ms après la dernière modification
 * et signale le groupe à la file de synchro automatique.
 * @param {string} slug
 * @param {Partial<Avis>} champs
 */
export function modifier(slug, champs) {
  const u = session.utilisateur;
  if (!u) return;
  const courant = avis(u, slug);
  notes[u][slug] = {
    note: courant.note,
    coeur: courant.coeur,
    commentaire: courant.commentaire,
    ...champs,
    maj: new Date().toISOString(),
  };
  signalerModification(slug);
  utilisateurAEnregistrer = u;
  clearTimeout(minuterie);
  minuterie = setTimeout(() => {
    minuterie = undefined;
    void enregistrer();
  }, 500);
}

export async function enregistrer() {
  const u = utilisateurAEnregistrer ?? session.utilisateur;
  if (!u) return;
  utilisateurAEnregistrer = null;
  // $state.snapshot : IndexedDB ne sait pas enregistrer les objets réactifs de Svelte
  await set(`notes-${u}`, $state.snapshot(notes[u]));
}

/**
 * Exporte les notes de l'utilisateur courant au format JSON.
 */
export function exporterNotes() {
  const u = session.utilisateur;
  if (!u) return;
  const contenu = JSON.stringify($state.snapshot(notes[u]), null, 2);
  const blob = new Blob([contenu], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `notes-${u}.json`,
  });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Sauvegarde immédiate si l'onglet est mis en arrière-plan ou fermé avant les 500 ms
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && minuterie) {
      clearTimeout(minuterie);
      minuterie = undefined;
      void enregistrer();
    }
  });
}
