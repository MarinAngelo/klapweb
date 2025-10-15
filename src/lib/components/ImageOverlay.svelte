<script lang="ts">
	import { hexToRgba } from '../utils/color';
    
	export let color: string;
	export let opacity: number;
</script>

<div
	class="absolute inset-0 pointer-events-none"
	style="background: {hexToRgba(color, opacity)};"
	aria-hidden="true"
></div>
