<script lang="ts">
    export let images: Array<{ url: string; alt?: string }>;

    let currentIndex = 0;

    // Variablen für Swipe-Logik
    let startX = 0;
    let endX = 0;

    // Funktion zum Wechseln des Bildes
    function nextImage() {
        currentIndex = (currentIndex + 1) % images.length;
    }

    function prevImage() {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
    }

    // Swipe-Logik
    function handleTouchStart(event: TouchEvent) {
        startX = event.touches[0].clientX;
    }

    function handleTouchMove(event: TouchEvent) {
        endX = event.touches[0].clientX;
    }

    function handleTouchEnd() {
        if (startX - endX > 50) {
            // Swipe nach links
            nextImage();
        } else if (endX - startX > 50) {
            // Swipe nach rechts
            prevImage();
        }
    }
</script>

<div
    class="carousel relative overflow-hidden"
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
>
    <!-- Bilder -->
    <div class="carousel-images flex transition-transform duration-500" style="transform: translateX(-{currentIndex * 100}%);">
        {#each images as image, index}
            <div class="carousel-item flex-shrink-0 w-full">
                <img src={image.url} alt={image.alt || 'Carousel Image'} class="w-full h-auto object-cover" />
            </div>
        {/each}
    </div>

    <!-- Navigation -->
    <button class="prev absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hidden md:block" on:click={prevImage}>
        &#10094;
    </button>
    <button class="next absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hidden md:block" on:click={nextImage}>
        &#10095;
    </button>

    <!-- Indikatoren -->
    <div class="indicators absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {#each images as _, index}
            <div
                class="indicator w-3 h-3 rounded-full cursor-pointer"
                class:selected={index === currentIndex}
                on:click={() => (currentIndex = index)}
            ></div>
        {/each}
    </div>
</div>

<style>
    .carousel {
        position: relative;
        width: 100%;
        overflow: hidden;
    }

    .carousel-images {
        display: flex;
    }

    .carousel-item {
        width: 100%;
    }

    .prev,
    .next {
        cursor: pointer;
    }

    .indicators .indicator {
        background-color: gray;
    }

    .indicators .indicator.selected {
        background-color: white;
    }

    /* Buttons ausblenden in der mobilen Ansicht */
    @media (max-width: 768px) {
        .prev,
        .next {
            display: none;
        }
    }
</style>