<script>
  import { siYoutube, siYoutubemusic, siSpotify } from 'simple-icons';

  /** @type {{ nom: string }} */
  let { nom } = $props();

  // "band" aide YouTube à éviter les homonymes (Earth, Void, Speed...)
  const liens = $derived([
    {
      icone: siYoutube,
      titre: 'YouTube',
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(nom + ' band')}`,
    },
    {
      icone: siYoutubemusic,
      titre: 'YouTube Music',
      url: `https://music.youtube.com/search?q=${encodeURIComponent(nom)}`,
    },
    {
      icone: siSpotify,
      titre: 'Spotify',
      url: `https://open.spotify.com/search/${encodeURIComponent(nom)}`,
    },
  ]);
</script>

<div class="ecoute" aria-label={`Écouter ${nom}`}>
  {#each liens as lien (lien.titre)}
    <a
      href={lien.url}
      target="_blank"
      rel="noopener noreferrer"
      title={`Écouter ${nom} sur ${lien.titre}`}
      aria-label={`Écouter ${nom} sur ${lien.titre}`}
      class="ecoute-btn"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" style:fill={`#${lien.icone.hex}`}>
        <path d={lien.icone.path} />
      </svg>
    </a>
  {/each}
</div>

<style>
  .ecoute {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .ecoute-btn {
    width: 44px;
    height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: var(--hf-elevated);
    border: 1px solid var(--hf-border);
    transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
    flex-shrink: 0;
  }

  .ecoute-btn:hover,
  .ecoute-btn:focus-visible {
    background-color: #242424;
    border-color: var(--hf-red);
    outline: none;
  }

  .ecoute-btn:active {
    transform: scale(0.96);
  }

  .ecoute-btn svg {
    width: 20px;
    height: 20px;
    display: block;
  }
</style>
