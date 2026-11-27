<script>
  import { session, notes, autreUtilisateur } from './notes.svelte.js';
  import { top } from './stats.js';
  import LigneComparaison from './LigneComparaison.svelte';

  /** @type {{ groupes: import('./lineup.js').Groupe[] }} */
  let { groupes } = $props();

  const moi = $derived(/** @type {import('./notes.svelte.js').UtilisateurId} */ (session.utilisateur ?? 'mcchouffe'));
  const autre = $derived(autreUtilisateur(moi));
  const liste = $derived(top(groupes, notes[moi], notes[autre]));
</script>

<section class="vue-bloc" aria-label="Notre top à deux">
  <header class="bandeau-vue">
    <div class="bandeau-gauche">
      <div class="duo-crabes" aria-hidden="true">
        <svg class="crabe"><use href="#crab-mcchouffe" /></svg>
        <span class="symbole">🏆</span>
        <svg class="crabe"><use href="#crab-jc" /></svg>
      </div>
      <div>
        <h2 class="font-display">Notre top ({liste.length})</h2>
        <p>Les 20 groupes préférés à deux : moyenne des deux notes, +0,25 par coup de cœur pour départager.</p>
      </div>
    </div>
  </header>

  {#if liste.length > 0}
    <div class="liste-lignes">
      {#each liste as x, i (x.groupe.slug)}
        <LigneComparaison
          groupe={x.groupe}
          avisA={x.a}
          avisB={x.b}
          utilisateurA={moi}
          utilisateurB={autre}
          detail={`#${i + 1} · ${x.moyenne.toFixed(1)} ★`}
        />
      {/each}
    </div>
  {:else}
    <div class="etat-vide">
      <p>Notez des groupes tous les deux pour voir apparaître votre top.</p>
    </div>
  {/if}
</section>

<style>
  .vue-bloc {
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
  }

  .bandeau-vue {
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    padding: 1rem 1.15rem;
  }

  .bandeau-gauche {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
  }

  .duo-crabes {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.65rem;
    background-color: var(--hf-bg);
    border: 1px solid var(--hf-border);
    flex-shrink: 0;
  }

  .crabe {
    width: 40px;
    height: 34px;
    display: block;
  }

  .symbole {
    font-size: 1.15rem;
  }

  h2 {
    margin: 0;
    font-size: 1.35rem;
    text-transform: uppercase;
    color: var(--hf-text);
  }

  .bandeau-vue p {
    margin: 0.2rem 0 0;
    font-size: 0.8rem;
    color: var(--hf-muted);
  }

  .liste-lignes {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .etat-vide {
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    padding: 2rem 1.25rem;
    text-align: center;
    color: var(--hf-muted);
    font-size: 0.88rem;
  }

  .etat-vide p {
    margin: 0;
  }
</style>
