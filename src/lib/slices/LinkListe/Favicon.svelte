<script lang="ts">
	// Favicon via our own server (/api/favicon) — no request from the visitor to Google
	export let domain: string;
	export let size = 32;
	let className = '';
	export { className as class };

	let failed = false;
	$: (domain, (failed = false));
</script>

{#if domain && !failed}
	<img
		src="/api/favicon?domain={encodeURIComponent(domain)}&sz={size}"
		alt=""
		class={className}
		loading="lazy"
		decoding="async"
		on:error={() => (failed = true)}
	/>
{/if}
