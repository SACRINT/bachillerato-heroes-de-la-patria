/**
 * Convocatorias Redirect - External JS (CSP Compliant)
 * Countdown and auto-redirect to calendario.html#convocatorias
 * Mobile-First with 48px touch targets
 */
(function () {
    'use strict';

    var REDIRECT_URL = 'calendario.html#convocatorias';
    var COUNTDOWN_SECONDS = 5;
    var count = COUNTDOWN_SECONDS;

    function updateCountdown() {
        var el = document.getElementById('countdown');
        var circleEl = document.getElementById('countdown-circle-num');
        if (el) el.textContent = count;
        if (circleEl) circleEl.textContent = count;
    }

    function tick() {
        count--;
        if (count <= 0) {
            window.location.href = REDIRECT_URL;
            return;
        }
        updateCountdown();
        setTimeout(tick, 1000);
    }

    function init() {
        updateCountdown();
        setTimeout(tick, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
