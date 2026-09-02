/**
 * 🌊 EDUZONA VISUAL ENGINE
 * Lenis Smooth Scroll + CountUp.js Animated Counters
 * Extraído como script externo para cumplir con Content Security Policy (CSP)
 */
(function() {
    'use strict';

    /* --- Lenis Smooth Scroll Removed (Causes scrolljacking, input lag, and wheel delay) --- */
    function initLenis() {
        // Native GPU-composited scrolling is used instead for instant responsiveness
        return;
    }

    /* --- CountUp.js Animated Counters --- */
    function initCounters() {
        var counters = document.querySelectorAll('.stat-number[data-count]');
        if (!counters.length) return;
        if (typeof CountUp === 'undefined' && typeof countUp === 'undefined') {
            console.warn('[VISUAL-ENGINE] CountUp.js not loaded yet');
            return;
        }
        var CountUpClass = (typeof CountUp !== 'undefined') ? CountUp : countUp.CountUp;
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var el = entry.target;
                    var endVal = parseInt(el.getAttribute('data-count'), 10);
                    var suffix = el.getAttribute('data-suffix') || '';
                    var counter = new CountUpClass(el, endVal, {
                        duration: 2.5,
                        separator: ',',
                        suffix: suffix,
                        enableScrollSpy: false
                    });
                    if (!counter.error) {
                        counter.start();
                    } else {
                        console.error('[VISUAL-ENGINE] CountUp error:', counter.error);
                    }
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.3 });
        counters.forEach(function(c) { observer.observe(c); });
        console.log('[VISUAL-ENGINE] CountUp counters initialized (' + counters.length + ')');
    }

    /* --- Initialize on DOM ready --- */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initLenis();
            initCounters();
        });
    } else {
        initLenis();
        initCounters();
    }
})();
