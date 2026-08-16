const micBtn = document.getElementById('mic-btn');
        const transcriptDiv = document.getElementById('transcript');
        let isListening = false;
        let recognition;

        if ('webkitSpeechRecognition' in window) {
            recognition = new webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'es-MX';
            recognition.interimResults = false;

            recognition.onstart = () => {
                isListening = true;
                micBtn.classList.add('listening');
                transcriptDiv.textContent = "Escuchando...";
            };

            recognition.onend = () => {
                isListening = false;
                micBtn.classList.remove('listening');
            };

            recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                transcriptDiv.textContent = `Dijiste: "${text}"`;
                processCommand(text);
            };

            micBtn.addEventListener('click', () => {
                if (isListening) recognition.stop();
                else recognition.start();
            });

        } else {
            transcriptDiv.textContent = "Tu navegador no soporta Web Speech API.";
        }

        function processCommand(text) {
            // Mock backend call
            console.log("Processing:", text);
            // fetch('/api/voice/command', { method: 'POST', body: JSON.stringify({ text }) ... });

            if (text.toLowerCase().includes('matemáticas')) {
                setTimeout(() => alert("Abriendo módulo de Matemáticas..."), 1000);
            }
        }
