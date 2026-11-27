/**
 * @typedef {Error & { status?: number }} ApiError
 */

/**
 * Appel générique à l'API du Worker (/api/*).
 * @param {string} chemin
 * @param {string} secret
 * @param {RequestInit} [options={}]
 */
async function appel(chemin, secret, options = {}) {
  const reponse = await fetch(`/api${chemin}`, {
    ...options,
    cache: 'no-store',
    headers: {
      'X-App-Secret': secret,
      'Content-Type': 'application/json',
    },
  });
  if (!reponse.ok) {
    /** @type {ApiError} */
    const erreur = new Error(
      reponse.status === 401 ? 'Code secret incorrect' : `Erreur serveur (${reponse.status})`
    );
    erreur.status = reponse.status;
    throw erreur;
  }
  return reponse.json();
}

/**
 * @param {string} secret
 * @returns {Promise<{ ok: boolean }>}
 */
export const verifierSecret = (secret) => appel('/verifier', secret);

/**
 * @param {string} secret
 * @returns {Promise<Record<import('./notes.svelte.js').UtilisateurId, Record<string, import('./notes.svelte.js').Avis>>>}
 */
export const lireNotes = (secret) => appel('/notes', secret);

/**
 * @param {string} secret
 * @param {import('./notes.svelte.js').UtilisateurId} utilisateur
 * @param {Record<string, import('./notes.svelte.js').Avis>} donnees
 * @param {{ keepalive?: boolean }} [options={}]
 * @returns {Promise<Record<string, import('./notes.svelte.js').Avis>>}
 */
export const envoyerNotes = (secret, utilisateur, donnees, { keepalive = false } = {}) =>
  appel(`/notes/${utilisateur}`, secret, {
    method: 'PUT',
    body: JSON.stringify(donnees),
    keepalive,
  });
