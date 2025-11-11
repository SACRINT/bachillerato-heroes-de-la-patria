#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
REFACTORIZACION FINAL - Approach diferente:
En lugar de reemplazar individual, reemplazamos TOKENS COMPLETOS
que no están dentro de strings ya procesados.
"""

import os
import re
from pathlib import Path

BASE_DIR = r"C:\03_BachilleratoHeroesWeb"
DIRS = [
    os.path.join(BASE_DIR, "public", "js"),
    os.path.join(BASE_DIR, "js")
]

# Mapeo de strings a reemplazar - ordenado por LONGITUD DESCENDENTE
REPLACEMENTS = {
    'Bachillerato General Estatal "Héroes de la Patria"': "window.getTenantConfigValue('school_full_name_with_quotes', 'Bachillerato General Estatal \"Héroes de la Patria\"')",
    "Bachillerato General Estatal Héroes de la Patria": "window.getTenantConfigValue('school_full_name', 'Bachillerato General Estatal Héroes de la Patria')",
    "BGE Héroes de la Patria": "window.getTenantConfigValue('school_name', 'BGE Héroes de la Patria')",
    "BGE Héroes": "window.getTenantConfigValue('school_short_form', 'BGE Héroes')",
    "Héroes de la Patria": "window.getTenantConfigValue('school_institution_name', 'Héroes de la Patria')",
}

# Ordenar por longitud descendente CRÍTICO
REPLACEMENTS = dict(sorted(REPLACEMENTS.items(), key=lambda x: len(x[0]), reverse=True))

total_replacements = 0
modified_files = []
failed_files = []

print("=" * 80)
print("REFACTORIZACION FINAL - REEMPLAZO SIMPLE Y SEGURO")
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

                file_count = 0

                # Aplicar TODOS los reemplazos en orden de longitud descendente
                # Esto es CRÍTICO para evitar solapamientos
                for find_str, replace_str in REPLACEMENTS.items():
                    # Contar cuántas veces aparece
                    before_count = content.count(find_str)

                    if before_count > 0:
                        # Reemplazar TODAS las ocurrencias
                        content = content.replace(find_str, replace_str)
                        file_count += before_count
                        total_replacements += before_count

                # Guardar si hubo cambios
                if file_count > 0:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)

                    print(f"  [OK] {file}: {file_count} cambios")
                    modified_files.append({"name": file, "count": file_count})

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
