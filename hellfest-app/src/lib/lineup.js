/**
 * @typedef {Object} Groupe
 * @property {string} slug
 * @property {string} nom
 * @property {string} [nomSite]
 * @property {string} jour
 * @property {string} date
 * @property {string} scene
 * @property {number} ordre
 * @property {string | null} style
 * @property {string | null} pays
 * @property {string | null} image
 * @property {string | null} description
 * @property {string | null} [mbid]
 */

export const JOURS = ['Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

/** @type {Record<string, string>} */
export const LIBELLES_JOURS = {
  Jeudi: 'Jeudi 17 Juin 2027',
  Vendredi: 'Vendredi 18 Juin 2027',
  Samedi: 'Samedi 19 Juin 2027',
  Dimanche: 'Dimanche 20 Juin 2027',
};

/** @type {Record<string, string>} */
export const LIBELLES_JOURS_COURTS = {
  Jeudi: 'Jeudi 17 Juin',
  Vendredi: 'Vendredi 18 Juin',
  Samedi: 'Samedi 19 Juin',
  Dimanche: 'Dimanche 20 Juin',
};

export const SCENES = [
  'MAINSTAGE 1',
  'MAINSTAGE 2',
  'WARZONE',
  'RIOT',
  'VALLEY',
  'ABYSS',
  'ALTAR',
  'FORGE',
  'TEMPLE',
  'CRYPT',
];

/**
 * Position dans une liste, valeurs inconnues à la fin.
 * @param {readonly string[]} liste
 * @param {string} valeur
 * @returns {number}
 */
export const rang = (liste, valeur) => {
  const i = liste.indexOf(valeur);
  return i === -1 ? liste.length : i;
};

/**
 * Minuscules sans accents : "ruim" trouve "Ruïm".
 * @param {string | null | undefined} s
 * @returns {string}
 */
export const normaliser = (s) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const nomsRegions = new Intl.DisplayNames(['fr'], { type: 'region' });

/**
 * "FR" -> "France"
 * @param {string | null | undefined} code
 * @returns {string}
 */
export const nomPays = (code) => {
  if (!code) return '';
  try {
    return nomsRegions.of(code) ?? code;
  } catch {
    return code;
  }
};

/**
 * "FR" -> 🇫🇷 (sur Windows, le navigateur affiche parfois "FR" à la place : normal)
 * @param {string | null | undefined} code
 * @returns {string}
 */
export const drapeau = (code) =>
  code && /^[A-Za-z]{2}$/.test(code)
    ? code
        .toUpperCase()
        .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    : '';

/**
 * "SLAM DEATHCORE" -> "Slam deathcore"
 * @param {string | null | undefined} s
 * @returns {string}
 */
export const joliStyle = (s) =>
  s ? s.charAt(0) + s.slice(1).toLowerCase() : '';

/**
 * "2027-06-17" -> "17/06"
 * @param {string | null | undefined} dateIso
 * @returns {string}
 */
export const formatDateCourte = (dateIso) => {
  if (!dateIso) return '';
  const parts = dateIso.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateIso;
};
