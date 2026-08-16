// ✅ Generar años dinámicamente de 1950 a año actual
                                            (function () {
                                                const selectGeneracion = document.getElementById('generacion');
                                                const currentYear = new Date().getFullYear();
                                                for (let year = currentYear; year >= 1950; year--) {
                                                    const option = document.createElement('option');
                                                    option.value = year;
                                                    option.textContent = year;
                                                    selectGeneracion.appendChild(option);
                                                }
                                            })();
