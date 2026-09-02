/**
 * 🏢 Galería de Infraestructura - Swiper.js
 * Extraído para estricto cumplimiento de Content Security Policy (CSP)
 */
(function() {
    'use strict';

    function initSwiper() {
        if (typeof Swiper === 'undefined') {
            // Reintentar brevemente si el script del CDN aún se está cargando
            setTimeout(initSwiper, 100);
            return;
        }

        var swiperEl = document.querySelector('.infra-swiper');
        if (!swiperEl) return;

        try {
            new Swiper('.infra-swiper', {
                slidesPerView: 1,
                spaceBetween: 20,
                loop: true,
                autoplay: {
                    delay: 4000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev'
                },
                breakpoints: {
                    640: { slidesPerView: 2 },
                    992: { slidesPerView: 3 }
                }
            });
            console.log('[SWIPER] Infraestructura initialized successfully');
        } catch (err) {
            console.error('[SWIPER] Error initializing infra slider:', err);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSwiper);
    } else {
        initSwiper();
    }
})();
