#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
REFACTORIZACION CORRECTA - Enfoque SIMULTÁNEO
Identifica todos los matches ANTES de hacer reemplazos
Esto evita reemplazos parciales que causan solapamientos
"""

import os
import re
from pathlib import Path

BASE_DIR = r"C:\03_BachilleratoHeroesWeb"
DIRS = [
    os.path.join(BASE_DIR, "public", "js"),
    os.path.join(BASE_DIR, "js")
]

# Mapeo ordenado por longitud descendente
REPLACEMENTS = {
    'Bachillerato General Estatal "Héroes de la Patria"': "window.getTenantConfigValue('school_full_name_with_quotes', 'Bachillerato General Estatal \"Héroes de la Patria\"')",
    "Bachillerato General Estatal Héroes de la Patria": "window.getTenantConfigValue('school_full_name', 'Bachillerato General Estatal Héroes de la Patria')",
    "BGE Héroes de la Patria": "window.getTenantConfigValue('school_name', 'BGE Héroes de la Patria')",
    "BGE Héroes": "window.getTenantConfigValue('school_short_form', 'BGE Héroes')",
    "Héroes de la Patria": "window.getTenantConfigValue('school_institution_name', 'Héroes de la Patria')",
}

REPLACEMENTS = dict(sorted(REPLACEMENTS.items(), key=lambda x: len(x[0]), reverse=True))

def replace_all_patterns(content):
    """
    Reemplaza TODOS los patrones en UNA SOLA PASADA sobre el contenido original.
    Esto evita que reemplazos parciales causen solapamientos.

    Estrategia:
    1. Para cada patrón, encontrar TODOS los matches (con posiciones)
    2. Crear lista de reemplazos a realizar (posición_inicio, posición_fin, nuevo_texto)
    3. Aplicar TODOS los reemplazos de forma ordenada (de atrás hacia adelante)
       para mantener las posiciones válidas
    """

    all_replacements = []  # Lista de (inicio, fin, nuevo_texto, patrón)

    # PASO 1: Encontrar todos los matches
    for find_str, replace_str in REPLACEMENTS.items():
        for match in re.finditer(re.escape(find_str), content):
            all_replacements.append({
                'start': match.start(),
                'end': match.end(),
                'replace': replace_str,
                'find': find_str
            })

    # PASO 2: Ordenar por posición de inicio (descendente)
    # Esto es CRÍTICO: reemplazamos de atrás hacia adelante
    # para mantener las posiciones válidas
    all_replacements.sort(key=lambda x: x['start'], reverse=True)

    # PASO 3: Aplicar reemplazos de atrás hacia adelante
    result_content = content
    replacements_made = 0

    for replacement in all_replacements:
        start = replacement['start']
        end = replacement['end']
        replace_str = replacement['replace']
        find_str = replacement['find']

        # Verificar que el substring en esa posición coincide con el patrón
        # (para evitar reemplazos de matches que ya fueron reemplazados)
        if result_content[start:end] == find_str:
            result_content = result_content[:start] + replace_str + result_content[end:]
            replacements_made += 1

    return result_content, replacements_made

total_replacements = 0
modified_files = []
failed_files = []

print("=" * 80)
print("REFACTORIZACION CORRECTA - SIMULTÁNEA (SIN SOLAPAMIENTOS)")
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

                # Aplicar TODOS los reemplazos simultáneamente
                new_content, file_count = replace_all_patterns(content)

                # Guardar si hubo cambios
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
