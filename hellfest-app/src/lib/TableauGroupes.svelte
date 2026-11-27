<script>
  import BoutonsEcoute from './BoutonsEcoute.svelte';
  import Etoiles from './Etoiles.svelte';
  import { nomPays, drapeau, joliStyle, formatDateCourte } from './lineup.js';
  import {
    session,
    avis,
    modifier,
    UTILISATEURS,
    LONGUEUR_MAX_COMMENTAIRE,
  } from './notes.svelte.js';

  /** @type {{ groupes: import('./lineup.js').Groupe[] }} */
  let { groupes } = $props();

  /** @type {string | null} */
  let commentaireOuvertSlug = $state(null);

  const moi = $derived(session.utilisateur);
  const autre = $derived(/** @type {import('./notes.svelte.js').UtilisateurId} */ (moi === 'mcchouffe' ? 'jc' : 'mcchouffe'));

  /** @param {string} slug */
  function basculerCommentaire(slug) {
    commentaireOuvertSlug = commentaireOuvertSlug === slug ? null : slug;
  }
</script>

<div class="tableau-wrap">
  <div class="tableau-scroll">
    <table class="tableau">
      <thead>
        <tr>
          <th>Groupe &amp; Style</th>
          <th>Scène &amp; Jour</th>
          <th>Pays</th>
          {#if moi}
            <th>{UTILISATEURS[moi]}</th>
          {/if}
          <th class="col-droite">Avis &amp; Écoute</th>
        </tr>
      </thead>
      <tbody>
        {#each groupes as g (g.slug)}
          {@const paysNom = nomPays(g.pays)}
          {@const paysDrapeau = drapeau(g.pays)}
          {@const styleTexte = joliStyle(g.style)}
          {@const monAvis = avis(moi, g.slug)}
          {@const sonAvis = avis(autre, g.slug)}
          {@const aCommentaire = Boolean(monAvis.commentaire.trim() || sonAvis.commentaire.trim())}
          {@const ouvert = commentaireOuvertSlug === g.slug}
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
            {#if moi}
              <td class="col-note">
                <div class="note-cellule">
                  <Etoiles
                    valeur={monAvis.note}
                    compact
                    ariaLabel={`Note de ${UTILISATEURS[moi]} pour ${g.nom}`}
                    onchange={(n) => modifier(g.slug, { note: n })}
                  />
                  <button
                    type="button"
                    class="coeur-mini"
                    class:actif={monAvis.coeur}
                    aria-pressed={monAvis.coeur}
                    aria-label={`Coup de cœur pour ${g.nom}`}
                    onclick={() => modifier(g.slug, { coeur: !monAvis.coeur })}
                  >
                    {monAvis.coeur ? '♥' : '♡'}
                  </button>
                </div>
              </td>
            {/if}
            <td class="col-droite col-ecoute">
              <div class="actions-droite">
                {#if moi}
                  <button
                    type="button"
                    class="btn-avis-tab"
                    class:ouvert
                    class:rempli={aCommentaire}
                    onclick={() => basculerCommentaire(g.slug)}
                  >
                    💬{aCommentaire ? ' •' : ''}
                  </button>
                {/if}
                <BoutonsEcoute nom={g.nom} />
              </div>
            </td>
          </tr>

          {#if moi && ouvert}
            <tr class="ligne-commentaire">
              <td colspan="5">
                <div class="commentaire-box">
                  <div class="commentaire-entete">
                    <span class="font-display">Commentaire ({UTILISATEURS[moi]})</span>
                    <span class="compteur-chars">
                      {monAvis.commentaire.length}/{LONGUEUR_MAX_COMMENTAIRE}
                    </span>
                  </div>
                  <textarea
                    rows="2"
                    maxlength={LONGUEUR_MAX_COMMENTAIRE}
                    placeholder="Mon commentaire..."
                    value={monAvis.commentaire}
                    oninput={(e) => modifier(g.slug, { commentaire: e.currentTarget.value })}
                  ></textarea>

                  {#if sonAvis.note || sonAvis.coeur || sonAvis.commentaire}
                    <div class="son-avis-tab">
                      <strong>{UTILISATEURS[autre]} :</strong>
                      {#if sonAvis.note > 0}<span>{sonAvis.note}/5 ★</span>{/if}
                      {#if sonAvis.coeur}<span class="coeur-rouge">♥</span>{/if}
                      {#if sonAvis.commentaire}<span>{sonAvis.commentaire}</span>{/if}
                    </div>
                  {/if}
                </div>
              </td>
            </tr>
          {/if}
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

  .tableau tbody tr:not(.ligne-commentaire):hover {
    background-color: var(--hf-elevated);
  }

  .tableau td {
    padding: 0.75rem 0.9rem;
    vertical-align: top;
  }

  .col-groupe {
    min-width: 190px;
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

  .col-scene,
  .col-pays,
  .col-note,
  .col-ecoute {
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
    font-size: 0.8rem;
    color: var(--hf-muted);
  }

  .muet {
    color: var(--hf-subtle);
  }

  .note-cellule {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .coeur-mini {
    min-width: 34px;
    min-height: 36px;
    background: transparent;
    border: 1px solid transparent;
    color: var(--hf-subtle);
    font-size: 1.05rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .coeur-mini:hover {
    color: var(--hf-text);
  }

  .coeur-mini.actif {
    color: var(--hf-red);
  }

  .col-droite {
    text-align: right;
  }

  .actions-droite {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }

  .btn-avis-tab {
    height: 44px;
    min-width: 44px;
    padding: 0 0.6rem;
    background-color: var(--hf-bg);
    border: 1px solid var(--hf-border);
    color: var(--hf-muted);
    font-size: 0.85rem;
    cursor: pointer;
    transition: border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease;
  }

  .btn-avis-tab.rempli {
    color: var(--hf-text);
    border-color: #444444;
  }

  .btn-avis-tab.ouvert {
    background-color: rgba(214, 41, 41, 0.15);
    border-color: var(--hf-red);
    color: var(--hf-text);
  }

  .ligne-commentaire {
    background-color: var(--hf-bg);
  }

  .commentaire-box {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    max-width: 680px;
  }

  .commentaire-entete {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.78rem;
    text-transform: uppercase;
    color: var(--hf-muted);
  }

  .compteur-chars {
    font-family: 'Inter', sans-serif;
    font-size: 0.7rem;
    color: var(--hf-subtle);
  }

  .commentaire-box textarea {
    width: 100%;
    padding: 0.5rem 0.65rem;
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    color: var(--hf-text);
    font-size: 0.82rem;
    font-family: inherit;
    resize: vertical;
  }

  .commentaire-box textarea:focus {
    outline: none;
    border-color: var(--hf-red);
  }

  .son-avis-tab {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.78rem;
    color: #c8c8c8;
    padding-top: 0.35rem;
    border-top: 1px solid var(--hf-border);
  }

  .coeur-rouge {
    color: var(--hf-red);
  }
</style>
