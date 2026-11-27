<script>
  import Mascottes from './lib/Mascottes.svelte';
  import Filtres from './lib/Filtres.svelte';
  import CarteGroupe from './lib/CarteGroupe.svelte';
  import TableauGroupes from './lib/TableauGroupes.svelte';
  import {
    JOURS,
    LIBELLES_JOURS,
    SCENES,
    rang,
    normaliser,
    nomPays,
    joliStyle,
  } from './lib/lineup.js';

  /** @type {import('./lib/lineup.js').Groupe[]} */
  let groupes = $state([]);
  let chargement = $state(true);
  /** @type {string | null} */
  let erreur = $state(null);

  // État des filtres et du tri
  let recherche = $state('');
  let jour = $state('');
  let scene = $state('');
  let style = $state('');
  let pays = $state('');
  /** @type {'affiche' | 'nom'} */
  let tri = $state('affiche');
  /** @type {'cartes' | 'tableau'} */
  let vue = $state('cartes');

  $effect(() => {
    const controller = new AbortController();
    chargement = true;
    erreur = null;

    fetch('/lineup.json', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        groupes = data;
        chargement = false;
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        erreur = `Impossible de charger le line-up (${e.message})`;
        chargement = false;
      });

    return () => controller.abort();
  });

  const styles = $derived(
    [...new Set(groupes.map((g) => g.style).filter(/** @returns {s is string} */ (s) => Boolean(s)))].sort(
      (a, b) => joliStyle(a).localeCompare(joliStyle(b), 'fr')
    )
  );

  const listePays = $derived(
    [...new Set(groupes.map((g) => g.pays).filter(/** @returns {p is string} */ (p) => Boolean(p)))]
      .map((code) => ({ code, nom: nomPays(code) }))
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  );

  const filtres = $derived.by(() => {
    const q = normaliser(recherche.trim());
    return groupes.filter(
      (g) =>
        (!jour || g.jour === jour) &&
        (!scene || g.scene === scene) &&
        (!style || g.style === style) &&
        (!pays || g.pays === pays) &&
        (!q ||
          normaliser(
            `${g.nom} ${g.style ?? ''} ${nomPays(g.pays)} ${g.pays ?? ''} ${g.scene} ${g.jour}`
          ).includes(q))
    );
  });

  // Regroupement Jour -> Scène -> Ordre de l'affiche (sections vides masquées)
  const sectionsParJour = $derived.by(() => {
    /** @type {Map<string, Map<string, import('./lib/lineup.js').Groupe[]>>} */
    const parJour = new Map();

    for (const g of filtres) {
      let parScene = parJour.get(g.jour);
      if (!parScene) {
        parScene = new Map();
        parJour.set(g.jour, parScene);
      }
      let liste = parScene.get(g.scene);
      if (!liste) {
        liste = [];
        parScene.set(g.scene, liste);
      }
      liste.push(g);
    }

    return [...parJour.entries()]
      .sort(([a], [b]) => rang(JOURS, a) - rang(JOURS, b) || a.localeCompare(b, 'fr'))
      .map(([nomJour, parScene]) => {
        const scenes = [...parScene.entries()]
          .sort(([a], [b]) => rang(SCENES, a) - rang(SCENES, b) || a.localeCompare(b, 'fr'))
          .map(([nomScene, liste]) => ({
            scene: nomScene,
            groupes: [...liste].sort(
              (a, b) => a.ordre - b.ordre || a.nom.localeCompare(b.nom, 'fr')
            ),
          }));

        const totalJour = scenes.reduce((acc, s) => acc + s.groupes.length, 0);
        return {
          jour: nomJour,
          libelle: LIBELLES_JOURS[nomJour] ?? nomJour,
          total: totalJour,
          scenes,
        };
      });
  });

  // Liste à plat pour le tri alphabétique et la vue tableau
  const listeTriee = $derived.by(() => {
    const copie = [...filtres];
    if (tri === 'nom') {
      return copie.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    }
    return copie.sort(
      (a, b) =>
        rang(JOURS, a.jour) - rang(JOURS, b.jour) ||
        rang(SCENES, a.scene) - rang(SCENES, b.scene) ||
        a.ordre - b.ordre ||
        a.nom.localeCompare(b.nom, 'fr')
    );
  });

  function reinitialiserFiltres() {
    recherche = '';
    jour = '';
    scene = '';
    style = '';
    pays = '';
  }

  function remonterEnHaut() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
</script>

<Mascottes />

<div class="page" id="haut">
  <!-- HEADER ÉDITORIAL -->
  <header class="entete">
    <div class="conteneur entete-interieur">
      <div class="identite">
        <div class="monogramme" aria-hidden="true">
          <span class="font-display">H</span>
        </div>
        <div>
          <h1 class="titre font-display">
            HELLFEST 2027 <span class="accent">• MCCHOUFFE &amp; JC</span>
          </h1>
          <p class="sous-titre font-display">
            THE ABSOLUTE EDITION • 17 – 20 JUIN 2027 • CLISSON
          </p>
        </div>
      </div>

      <div class="mascottes-duo" aria-hidden="true">
        <svg class="crabe"><use href="#crab-mcchouffe" /></svg>
        <svg class="crabe"><use href="#crab-jc" /></svg>
      </div>
    </div>
  </header>

  <!-- BARRE COLLANTE DE RECHERCHE, FILTRES ET TRI -->
  <Filtres
    bind:recherche
    bind:jour
    bind:scene
    bind:style
    bind:pays
    bind:tri
    bind:vue
    {styles}
    {listePays}
    total={groupes.length}
    nbResultats={filtres.length}
    onReinitialiser={reinitialiserFiltres}
  />

  <!-- CONTENU PRINCIPAL -->
  <main class="conteneur contenu-principal">
    {#if chargement}
      <div class="etat-boite">
        <p class="font-display etat-titre">Chargement du line-up...</p>
      </div>
    {:else if erreur}
      <div class="etat-boite etat-erreur" role="alert">
        <h2 class="font-display etat-titre">Erreur de chargement</h2>
        <p class="etat-texte">{erreur}</p>
      </div>
    {:else if filtres.length === 0}
      <div class="etat-boite">
        <h2 class="font-display etat-titre">Aucun groupe trouvé</h2>
        <p class="etat-texte">Aucun groupe ne correspond aux critères sélectionnés.</p>
        <button type="button" class="btn-primaire" onclick={reinitialiserFiltres}>
          Réinitialiser les filtres
        </button>
      </div>
    {:else if vue === 'tableau'}
      <TableauGroupes groupes={listeTriee} />
    {:else if tri === 'nom'}
      <div class="grille-cartes">
        {#each listeTriee as g (g.slug)}
          <CarteGroupe groupe={g} afficherJourScene={true} />
        {/each}
      </div>
    {:else}
      <!-- Accès rapide aux jours lorsqu'il y en a plusieurs -->
      {#if sectionsParJour.length > 1}
        <nav class="acces-jours" aria-label="Accès rapide par jour">
          {#each sectionsParJour as s (s.jour)}
            <a href={`#jour-${normaliser(s.jour)}`} class="lien-jour">
              <span class="font-display">{s.jour}</span>
              <span class="nb-jour">{s.total}</span>
            </a>
          {/each}
        </nav>
      {/if}

      <div class="sections-jours">
        {#each sectionsParJour as sectionJour (sectionJour.jour)}
          <section class="section-jour" id={`jour-${normaliser(sectionJour.jour)}`}>
            <header class="entete-jour">
              <div class="entete-jour-titre">
                <span class="barre-rouge" aria-hidden="true"></span>
                <h2 class="font-display">{sectionJour.libelle}</h2>
              </div>
              <span class="compteur-section">
                {sectionJour.total} {sectionJour.total > 1 ? 'groupes' : 'groupe'}
              </span>
            </header>

            <div class="sections-scenes">
              {#each sectionJour.scenes as sectionScene (sectionScene.scene)}
                <div class="section-scene">
                  <div class="entete-scene">
                    <h3 class="badge-titre-scene font-display">{sectionScene.scene}</h3>
                    <span class="compteur-scene">
                      {sectionScene.groupes.length}
                      {sectionScene.groupes.length > 1 ? 'groupes' : 'groupe'}
                    </span>
                  </div>

                  <div class="grille-cartes">
                    {#each sectionScene.groupes as g (g.slug)}
                      <CarteGroupe groupe={g} />
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </section>
        {/each}
      </div>
    {/if}
  </main>

  <!-- PIED DE PAGE -->
  <footer class="pied-page">
    <div class="conteneur pied-interieur">
      <div class="pied-info">
        <span class="font-display pied-marque">HELLFEST 2027 • MCCHOUFFE &amp; JC</span>
        <span>— Line-up complet • 17–20 Juin 2027 • Clisson</span>
      </div>
      <button type="button" class="btn-haut" onclick={remonterEnHaut}>
        ↑ Haut de page
      </button>
    </div>
  </footer>
</div>

<style>
  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .entete {
    background-color: var(--hf-bg);
    border-bottom: 1px solid var(--hf-border);
  }

  .entete-interieur {
    padding-top: 0.9rem;
    padding-bottom: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .identite {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    min-width: 0;
  }

  .monogramme {
    width: 40px;
    height: 40px;
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .monogramme span {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--hf-red);
    line-height: 1;
  }

  .titre {
    margin: 0;
    font-size: clamp(1.15rem, 3.2vw, 1.55rem);
    font-weight: 700;
    text-transform: uppercase;
    color: var(--hf-text);
    line-height: 1.05;
  }

  .titre .accent {
    color: var(--hf-red);
  }

  .sous-titre {
    margin: 0.25rem 0 0;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--hf-muted);
  }

  .mascottes-duo {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .crabe {
    width: 40px;
    height: 34px;
    display: block;
  }

  @media (min-width: 640px) {
    .crabe {
      width: 48px;
      height: 40px;
    }
  }

  .contenu-principal {
    flex: 1;
    width: 100%;
    padding-top: 1.25rem;
    padding-bottom: 2.5rem;
  }

  .acces-jours {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .lien-jour {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.4rem 0.75rem;
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    color: var(--hf-text);
    text-decoration: none;
    font-size: 0.85rem;
    text-transform: uppercase;
    transition: border-color 0.15s ease, background-color 0.15s ease;
  }

  .lien-jour:hover {
    background-color: var(--hf-elevated);
    border-color: var(--hf-red);
  }

  .nb-jour {
    font-size: 0.72rem;
    color: var(--hf-muted);
    background-color: var(--hf-bg);
    border: 1px solid var(--hf-border);
    padding: 0.05rem 0.35rem;
  }

  .sections-jours {
    display: flex;
    flex-direction: column;
    gap: 2.75rem;
  }

  .section-jour {
    scroll-margin-top: 155px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .entete-jour {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-bottom: 0.55rem;
    border-bottom: 1px solid var(--hf-border);
  }

  .entete-jour-titre {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .barre-rouge {
    width: 5px;
    height: 22px;
    background-color: var(--hf-red);
    display: inline-block;
    flex-shrink: 0;
  }

  .entete-jour h2 {
    margin: 0;
    font-size: clamp(1.25rem, 3vw, 1.6rem);
    font-weight: 700;
    text-transform: uppercase;
    color: var(--hf-text);
    line-height: 1.1;
  }

  .compteur-section {
    font-size: 0.78rem;
    color: var(--hf-muted);
    white-space: nowrap;
  }

  .sections-scenes {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  .section-scene {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .entete-scene {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .badge-titre-scene {
    margin: 0;
    display: inline-block;
    padding: 0.22rem 0.7rem;
    background-color: #1e1e1e;
    border: 1px solid #333333;
    border-left: 3px solid var(--hf-red);
    color: var(--hf-text);
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .compteur-scene {
    font-size: 0.74rem;
    color: var(--hf-subtle);
  }

  .grille-cartes {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 1rem;
  }

  @media (min-width: 680px) {
    .grille-cartes {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: 1100px) {
    .grille-cartes {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  .etat-boite {
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    padding: 2.5rem 1.25rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .etat-erreur {
    border-color: var(--hf-red);
  }

  .etat-titre {
    margin: 0;
    font-size: 1.35rem;
    text-transform: uppercase;
    color: var(--hf-text);
  }

  .etat-texte {
    margin: 0;
    font-size: 0.85rem;
    color: var(--hf-muted);
    max-width: 44ch;
  }

  .btn-primaire {
    margin-top: 0.25rem;
    padding: 0.6rem 1.1rem;
    background-color: var(--hf-red);
    border: none;
    color: var(--hf-text);
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .btn-primaire:hover {
    background-color: var(--hf-red-hover);
  }

  .pied-page {
    border-top: 1px solid var(--hf-border);
    background-color: var(--hf-bg);
    padding: 1.25rem 0;
    margin-top: auto;
  }

  .pied-interieur {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    font-size: 0.76rem;
    color: var(--hf-subtle);
  }

  .pied-info {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
  }

  .pied-marque {
    color: var(--hf-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .btn-haut {
    background: transparent;
    border: 1px solid var(--hf-border);
    color: var(--hf-muted);
    padding: 0.35rem 0.65rem;
    font-size: 0.74rem;
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease;
  }

  .btn-haut:hover {
    color: var(--hf-text);
    border-color: var(--hf-red);
  }
</style>
