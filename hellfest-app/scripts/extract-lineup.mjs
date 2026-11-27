// Étape 1 : extrait le line-up de hellfest.fr (slug, style, image, description)
// et le fusionne avec le CSV (jour, date, scène, ordre d'affiche).
//
// Usage (depuis hellfest-app/) :
//   node scripts/extract-lineup.mjs
//   node scripts/extract-lineup.mjs --file page.html   (si le site bloque : page enregistrée avec Ctrl+S)
//
// Entrée  : scripts/data/hellfest_2027_lineup.csv
// Sortie  : scripts/data/lineup-base.json

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(DIR, 'data', 'hellfest_2027_lineup.csv');
const OUT_PATH = path.join(DIR, 'data', 'lineup-base.json');
const URL_LINEUP = 'https://hellfest.fr/lineup';

// Normalise un nom pour comparer "Body Count feat. Ice-T" et "BODY COUNT FEAT ICE-T"
export const cle = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');

async function lireHtml() {
  const i = process.argv.indexOf('--file');
  if (i > -1) return readFile(process.argv[i + 1], 'utf-8');
  const res = await fetch(URL_LINEUP, {
    headers: { 'User-Agent': 'Mozilla/5.0 (HellfestApp perso)', 'Accept-Language': 'fr' },
  });
  if (!res.ok) throw new Error(`hellfest.fr a répondu ${res.status}. Enregistrez la page (Ctrl+S) et relancez avec --file`);
  return res.text();
}

// Le site (Nuxt) embarque ses données dans un <script> au format "devalue" :
// un tableau où les objets référencent les autres éléments par leur index.
export function extrairePayload(html) {
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1].trim());
  const brut = scripts.find((s) => s.startsWith('[') && s.includes('page-lineup'));
  if (!brut) throw new Error('Données du line-up introuvables dans la page (le site a peut-être changé).');
  const arr = JSON.parse(brut);
  const WRAPPERS = new Set(['ShallowReactive', 'Reactive', 'Ref', 'ShallowRef', 'EmptyRef', 'EmptyShallowRef', 'Set', 'Map', 'Date']);
  const cache = new Map();
  const rev = (i) => {
    if (typeof i !== 'number' || i < 0) return undefined;
    if (cache.has(i)) return cache.get(i);
    const v = arr[i];
    if (v === null || typeof v !== 'object') { cache.set(i, v); return v; }
    if (Array.isArray(v)) {
      if (typeof v[0] === 'string' && WRAPPERS.has(v[0])) { const r = rev(v[1]); cache.set(i, r); return r; }
      const a = []; cache.set(i, a); for (const x of v) a.push(rev(x)); return a;
    }
    const o = {}; cache.set(i, o); for (const k in v) o[k] = rev(v[k]); return o;
  };
  const data = rev(0)?.data ?? {};
  const cleLineup = Object.keys(data).find((k) => k.startsWith('page-lineup'));
  if (!cleLineup) throw new Error('Clé "page-lineup" absente des données.');
  return data[cleLineup];
}

const capitaliser = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const liste = (t) => t.slice(0, 20).map((x) => `  - ${x}`).join('\n') + (t.length > 20 ? `\n  … et ${t.length - 20} autres` : '');

async function lireCsv() {
  const txt = (await readFile(CSV_PATH, 'utf-8')).replace(/^﻿/, '');
  const [entete, ...lignes] = txt.split(/\r?\n/).filter(Boolean);
  const cols = entete.split(';');
  return lignes.map((l) => Object.fromEntries(l.split(';').map((v, i) => [cols[i], v])));
}

async function main() {
  const [html, csv] = await Promise.all([lireHtml(), lireCsv()]);
  const page = extrairePayload(html);
  const csvParCle = new Map(csv.map((r) => [cle(r['Groupe']), r]));

  const groupes = [];
  const nouveaux = [];
  const slugsVus = new Set();
  const slugCorriges = [];
  // Slug valide et unique, sinon recalculé depuis le nom (ex. Kanine a le slug "GENRE" sur le site)
  const slugSur = (slug, nom) => {
    let s = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug ?? '') ? slug
      : nom.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (s !== slug) slugCorriges.push(`${nom} : "${slug}" → "${s}"`);
    while (slugsVus.has(s)) s += '-2';
    slugsVus.add(s);
    return s;
  };
  for (const jour of page.artist_days ?? []) {
    for (const a of jour.artists ?? []) {
      const raw = a.fragolabs_raw ?? {};
      const ligne = csvParCle.get(cle(a.title));
      if (!ligne) nouveaux.push(a.title);
      groupes.push({
        slug: slugSur(a.slug, a.title),
        nom: ligne?.['Groupe'] ?? a.title,
        nomSite: a.title,
        jour: ligne?.['Jour'] ?? capitaliser(jour.title.split(' ')[0]),
        date: jour.date ?? null, // format ISO, ex. 2027-06-17
        scene: a.stage?.title ?? ligne?.['Scène'] ?? null,
        ordre: ligne ? Number(ligne['Ordre']) : 999,
        style: a.style ?? null,
        image: a.image?.url ?? raw.image ?? null,
        description: raw.description_t?.fr || raw.description_t?.en || null,
      });
      if (ligne) csvParCle.delete(cle(a.title));
    }
  }

  await writeFile(OUT_PATH, JSON.stringify(groupes, null, 2), 'utf-8');
  console.log(`✔ ${groupes.length} groupes écrits dans ${path.relative(process.cwd(), OUT_PATH)}`);
  if (nouveaux.length) console.warn(`⚠ ${nouveaux.length} groupe(s) absents du CSV (ordre = 999, à placer) :\n${liste(nouveaux)}`);
  if (csvParCle.size) console.warn(`⚠ ${csvParCle.size} groupe(s) du CSV introuvables sur le site (renommés ou retirés ?) :\n${liste([...csvParCle.values()].map((r) => r['Groupe']))}`);
  if (slugCorriges.length) console.warn(`ℹ ${slugCorriges.length} slug(s) recalculé(s) :\n${liste(slugCorriges)}`);
  const sansStyle = groupes.filter((g) => !g.style).length;
  if (sansStyle) console.warn(`⚠ ${sansStyle} groupe(s) sans style.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error('✖', e.message); process.exit(1); });
}