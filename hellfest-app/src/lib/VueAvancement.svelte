<script>
  import { session, notes, UTILISATEURS, autreUtilisateur } from './notes.svelte.js';
  import { avancement } from './stats.js';

  /** @type {{ groupes: import('./lineup.js').Groupe[] }} */
  let { groupes } = $props();

  const moi = $derived(/** @type {import('./notes.svelte.js').UtilisateurId} */ (session.utilisateur ?? 'mcchouffe'));
  const autre = $derived(autreUtilisateur(moi));
  const stats = $derived({
    [moi]: avancement(groupes, notes[moi]),
    [autre]: avancement(groupes, notes[autre]),
  });

  /** @param {number} restants */
  function messageCourage(restants) {
    if (restants === 0) return 'Tout est écouté, prêt pour Clisson ! 🤘';
    if (restants <= 20) return `Dernière ligne droite : plus que ${restants} groupe${restants > 1 ? 's' : ''} !`;
    return `Plus que ${restants} groupes à écouter, courage !`;
  }
</script>

<section class="vue-avancement" aria-label="Avancement à deux">
  <div class="grille-duo">
    {#each [moi, autre] as u (u)}
      {@const st = stats[u]}
      {@const restants = Math.max(0, st.total - st.notes)}
      {@const crabe = u === 'mcchouffe' ? '#crab-mcchouffe' : '#crab-jc'}
      <article class="carte-avancement" class:actif={u === moi}>
        <header class="carte-entete">
          <div class="qui-bloc">
            <svg class="crabe" aria-hidden="true"><use href={crabe} /></svg>
            <div>
              <h2 class="font-display">
                {UTILISATEURS[u]}
                {#if u === moi}<span class="tag-moi">[Toi]</span>{/if}
              </h2>
              <p class="score-global">
                <strong>{st.notes} / {st.total}</strong> notés ({st.pourcent} %)
              </p>
            </div>
          </div>
          <div class="badges-stats">
            <span class="stat-pill">❤️ {st.coeurs}</span>
            <span class="stat-pill">💬 {st.commentaires}</span>
          </div>
        </header>

        <progress class="barre-globale" max={st.total || 1} value={st.notes}></progress>

        <p class="message-courage">{messageCourage(restants)}</p>

        <div class="par-jour">
          {#each st.parJour as j (j.jour)}
            <div class="jour-ligne">
              <div class="jour-info">
                <span class="font-display jour-nom">{j.jour}</span>
                <span class="jour-nb">{j.notes}/{j.total} ({j.pourcent} %)</span>
              </div>
              <progress class="barre-jour" max={j.total || 1} value={j.notes}></progress>
            </div>
          {/each}
        </div>
      </article>
    {/each}
  </div>
</section>

<style>
  .vue-avancement {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .grille-duo {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 1rem;
  }

  @media (min-width: 820px) {
    .grille-duo {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .carte-avancement {
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    padding: 1.15rem;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .carte-avancement.actif {
    border-color: rgba(214, 41, 41, 0.6);
  }

  .carte-entete {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .qui-bloc {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .crabe {
    width: 48px;
    height: 40px;
    flex-shrink: 0;
    display: block;
  }

  h2 {
    margin: 0;
    font-size: 1.35rem;
    text-transform: uppercase;
    color: var(--hf-text);
    line-height: 1.1;
  }

  .tag-moi {
    font-family: 'Inter', sans-serif;
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--hf-red);
    margin-left: 0.35rem;
    vertical-align: middle;
  }

  .score-global {
    margin: 0.25rem 0 0;
    font-size: 0.82rem;
    color: var(--hf-muted);
  }

  .score-global strong {
    color: var(--hf-text);
  }

  .badges-stats {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }

  .stat-pill {
    padding: 0.25rem 0.55rem;
    background-color: var(--hf-bg);
    border: 1px solid var(--hf-border);
    font-size: 0.78rem;
    color: var(--hf-text);
  }

  progress {
    width: 100%;
    appearance: none;
    border: none;
    background-color: var(--hf-border);
    overflow: hidden;
  }

  progress::-webkit-progress-bar {
    background-color: var(--hf-border);
  }

  progress::-webkit-progress-value {
    background-color: var(--hf-red);
    transition: width 0.25s ease;
  }

  progress::-moz-progress-bar {
    background-color: var(--hf-red);
  }

  .barre-globale {
    height: 9px;
  }

  .message-courage {
    margin: 0;
    font-size: 0.78rem;
    color: var(--hf-muted);
  }

  .par-jour {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--hf-border);
  }

  .jour-ligne {
    display: flex;
    flex-direction: column;
    gap: 0.28rem;
  }

  .jour-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.78rem;
  }

  .jour-nom {
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--hf-text);
  }

  .jour-nb {
    color: var(--hf-muted);
  }

  .barre-jour {
    height: 6px;
  }
</style>
