<script>
  import BoutonsEcoute from './BoutonsEcoute.svelte';
  import { nomPays, drapeau, joliStyle, formatDateCourte } from './lineup.js';

  /** @type {{ groupes: import('./lineup.js').Groupe[] }} */
  let { groupes } = $props();
</script>

<div class="tableau-wrap">
  <div class="tableau-scroll">
    <table class="tableau">
      <thead>
        <tr>
          <th>Groupe &amp; Style</th>
          <th>Scène &amp; Jour</th>
          <th>Pays</th>
          <th class="col-droite">Écouter</th>
        </tr>
      </thead>
      <tbody>
        {#each groupes as g (g.slug)}
          {@const paysNom = nomPays(g.pays)}
          {@const paysDrapeau = drapeau(g.pays)}
          {@const styleTexte = joliStyle(g.style)}
          <tr>
            <td class="col-groupe">
              <div class="groupe-nom font-display">{g.nom}</div>
              {#if styleTexte}
                <div class="groupe-style">{styleTexte}</div>
              {/if}
              {#if g.description}
                <details class="tableau-bio">
                  <summary>Bio</summary>
                  <p>{g.description}</p>
                </details>
              {/if}
            </td>
            <td class="col-scene">
              <span class="badge-scene">{g.scene}</span>
              <div class="scene-jour">
                {g.jour} {formatDateCourte(g.date)} • #{g.ordre}
              </div>
            </td>
            <td class="col-pays">
              {#if paysNom}
                <span>{#if paysDrapeau}{paysDrapeau} {/if}{paysNom}</span>
              {:else}
                <span class="muet">—</span>
              {/if}
            </td>
            <td class="col-droite col-ecoute">
              <BoutonsEcoute nom={g.nom} />
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .tableau-wrap {
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    overflow: hidden;
  }

  .tableau-scroll {
    overflow-x: auto;
  }

  .tableau {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .tableau thead tr {
    background-color: var(--hf-elevated);
    border-bottom: 1px solid var(--hf-border);
  }

  .tableau th {
    padding: 0.75rem 0.9rem;
    font-family: 'Oswald', sans-serif;
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--hf-muted);
    white-space: nowrap;
  }

  .tableau tbody tr {
    border-bottom: 1px solid var(--hf-border);
    transition: background-color 0.12s ease;
  }

  .tableau tbody tr:last-child {
    border-bottom: none;
  }

  .tableau tbody tr:hover {
    background-color: var(--hf-elevated);
  }

  .tableau td {
    padding: 0.75rem 0.9rem;
    vertical-align: top;
  }

  .col-groupe {
    min-width: 210px;
  }

  .groupe-nom {
    font-size: 1.05rem;
    text-transform: uppercase;
    color: var(--hf-text);
    line-height: 1.2;
  }

  .groupe-style {
    font-size: 0.74rem;
    color: var(--hf-muted);
    margin-top: 0.15rem;
  }

  .tableau-bio {
    margin-top: 0.35rem;
  }

  .tableau-bio summary {
    cursor: pointer;
    font-family: 'Oswald', sans-serif;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--hf-subtle);
    list-style: none;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .tableau-bio summary::-webkit-details-marker {
    display: none;
  }

  .tableau-bio summary::before {
    content: '▸';
    color: var(--hf-red);
  }

  .tableau-bio[open] summary::before {
    content: '▾';
  }

  .tableau-bio summary:hover {
    color: var(--hf-text);
  }

  .tableau-bio p {
    margin: 0.4rem 0 0;
    font-size: 0.78rem;
    line-height: 1.45;
    color: #c8c8c8;
    max-width: 46ch;
  }

  .col-scene {
    white-space: nowrap;
  }

  .badge-scene {
    display: inline-block;
    background-color: #1e1e1e;
    border: 1px solid #333333;
    color: #d0d0d0;
    font-family: 'Oswald', sans-serif;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0.12rem 0.5rem;
  }

  .scene-jour {
    font-size: 0.72rem;
    color: var(--hf-muted);
    margin-top: 0.25rem;
  }

  .col-pays {
    white-space: nowrap;
    font-size: 0.8rem;
    color: var(--hf-muted);
  }

  .muet {
    color: var(--hf-subtle);
  }

  .col-droite {
    text-align: right;
  }

  .col-ecoute {
    white-space: nowrap;
  }
</style>
