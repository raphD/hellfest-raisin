<script>
  import { session, notes, autreUtilisateur } from './notes.svelte.js';
  import { coeurs, parJourEtScene } from './stats.js';
  import { LIBELLES_JOURS } from './lineup.js';
  import LigneComparaison from './LigneComparaison.svelte';

  /** @type {{ groupes: import('./lineup.js').Groupe[] }} */
  let { groupes } = $props();

  let copieOk = $state(false);

  const moi = $derived(/** @type {import('./notes.svelte.js').UtilisateurId} */ (session.utilisateur ?? 'mcchouffe'));
  const autre = $derived(autreUtilisateur(moi));
  const resultat = $derived(coeurs(groupes, notes[moi], notes[autre]));
  const programme = $derived(parJourEtScene(resultat.communs));
  const presque = $derived(parJourEtScene(resultat.presque));

  async function copierProgramme() {
    /** @type {string[]} */
    const lignes = ['HELLFEST 2027 – Programme McChouffe & JC'];

    /**
     * @param {string} titre
     * @param {ReturnType<typeof parJourEtScene>} sections
     */
    const ajouterSection = (titre, sections) => {
      if (!sections.length) return;
      lignes.push('', `=== ${titre} ===`);
      for (const j of sections) {
        lignes.push(`\n${LIBELLES_JOURS[j.jour] ?? j.jour}`);
        for (const s of j.scenes) {
          const noms = s.elements.map((x) => x.groupe.nom).join(', ');
          lignes.push(`  • ${s.scene} : ${noms}`);
        }
      }
    };

    ajouterSection(`Immanquable (${resultat.communs.length})`, programme);
    ajouterSection(`Presque (${resultat.presque.length})`, presque);

    try {
      await navigator.clipboard.writeText(lignes.join('\n'));
      copieOk = true;
      setTimeout(() => (copieOk = false), 2200);
    } catch {
      // Clipboard indisponible
    }
  }
</script>

<section class="vue-coeurs" aria-label="Cœurs communs et programme">
  <header class="bandeau-vue">
    <div class="bandeau-gauche">
      <div class="duo-crabes" aria-hidden="true">
        <svg class="crabe"><use href="#crab-mcchouffe" /></svg>
        <span class="coeur-sym">♥</span>
        <svg class="crabe"><use href="#crab-jc" /></svg>
      </div>
      <div>
        <h2 class="font-display">❤️❤️ Immanquable ({resultat.communs.length})</h2>
        <p>Les coups de cœur communs rangés par jour et par scène pour préparer le programme à Clisson.</p>
      </div>
    </div>

    {#if resultat.communs.length > 0 || resultat.presque.length > 0}
      <button type="button" class="btn-copier" onclick={copierProgramme}>
        {copieOk ? '✓ Programme copié !' : '📋 Copier le programme'}
      </button>
    {/if}
  </header>

  {#if programme.length > 0}
    <div class="programme-jours">
      {#each programme as j (j.jour)}
        <div class="jour-section">
          <div class="jour-entete">
            <span class="barre-rouge" aria-hidden="true"></span>
            <h3 class="font-display">{LIBELLES_JOURS[j.jour] ?? j.jour}</h3>
          </div>

          <div class="scenes-liste">
            {#each j.scenes as s (s.scene)}
              <div class="scene-bloc">
                <h4 class="badge-scene font-display">{s.scene}</h4>
                <div class="liste-lignes">
                  {#each s.elements as x (x.groupe.slug)}
                    <LigneComparaison
                      groupe={x.groupe}
                      avisA={x.a}
                      avisB={x.b}
                      utilisateurA={moi}
                      utilisateurB={autre}
                      masquerJourScene
                    />
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="etat-vide">
      <p>Pas encore de cœur commun.</p>
    </div>
  {/if}

  {#if resultat.presque.length > 0}
    <div class="section-presque">
      <header class="entete-presque">
        <h2 class="font-display">❤️ Presque ({resultat.presque.length})</h2>
        <p>Un cœur d'un côté, au moins 4 ★ de l'autre : à confirmer ensemble ?</p>
      </header>

      <div class="programme-jours">
        {#each presque as j (j.jour)}
          <div class="jour-section">
            <div class="jour-entete">
              <span class="barre-rouge" aria-hidden="true"></span>
              <h3 class="font-display">{LIBELLES_JOURS[j.jour] ?? j.jour}</h3>
            </div>

            <div class="scenes-liste">
              {#each j.scenes as s (s.scene)}
                <div class="scene-bloc">
                  <h4 class="badge-scene font-display">{s.scene}</h4>
                  <div class="liste-lignes">
                    {#each s.elements as x (x.groupe.slug)}
                      <LigneComparaison
                        groupe={x.groupe}
                        avisA={x.a}
                        avisB={x.b}
                        utilisateurA={moi}
                        utilisateurB={autre}
                        masquerJourScene
                      />
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</section>

<style>
  .vue-coeurs {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .bandeau-vue {
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    padding: 1rem 1.15rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
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
    gap: 0.3rem;
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

  .coeur-sym {
    color: var(--hf-red);
    font-size: 1.15rem;
    font-weight: 700;
  }

  h2 {
    margin: 0;
    font-size: 1.35rem;
    text-transform: uppercase;
    color: var(--hf-text);
  }

  .bandeau-vue p,
  .entete-presque p {
    margin: 0.2rem 0 0;
    font-size: 0.8rem;
    color: var(--hf-muted);
  }

  .btn-copier {
    padding: 0.55rem 0.9rem;
    background-color: var(--hf-bg);
    border: 1px solid var(--hf-border);
    color: var(--hf-text);
    font-size: 0.78rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: border-color 0.15s ease, background-color 0.15s ease;
    flex-shrink: 0;
  }

  .btn-copier:hover {
    border-color: var(--hf-red);
    background-color: var(--hf-elevated);
  }

  .programme-jours {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  .jour-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .jour-entete {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding-bottom: 0.45rem;
    border-bottom: 1px solid var(--hf-border);
  }

  .barre-rouge {
    width: 5px;
    height: 20px;
    background-color: var(--hf-red);
    display: inline-block;
  }

  .jour-entete h3 {
    margin: 0;
    font-size: 1.25rem;
    text-transform: uppercase;
    color: var(--hf-text);
  }

  .scenes-liste {
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
  }

  .scene-bloc {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .badge-scene {
    margin: 0;
    align-self: flex-start;
    padding: 0.18rem 0.65rem;
    background-color: #1e1e1e;
    border: 1px solid #333333;
    border-left: 3px solid var(--hf-red);
    color: var(--hf-text);
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .liste-lignes {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .section-presque {
    margin-top: 0.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--hf-border);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
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
