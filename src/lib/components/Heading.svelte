<script lang="ts">
    import clsx from 'clsx';

    export let tag = 'h1';
    /* Neu: 'auto' hinzugefügt und als Default gesetzt. 
       Damit greift standardmäßig deine app.css!
    */
    export let size: 'sm' | 'md' | 'lg' | 'xl' | 'auto' = 'auto';
</script>

<svelte:element
    this={tag}
    class={clsx(
        'font-semibold leading-tight tracking-tight md:leading-tight',
        /* Nur wenn size explizit gesetzt ist, überschreiben wir das CSS */
        size === 'xl' && 'text-5xl md:text-7xl',
        size === 'lg' && 'text-4xl md:text-5xl',
        size === 'md' && 'text-3xl md:text-4xl',
        size === 'sm' && 'text-xl md:text-2xl',
        /* Bei 'auto' wird keine Klasse hinzugefügt -> app.css gewinnt */
        $$props.class
    )}
>
    <slot />
</svelte:element>