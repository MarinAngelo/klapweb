<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import Bounded from '$lib/components/Bounded.svelte';

    // Daten vom Layout
    $: mainLang = $page.data.mainLang || 'de-ch';
    
    // Ziel: Homepage der Hauptsprache
    $: homeHref = mainLang === 'de-ch' ? '/' : `/${mainLang}`;

    let countdown = 15; // Erhöhe den Wert auf 15s für mehr Puffer
    let timer: any;
    let mounted = false;

    onMount(() => {
        mounted = true;
        timer = setInterval(() => {
            if (countdown > 0) {
                countdown -= 1;
            } else {
                clearInterval(timer);
                // Nur umleiten, wenn wir nicht bereits auf dem Ziel sind
                if (window.location.pathname !== homeHref) {
                    goto(homeHref);
                }
            }
        }, 1000);

        return () => clearInterval(timer);
    });

    const translations: Record<string, any> = {
        'de-ch': {
            title: 'Seite nicht gefunden',
            text: 'Diese Seite existiert in der gewählten Sprache leider noch nicht.',
            button: 'Zurück zur Hauptseite',
            redirectText: 'Automatische Weiterleitung in'
        },
        'en-us': {
            title: 'Page not found',
            text: 'This page is not available in the selected language yet.',
            button: 'Back to main page',
            redirectText: 'Redirecting in'
        }
    };

    // Bestimme die Sprache basierend auf dem URL-Präfix
    $: currentPath = $page.url.pathname;
    $: currentViewLang = currentPath.startsWith('/en-us') ? 'en-us' : 'de-ch';
    $: t = translations[currentViewLang] || translations['de-ch'];
</script>

{#if mounted}
<Bounded as="section" class="flex flex-col items-center justify-center min-h-[70vh] text-center">
    <div class="bg-white p-10 rounded-3xl border shadow-xl max-w-xl w-full border-slate-200">
        <span class="text-sm font-bold tracking-widest text-blue-600 uppercase">Status {$page.status}</span>
        <h1 class="text-4xl font-black text-slate-900 mt-2 mb-4">{t.title}</h1>
        
        <p class="text-slate-500 mb-10 leading-relaxed">
            {t.text}<br>
            <span class="text-xs italic opacity-70">(Path: {currentPath})</span>
        </p>

        <div class="space-y-6">
            <a
                href={homeHref}
                class="inline-block w-full px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md"
            >
                {t.button}
            </a>

            <div class="flex items-center justify-center gap-3 text-slate-400 text-sm">
                <div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                {t.redirectText} <span class="font-mono font-bold text-slate-900">{countdown}s</span>
            </div>
        </div>
    </div>
</Bounded>
{/if}