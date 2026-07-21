<script lang="ts">
  export let node: any;
  const name = node?.data?.label ?? '';
</script>

<span class={`rt-label rt-${name}`}>
  <slot />
</span>

<style>
  .rt-label { display: inline; }

  /* deine Styles hier -> gelten sicher für dieses Span */
  .rt-highlight {
    color: var(--highlight-color, currentColor);
    background-color: var(--highlight-bg-color, transparent);
    border-radius: 0.15em;
    padding: 0.05em 0.2em;
  }
</style>
