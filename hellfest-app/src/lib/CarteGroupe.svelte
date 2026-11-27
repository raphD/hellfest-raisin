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

  /** @type {{ groupe: import('./lineup.js').Groupe, afficherJourScene?: boolean }} */
  let { groupe, afficherJourScene = false } = $props();

  let imageErreur = $state(false);
  let commentaireOuvert = $state(false);

  const moi = $derived(session.utilisateur);
  const autre = $derived(/** @type {import('./notes.svelte.js').UtilisateurId} */ (moi === 'mcchouffe' ? 'jc' : 'mcchouffe'));
  const monAvis = $derived(avis(moi, groupe.slug));
  const sonAvis = $derived(avis(autre, groupe.slug));
  const aSonAvis = $derived(Boolean(sonAvis.note || sonAvis.coeur || sonAvis.commentaire));
  const moyenne = $derived(
    monAvis.note > 0 && sonAvis.note > 0
      ? ((monAvis.note + sonAvis.note) / 2).toFixed(1)
      : null
  );

  const monCrabe = $derived(moi === 'mcchouffe' ? '#crab-mcchouffe' : '#crab-jc');
  const sonCrabe = $derived(autre === 'mcchouffe' ? '#crab-mcchouffe' : '#crab-jc');

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

    <div class="carte-bas">
      <!-- Ligne écoute + moyenne si les deux ont noté -->
      <div class="carte-ecoute-ligne">
        <div class="ecoute-bloc">
          <span class="ecouter-label">Écouter</span>
          <BoutonsEcoute nom={groupe.nom} />
        </div>

        {#if moyenne}
          <div class="moyenne-bloc">
            <span class="moyenne-label">Moyenne</span>
            <span class="moyenne-valeur font-display">{moyenne} / 5</span>
          </div>
        {/if}
      </div>

      <!-- Bloc mon avis : étoiles, cœur, commentaire repliable -->
      {#if moi}
        <div class="bloc-avis">
          <div class="avis-entete">
            <div class="avis-auteur">
              <svg class="crabe-mini" aria-hidden="true"><use href={monCrabe} /></svg>
              <span class="font-display auteur-nom">{UTILISATEURS[moi]}</span>
              <span class="note-chiffre">{monAvis.note > 0 ? `${monAvis.note}/5` : '—'}</span>
            </div>

            <button
              type="button"
              class="btn-commenter"
              class:a-commentaire={Boolean(monAvis.commentaire.trim())}
              aria-expanded={commentaireOuvert}
              onclick={() => (commentaireOuvert = !commentaireOuvert)}
            >
              <span>💬</span>
              <span>{monAvis.commentaire.trim() ? 'Commentaire' : 'Commenter'}</span>
            </button>
          </div>

          <div class="avis-controles">
            <Etoiles
              valeur={monAvis.note}
              ariaLabel={`Note de ${UTILISATEURS[moi]} pour ${groupe.nom}`}
              onchange={(n) => modifier(groupe.slug, { note: n })}
            />

            <button
              type="button"
              class="btn-coeur"
              class:actif={monAvis.coeur}
              aria-pressed={monAvis.coeur}
              aria-label={monAvis.coeur ? `Retirer ${groupe.nom} des coups de cœur` : `Ajouter ${groupe.nom} aux coups de cœur`}
              onclick={() => modifier(groupe.slug, { coeur: !monAvis.coeur })}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          </div>

          {#if !commentaireOuvert && monAvis.commentaire.trim()}
            <button
              type="button"
              class="apercu-commentaire"
              onclick={() => (commentaireOuvert = true)}
              title="Cliquer pour modifier ton commentaire"
            >
              {monAvis.commentaire}
            </button>
          {/if}

          {#if commentaireOuvert}
            <div class="editeur-commentaire">
              <textarea
                rows="3"
                placeholder="Mon commentaire (super en live, à réécouter...)"
                maxlength={LONGUEUR_MAX_COMMENTAIRE}
                aria-label={`Commentaire pour ${groupe.nom}`}
                value={monAvis.commentaire}
                oninput={(e) => modifier(groupe.slug, { commentaire: e.currentTarget.value })}
              ></textarea>
              <div class="commentaire-pied">
                <span class="compteur-chars">
                  {monAvis.commentaire.length}/{LONGUEUR_MAX_COMMENTAIRE}
                </span>
              </div>
            </div>
          {/if}

          <!-- Bloc avis de l'autre (visible dès qu'il a noté/commenté, en phase 6 ou en test local) -->
          {#if aSonAvis}
            <div class="son-avis">
              <div class="son-avis-ligne">
                <div class="avis-auteur">
                  <svg class="crabe-mini" aria-hidden="true"><use href={sonCrabe} /></svg>
                  <span class="font-display auteur-autre">{UTILISATEURS[autre]}</span>
                  {#if sonAvis.note > 0}
                    <Etoiles valeur={sonAvis.note} lectureSeule />
                  {/if}
                </div>
                {#if sonAvis.coeur}
                  <span class="son-coeur" title={`Coup de cœur ${UTILISATEURS[autre]}`} aria-label={`Coup de cœur ${UTILISATEURS[autre]}`}>
                    ♥
                  </span>
                {/if}
              </div>
              {#if sonAvis.commentaire}
                <p class="son-commentaire">{sonAvis.commentaire}</p>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
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

  .carte-bas {
    padding-top: 0.75rem;
    border-top: 1px solid var(--hf-border);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .carte-ecoute-ligne {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .ecoute-bloc {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .ecouter-label {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: var(--hf-subtle);
    font-weight: 600;
  }

  .moyenne-bloc {
    text-align: right;
    flex-shrink: 0;
  }

  .moyenne-label {
    display: block;
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--hf-subtle);
  }

  .moyenne-valeur {
    font-size: 0.9rem;
    color: var(--hf-text);
  }

  .bloc-avis {
    background-color: var(--hf-bg);
    border: 1px solid var(--hf-border);
    padding: 0.55rem 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .avis-entete {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .avis-auteur {
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

  .auteur-nom {
    font-size: 0.76rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--hf-text);
  }

  .auteur-autre {
    font-size: 0.74rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--hf-muted);
  }

  .note-chiffre {
    font-size: 0.72rem;
    color: var(--hf-subtle);
  }

  .btn-commenter {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.22rem 0.5rem;
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    color: var(--hf-muted);
    font-size: 0.72rem;
    font-family: inherit;
    cursor: pointer;
    transition: border-color 0.15s ease, color 0.15s ease;
  }

  .btn-commenter:hover {
    color: var(--hf-text);
    border-color: #444444;
  }

  .btn-commenter.a-commentaire {
    border-color: rgba(214, 41, 41, 0.55);
    color: var(--hf-text);
  }

  .avis-controles {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.35rem;
  }

  .btn-coeur {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    color: var(--hf-subtle);
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
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

  .btn-coeur svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
  }

  .btn-coeur.actif svg {
    fill: currentColor;
  }

  .apercu-commentaire {
    width: 100%;
    text-align: left;
    background: var(--hf-surface);
    border: 1px solid var(--hf-border);
    padding: 0.45rem 0.55rem;
    color: #d0d0d0;
    font-size: 0.76rem;
    font-family: inherit;
    line-height: 1.4;
    cursor: pointer;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .apercu-commentaire:hover {
    border-color: #444444;
  }

  .editeur-commentaire {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: 0.15rem;
  }

  .editeur-commentaire textarea {
    width: 100%;
    padding: 0.5rem 0.6rem;
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    color: var(--hf-text);
    font-size: 0.8rem;
    font-family: inherit;
    line-height: 1.4;
    resize: vertical;
  }

  .editeur-commentaire textarea::placeholder {
    color: var(--hf-subtle);
  }

  .editeur-commentaire textarea:focus {
    outline: none;
    border-color: var(--hf-red);
  }

  .commentaire-pied {
    display: flex;
    justify-content: flex-end;
  }

  .compteur-chars {
    font-size: 0.68rem;
    color: var(--hf-subtle);
    font-variant-numeric: tabular-nums;
  }

  .son-avis {
    margin-top: 0.25rem;
    padding-top: 0.45rem;
    border-top: 1px solid rgba(42, 42, 42, 0.8);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .son-avis-ligne {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .son-coeur {
    color: var(--hf-red);
    font-size: 0.9rem;
    line-height: 1;
  }

  .son-commentaire {
    margin: 0;
    font-size: 0.76rem;
    line-height: 1.4;
    color: #c8c8c8;
    word-break: break-word;
  }
</style>
