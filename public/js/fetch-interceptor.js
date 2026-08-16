/**
 * 🔧 FETCH INTERCEPTOR - Fix /auth/* URLs to /api/auth/*
 *
 * The compiled /dist/assets/main.js uses /auth/login instead of /api/auth/login
 * This interceptor transparently converts all /auth/* requests to /api/auth/*
 *
 * This allows the old compiled code to work with the new API structure
 */

(function() {
    'use strict';

    const originalFetch = window.fetch;

    window.fetch = function(...args) {
        let url = args[0];

        // Only process string URLs
        if (typeof url === 'string') {
            // Convert /auth/* to /api/auth/* if not already prefixed
            if (url.includes('/auth/') && !url.includes('/api/auth/')) {
                const newUrl = url.replace(/\/auth\//g, '/api/auth/');
                
                args[0] = newUrl;
            }
        }

        return originalFetch.apply(this, args);
    };

    
})();
