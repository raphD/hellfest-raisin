// Étape 2 : ajoute le pays d'origine de chaque groupe via l'API MusicBrainz.
//
// Usage (depuis hellfest-app/) :
//   node scripts/enrich-country.mjs
//
// Entrées : scripts/data/lineup-base.json        (produit par extract-lineup.mjs)
//           scripts/data/corrections.json        (vos corrections manuelles, optionnel)
//           scripts/data/cache-musicbrainz.json  (cache des réponses, créé automatiquement)
// Sorties : public/lineup.json                   (données de l'app)
//           scripts/data/a-verifier.csv          (groupes au pays incertain)
//
// ⚠ Remplacez CONTACT ci-dessous par votre e-mail : MusicBrainz exige un User-Agent identifiable.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const CONTACT = process.env.MB_CONTACT || 'raphael.delaye@gmail.com';
const USER_AGENT = `HellfestApp/0.1 ( ${CONTACT} )`;
const PAUSE_MS = Number(process.env.MB_PAUSE ?? 1100); // MusicBrainz : 1 requête par seconde maximum

const DIR = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(DIR, 'data');
const IN_PATH = path.join(DATA, 'lineup-base.json');
const CACHE_PATH = path.join(DATA, 'cache-musicbrainz.json');
const CORR_PATH = path.join(DATA, 'corrections.json');
const VERIF_PATH = path.join(DATA, 'a-verifier.csv');
const OUT_PATH = path.join(DIR, '..', 'public', 'lineup.json');

// Mots qui aident à départager les homonymes (complétés par le style de chaque groupe)
const MOTS_GENRE = ['metal', 'punk', 'hardcore', 'core', 'doom', 'stoner', 'sludge', 'grind', 'thrash',
  'death', 'black', 'heavy', 'rock', 'psych', 'post', 'gothic', 'goth', 'industrial', 'folk', 'crust',
  'noise', 'drone', 'shoegaze', 'synthwave', 'darkwave', 'emo', 'oi', 'ska', 'grunge', 'prog'];

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function lireJson(p, defaut) {
  try { return JSON.parse(await readFile(p, 'utf-8')); } catch { return defaut; }
}

async function chercherMusicBrainz(nom) {
  const q = `artist:"${nom.replace(/[\\"]/g, '\\$&')}"`;
  const url = `https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(q)}&fmt=json&limit=5`;
  for (let essai = 1; essai <= 4; essai++) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    if (res.ok) {
      const json = await res.json();
      return (json.artists ?? []).map((a) => ({
        mbid: a.id,
        nom: a.name,
        score: Number(a.score),
        type: a.type ?? null,
        pays: a.country ?? null,
        zone: a.area?.name ?? null,
        precision: a.disambiguation ?? null,
        tags: (a.tags ?? []).map((t) => t.name),
      }));
    }
    if (res.status === 503 || res.status === 429) { await dormir(PAUSE_MS * 3 * essai); continue; }
    throw new Error(`MusicBrainz a répondu ${res.status} pour "${nom}"`);
  }
  throw new Error(`MusicBrainz indisponible pour "${nom}" après plusieurs essais`);
}

function evoqueLeGenre(candidat, style) {
  const mots = new Set([...MOTS_GENRE, ...(style ?? '').toLowerCase().split(/[^a-z]+/).filter((m) => m.length > 2)]);
  const texte = [candidat.precision ?? '', ...candidat.tags].join(' ').toLowerCase();
  return [...mots].some((m) => texte.includes(m));
}

// Renvoie { choix, raison } ; raison non nulle = à vérifier à la main
function choisir(candidats, style) {
  const parfaits = candidats.filter((c) => c.score === 100);
  if (parfaits.length === 0) return { choix: null, raison: 'aucune correspondance exacte' };

  let retenus = parfaits;
  if (retenus.length > 1) {
    const groupes = retenus.filter((c) => c.type !== 'Person');
    if (groupes.length) retenus = groupes;
  }
  if (retenus.length > 1) {
    const genre = retenus.filter((c) => evoqueLeGenre(c, style));
    if (genre.length === 1) return { choix: genre[0], raison: null };
    return { choix: genre[0] ?? retenus[0], raison: `${retenus.length} homonymes` };
  }
  const c = retenus[0];
  if (!c.pays) return { choix: c, raison: c.zone ? 'pays déduit de la zone, à confirmer' : 'pays inconnu' };
  if (c.type === 'Person') return { choix: c, raison: 'artiste solo ou personne : vérifier' };
  return { choix: c, raison: null };
}

// "BODY COUNT FEAT ICE-T" → "BODY COUNT"
const nomDeRecherche = (nom) => nom.replace(/\s+(feat\.?|ft\.?|featuring)\s.*$/i, '').trim();

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

async function main() {
  if (CONTACT.includes('exemple')) console.warn('⚠ Pensez à mettre votre e-mail dans CONTACT (ou la variable MB_CONTACT).');

  const groupes = await lireJson(IN_PATH, null);
  if (!groupes) throw new Error('lineup-base.json introuvable : lancez d\'abord extract-lineup.mjs');
  const cache = await lireJson(CACHE_PATH, {});
  const corrections = await lireJson(CORR_PATH, {});

  const aVerifier = [];
  let requetes = 0;

  for (const [i, g] of groupes.entries()) {
    // 1. Correction manuelle : prioritaire, aucune requête
    if (Object.hasOwn(corrections, g.slug)) {
      g.pays = corrections[g.slug]; // code ISO ("US") ou null
      g.mbid = null;
      continue;
    }

    // 2. Cache, sinon requête MusicBrainz
    if (!cache[g.slug]) {
      if (requetes > 0) await dormir(PAUSE_MS);
      process.stdout.write(`[${i + 1}/${groupes.length}] ${g.nom}… `);
      cache[g.slug] = await chercherMusicBrainz(nomDeRecherche(g.nomSite ?? g.nom));
      requetes++;
      await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8'); // sauvegarde au fil de l'eau
      console.log(cache[g.slug][0]?.pays ?? '?');
    }

    // 3. Choix du bon candidat
    const { choix, raison } = choisir(cache[g.slug], g.style);
    g.pays = choix?.pays ?? null;
    g.zone = choix && !choix.pays ? choix.zone : undefined;
    g.mbid = choix?.mbid ?? null;
    if (raison) {
      aVerifier.push([g.slug, g.nom, g.style, raison,
        cache[g.slug].slice(0, 5).map((c) => `${c.nom} | ${c.pays ?? c.zone ?? '?'} | ${c.precision ?? ''} | ${c.score}`).join(' || ')]);
    }
  }

  await writeFile(OUT_PATH, JSON.stringify(groupes, null, 2), 'utf-8');
  const lignes = [['slug', 'nom', 'style', 'raison', 'candidats (nom | pays | précision | score)'], ...aVerifier];
  await writeFile(VERIF_PATH, '﻿' + lignes.map((l) => l.map(csvCell).join(';')).join('\n'), 'utf-8');

  const sansPays = groupes.filter((g) => !g.pays).length;
  console.log(`\n✔ ${groupes.length} groupes écrits dans public/lineup.json (${requetes} requête(s) MusicBrainz)`);
  console.log(`  ${sansPays} sans pays, ${aVerifier.length} à vérifier → scripts/data/a-verifier.csv`);
  console.log('  Corrigez dans scripts/data/corrections.json, ex. { "earth": "US", "very-special-guest": null }, puis relancez.');
}

main().catch((e) => { console.error('\n✖', e.message); process.exit(1); });
