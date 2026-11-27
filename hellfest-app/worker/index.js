import { fusionner } from '../src/lib/fusion.js';

const UTILISATEURS = ['mcchouffe', 'jc'];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const TAILLE_MAX = 300_000; // octets
const LONGUEUR_MAX_COMMENTAIRE = 500;
const NB_MAX_GROUPES = 500;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Tout ce qui n'est pas /api/ : l'app (en pratique, run_worker_first nous l'évite déjà)
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      return await api(request, env, url);
    } catch (e) {
      console.error(e);
      return json({ erreur: 'erreur serveur' }, 500);
    }
  },
};

async function api(request, env, url) {
  if (!secretValide(request, env)) {
    return json({ erreur: 'code secret incorrect' }, 401);
  }

  // GET /api/verifier -> sert à l'écran de connexion pour tester le code
  if (url.pathname === '/api/verifier' && request.method === 'GET') {
    return json({ ok: true });
  }

  // GET /api/notes -> les notes des deux utilisateurs
  if (url.pathname === '/api/notes' && request.method === 'GET') {
    const resultat = {};
    for (const u of UTILISATEURS) {
      resultat[u] = (await env.NOTES.get(`notes-${u}`, 'json')) ?? {};
    }
    return json(resultat);
  }

  // PUT /api/notes/:utilisateur -> fusionne et enregistre les notes d'un utilisateur
  const m = url.pathname.match(/^\/api\/notes\/([a-z]+)$/);
  if (m && request.method === 'PUT') {
    const utilisateur = m[1];
    if (!UTILISATEURS.includes(utilisateur)) {
      return json({ erreur: 'utilisateur inconnu' }, 404);
    }

    const texte = await request.text();
    if (texte.length > TAILLE_MAX) {
      return json({ erreur: 'trop volumineux' }, 413);
    }

    let recu;
    try {
      recu = JSON.parse(texte);
    } catch {
      return json({ erreur: 'JSON invalide' }, 400);
    }
    const probleme = valider(recu);
    if (probleme) {
      return json({ erreur: probleme }, 400);
    }

    // On fusionne avec ce qui est déjà sur le serveur (ex. notes faites depuis un autre appareil)
    const cle = `notes-${utilisateur}`;
    const existant = (await env.NOTES.get(cle, 'json')) ?? {};
    const fusion = fusionner(existant, recu);
    await env.NOTES.put(cle, JSON.stringify(fusion));
    return json(fusion);
  }

  return json({ erreur: 'introuvable' }, 404);
}

// Comparaison en temps constant : ne révèle pas, par la durée de réponse, combien de caractères sont justes
function secretValide(request, env) {
  const encodeur = new TextEncoder();
  const recu = encodeur.encode(request.headers.get('X-App-Secret') ?? '');
  const attendu = encodeur.encode(env.APP_SECRET ?? '');
  if (attendu.length === 0 || recu.length !== attendu.length) return false;
  return crypto.subtle.timingSafeEqual(recu, attendu);
}

function valider(donnees) {
  if (!donnees || typeof donnees !== 'object' || Array.isArray(donnees)) {
    return 'objet attendu';
  }
  const entrees = Object.entries(donnees);
  if (entrees.length > NB_MAX_GROUPES) {
    return 'trop de groupes';
  }
  for (const [slug, a] of entrees) {
    if (!SLUG.test(slug)) return `groupe invalide : ${slug}`;
    if (!Number.isInteger(a?.note) || a.note < 0 || a.note > 5) {
      return `note invalide : ${slug}`;
    }
    if (typeof a.coeur !== 'boolean') return `cœur invalide : ${slug}`;
    if (typeof a.commentaire !== 'string' || a.commentaire.length > LONGUEUR_MAX_COMMENTAIRE) {
      return `commentaire invalide : ${slug}`;
    }
    if (typeof a.maj !== 'string' || Number.isNaN(Date.parse(a.maj))) {
      return `date invalide : ${slug}`;
    }
  }
  return null;
}

function json(donnees, statut = 200) {
  return new Response(JSON.stringify(donnees), {
    status: statut,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
