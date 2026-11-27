<script>
  import Etoiles from './Etoiles.svelte';
  import BoutonsEcoute from './BoutonsEcoute.svelte';
  import { UTILISATEURS } from './notes.svelte.js';
  import { drapeau, nomPays, joliStyle } from './lineup.js';

  /**
   * @type {{
   *   groupe: import('./lineup.js').Groupe,
   *   avisA: import('./notes.svelte.js').Avis,
   *   avisB: import('./notes.svelte.js').Avis,
   *   utilisateurA: import('./notes.svelte.js').UtilisateurId,
   *   utilisateurB: import('./notes.svelte.js').UtilisateurId,
   *   detail?: string,
   *   masquerJourScene?: boolean,
   * }}
   */
  let {
    groupe,
    avisA,
    avisB,
    utilisateurA,
    utilisateurB,
    detail = '',
    masquerJourScene = false,
  } = $props();

  const crabeA = $derived(utilisateurA === 'mcchouffe' ? '#crab-mcchouffe' : '#crab-jc');
  const crabeB = $derived(utilisateurB === 'mcchouffe' ? '#crab-mcchouffe' : '#crab-jc');
  const styleTexte = $derived(joliStyle(groupe.style));
  const paysDrapeau = $derived(drapeau(groupe.pays));
  const paysNom = $derived(nomPays(groupe.pays));
</script>

<article class="ligne">
  <div class="ligne-haut">
    <div class="ligne-titre-bloc">
      <div class="ligne-nom-row">
        <strong class="ligne-nom font-display">{groupe.nom}</strong>
        {#if paysDrapeau}
          <span class="drapeau" title={paysNom}>{paysDrapeau}</span>
        {/if}
        {#if detail}
          <span class="detail">{detail}</span>
        {/if}
      </div>

      <div class="ligne-meta">
        {#if !masquerJourScene}
          <span class="badge-scene">{groupe.scene}</span>
          <span>{groupe.jour}</span>
        {/if}
        {#if styleTexte}
          {#if !masquerJourScene}<span aria-hidden="true">·</span>{/if}
          <span>{styleTexte}</span>
        {/if}
      </div>
    </div>

    <div class="ligne-ecoute">
      <BoutonsEcoute nom={groupe.nom} />
    </div>
  </div>

  <div class="ligne-avis-grille">
    <div class="avis-row">
      <div class="avis-qui">
        <svg class="crabe-mini" aria-hidden="true"><use href={crabeA} /></svg>
        <span class="font-display nom-u">{UTILISATEURS[utilisateurA]}</span>
      </div>
      <div class="avis-note">
        <Etoiles valeur={avisA.note} lectureSeule />
        {#if avisA.coeur}
          <span class="coeur-actif" aria-label={`Coup de cœur ${UTILISATEURS[utilisateurA]}`}>♥</span>
        {/if}
      </div>
    </div>

    <div class="avis-row">
      <div class="avis-qui">
        <svg class="crabe-mini" aria-hidden="true"><use href={crabeB} /></svg>
        <span class="font-display nom-u">{UTILISATEURS[utilisateurB]}</span>
      </div>
      <div class="avis-note">
        <Etoiles valeur={avisB.note} lectureSeule />
        {#if avisB.coeur}
          <span class="coeur-actif" aria-label={`Coup de cœur ${UTILISATEURS[utilisateurB]}`}>♥</span>
        {/if}
      </div>
    </div>
  </div>

  {#if avisA.commentaire || avisB.commentaire}
    <div class="ligne-commentaires">
      {#if avisA.commentaire}
        <p>« {avisA.commentaire} » <span class="auteur-com">— {UTILISATEURS[utilisateurA]}</span></p>
      {/if}
      {#if avisB.commentaire}
        <p>« {avisB.commentaire} » <span class="auteur-com">— {UTILISATEURS[utilisateurB]}</span></p>
      {/if}
    </div>
  {/if}
</article>

<style>
  .ligne {
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    padding: 0.85rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .ligne:hover {
    background-color: var(--hf-elevated);
    border-color: #383838;
  }

  .ligne-haut {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.65rem;
  }

  .ligne-titre-bloc {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
    flex: 1 1 200px;
  }

  .ligne-nom-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
  }

  .ligne-nom {
    font-size: 1.2rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--hf-text);
    line-height: 1.15;
  }

  .drapeau {
    font-size: 0.9rem;
    line-height: 1;
  }

  .detail {
    padding: 0.12rem 0.5rem;
    background-color: rgba(214, 41, 41, 0.15);
    border: 1px solid rgba(214, 41, 41, 0.55);
    color: var(--hf-text);
    font-size: 0.72rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .ligne-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.74rem;
    color: var(--hf-muted);
  }

  .badge-scene {
    background-color: #1e1e1e;
    border: 1px solid #333333;
    color: #d0d0d0;
    font-family: 'Oswald', sans-serif;
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0.08rem 0.42rem;
  }

  .ligne-ecoute {
    flex-shrink: 0;
  }

  .ligne-avis-grille {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 0.35rem;
    background-color: var(--hf-bg);
    border: 1px solid var(--hf-border);
    padding: 0.45rem 0.65rem;
  }

  @media (min-width: 560px) {
    .ligne-avis-grille {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.85rem;
    }
  }

  .avis-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .avis-qui {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-width: 0;
  }

  .crabe-mini {
    width: 22px;
    height: 18px;
    flex-shrink: 0;
    display: block;
  }

  .nom-u {
    font-size: 0.76rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--hf-muted);
  }

  .avis-note {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  .coeur-actif {
    color: var(--hf-red);
    font-size: 0.95rem;
    line-height: 1;
  }

  .ligne-commentaires {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding-top: 0.25rem;
    border-top: 1px solid rgba(42, 42, 42, 0.7);
  }

  .ligne-commentaires p {
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.45;
    color: #d0d0d0;
    word-break: break-word;
  }

  .auteur-com {
    color: var(--hf-muted);
    font-size: 0.72rem;
  }
</style>
