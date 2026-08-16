// Load BGE core only if online
        if (navigator.onLine) {
            const script = document.createElement('script');
            script.src = 'js/bge-framework-core.js';
            script.defer = true;
            document.head.appendChild(script);
        }
