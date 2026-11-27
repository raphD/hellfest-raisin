<script>
  import { session, seConnecter, UTILISATEURS } from './notes.svelte.js';

  /** @type {import('./notes.svelte.js').UtilisateurId | null} */
  let choix = $state(null);
  let secret = $state(session.secret);

  /** @param {SubmitEvent} e */
  function valider(e) {
    e.preventDefault();
    if (!choix) return;
    seConnecter(choix, secret.trim());
  }
</script>

<main class="connexion-page">
  <section class="connexion-carte" aria-labelledby="connexion-titre">
    <div class="connexion-entete">
      <div class="monogramme" aria-hidden="true">
        <span class="font-display">H</span>
      </div>
      <div>
        <h1 id="connexion-titre" class="font-display">
          HELLFEST 2027 <span class="accent">• MCCHOUFFE &amp; JC</span>
        </h1>
        <p class="sous-titre font-display">THE ABSOLUTE EDITION • 17 – 20 JUIN 2027 • CLISSON</p>
      </div>
    </div>

    <form class="connexion-form" onsubmit={valider}>
      <div class="champ-bloc">
        <span class="label-section font-display">Qui es-tu ?</span>
        <div class="choix-profils" role="radiogroup" aria-label="Choisir ton profil">
          <button
            type="button"
            role="radio"
            aria-checked={choix === 'mcchouffe'}
            class="profil-btn"
            class:selectionne={choix === 'mcchouffe'}
            onclick={() => (choix = 'mcchouffe')}
          >
            <svg class="profil-crabe" aria-hidden="true"><use href="#crab-mcchouffe" /></svg>
            <span class="profil-nom font-display">{UTILISATEURS.mcchouffe}</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={choix === 'jc'}
            class="profil-btn"
            class:selectionne={choix === 'jc'}
            onclick={() => (choix = 'jc')}
          >
            <svg class="profil-crabe" aria-hidden="true"><use href="#crab-jc" /></svg>
            <span class="profil-nom font-display">{UTILISATEURS.jc}</span>
          </button>
        </div>
      </div>

      <div class="champ-bloc">
        <label for="champ-secret" class="label-section font-display">
          Code secret partagé <span class="optionnel">(optionnel pour l'instant)</span>
        </label>
        <input
          id="champ-secret"
          type="password"
          bind:value={secret}
          autocomplete="current-password"
          placeholder="Sera utilisé pour la synchro en phase 5"
          class="champ-texte"
        />
        <p class="aide">
          Mémorisé uniquement sur cet appareil. Tes notes sont enregistrées en local et fonctionnent hors ligne.
        </p>
      </div>

      <button type="submit" class="btn-valider font-display" disabled={!choix}>
        C'est parti
      </button>
    </form>
  </section>
</main>

<style>
  .connexion-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem 1rem;
    background-color: var(--hf-bg);
  }

  .connexion-carte {
    width: 100%;
    max-width: 480px;
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    padding: 1.75rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .connexion-entete {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding-bottom: 1.15rem;
    border-bottom: 1px solid var(--hf-border);
  }

  .monogramme {
    width: 44px;
    height: 44px;
    background-color: var(--hf-bg);
    border: 1px solid var(--hf-border);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .monogramme span {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--hf-red);
    line-height: 1;
  }

  h1 {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--hf-text);
    line-height: 1.1;
  }

  .accent {
    color: var(--hf-red);
  }

  .sous-titre {
    margin: 0.25rem 0 0;
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--hf-muted);
  }

  .connexion-form {
    display: flex;
    flex-direction: column;
    gap: 1.35rem;
  }

  .champ-bloc {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .label-section {
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--hf-text);
  }

  .optionnel {
    font-family: 'Inter', sans-serif;
    font-size: 0.72rem;
    font-weight: 400;
    text-transform: none;
    letter-spacing: normal;
    color: var(--hf-muted);
  }

  .choix-profils {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .profil-btn {
    background-color: var(--hf-bg);
    border: 1px solid var(--hf-border);
    padding: 1.1rem 0.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    cursor: pointer;
    color: var(--hf-muted);
    transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
  }

  .profil-btn:hover {
    background-color: var(--hf-elevated);
    border-color: #444444;
    color: var(--hf-text);
  }

  .profil-btn.selectionne {
    background-color: rgba(214, 41, 41, 0.12);
    border-color: var(--hf-red);
    color: var(--hf-text);
  }

  .profil-crabe {
    width: 72px;
    height: 60px;
    display: block;
  }

  .profil-nom {
    font-size: 1.1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .champ-texte {
    width: 100%;
    height: 44px;
    padding: 0 0.85rem;
    background-color: var(--hf-bg);
    border: 1px solid var(--hf-border);
    color: var(--hf-text);
    font-size: 0.875rem;
    font-family: inherit;
  }

  .champ-texte::placeholder {
    color: var(--hf-subtle);
  }

  .champ-texte:focus {
    outline: none;
    border-color: var(--hf-red);
  }

  .aide {
    margin: 0;
    font-size: 0.74rem;
    line-height: 1.45;
    color: var(--hf-muted);
  }

  .btn-valider {
    width: 100%;
    height: 48px;
    background-color: var(--hf-red);
    border: none;
    color: var(--hf-text);
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: background-color 0.15s ease, opacity 0.15s ease;
  }

  .btn-valider:hover:not(:disabled) {
    background-color: var(--hf-red-hover);
  }

  .btn-valider:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
