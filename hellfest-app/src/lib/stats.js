// Calculs à deux : fonctions pures (sans Svelte), faciles à tester
import { JOURS, SCENES, rang } from './lineup.js';

/**
 * @typedef {import('./lineup.js').Groupe} Groupe
 * @typedef {import('./notes.svelte.js').Avis} Avis
 */

/** @type {Readonly<Avis>} */
const VIDE = Object.freeze({ note: 0, coeur: false, commentaire: '' });

/**
 * @param {Record<string, Avis> | null | undefined} notesUtilisateur
 * @param {string} slug
 * @returns {Avis}
 */
const avisDe = (notesUtilisateur, slug) => notesUtilisateur?.[slug] ?? VIDE;

/**
 * @param {Groupe} a
 * @param {Groupe} b
 * @returns {number}
 */
const ordreAffiche = (a, b) =>
  rang(JOURS, a.jour) - rang(JOURS, b.jour) ||
  rang(SCENES, a.scene) - rang(SCENES, b.scene) ||
  a.ordre - b.ordre;

/**
 * Avancement d'une personne, au total et par jour.
 * @param {Groupe[]} groupes
 * @param {Record<string, Avis> | null | undefined} notesU
 */
export function avancement(groupes, notesU) {
  /** @param {Groupe[]} liste */
  const compter = (liste) => {
    const nbNotes = liste.filter((g) => avisDe(notesU, g.slug).note > 0).length;
    return {
      total: liste.length,
      notes: nbNotes,
      pourcent: liste.length ? Math.round((100 * nbNotes) / liste.length) : 0,
    };
  };
  const tous = Object.values(notesU ?? {});
  return {
    ...compter(groupes),
    coeurs: groupes.filter((g) => avisDe(notesU, g.slug).coeur).length,
    commentaires: tous.filter((a) => Boolean(a.commentaire?.trim())).length,
    parJour: JOURS.map((jour) => ({
      jour,
      ...compter(groupes.filter((g) => g.jour === jour)),
    })),
  };
}

/**
 * Groupes notés par les deux, avec l'écart et la moyenne.
 * @param {Groupe[]} groupes
 * @param {Record<string, Avis> | null | undefined} notesA
 * @param {Record<string, Avis> | null | undefined} notesB
 */
function notesParLesDeux(groupes, notesA, notesB) {
  return groupes
    .map((g) => ({ groupe: g, a: avisDe(notesA, g.slug), b: avisDe(notesB, g.slug) }))
    .filter(({ a, b }) => a.note > 0 && b.note > 0)
    .map((x) => ({
      ...x,
      ecart: Math.abs(x.a.note - x.b.note),
      moyenne: (x.a.note + x.b.note) / 2,
    }));
}

/**
 * Désaccords : écart de note >= seuil, ou cœur d'un côté et note <= 2 de l'autre.
 * @param {Groupe[]} groupes
 * @param {Record<string, Avis> | null | undefined} notesA
 * @param {Record<string, Avis> | null | undefined} notesB
 * @param {number} [seuil=2]
 */
export function desaccords(groupes, notesA, notesB, seuil = 2) {
  return groupes
    .map((g) => ({ groupe: g, a: avisDe(notesA, g.slug), b: avisDe(notesB, g.slug) }))
    .filter(({ a, b }) => {
      const ecart = a.note > 0 && b.note > 0 ? Math.abs(a.note - b.note) : 0;
      const coeurContre =
        (a.coeur && b.note > 0 && b.note <= 2) || (b.coeur && a.note > 0 && a.note <= 2);
      return ecart >= seuil || coeurContre;
    })
    .map((x) => ({
      ...x,
      ecart: x.a.note > 0 && x.b.note > 0 ? Math.abs(x.a.note - x.b.note) : 0,
    }))
    .sort((x, y) => y.ecart - x.ecart || ordreAffiche(x.groupe, y.groupe));
}

/**
 * Cœurs communs, et "presque" : cœur d'un côté, note >= 4 de l'autre.
 * @param {Groupe[]} groupes
 * @param {Record<string, Avis> | null | undefined} notesA
 * @param {Record<string, Avis> | null | undefined} notesB
 */
export function coeurs(groupes, notesA, notesB) {
  /** @type {{ groupe: Groupe, a: Avis, b: Avis }[]} */
  const communs = [];
  /** @type {{ groupe: Groupe, a: Avis, b: Avis }[]} */
  const presque = [];
  for (const g of groupes) {
    const a = avisDe(notesA, g.slug);
    const b = avisDe(notesB, g.slug);
    if (a.coeur && b.coeur) {
      communs.push({ groupe: g, a, b });
    } else if ((a.coeur && b.note >= 4) || (b.coeur && a.note >= 4)) {
      presque.push({ groupe: g, a, b });
    }
  }
  /**
   * @param {{ groupe: Groupe }} x
   * @param {{ groupe: Groupe }} y
   */
  const tri = (x, y) => ordreAffiche(x.groupe, y.groupe);
  return { communs: communs.sort(tri), presque: presque.sort(tri) };
}

/**
 * Regroupe une liste { groupe, ... } par jour puis par scène (pour le "programme").
 * @template {{ groupe: Groupe }} T
 * @param {T[]} liste
 */
export function parJourEtScene(liste) {
  return JOURS.map((jour) => ({
    jour,
    scenes: SCENES.map((scene) => ({
      scene,
      elements: liste.filter((x) => x.groupe.jour === jour && x.groupe.scene === scene),
    })).filter((s) => s.elements.length > 0),
  })).filter((j) => j.scenes.length > 0);
}

/**
 * Notre top : moyenne des deux notes, cœurs en bonus pour départager.
 * @param {Groupe[]} groupes
 * @param {Record<string, Avis> | null | undefined} notesA
 * @param {Record<string, Avis> | null | undefined} notesB
 * @param {number} [limite=20]
 */
export function top(groupes, notesA, notesB, limite = 20) {
  return notesParLesDeux(groupes, notesA, notesB)
    .map((x) => ({
      ...x,
      score: x.moyenne + (x.a.coeur ? 0.25 : 0) + (x.b.coeur ? 0.25 : 0),
    }))
    .sort((x, y) => y.score - x.score || x.ecart - y.ecart || ordreAffiche(x.groupe, y.groupe))
    .slice(0, limite);
}

/**
 * À rattraper : noté par l'autre mais pas par moi, ses cœurs puis ses meilleures notes d'abord.
 * @param {Groupe[]} groupes
 * @param {Record<string, Avis> | null | undefined} notesMoi
 * @param {Record<string, Avis> | null | undefined} notesAutre
 */
export function aRattraper(groupes, notesMoi, notesAutre) {
  return groupes
    .map((g) => ({ groupe: g, moi: avisDe(notesMoi, g.slug), autre: avisDe(notesAutre, g.slug) }))
    .filter(({ moi, autre }) => !moi.note && autre.note > 0)
    .sort(
      (x, y) =>
        Number(y.autre.coeur) - Number(x.autre.coeur) ||
        y.autre.note - x.autre.note ||
        ordreAffiche(x.groupe, y.groupe)
    );
}

