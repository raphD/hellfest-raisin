# Webapp Hellfest 2027 – McChouffe & JC

Notes de cadrage (pas encore de dev). Objectif : écouter, noter et commenter à deux les 307 groupes du line-up du Hellfest 2027 (17–20 juin 2027).

## 1. Décisions prises

| Sujet | Choix |
|---|---|
| Utilisateurs | **McChouffe** et **JC** |
| Hébergement | **Cloudflare Pages** (gratuit) |
| Stockage des notes | **Cloudflare Workers KV**, via des Pages Functions |
| Architecture | **Option C, hybride** : PWA offline-first + synchro |
| Synchro entre les deux téléphones | **Indispensable** |
| Données des groupes | CSV du line-up enrichi (style depuis hellfest.fr, pays via MusicBrainz), livré en JSON statique |
| Écoute | **YouTube, YouTube Music et Spotify** uniquement, avec icônes |
| Stack | **JS léger** : Vite + Svelte |
| Horaires / planning | **Hors périmètre** pour l'instant : l'app officielle du Hellfest le fait |

## 2. Fonctionnalités

### Affichage
- Liste par jour puis par scène, dans l'ordre de l'affiche (colonne `Ordre` du CSV), et une vue tableau
- Pour chaque groupe : nom, jour, scène, **style**, **pays** (drapeau + nom), image si disponible

### Recherche, filtres, tris
- Recherche plein texte (nom du groupe, style, pays, commentaires)
- Filtres : jour, scène, style, pays, « pas encore noté », « coups de cœur », « commenté par l'autre »
- Tris : ordre de l'affiche, nom, note de McChouffe, note de JC, moyenne

### Notes, cœurs, commentaires (séparés pour chacun)
- Note de 1 à 5 étoiles
- Cœur « coup de cœur »
- Commentaire libre (« super en live », « à réécouter »…), affiché sous le groupe avec le prénom de l'auteur
- Moyenne des deux notes affichée

### Écouter
Trois boutons avec icône par groupe, qui ouvrent une recherche sur le nom du groupe :

| Service | URL |
|---|---|
| YouTube | `https://www.youtube.com/results?search_query=<nom>` |
| YouTube Music | `https://music.youtube.com/search?q=<nom>` |
| Spotify | `https://open.spotify.com/search/<nom>` |

- Le nom est encodé avec `encodeURIComponent()`
- Pour les noms ambigus (Earth, Void, Speed…), ajouter « band » à la recherche
- Sur mobile, ces liens ouvrent en général directement l'app installée
- Icônes : SVG de **Simple Icons** (simpleicons.org, sous licence CC0), intégrés dans l'app. Respecter les règles d'usage des marques : logos non modifiés, simplement utilisés comme liens.

### À deux
- **Avancement** : « McChouffe : 142/307 écoutés, JC : 98/307 » + filtre « ce que l'autre a noté et pas moi »
- **Désaccords** : groupes avec un gros écart de note (5 contre 1), à départager ou à réécouter ensemble
- **Cœurs communs** : les groupes à ne surtout pas rater

## 3. Architecture : PWA offline-first + Cloudflare Pages + Workers KV

### Principe
- Les fichiers du site déployé sont en lecture seule : `lineup.json` est servi tel quel
- Les notes passent par une **Pages Function** (petite API) qui lit et écrit dans **Workers KV**
- Le téléphone enregistre tout **d'abord en local**, puis synchronise dès qu'il y a du réseau (le réseau sature souvent sur le site du festival)

### Quotas gratuits de Workers KV (vérifiés en novembre 2026)
- 100 000 lectures/jour
- 1 000 écritures/jour (clés différentes), **1 écriture/seconde sur une même clé**
- 1 Go de stockage
- Remise à zéro chaque jour à minuit UTC ; au-delà, les opérations échouent avec une erreur (pas de facturation surprise)

### Données
- **`lineup.json`** : statique, déployé avec le site, regénéré quand Hellfest annonce de nouveaux groupes
- **Une clé KV par personne** : `notes-mcchouffe` et `notes-jc`. Chacun n'écrit que la sienne, donc aucun risque d'écraser les notes de l'autre.
- Format d'une clé :

```json
{
  "gojira": { "note": 5, "coeur": true, "commentaire": "Incontournable", "maj": "2027-03-12T21:04:00Z" },
  "watain": { "note": 3, "coeur": false, "commentaire": "À réécouter", "maj": "2027-03-14T19:30:00Z" }
}
```

- Clé d'un groupe = le slug fourni par hellfest.fr (ex. `16-horsepower`), plus stable que le nom
- Champ `maj` : date de mise à jour, pour fusionner les versions locale et serveur (la plus récente gagne, groupe par groupe)
- Commentaire limité à environ 500 caractères

### API (Pages Functions)

| Méthode | Route | Rôle |
|---|---|---|
| `GET` | `/api/notes` | Renvoie les notes des deux utilisateurs |
| `PUT` | `/api/notes/:user` | Enregistre les notes d'un utilisateur (`mcchouffe` ou `jc`) |

- Écriture protégée par un **code secret** envoyé dans un en-tête (ex. `X-App-Secret`), comparé à une variable d'environnement chiffrée côté Cloudflare. Le code n'est jamais écrit dans le code du site : chacun le saisit une fois sur son téléphone.
- Réponses avec `Cache-Control: no-store`, pour ne jamais recevoir une version périmée depuis le CDN

### Synchro
1. Toute modification est enregistrée **immédiatement en local** (IndexedDB) et marquée « à envoyer »
2. Les modifications sont **regroupées** et envoyées quelques secondes après la dernière saisie (pas à chaque lettre d'un commentaire, à cause de la limite d'1 écriture/s par clé)
3. Sans réseau, la file d'attente est conservée et renvoyée au retour du réseau
4. L'app **récupère les notes de l'autre** à l'ouverture, au retour au premier plan et toutes les 30 à 60 secondes
5. Fusion groupe par groupe selon `maj`
6. Indicateur visible : « synchronisé », « en attente (3) », « hors ligne »

À savoir : KV est « éventuellement cohérent ». Une écriture peut mettre jusqu'à une minute environ à être visible partout, ce qui est sans importance pour cet usage.

### Identification
- Pas de vrais comptes : au premier lancement, choix « Je suis McChouffe / Je suis JC » + saisie du code secret, mémorisés sur le téléphone

## 4. Hébergement Cloudflare Pages : marche à suivre

> Les intitulés des menus Cloudflare évoluent régulièrement : se fier à la documentation officielle (developers.cloudflare.com/pages) en cas d'écart.

### Prérequis
- Un compte **GitHub** (gratuit)
- Un compte **Cloudflare** (gratuit, sans carte bancaire)
- **Node.js** (version LTS) installé sur le PC

### Étape 1 – Créer le projet en local
```bash
npm create vite@latest hellfest-app -- --template svelte
cd hellfest-app
npm install
npm install -D wrangler vite-plugin-pwa
```

Arborescence visée :
```
hellfest-app/
├─ public/
│  └─ lineup.json          ← données enrichies (statiques)
├─ functions/
│  └─ api/
│     └─ notes/
│        ├─ index.js       ← GET /api/notes
│        └─ [user].js      ← PUT /api/notes/:user
├─ src/                    ← app Svelte
└─ package.json
```
Le dossier `functions/` à la racine est reconnu automatiquement par Cloudflare Pages : chaque fichier devient une route d'API.

### Étape 2 – Pousser sur GitHub
- Créer un dépôt (privé ou public) et y pousser le projet

### Étape 3 – Créer l'espace KV
- Dashboard Cloudflare → **Storage & Databases → KV** (ou **Workers & Pages → KV**) → **Create namespace**
- Nom : `hellfest-notes`

### Étape 4 – Créer le projet Pages
- Dashboard → **Workers & Pages → Create → Pages → Connect to Git**
- Autoriser Cloudflare sur GitHub et choisir le dépôt
- Réglages du build :
  - Framework preset : **Svelte** (ou aucun)
  - Build command : `npm run build`
  - Build output directory : `dist`
- **Save and Deploy** → le site est en ligne sur `https://<nom-du-projet>.pages.dev`

### Étape 5 – Brancher KV et le secret
Dans le projet Pages → **Settings** :
- **Bindings → Add → KV namespace** : nom de variable `NOTES`, namespace `hellfest-notes` (à faire pour l'environnement *Production*, et *Preview* si besoin)
- **Variables and Secrets → Add** : `APP_SECRET`, type **Secret** (chiffré), valeur = le code partagé entre McChouffe et JC
- Relancer un déploiement pour que ces réglages soient pris en compte

Dans une fonction, ils sont accessibles via `context.env.NOTES` et `context.env.APP_SECRET`.

### Étape 6 – Développer en local
```bash
npm run build
npx wrangler pages dev dist --kv NOTES
```
- Le secret local se met dans un fichier `.dev.vars` (`APP_SECRET=...`), à ajouter au `.gitignore`

### Étape 7 – Mises à jour
- Chaque `git push` sur la branche principale redéploie le site automatiquement
- Chaque autre branche ou pull request obtient sa propre URL de prévisualisation
- Les notes dans KV ne sont **pas** touchées par les redéploiements

### Étape 8 – Installer sur les téléphones
- Ouvrir l'URL `*.pages.dev` → menu du navigateur → **Ajouter à l'écran d'accueil**
- Grâce au plugin PWA, l'app fonctionne ensuite hors ligne

## 5. Données : style (hellfest.fr) et pays (MusicBrainz)

### Style et slug
- Disponibles dans les données de la page hellfest.fr/lineup (champs `style` et `slug` de chaque groupe, avec une description et une image)
- Un script d'extraction les récupère et les fusionne avec le CSV

### Pays via l'API MusicBrainz

**Principe** : un script Node lancé **une seule fois** (et relancé quand le line-up évolue), qui interroge MusicBrainz pour chaque groupe et produit `lineup.json`. L'app ne contacte jamais MusicBrainz.

**Requête de recherche :**
```
GET https://musicbrainz.org/ws/2/artist?query=artist:"Gojira"&fmt=json&limit=5
```

**Règles à respecter :**
- **1 requête par seconde maximum** (sinon erreur 503) → pause d'environ 1,1 s entre deux groupes, soit environ 6 minutes pour 307 groupes
- **En-tête `User-Agent` obligatoire et explicite**, ex. `HellfestApp/0.1 (adresse-mail@exemple.fr)`, sinon les requêtes peuvent être bloquées
- Pas de clé d'API nécessaire

**Champs utiles dans la réponse** (`artists[]`) :
- `score` : pertinence de la correspondance (0 à 100)
- `type` : `Group` ou `Person`
- `country` : code pays ISO (ex. `FR`)
- `area.name` : pays ou zone d'origine
- `disambiguation` : précision (ex. « French metal band »)
- `tags` : genres saisis par la communauté (metal, punk…)

**Algorithme de sélection :**
1. Prendre les résultats avec un `score` de 100
2. S'il y en a plusieurs, préférer celui dont les `tags` ou la `disambiguation` contiennent un mot lié au style (metal, punk, hardcore, doom, stoner, rock…)
3. Si le pays est vide, utiliser `area.name`
4. Si le choix reste incertain (aucun score à 100, ou plusieurs candidats crédibles), marquer le groupe **« à vérifier »**

**Vérification manuelle :**
- Le script écrit aussi un fichier `a-verifier.csv` (groupe, candidats trouvés, pays proposés)
- Noms à surveiller en priorité : Warzone, Earth, Void, Speed, Witches, Cobra, Gans, Knives, Seth, Alias, Mono, Envy, Down, Magma, Truck Violence, Very Special Guest (pas un groupe)…
- Les corrections se mettent dans un fichier `corrections.json` (ex. `{ "earth": "US" }`), appliqué en dernier par le script. Il survit aux relances.

**Affichage du pays dans l'app :**
- Nom en français à partir du code ISO, sans table à maintenir : `new Intl.DisplayNames(['fr'], { type: 'region' }).of('FR')` → « France »
- Drapeau en emoji calculé depuis le code ISO
- Le script met les réponses en cache (`cache-musicbrainz.json`) pour ne pas tout réinterroger à chaque relance

## 6. Stack

- **Vite + Svelte** : léger, rapide sur mobile, peu de code
- **vite-plugin-pwa** : installation sur l'écran d'accueil + fonctionnement hors ligne (service worker)
- **IndexedDB** (via une petite lib comme `idb-keyval`) pour le stockage local et la file d'attente de synchro
- **Pages Functions** (JavaScript) pour l'API
- **Wrangler** pour le dev local
- Script de données (extraction hellfest.fr + MusicBrainz) en Node, hors de l'app

## 7. Découpage

1. **Données** : script d'extraction (style, slug) + enrichissement MusicBrainz (pays) → `lineup.json` + vérification manuelle
2. **App en lecture seule** : affichage, recherche, filtres, tris, boutons d'écoute → premier déploiement sur Cloudflare Pages
3. **Notes, cœurs, commentaires en local** (IndexedDB) + PWA hors ligne
4. **API + KV** : Pages Functions `GET`/`PUT`, secret, binding KV
5. **Synchro** : file d'attente, envoi groupé, récupération des notes de l'autre, fusion par `maj`, indicateur d'état
6. **Vues à deux** : avancement, désaccords, cœurs communs

## 8. Hors périmètre (pour l'instant)

- Horaires, planning, détection des conflits, « en ce moment sur scène » : l'app officielle du Hellfest s'en charge

---
*Données du line-up extraites de hellfest.fr/lineup le 27/11/2026. Quotas gratuits Cloudflare vérifiés en novembre 2026 ; ils peuvent évoluer.*
