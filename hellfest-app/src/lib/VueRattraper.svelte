<script>
  import { session, notes, modifier, UTILISATEURS, autreUtilisateur } from './notes.svelte.js';
  import { aRattraper } from './stats.js';
  import { drapeau, nomPays, joliStyle } from './lineup.js';
  import Etoiles from './Etoiles.svelte';
  import BoutonsEcoute from './BoutonsEcoute.svelte';

  /** @type {{ groupes: import('./lineup.js').Groupe[] }} */
  let { groupes } = $props();

  const moi = $derived(/** @type {import('./notes.svelte.js').UtilisateurId} */ (session.utilisateur ?? 'mcchouffe'));
  const autre = $derived(autreUtilisateur(moi));
  const liste = $derived(aRattraper(groupes, notes[moi], notes[autre]));
  const monCrabe = $derived(moi === 'mcchouffe' ? '#crab-mcchouffe' : '#crab-jc');
  const sonCrabe = $derived(autre === 'mcchouffe' ? '#crab-mcchouffe' : '#crab-jc');
</script>

<section class="vue-bloc" aria-label="Groupes à rattraper">
  <header class="bandeau-vue">
    <div class="bandeau-gauche">
      <div class="duo-crabes" aria-hidden="true">
        <svg class="crabe"><use href={sonCrabe} /></svg>
        <span class="fleche">→</span>
        <svg class="crabe"><use href={monCrabe} /></svg>
      </div>
      <div>
        <h2 class="font-display">👀 À rattraper ({liste.length})</h2>
        <p>
          Ce que <strong>{UTILISATEURS[autre]}</strong> a déjà noté et pas encore toi (ses coups de cœur en premier). Note un groupe pour le sortir de la liste.
        </p>
      </div>
    </div>
  </header>

  {#if liste.length > 0}
    <div class="liste-lignes">
      {#each liste as x (x.groupe.slug)}
        {@const styleTexte = joliStyle(x.groupe.style)}
        {@const paysDrapeau = drapeau(x.groupe.pays)}
        {@const paysNom = nomPays(x.groupe.pays)}
        <article class="ligne-rattraper">
          <div class="ligne-haut">
            <div class="ligne-titre-bloc">
              <div class="ligne-nom-row">
                <strong class="ligne-nom font-display">{x.groupe.nom}</strong>
                {#if paysDrapeau}
                  <span class="drapeau" title={paysNom}>{paysDrapeau}</span>
                {/if}
              </div>
              <div class="ligne-meta">
                <span class="badge-scene">{x.groupe.scene}</span>
                <span>{x.groupe.jour}</span>
                {#if styleTexte}
                  <span aria-hidden="true">·</span>
                  <span>{styleTexte}</span>
                {/if}
              </div>
            </div>

            <BoutonsEcoute nom={x.groupe.nom} />
          </div>

          <div class="comparaison-zone">
            <!-- Note de l'autre (lecture seule) -->
            <div class="avis-autre">
              <div class="qui">
                <svg class="crabe-mini" aria-hidden="true"><use href={sonCrabe} /></svg>
                <span class="font-display nom-autre">{UTILISATEURS[autre]}</span>
              </div>
              <div class="note-autre">
                <Etoiles valeur={x.autre.note} lectureSeule />
                {#if x.autre.coeur}
                  <span class="coeur-actif" aria-label={`Coup de cœur ${UTILISATEURS[autre]}`}>♥</span>
                {/if}
              </div>
            </div>

            {#if x.autre.commentaire}
              <p class="com-autre">« {x.autre.commentaire} » — {UTILISATEURS[autre]}</p>
            {/if}

            <!-- Ma notation directe (modifiable) -->
            <div class="avis-moi">
              <div class="qui">
                <svg class="crabe-mini" aria-hidden="true"><use href={monCrabe} /></svg>
                <span class="font-display nom-moi">Ta note ({UTILISATEURS[moi]})</span>
              </div>
              <div class="controles-moi">
                <Etoiles
                  valeur={x.moi.note}
                  ariaLabel={`Noter ${x.groupe.nom}`}
                  onchange={(n) => modifier(x.groupe.slug, { note: n })}
                />
                <button
                  type="button"
                  class="btn-coeur"
                  class:actif={x.moi.coeur}
                  aria-pressed={x.moi.coeur}
                  aria-label={`Coup de cœur pour ${x.groupe.nom}`}
                  onclick={() => modifier(x.groupe.slug, { coeur: !x.moi.coeur })}
                >
                  {x.moi.coeur ? '♥' : '♡'}
                </button>
              </div>
            </div>
          </div>
        </article>
      {/each}
    </div>
  {:else}
    <div class="etat-vide">
      <p>Tu es à jour ! Aucun groupe noté par {UTILISATEURS[autre]} ne te manque 🤘</p>
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

  .fleche {
    color: var(--hf-red);
    font-weight: 700;
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

  .bandeau-vue strong {
    color: var(--hf-text);
  }

  .liste-lignes {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .ligne-rattraper {
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    padding: 0.9rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
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

  .comparaison-zone {
    background-color: var(--hf-bg);
    border: 1px solid var(--hf-border);
    padding: 0.55rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .avis-autre,
  .avis-moi {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .avis-moi {
    padding-top: 0.45rem;
    border-top: 1px solid rgba(42, 42, 42, 0.75);
  }

  .qui {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .crabe-mini {
    width: 22px;
    height: 18px;
    display: block;
    flex-shrink: 0;
  }

  .nom-autre {
    font-size: 0.76rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--hf-muted);
  }

  .nom-moi {
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--hf-text);
  }

  .note-autre {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .coeur-actif {
    color: var(--hf-red);
    font-size: 0.95rem;
  }

  .com-autre {
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.4;
    color: #d0d0d0;
  }

  .controles-moi {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .btn-coeur {
    width: 44px;
    height: 44px;
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    color: var(--hf-subtle);
    font-size: 1.15rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .btn-coeur:hover {
    color: var(--hf-text);
    border-color: #444444;
  }

  .btn-coeur.actif {
    background-color: rgba(214, 41, 41, 0.15);
    border-color: var(--hf-red);
    color: var(--hf-red);
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
