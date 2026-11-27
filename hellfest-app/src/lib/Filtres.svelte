<script>
  import { JOURS, LIBELLES_JOURS_COURTS, SCENES, drapeau, joliStyle } from './lineup.js';

  /**
   * @type {{
   *   recherche: string,
   *   jour: string,
   *   scene: string,
   *   style: string,
   *   pays: string,
   *   tri: 'affiche' | 'nom',
   *   vue: 'cartes' | 'tableau',
   *   styles: string[],
   *   listePays: { code: string, nom: string }[],
   *   total: number,
   *   nbResultats: number,
   *   onReinitialiser: () => void,
   * }}
   */
  let {
    recherche = $bindable(''),
    jour = $bindable(''),
    scene = $bindable(''),
    style = $bindable(''),
    pays = $bindable(''),
    tri = $bindable('affiche'),
    vue = $bindable('cartes'),
    styles,
    listePays,
    total,
    nbResultats,
    onReinitialiser,
  } = $props();

  let filtresOuverts = $state(false);

  const nbFiltresActifs = $derived([jour, scene, style, pays].filter(Boolean).length);
  const aDesFiltres = $derived(Boolean(recherche.trim() || nbFiltresActifs > 0));
</script>

<section class="filtres-barre" aria-label="Recherche, filtres et tri">
  <div class="conteneur filtres-contenu">
    <!-- Ligne 1 : Recherche + bouton filtres mobile + tri + vue -->
    <div class="ligne-principale">
      <div class="champ-recherche">
        <svg class="icone-loupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="search"
          bind:value={recherche}
          placeholder="Rechercher un groupe, un style, un pays, une scène..."
          aria-label="Rechercher un groupe, un style, un pays ou une scène"
        />
        {#if recherche}
          <button
            type="button"
            class="btn-effacer"
            onclick={() => (recherche = '')}
            aria-label="Effacer la recherche"
          >
            ✕
          </button>
        {/if}
      </div>

      <button
        type="button"
        class="btn-toggle-filtres"
        class:actif={filtresOuverts || nbFiltresActifs > 0}
        aria-expanded={filtresOuverts}
        onclick={() => (filtresOuverts = !filtresOuverts)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 4h18M6 12h12M10 20h4"
          />
        </svg>
        <span>Filtres</span>
        {#if nbFiltresActifs > 0}
          <span class="compteur-badge">{nbFiltresActifs}</span>
        {/if}
      </button>

      <div class="controles-affichage" class:ouvert={filtresOuverts}>
        <label class="sr-only" for="select-tri">Trier par</label>
        <select id="select-tri" bind:value={tri} class="champ-select select-tri">
          <option value="affiche">Tri : Ordre de l'affiche</option>
          <option value="nom">Tri : Nom (A → Z)</option>
        </select>

        <div class="bascule-vue" role="group" aria-label="Mode d'affichage">
          <button
            type="button"
            class:actif={vue === 'cartes'}
            onclick={() => (vue = 'cartes')}
          >
            Cartes
          </button>
          <button
            type="button"
            class:actif={vue === 'tableau'}
            onclick={() => (vue = 'tableau')}
          >
            Tableau
          </button>
        </div>
      </div>
    </div>

    <!-- Ligne 2 : Listes déroulantes (Jour, Scène, Style, Pays) -->
    <div class="grille-filtres" class:ouvert={filtresOuverts}>
      <label class="sr-only" for="filtre-jour">Jour</label>
      <select id="filtre-jour" bind:value={jour} class="champ-select">
        <option value="">Jour : Tous</option>
        {#each JOURS as j (j)}
          <option value={j}>{LIBELLES_JOURS_COURTS[j] ?? j}</option>
        {/each}
      </select>

      <label class="sr-only" for="filtre-scene">Scène</label>
      <select id="filtre-scene" bind:value={scene} class="champ-select">
        <option value="">Scène : Toutes</option>
        {#each SCENES as s (s)}
          <option value={s}>{s}</option>
        {/each}
      </select>

      <label class="sr-only" for="filtre-style">Style</label>
      <select id="filtre-style" bind:value={style} class="champ-select">
        <option value="">Style : Tous</option>
        {#each styles as st (st)}
          <option value={st}>{joliStyle(st)}</option>
        {/each}
      </select>

      <label class="sr-only" for="filtre-pays">Pays</label>
      <select id="filtre-pays" bind:value={pays} class="champ-select">
        <option value="">Pays : Tous</option>
        {#each listePays as p (p.code)}
          <option value={p.code}>{drapeau(p.code)} {p.nom}</option>
        {/each}
      </select>
    </div>

    <!-- Ligne 3 : Compteur + Réinitialiser -->
    <div class="ligne-statut">
      <span class="compteur">
        <strong>{nbResultats}</strong> / {total} {nbResultats > 1 ? 'groupes' : 'groupe'}
      </span>

      {#if aDesFiltres}
        <button type="button" class="btn-reset" onclick={onReinitialiser}>
          Réinitialiser les filtres
        </button>
      {/if}
    </div>
  </div>
</section>

<style>
  .filtres-barre {
    position: sticky;
    top: 0;
    z-index: 30;
    background-color: rgba(14, 14, 14, 0.96);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--hf-border);
  }

  .filtres-contenu {
    padding-top: 0.75rem;
    padding-bottom: 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .ligne-principale {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
  }

  .champ-recherche {
    position: relative;
    flex: 1 1 220px;
    min-width: 0;
  }

  .icone-loupe {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    color: var(--hf-subtle);
    pointer-events: none;
  }

  .champ-recherche input {
    width: 100%;
    height: 40px;
    padding: 0 2.25rem 0 2.3rem;
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    color: var(--hf-text);
    font-size: 0.875rem;
    font-family: inherit;
    transition: border-color 0.15s ease;
  }

  .champ-recherche input::placeholder {
    color: var(--hf-subtle);
  }

  .champ-recherche input:focus {
    outline: none;
    border-color: var(--hf-red);
  }

  /* Masque la croix native de type="search" pour utiliser la nôtre */
  .champ-recherche input::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
  }

  .btn-effacer {
    position: absolute;
    right: 0.25rem;
    top: 50%;
    transform: translateY(-50%);
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--hf-muted);
    cursor: pointer;
    font-size: 0.8rem;
  }

  .btn-effacer:hover {
    color: var(--hf-text);
  }

  .btn-toggle-filtres {
    height: 40px;
    padding: 0 0.75rem;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    color: var(--hf-text);
    font-family: 'Oswald', sans-serif;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    cursor: pointer;
    flex-shrink: 0;
  }

  .btn-toggle-filtres svg {
    width: 15px;
    height: 15px;
    color: var(--hf-red);
  }

  .btn-toggle-filtres.actif {
    border-color: var(--hf-red);
    background-color: rgba(214, 41, 41, 0.12);
  }

  .compteur-badge {
    background-color: var(--hf-red);
    color: var(--hf-text);
    font-family: 'Inter', sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .controles-affichage {
    display: none;
    width: 100%;
    align-items: center;
    gap: 0.6rem;
  }

  .controles-affichage.ouvert {
    display: flex;
  }

  .champ-select {
    width: 100%;
    height: 38px;
    padding: 0 0.65rem;
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    color: var(--hf-text);
    font-size: 0.8rem;
    font-family: inherit;
    cursor: pointer;
  }

  .champ-select:focus {
    outline: none;
    border-color: var(--hf-red);
  }

  .select-tri {
    flex: 1;
    min-width: 0;
  }

  .bascule-vue {
    display: inline-flex;
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    flex-shrink: 0;
  }

  .bascule-vue button {
    height: 36px;
    padding: 0 0.75rem;
    background: transparent;
    border: none;
    color: var(--hf-muted);
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  .bascule-vue button + button {
    border-left: 1px solid var(--hf-border);
  }

  .bascule-vue button.actif {
    background-color: var(--hf-elevated);
    color: var(--hf-text);
    box-shadow: inset 0 -2px 0 var(--hf-red);
  }

  .bascule-vue button:hover:not(.actif) {
    color: var(--hf-text);
  }

  .grille-filtres {
    display: none;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem;
  }

  .grille-filtres.ouvert {
    display: grid;
  }

  .ligne-statut {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    font-size: 0.76rem;
    color: var(--hf-muted);
    padding-top: 0.45rem;
    border-top: 1px solid rgba(42, 42, 42, 0.65);
  }

  .compteur strong {
    color: var(--hf-text);
  }

  .btn-reset {
    background: transparent;
    border: none;
    padding: 0;
    color: var(--hf-red);
    font-size: 0.76rem;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
  }

  .btn-reset:hover {
    color: var(--hf-red-hover);
  }

  @media (min-width: 768px) {
    .btn-toggle-filtres {
      display: none;
    }

    .controles-affichage {
      display: flex;
      width: auto;
      flex-shrink: 0;
    }

    .select-tri {
      width: 210px;
    }

    .grille-filtres {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
</style>
