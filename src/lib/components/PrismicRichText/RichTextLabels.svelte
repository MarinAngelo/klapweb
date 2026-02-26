<script>
	export let node;
	export let color = undefined;
</script>

{#if node.data.label === 'h1'}
	<span class="h1-style" style={color ? `color: ${color};` : undefined}>
		<slot />
	</span>
{:else if node.data.label === 'h2'}
	<span class="h2-style" style={color ? `color: ${color};` : undefined}>
		<slot />
	</span>
{:else if node.data.label === 'h3'}
	<span class="h3-style" style={color ? `color: ${color};` : undefined}>
		<slot />
	</span>
{:else if node.data.label === 'h4'}
	<span class="h4-style" style={color ? `color: ${color};` : undefined}>
		<slot />
	</span>
{:else}
	<span class="label-{node.data.label}" style={color ? `color: ${color};` : undefined}>
		<slot />
	</span>
{/if}

<style>
	/* Hier definierst du den Style, damit er EXAKT wie deine H1 aussieht.
     Am besten nutzt du hier die gleichen Variablen wie in deiner globalen app.css 
  */
	.h1-style {
		font-size: 2.25rem; /* text-4xl */
		font-weight: 700; /* font-bold */
		line-height: 1.25; /* leading-tight */
		margin-bottom: 1.5rem; /* mb-6 */
		display: inline-block;
	}

	@media (min-width: 768px) {
		.h1-style {
			font-size: 3rem; /* md:text-5xl */
		}
	}

	.h2-style {
		font-size: 1.875rem; /* text-3xl */
		font-weight: 600; /* font-semibold */
		line-height: 1.375; /* leading-snug */
		margin-bottom: 1rem; /* mb-4 */
		margin-top: 2rem; /* mt-8 */
		display: inline-block;
	}

	@media (min-width: 768px) {
		.h2-style {
			font-size: 2.25rem; /* md:text-4xl */
		}
	}

	.h3-style {
		font-size: 1.5rem; /* text-2xl */
		font-weight: 600; /* font-semibold */
		line-height: 1.6; /* default */
		margin-bottom: 0.75rem; /* mb-3 */
		margin-top: 1.5rem; /* mt-6 */
		display: inline-block;
	}

	@media (min-width: 768px) {
		.h3-style {
			font-size: 1.875rem; /* md:text-3xl */
		}
	}

	.h4-style {
		font-size: 1.25rem; /* text-xl */
		font-weight: 600; /* font-semibold */
		line-height: 1.6; /* default */
		margin-bottom: 0.5rem; /* mb-2 */
		display: inline-block;
	}
</style>
