// Measure Core Web Vitals with web-vitals library
        async function measureVitals() {
            try {
                const { onLCP, onFID, onCLS } = await import('https://unpkg.com/web-vitals@3?module');

                onLCP(metric => {
                    const value = metric.value.toFixed(0);
                    const el = document.getElementById('lcp');
                    el.textContent = value + ' ms';
                    el.className = value < 2500 ? 'metric-value good' : value < 4000 ? 'metric-value warning' : 'metric-value poor';
                });

                onFID(metric => {
                    const value = metric.value.toFixed(0);
                    const el = document.getElementById('fid');
                    el.textContent = value + ' ms';
                    el.className = value < 100 ? 'metric-value good' : value < 300 ? 'metric-value warning' : 'metric-value poor';
                });

                onCLS(metric => {
                    const value = metric.value.toFixed(3);
                    const el = document.getElementById('cls');
                    el.textContent = value;
                    el.className = value < 0.1 ? 'metric-value good' : value < 0.25 ? 'metric-value warning' : 'metric-value poor';
                });
            } catch (error) {
                console.error('Error loading web-vitals:', error);
            }
        }

        function runAudit() {
            alert('Abriendo Lighthouse en DevTools...\n\n1. Abrir DevTools (F12)\n2. Tab "Lighthouse"\n3. Click "Analyze page load"');
        }

        // Auto-measure on load
        measureVitals();

        // ✅ CSP Compliant: Using addEventListener instead of onclick
        document.getElementById('runAuditBtn')?.addEventListener('click', runAudit);
