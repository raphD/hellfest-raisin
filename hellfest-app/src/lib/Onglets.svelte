<script>
  /**
   * @type {{
   *   vue: string,
   *   compteurs?: { coeurs?: number, desaccords?: number, rattraper?: number },
   * }}
   */
  let { vue, compteurs = {} } = $props();

  const onglets = $derived([
    { id: 'tous', icone: '🎸', libelle: 'Tous', badge: null },
    { id: 'avancement', icone: '📊', libelle: 'Avancement', badge: null },
    { id: 'top', icone: '🏆', libelle: 'Top', badge: null },
    { id: 'coeurs', icone: '❤️', libelle: 'Cœurs', badge: compteurs.coeurs || null },
    { id: 'desaccords', icone: '⚔️', libelle: 'Désaccords', badge: compteurs.desaccords || null },
    { id: 'rattraper', icone: '👀', libelle: 'À rattraper', badge: compteurs.rattraper || null },
  ]);
</script>

<nav class="onglets-barre" aria-label="Navigation entre les vues">
  <div class="conteneur onglets-liste">
    {#each onglets as o (o.id)}
      <a
        href={`#${o.id}`}
        class="onglet"
        aria-current={vue === o.id ? 'page' : undefined}
      >
        <span class="onglet-icone" aria-hidden="true">{o.icone}</span>
        <span class="onglet-texte font-display">{o.libelle}</span>
        {#if o.badge}
          <span class="onglet-badge">{o.badge}</span>
        {/if}
      </a>
    {/each}
  </div>
</nav>

<style>
  .onglets-barre {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 40;
    background-color: rgba(14, 14, 14, 0.97);
    backdrop-filter: blur(8px);
    border-top: 1px solid var(--hf-border);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .onglets-liste {
    display: flex;
    align-items: stretch;
    gap: 0.2rem;
    overflow-x: auto;
    scrollbar-width: none;
    padding-top: 0;
    padding-bottom: 0;
  }

  .onglets-liste::-webkit-scrollbar {
    display: none;
  }

  .onglet {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.72rem 0.85rem;
    color: var(--hf-muted);
    text-decoration: none;
    white-space: nowrap;
    border-top: 2px solid transparent;
    transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
  }

  .onglet:hover {
    color: var(--hf-text);
    background-color: rgba(255, 255, 255, 0.03);
  }

  .onglet[aria-current='page'] {
    color: var(--hf-text);
    border-top-color: var(--hf-red);
    background-color: rgba(214, 41, 41, 0.1);
  }

  .onglet-icone {
    font-size: 0.9rem;
    line-height: 1;
  }

  .onglet-texte {
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .onglet-badge {
    font-size: 0.68rem;
    font-weight: 600;
    padding: 0.05rem 0.38rem;
    background-color: var(--hf-elevated);
    border: 1px solid var(--hf-border);
    color: var(--hf-text);
    line-height: 1.3;
  }

  .onglet[aria-current='page'] .onglet-badge {
    background-color: var(--hf-red);
    border-color: var(--hf-red);
  }

  @media (min-width: 768px) {
    .onglets-barre {
      position: static;
      border-top: none;
      border-bottom: 1px solid var(--hf-border);
      padding-bottom: 0;
    }

    .onglet {
      border-top: none;
      border-bottom: 2px solid transparent;
      padding: 0.75rem 1rem;
    }

    .onglet[aria-current='page'] {
      border-top-color: transparent;
      border-bottom-color: var(--hf-red);
    }
  }
</style>
