<script>
  import { synchro, synchroniserMaintenant, arreterSynchro } from './synchro.svelte.js';
  import { seDeconnecter } from './notes.svelte.js';

  /** @param {Date | null} d */
  const heure = (d) =>
    d?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) ?? '';

  const libelle = $derived(
    {
      inactif: '',
      synchronise: `✓ Synchronisé${synchro.derniere ? ` ${heure(synchro.derniere)}` : ''}`,
      attente: `⏳ ${synchro.enAttente} en attente`,
      envoi: '↻ Envoi…',
      'hors-ligne': `📴 Hors ligne${synchro.enAttente ? ` · ${synchro.enAttente} en attente` : ''}`,
      erreur: '⚠ Problème réseau, nouvel essai bientôt',
      'code-incorrect': '🔒 Code secret refusé',
    }[synchro.statut]
  );

  function seReconnecter() {
    arreterSynchro();
    seDeconnecter();
  }
</script>

{#if synchro.statut !== 'inactif'}
  <div class="synchro" data-statut={synchro.statut} aria-live="polite">
    <span class="synchro-libelle" title={synchro.erreur ?? undefined}>{libelle}</span>

    {#if synchro.statut === 'code-incorrect'}
      <button type="button" class="btn-reconnecter" onclick={seReconnecter}>
        Se reconnecter
      </button>
    {:else}
      <button
        type="button"
        class="btn-refresh"
        class:tourne={synchro.statut === 'envoi'}
        aria-label="Synchroniser maintenant"
        title="Synchroniser maintenant"
        disabled={synchro.statut === 'envoi'}
        onclick={synchroniserMaintenant}
      >
        <span aria-hidden="true">🔄</span>
      </button>
    {/if}
  </div>
{/if}

<style>
  .synchro {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.18rem 0.5rem;
    background-color: var(--hf-surface);
    border: 1px solid var(--hf-border);
    font-size: 0.74rem;
    line-height: 1.2;
    color: var(--hf-muted);
    max-width: 100%;
  }

  .synchro-libelle {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Vert : synchronisé */
  .synchro[data-statut='synchronise'] {
    color: #86efac;
    border-color: rgba(74, 222, 128, 0.35);
    background-color: rgba(22, 101, 52, 0.16);
  }

  /* Orange : en attente ou envoi en cours */
  .synchro[data-statut='attente'],
  .synchro[data-statut='envoi'] {
    color: #fcd34d;
    border-color: rgba(251, 191, 36, 0.4);
    background-color: rgba(146, 64, 14, 0.18);
  }

  /* Gris : hors ligne */
  .synchro[data-statut='hors-ligne'] {
    color: #a3a3a3;
    border-color: #3a3a3a;
    background-color: var(--hf-elevated);
  }

  /* Rouge : erreur réseau ou code refusé */
  .synchro[data-statut='erreur'],
  .synchro[data-statut='code-incorrect'] {
    color: #ff9b9b;
    border-color: rgba(214, 41, 41, 0.7);
    background-color: rgba(214, 41, 41, 0.14);
  }

  .btn-refresh {
    background: transparent;
    border: none;
    padding: 0.1rem 0.2rem;
    color: inherit;
    font-size: 0.8rem;
    line-height: 1;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .btn-refresh:hover:not(:disabled) {
    transform: scale(1.1);
  }

  .btn-refresh:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .btn-refresh.tourne span {
    display: inline-block;
    animation: rotation 0.9s linear infinite;
  }

  .btn-reconnecter {
    background-color: var(--hf-red);
    border: none;
    color: var(--hf-text);
    padding: 0.2rem 0.5rem;
    font-size: 0.72rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    flex-shrink: 0;
  }

  .btn-reconnecter:hover {
    background-color: var(--hf-red-hover);
  }

  @keyframes rotation {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
