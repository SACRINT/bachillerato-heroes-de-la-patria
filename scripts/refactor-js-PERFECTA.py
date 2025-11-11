#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
REFACTORIZACION PERFECTA - Solución definitiva
Detecta solapamientos y NO REEMPLAZA strings que son substrings de otros matches
"""

import os
import re
from pathlib import Path

BASE_DIR = r"C:\03_BachilleratoHeroesWeb"
DIRS = [
    os.path.join(BASE_DIR, "public", "js"),
    os.path.join(BASE_DIR, "js")
]

REPLACEMENTS = {
    'Bachillerato General Estatal "Héroes de la Patria"': "window.getTenantConfigValue('school_full_name_with_quotes', 'Bachillerato General Estatal \"Héroes de la Patria\"')",
    "Bachillerato General Estatal Héroes de la Patria": "window.getTenantConfigValue('school_full_name', 'Bachillerato General Estatal Héroes de la Patria')",
    "BGE Héroes de la Patria": "window.getTenantConfigValue('school_name', 'BGE Héroes de la Patria')",
    "BGE Héroes": "window.getTenantConfigValue('school_short_form', 'BGE Héroes')",
    "Héroes de la Patria": "window.getTenantConfigValue('school_institution_name', 'Héroes de la Patria')",
}

# Ordenar por longitud descendente
REPLACEMENTS = dict(sorted(REPLACEMENTS.items(), key=lambda x: len(x[0]), reverse=True))

def has_overlap(match1, match2):
    """
    Detecta si dos matches se solapan
    match1, match2: tuplas (start, end)
    """
    # Si un match está completamente dentro del otro
    if match1[0] <= match2[0] < match1[1] or match1[0] < match2[1] <= match1[1]:
        return True
    if match2[0] <= match1[0] < match2[1] or match2[0] < match1[1] <= match2[1]:
        return True
    return False

def replace_with_no_overlaps(content):
    """
    Encuentra todos los matches, detecta solapamientos,
    y mantiene solo los matches de MAYOR LONGITUD en areas solapadas.
    """

    # Paso 1: Encontrar TODOS los matches
    all_matches = []  # Lista de (start, end, find_str, replace_str)

    for find_str, replace_str in REPLACEMENTS.items():
        for match in re.finditer(re.escape(find_str), content):
            all_matches.append({
                'start': match.start(),
                'end': match.end(),
                'find': find_str,
                'replace': replace_str,
                'length': len(find_str)
            })

    # Paso 2: Detectar y resolver solapamientos
    # Mantener los matches de MAYOR longitud
    filtered_matches = []

    for i, match_i in enumerate(all_matches):
        overlaps_with_longer = False

        for j, match_j in enumerate(all_matches):
            if i != j:
                # ¿Solapan?
                if has_overlap((match_i['start'], match_i['end']),
                               (match_j['start'], match_j['end'])):
                    # Si match_j es más largo, descartar match_i
                    if match_j['length'] > match_i['length']:
                        overlaps_with_longer = True
                        break

        if not overlaps_with_longer:
            filtered_matches.append(match_i)

    # Paso 3: Aplicar reemplazos de atrás hacia adelante
    filtered_matches.sort(key=lambda x: x['start'], reverse=True)

    result_content = content
    replacements_made = 0

    for match in filtered_matches:
        start = match['start']
        end = match['end']
        replace_str = match['replace']
        find_str = match['find']

        # Verificar que el substring aún coincide
        if result_content[start:end] == find_str:
            result_content = result_content[:start] + replace_str + result_content[end:]
            replacements_made += 1

    return result_content, replacements_made

total_replacements = 0
modified_files = []
failed_files = []

print("=" * 80)
print("REFACTORIZACION PERFECTA - SIN SOLAPAMIENTOS")
print("=" * 80)
print()

for dir_path in DIRS:
    if not os.path.exists(dir_path):
        print(f"[SKIP] {dir_path}")
        continue

    print(f"[PROCESANDO] {dir_path}")

    for root, dirs, files in os.walk(dir_path):
        for file in files:
            if not file.endswith(".js"):
                continue

            file_path = os.path.join(root, file)

            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                new_content, file_count = replace_with_no_overlaps(content)

                if file_count > 0:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)

                    print(f"  [OK] {file}: {file_count} cambios")
                    modified_files.append({"name": file, "count": file_count})
                    total_replacements += file_count

            except Exception as e:
                error_msg = str(e)[:60]
                print(f"  [ERROR] {file}: {error_msg}")
                failed_files.append({"name": file, "error": str(e)})

print()
print("=" * 80)
print("RESULTADOS FINALES")
print("=" * 80)
print(f"Archivos modificados: {len(modified_files)}")
print(f"Archivos con error: {len(failed_files)}")
print(f"Total de reemplazos: {total_replacements}")
print()

if modified_files:
    sorted_files = sorted(modified_files, key=lambda x: x['count'], reverse=True)
    print("TOP 15 archivos con más reemplazos:")
    for i, file in enumerate(sorted_files[:15], 1):
        print(f"  {i:2d}. {file['count']:3d} - {file['name']}")

print()
print("=" * 80)
