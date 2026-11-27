<script>
  import BoutonsEcoute from './BoutonsEcoute.svelte';
  import { nomPays, drapeau, joliStyle, formatDateCourte } from './lineup.js';

  /** @type {{ groupe: import('./lineup.js').Groupe, afficherJourScene?: boolean }} */
  let { groupe, afficherJourScene = false } = $props();

  let imageErreur = $state(false);

  const paysNom = $derived(nomPays(groupe.pays));
  const paysDrapeau = $derived(drapeau(groupe.pays));
  const styleTexte = $derived(joliStyle(groupe.style));
  const dateCourte = $derived(formatDateCourte(groupe.date));
</script>

<article class="carte">
  {#if groupe.image && !imageErreur}
    <div class="carte-media">
      <img
        src={groupe.image}
        alt=""
        loading="lazy"
        decoding="async"
        onerror={() => (imageErreur = true)}
      />
      <span class="carte-ordre" aria-label={`Position ${groupe.ordre} sur l'affiche`}>
        #{groupe.ordre}
      </span>
    </div>
  {/if}

  <div class="carte-corps">
    <div class="carte-haut">
      {#if afficherJourScene}
        <div class="carte-meta-row">
          <span class="badge-scene">{groupe.scene}</span>
          <span class="meta-jour">
            {groupe.jour} {dateCourte} • #{groupe.ordre}
          </span>
        </div>
      {:else if !groupe.image || imageErreur}
        <div class="carte-meta-row">
          <span class="meta-jour">Affiche #{groupe.ordre}</span>
        </div>
      {/if}

      <div class="carte-entete">
        <h3 class="carte-nom font-display">{groupe.nom}</h3>

        {#if paysNom}
          <span class="badge-pays" title={paysNom}>
            {#if paysDrapeau}<span class="drapeau" aria-hidden="true">{paysDrapeau}</span>{/if}
            <span>{paysNom}</span>
          </span>
        {/if}
      </div>

      {#if styleTexte}
        <p class="carte-style">{styleTexte}</p>
      {/if}

      {#if groupe.description}
        <details class="carte-bio">
          <summary>Bio</summary>
          <p>{groupe.description}</p>
        </details>
      {/if}
    </div>

    <div class="carte-pied">
      <span class="ecouter-label">Écouter</span>
      <BoutonsEcoute nom={groupe.nom} />
    </div>
  </div>
</article>

<style>
  .carte {
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .carte:hover {
    background-color: var(--hf-elevated);
    border-color: #383838;
  }

  .carte-media {
    position: relative;
    aspect-ratio: 16 / 9;
    background-color: var(--hf-bg);
    border-bottom: 1px solid var(--hf-border);
    overflow: hidden;
  }

  .carte-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 22%;
    display: block;
  }

  .carte-ordre {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background-color: rgba(14, 14, 14, 0.86);
    border: 1px solid var(--hf-border);
    color: var(--hf-text);
    font-family: 'Oswald', sans-serif;
    font-size: 0.72rem;
    letter-spacing: 0.05em;
    padding: 0.12rem 0.45rem;
  }

  .carte-corps {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1;
    gap: 0.85rem;
  }

  .carte-haut {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .carte-meta-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.15rem;
  }

  .badge-scene {
    background-color: #1e1e1e;
    border: 1px solid #333333;
    color: #d0d0d0;
    font-family: 'Oswald', sans-serif;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0.12rem 0.5rem;
  }

  .meta-jour {
    font-size: 0.72rem;
    color: var(--hf-muted);
  }

  .carte-entete {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.6rem;
  }

  .carte-nom {
    font-size: 1.4rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--hf-text);
    line-height: 1.15;
    margin: 0;
    word-break: break-word;
  }

  .badge-pays {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    flex-shrink: 0;
    background-color: var(--hf-bg);
    border: 1px solid var(--hf-border);
    color: var(--hf-muted);
    font-size: 0.75rem;
    padding: 0.18rem 0.5rem;
    white-space: nowrap;
  }

  .drapeau {
    font-size: 0.85rem;
    line-height: 1;
  }

  .carte-style {
    margin: 0;
    font-size: 0.76rem;
    font-weight: 500;
    letter-spacing: 0.03em;
    color: var(--hf-muted);
  }

  .carte-bio {
    margin-top: 0.35rem;
    border-top: 1px solid rgba(42, 42, 42, 0.7);
    padding-top: 0.45rem;
  }

  .carte-bio summary {
    cursor: pointer;
    font-family: 'Oswald', sans-serif;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--hf-muted);
    user-select: none;
    list-style: none;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .carte-bio summary::-webkit-details-marker {
    display: none;
  }

  .carte-bio summary::before {
    content: '▸';
    color: var(--hf-red);
    font-size: 0.75rem;
    transition: transform 0.15s ease;
    display: inline-block;
  }

  .carte-bio[open] summary::before {
    transform: rotate(90deg);
  }

  .carte-bio summary:hover {
    color: var(--hf-text);
  }

  .carte-bio p {
    margin: 0.5rem 0 0;
    font-size: 0.8rem;
    line-height: 1.5;
    color: #c8c8c8;
  }

  .carte-pied {
    padding-top: 0.75rem;
    border-top: 1px solid var(--hf-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .ecouter-label {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: var(--hf-subtle);
    font-weight: 600;
  }
</style>
