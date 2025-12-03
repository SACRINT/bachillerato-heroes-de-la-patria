#!/usr/bin/env python3
"""
Script para corregir caracteres UTF-8 corruptos en TODOS los archivos
(HTML, CSS, JS)
"""

import os
import re
from pathlib import Path

def fix_file(filepath):
    """Arregla un archivo individual"""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        original = content

        # ===== ACENTOS CON CORRUPCIÓN DE TIPO †/¢/? =====
        # El carácter † es U+2020 (DAGGER) que aparece cuando ó está mal decodificado

        # Patrones específicos con †
        content = content.replace('†', 'í')  # í corrupto
        content = content.replace('á', 'á')  # Safe replacement
        content = content.replace('é', 'é')  # Safe replacement
        content = content.replace('ó', 'ó')  # Safe replacement
        content = content.replace('ú', 'ú')  # Safe replacement

        # Palabras comunes corruptas
        content = re.sub(r'H[†¢?]roes', 'Héroes', content)
        content = re.sub(r'Gamificaci[†¢?]n', 'Gamificación', content)
        content = re.sub(r'posici[†¢?]n', 'posición', content)
        content = re.sub(r'D[†¢?]as', 'Días', content)
        content = re.sub(r'Estad[†¢?]sticas', 'Estadísticas', content)
        content = re.sub(r'Acad[†¢?]mico', 'Académico', content)
        content = re.sub(r'Mart[†¢?]nez', 'Martínez', content)
        content = re.sub(r'L[†¢?]pez', 'López', content)
        content = re.sub(r'Garc[†¢?]a', 'García', content)
        content = re.sub(r'Obt[†¢?]n', 'Obtén', content)
        content = re.sub(r'informaci[†¢?]n', 'información', content)
        content = re.sub(r'R[†¢?]pidas', 'Rápidas', content)
        content = re.sub(r'desbloqueado', 'desbloqueados', content)

        # ===== EMOJIS Y CARACTERES ESPECIALES =====
        content = content.replace('ðŸ†', '🏆')
        content = content.replace('ðŸ"…', '📅')
        content = content.replace('ðŸ—"ï¸', '🗓️')
        content = content.replace('ðŸŽ¯', '🎯')
        content = content.replace('ðŸŽ‰', '🎉')
        content = content.replace('ðŸ¢', '💰')
        content = content.replace('â˜€ï¸', '☀️')
        content = content.replace('â€¢', '•')
        content = content.replace('â€œ', '"')
        content = content.replace('â€\x9d', '"')
        content = content.replace('â€™', "'")

        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        return False

# Procesar archivos
root_dir = Path('C:\\03_BachilleratoHeroesWeb\\public')
fixed = 0
total = 0

print("Arreglando encoding en archivos...")

# HTML files
for html_file in sorted(root_dir.glob('*.html')):
    total += 1
    if fix_file(html_file):
        print("Fixed HTML: " + html_file.name)
        fixed += 1

# JS files
js_dir = root_dir / 'js'
for js_file in sorted(js_dir.glob('*.js')):
    total += 1
    if fix_file(js_file):
        print("Fixed JS: " + js_file.name)
        fixed += 1

# CSS files
css_dir = root_dir / 'css'
for css_file in sorted(css_dir.glob('*.css')):
    total += 1
    if fix_file(css_file):
        print("Fixed CSS: " + css_file.name)
        fixed += 1

print("\nTotal: " + str(fixed) + "/" + str(total) + " archivos arreglados")
