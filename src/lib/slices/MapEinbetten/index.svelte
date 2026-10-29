<script lang="ts">
	import Bounded from '$lib/components/Bounded.svelte';
	import GoogleMap from '$lib/components/GoogleMap.svelte';
	import { convertNumber } from '$lib/utils/convertNumber';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';

	export let slice: any;

	const p = slice.primary ?? {};

	$: anim = mapAnimationFromPrimary(slice.primary);
	$: mobileVollbreite = p.mobile_full_width ?? false;

	const mapOpacity = convertNumber(p.opacity ?? 100);
	const mapHeight = p.map_height || 400;
</script>

<Bounded
	tag="section"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
	class={mobileVollbreite ? 'overflow-x-clip' : ''}
>
	<GoogleMap mapUrl={p.map_url} {mapHeight} {mapOpacity} {mobileVollbreite} />
</Bounded>
