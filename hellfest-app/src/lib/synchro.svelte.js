import { get, set } from 'idb-keyval';
import { session, notes } from './notes.svelte.js';
import { fusionner } from './fusion.js';
import { lireNotes, envoyerNotes } from './api.js';

/**
 * @typedef {'inactif' | 'synchronise' | 'attente' | 'envoi' | 'hors-ligne' | 'erreur' | 'code-incorrect'} StatutSynchro
 */

const DELAI_ENVOI = 3_000; // attente après la dernière modification
const INTERVALLE_LECTURE = 60_000; // lecture régulière quand l'app est à l'écran
const DELAIS_NOUVEL_ESSAI = [5_000, 15_000, 60_000, 300_000];

export const synchro = $state({
  /** @type {StatutSynchro} */
  statut: 'inactif',
  enAttente: 0,
  /** @type {Date | null} */
  derniere: null,
  /** @type {string | null} */
  erreur: null,
});

/** @type {Set<string>} */
let aEnvoyer = new Set(); // slugs modifiés pas encore confirmés par le serveur
/** @type {ReturnType<typeof setTimeout> | null} */
let minuterie = null;
/** @type {ReturnType<typeof setInterval> | null} */
let intervalle = null;
/** @type {AbortController | null} */
let ecouteurs = null; // pour tout débrancher à la déconnexion
let enCours = false;
let relancer = false;
let tentatives = 0;

const moi = () => session.utilisateur;
/** @returns {import('./notes.svelte.js').UtilisateurId} */
const autre = () => (moi() === 'mcchouffe' ? 'jc' : 'mcchouffe');
const cleAttente = () => `en-attente-${moi()}`;

async function enregistrerFile() {
  const u = moi();
  synchro.enAttente = aEnvoyer.size;
  if (!u) return;
  await set(`en-attente-${u}`, [...aEnvoyer]);
}

/** @param {number} delai */
function programmer(delai) {
  if (minuterie !== null) clearTimeout(minuterie);
  minuterie = setTimeout(() => {
    minuterie = null;
    void cycle();
  }, delai);
}

// À appeler après la connexion (ou au démarrage si déjà connecté)
export async function demarrerSynchro() {
  arreterSynchro();
  const u = moi();
  if (!u) return;

  const sauvegardes = await get(cleAttente());
  // Si l'utilisateur a changé entre temps, on abandonne
  if (moi() !== u) return;

  aEnvoyer = new Set(Array.isArray(sauvegardes) ? sauvegardes : []);
  synchro.enAttente = aEnvoyer.size;
  synchro.erreur = null;
  tentatives = 0;

  ecouteurs = new AbortController();
  const { signal } = ecouteurs;
  window.addEventListener('online', () => void cycle(), { signal });
  window.addEventListener('offline', () => (synchro.statut = 'hors-ligne'), { signal });
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.visibilityState === 'visible') void cycle();
      else envoyerAvantFermeture();
    },
    { signal }
  );
  window.addEventListener('pagehide', envoyerAvantFermeture, { signal });

  intervalle = setInterval(() => {
    if (document.visibilityState === 'visible') void cycle();
  }, INTERVALLE_LECTURE);

  await cycle();
}

// À appeler à la déconnexion
export function arreterSynchro() {
  ecouteurs?.abort();
  ecouteurs = null;
  if (minuterie !== null) {
    clearTimeout(minuterie);
    minuterie = null;
  }
  if (intervalle !== null) {
    clearInterval(intervalle);
    intervalle = null;
  }
  relancer = false;
  tentatives = 0;
  aEnvoyer = new Set();
  synchro.enAttente = 0;
  synchro.erreur = null;
  synchro.derniere = null;
  synchro.statut = 'inactif';
}

/**
 * Appelée par notes.svelte.js à chaque modification.
 * @param {string} slug
 */
export function signalerModification(slug) {
  if (!moi()) return;
  aEnvoyer.add(slug);
  void enregistrerFile();
  synchro.statut = navigator.onLine ? 'attente' : 'hors-ligne';
  programmer(DELAI_ENVOI);
}

// Bouton « Synchroniser » : sans attendre
export const synchroniserMaintenant = () => {
  void cycle();
};

async function cycle() {
  const u = moi();
  if (!u) return;
  if (!navigator.onLine) {
    synchro.statut = 'hors-ligne';
    return;
  }
  if (enCours) {
    relancer = true;
    return;
  }

  enCours = true;
  if (minuterie !== null) {
    clearTimeout(minuterie);
    minuterie = null;
  }

  const secret = session.secret;
  const aut = autre();

  try {
    // 1. ENVOI des groupes en attente
    if (aEnvoyer.size) {
      /** @type {Record<string, import('./notes.svelte.js').Avis>} */
      const lot = {};
      for (const slug of [...aEnvoyer]) {
        const snapshot = $state.snapshot(notes[u][slug]);
        if (snapshot) {
          lot[slug] = snapshot;
        } else {
          aEnvoyer.delete(slug);
        }
      }

      if (Object.keys(lot).length > 0) {
        synchro.statut = 'envoi';
        const serveur = await envoyerNotes(secret, u, lot);
        if (moi() !== u) return;
        // On ne retire que ce qui n'a pas été remodifié pendant l'envoi
        for (const [slug, avisEnvoye] of Object.entries(lot)) {
          if (notes[u][slug]?.maj === avisEnvoye.maj) {
            aEnvoyer.delete(slug);
          }
        }
        notes[u] = fusionner($state.snapshot(notes[u]), serveur);
      }
      await enregistrerFile();
    }

    // 2. LECTURE : mes autres appareils + les notes de l'autre
    const tout = await lireNotes(secret);
    if (moi() !== u) return;
    notes[u] = fusionner($state.snapshot(notes[u]), tout[u]);
    notes[aut] = tout[aut] ?? {};

    // 3. Sauvegarde locale (pour le hors ligne)
    await set(`notes-${u}`, $state.snapshot(notes[u]));
    await set(`notes-${aut}`, $state.snapshot(notes[aut]));
    if (moi() !== u) return;

    tentatives = 0;
    synchro.erreur = null;
    synchro.derniere = new Date();
    synchro.statut = aEnvoyer.size ? 'attente' : 'synchronise';
  } catch (e) {
    if (moi() !== u) return;
    /** @type {import('./api.js').ApiError} */
    const err = e instanceof Error ? e : new Error('Erreur réseau');
    synchro.erreur = err.message;
    if (err.status === 401) {
      synchro.statut = 'code-incorrect'; // inutile d'insister
    } else {
      synchro.statut = navigator.onLine ? 'erreur' : 'hors-ligne';
      const delai = DELAIS_NOUVEL_ESSAI[Math.min(tentatives++, DELAIS_NOUVEL_ESSAI.length - 1)];
      programmer(delai);
    }
  } finally {
    enCours = false;
    if (moi() === u && relancer) {
      relancer = false;
      programmer(1_000);
    } else if (moi() === u && aEnvoyer.size > 0 && minuterie === null && synchro.statut === 'attente') {
      programmer(DELAI_ENVOI);
    }
  }
}

// Quand on quitte l'app : envoi "au mieux", sans attendre la réponse.
// La file n'est pas vidée : le prochain cycle confirmera (la fusion évite tout doublon).
function envoyerAvantFermeture() {
  const u = moi();
  if (!u || !aEnvoyer.size || !navigator.onLine) return;
  /** @type {Record<string, import('./notes.svelte.js').Avis>} */
  const lot = {};
  for (const slug of [...aEnvoyer]) {
    const snapshot = $state.snapshot(notes[u][slug]);
    if (snapshot) lot[slug] = snapshot;
  }
  if (Object.keys(lot).length === 0) return;
  envoyerNotes(session.secret, u, lot, { keepalive: true }).catch(() => {});
}
