#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
from pathlib import Path

# Directorio base
BASE_DIR = r"C:\03_BachilleratoHeroesWeb"
DIRS = [
    os.path.join(BASE_DIR, "public", "js"),
    os.path.join(BASE_DIR, "js")
]

# Patrones de reemplazo ORDENADOS POR LONGITUD DECRECIENTE
# (Los patrones más largos se reemplazan PRIMERO para evitar nesting)
PATTERNS = [
    {
        "find": 'Bachillerato General Estatal "Héroes de la Patria"',
        "replace": "window.getTenantConfigValue('school_full_name_with_quotes', 'Bachillerato General Estatal \"Héroes de la Patria\"')"
    },
    {
        "find": "Bachillerato General Estatal Héroes de la Patria",
        "replace": "window.getTenantConfigValue('school_full_name', 'Bachillerato General Estatal Héroes de la Patria')"
    },
    {
        "find": "BGE Héroes de la Patria",
        "replace": "window.getTenantConfigValue('school_name', 'BGE Héroes de la Patria')"
    },
    {
        "find": "BGE Héroes",
        "replace": "window.getTenantConfigValue('school_short_form', 'BGE Héroes')"
    },
    {
        "find": "Héroes de la Patria",
        "replace": "window.getTenantConfigValue('school_institution_name', 'Héroes de la Patria')"
    }
]

# Ordenar patrones por longitud decreciente (más largo primero)
PATTERNS_SORTED = sorted(PATTERNS, key=lambda p: len(p["find"]), reverse=True)

total_replacements = 0
modified_files = []
failed_files = []

print("=" * 60)
print("REFACTORIZACION V2 - REEMPLAZO ORDENADO (SIN NESTING)")
print("=" * 60)

for dir_path in DIRS:
    if not os.path.exists(dir_path):
        print(f"[SKIP] Directorio no encontrado: {dir_path}")
        continue

    print(f"\n[PROCESANDO] {dir_path}")

    for root, dirs, files in os.walk(dir_path):
        for file in files:
            if not file.endswith(".js"):
                continue

            file_path = os.path.join(root, file)

            try:
                # Leer archivo con codificacion UTF-8
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                original_content = content
                file_count = 0

                # Aplicar cada patron (ya ordenado por longitud)
                for pattern in PATTERNS_SORTED:
                    find_str = pattern["find"]
                    replace_str = pattern["replace"]

                    # Contar ocurrencias ANTES de reemplazar
                    occurrences = len(re.findall(re.escape(find_str), content))

                    if occurrences > 0:
                        # Reemplazar
                        content = content.replace(find_str, replace_str)
                        file_count += occurrences
                        total_replacements += occurrences

                # Guardar si hubo cambios
                if file_count > 0:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)

                    print(f"  [OK] {file}: {file_count} cambios")
                    modified_files.append({"name": file, "count": file_count})

            except Exception as e:
                print(f"  [ERROR] {file}: {str(e)}")
                failed_files.append({"name": file, "error": str(e)})

print("\n" + "=" * 60)
print("RESULTADOS FINALES")
print("=" * 60)
print(f"Archivos modificados: {len(modified_files)}")
print(f"Archivos con error: {len(failed_files)}")
print(f"Total de reemplazos: {total_replacements}")

if modified_files:
    print("\nDetalle de cambios:")
    for file in modified_files[:20]:  # Mostrar primeros 20
        print(f"  - {file['name']}: {file['count']} cambios")
    if len(modified_files) > 20:
        print(f"  ... y {len(modified_files) - 20} archivos mas")

if failed_files:
    print("\nArchivos con error:")
    for file in failed_files:
        print(f"  - {file['name']}: {file['error']}")

print("=" * 60)
