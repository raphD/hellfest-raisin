import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  avancement,
  desaccords,
  coeurs,
  parJourEtScene,
  top,
  aRattraper,
} from '../src/lib/stats.js';

const g = (slug, jour = 'Dimanche', scene = 'MAINSTAGE 1', ordre = 1) => ({
  slug,
  nom: slug,
  jour,
  date: '2027-06-20',
  scene,
  ordre,
  style: null,
  pays: null,
  image: null,
  description: null,
});

const av = (note, coeur = false, commentaire = '') => ({
  note,
  coeur,
  commentaire,
  maj: '2027-01-01T00:00:00.000Z',
});

const groupes = [
  g('gojira'),
  g('kreator', 'Dimanche', 'FORGE'),
  g('watain', 'Dimanche', 'TEMPLE'),
  g('slayer', 'Samedi'),
];
const mc = { gojira: av(5, true, 'Enorme'), kreator: av(5), watain: av(1) };
const jc = { gojira: av(5, true), kreator: av(2), watain: av(4, true), slayer: av(5, true) };

test('désaccords : écart de 3 et cœur contre note basse', () => {
  assert.deepEqual(
    desaccords(groupes, mc, jc).map((x) => x.groupe.slug),
    ['kreator', 'watain']
  );
});

test('désaccords : cœur sans note contre note <= 2', () => {
  const res = desaccords([g('earth')], { earth: av(0, true) }, { earth: av(2) });
  assert.equal(res.length, 1);
  assert.equal(res[0].ecart, 0);
});

test('cœurs communs et presque', () => {
  const res = coeurs(
    [...groupes, g('opeth', 'Vendredi', 'ALTAR')],
    { ...mc, opeth: av(4, false) },
    { ...jc, opeth: av(5, true) }
  );
  assert.deepEqual(
    res.communs.map((x) => x.groupe.slug),
    ['gojira']
  );
  assert.deepEqual(
    res.presque.map((x) => x.groupe.slug),
    ['opeth']
  );
});

test('parJourEtScene : ordre officiel des jours et scènes', () => {
  const prog = parJourEtScene([
    { groupe: g('b', 'Dimanche', 'TEMPLE', 2) },
    { groupe: g('a', 'Jeudi', 'MAINSTAGE 1', 1) },
  ]);
  assert.deepEqual(
    prog.map((j) => j.jour),
    ['Jeudi', 'Dimanche']
  );
  assert.equal(prog[0].scenes[0].scene, 'MAINSTAGE 1');
});

test('top : Gojira premier', () => {
  assert.equal(top(groupes, mc, jc)[0].groupe.slug, 'gojira');
});

test('à rattraper : ce que JC a noté et pas McChouffe', () => {
  assert.deepEqual(
    aRattraper(groupes, mc, jc).map((x) => x.groupe.slug),
    ['slayer']
  );
});

test('avancement : totaux, cœurs, commentaires et par jour', () => {
  const st = avancement(groupes, mc);
  assert.equal(st.total, 4);
  assert.equal(st.notes, 3);
  assert.equal(st.pourcent, 75);
  assert.equal(st.coeurs, 1);
  assert.equal(st.commentaires, 1);
  assert.equal(st.parJour.length, 4);
});

