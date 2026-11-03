<script lang="ts">
	// Login form in the look of the site (theme colors/fonts) — admin, protected pages
	import Bounded from '$lib/components/Bounded.svelte';

	export let title: string;
	/** Form action, e.g. "?/login" (default: page's default action) */
	export let action: string | undefined = undefined;
</script>

<Bounded as="section" class="bg-page-bg text-page">
	<div class="flex min-h-[50vh] items-center justify-center">
		<form
			method="POST"
			{action}
			class="panel-tinted flex w-full max-w-sm flex-col gap-5 rounded-lg p-8"
		>
			<h2 class="m-0">{title}</h2>
			<slot />
		</form>
	</div>
</Bounded>
