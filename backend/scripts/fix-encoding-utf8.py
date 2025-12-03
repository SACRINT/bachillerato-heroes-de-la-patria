#!/usr/bin/env python3
import os
import re
from pathlib import Path

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        original = content

        # Fix H?roes patterns
        content = re.sub(r'H[^\w\-éà-ÿ]roes', 'Héroes', content, flags=re.IGNORECASE)

        # Fix Gamificaci?n patterns
        content = re.sub(r'Gamificaci[^\w\-óà-ÿ]n', 'Gamificación', content)
        content = content.replace('Gamificacion', 'Gamificación')
        content = content.replace('Gamification', 'Gamificación')

        # Emojis
        content = content.replace('ðŸ†', '🏆')
        content = content.replace('ðŸ"…', '📅')
        content = content.replace('ðŸ—"ï¸', '🗓️')
        content = content.replace('ðŸŽ¯', '🎯')
        content = content.replace('ðŸŽ‰', '🎉')
        content = content.replace('ðŸ¢', '💰')
        content = content.replace('â˜€ï¸', '☀️')

        # Special chars
        content = content.replace('â€¢', '•')
        content = content.replace('â€œ', '"')
        content = content.replace('â€\x9d', '"')
        content = content.replace('â€™', "'")

        # Bytes patterns
        content = re.sub(r'[Hh][\x80-\xFF]+roes', 'Héroes', content)
        content = re.sub(r'[Gg]amificaci[\x80-\xFF]+n', 'Gamificación', content)

        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        return False

html_dir = Path('C:\\03_BachilleratoHeroesWeb\\public')
fixed = 0
total = 0

for html_file in sorted(html_dir.glob('*.html')):
    total += 1
    if fix_file(html_file):
        print("Fixed: " + html_file.name)
        fixed += 1

print("\nTotal: " + str(fixed) + "/" + str(total) + " archivos arreglados")
