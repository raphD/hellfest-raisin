<script>
  /**
   * @type {{
   *   valeur?: number,
   *   onchange?: (note: number) => void,
   *   lectureSeule?: boolean,
   *   compact?: boolean,
   *   ariaLabel?: string,
   * }}
   */
  let {
    valeur = 0,
    onchange,
    lectureSeule = false,
    compact = false,
    ariaLabel = 'Note sur 5',
  } = $props();
</script>

<div
  class="etoiles"
  class:lecture-seule={lectureSeule}
  class:compact
  role="radiogroup"
  aria-label={ariaLabel}
>
  {#each [1, 2, 3, 4, 5] as n (n)}
    <button
      type="button"
      role="radio"
      aria-checked={valeur === n}
      aria-label={`${n} sur 5`}
      disabled={lectureSeule}
      class:pleine={n <= valeur}
      onclick={() => onchange?.(valeur === n ? 0 : n)}
    >
      ★
    </button>
  {/each}
</div>

<style>
  .etoiles {
    display: inline-flex;
    align-items: center;
  }

  button {
    font-size: 1.45rem;
    line-height: 1;
    background: none;
    border: 0;
    padding: 0;
    color: #3a3a3a;
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: color 0.12s ease, transform 0.1s ease;
  }

  button:hover:not(:disabled) {
    color: var(--hf-muted);
  }

  button:active:not(:disabled) {
    transform: scale(0.92);
  }

  button:focus-visible {
    outline: 1px solid var(--hf-red);
    outline-offset: -2px;
  }

  button.pleine {
    color: var(--hf-red);
  }

  button:disabled {
    cursor: default;
  }

  .lecture-seule button {
    font-size: 1rem;
    min-width: 20px;
    min-height: 24px;
  }

  .lecture-seule button.pleine {
    color: var(--hf-text);
  }

  .compact button {
    font-size: 1.15rem;
    min-width: 28px;
    min-height: 36px;
  }

  @media (pointer: coarse) {
    .compact:not(.lecture-seule) button {
      min-width: 36px;
      min-height: 44px;
    }
  }
</style>
