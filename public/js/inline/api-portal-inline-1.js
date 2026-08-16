// Load API stats from spec
        async function loadAPIStats() {
            try {
                const response = await fetch('/api-docs/spec.json');
                const spec = await response.json();

                // Update stats
                document.getElementById('total-paths').textContent = Object.keys(spec.paths || {}).length;
                document.getElementById('total-schemas').textContent = Object.keys(spec.components?.schemas || {}).length;
                document.getElementById('total-tags').textContent = (spec.tags || []).length;
                document.getElementById('endpoint-count').textContent = Object.keys(spec.paths || {}).length + '+';

                // Show stats section
                document.getElementById('api-stats-section').style.display = 'block';

            } catch (error) {
                console.log('Could not load API stats:', error);
            }
        }

        // Load on page load
        document.addEventListener('DOMContentLoaded', loadAPIStats);
