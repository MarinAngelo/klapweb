<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import Bounded from '$lib/components/Bounded.svelte';
    import Button from '$lib/components/Button.svelte';

    // 1. SPRACH-LOGIK: Wir erkennen die gewünschte Sprache aus der URL
    // Falls params.lang leer ist (z.B. Root-Ebene), nutzen wir mainLang als Fallback
    $: targetLang = $page.params.lang || $page.data.mainLang || 'de-ch';
    
    // 2. Ziel-URL für den Button & Redirect (Hauptseite der Zielsprache)
    $: homeHref = targetLang === 'de-ch' ? '/' : `/${targetLang}`;

    let countdown = 15;
    let timer: any;
    let mounted = false;

    // 3. TRANSLATIONS
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

    // Reaktiv den richtigen Textsatz wählen
    $: t = translations[targetLang] || translations['de-ch'];

    onMount(() => {
        mounted = true;
        timer = setInterval(() => {
            if (countdown > 0) {
                countdown -= 1;
            } else {
                clearInterval(timer);
                // Nur umleiten, wenn wir nicht schon dort sind
                if (window.location.pathname !== homeHref) {
                    goto(homeHref);
                }
            }
        }, 1000);

        return () => clearInterval(timer);
    });
</script>

{#if mounted}
    <div class="error-container">
        <Bounded as="section" class="text-center">
            <div class="content-wrapper">
                <span class="status-code">Status {$page.status}</span>
                <h1 class="error-title">{t.title}</h1>
                
                <p class="error-text">
                    {t.text}
                </p>

                <div class="actions">
                    <Button 
                        link={{ url: homeHref }} 
                        text={t.button} 
                    />

                    <div class="countdown-wrapper">
                        <div class="spinner"></div>
                        <span>{t.redirectText} <strong>{countdown}s</strong></span>
                    </div>
                </div>
            </div>
        </Bounded>
    </div>
{/if}

<style>
    .error-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 70vh;
        background: transparent;
        color: var(--page-color);
        font-family: var(--page-font);
    }

    .content-wrapper {
        max-width: 32rem;
        margin: 0 auto;
    }

    .status-code {
        display: block;
        font-size: 0.875rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #ef4444; /* Status 404 in Rot */
        margin-bottom: 0.5rem;
    }

    .error-title {
        font-size: clamp(2rem, 8vw, 3rem);
        font-weight: 900;
        line-height: 1.1;
        margin-bottom: 1.5rem;
    }

    .error-text {
        font-size: 1.125rem;
        line-height: 1.6;
        margin-bottom: 2rem;
        opacity: 0.8;
    }

    .actions {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
    }

    .countdown-wrapper {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.875rem;
        opacity: 0.7;
    }

    .spinner {
        width: 1rem;
        height: 1rem;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
</style>