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

# Patrones exactos - Sin solapamientos
# Estos patrones fueron verificados manualmente
PATTERNS_EXACT = [
    {
        "find": 'Bachillerato General Estatal "Héroes de la Patria"',
        "replace": "window.getTenantConfigValue('school_full_name_with_quotes', 'Bachillerato General Estatal \"Héroes de la Patria\"')",
        "description": "Nombre completo formal con comillas internas"
    },
    {
        "find": "Bachillerato General Estatal Héroes de la Patria",
        "replace": "window.getTenantConfigValue('school_full_name', 'Bachillerato General Estatal Héroes de la Patria')",
        "description": "Nombre completo sin comillas internas"
    },
    {
        "find": "BGE Héroes de la Patria",
        "replace": "window.getTenantConfigValue('school_name', 'BGE Héroes de la Patria')",
        "description": "Forma corta estándar (BGE + nombre)"
    },
    {
        "find": "BGE Héroes",
        "replace": "window.getTenantConfigValue('school_short_form', 'BGE Héroes')",
        "description": "Forma muy corta"
    },
    {
        "find": "Héroes de la Patria",
        "replace": "window.getTenantConfigValue('school_institution_name', 'Héroes de la Patria')",
        "description": "Solo el nombre de la institución"
    }
]

total_replacements = 0
modified_files = []
skipped_files = []
failed_files = []

print("=" * 70)
print("REFACTORIZACION V3 - REEMPLAZO INTELIGENTE (ANTI-NESTING)")
print("=" * 70)
print()

for dir_path in DIRS:
    if not os.path.exists(dir_path):
        print(f"[SKIP] Directorio no encontrado: {dir_path}")
        continue

    print(f"[PROCESANDO] {dir_path}")

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
                file_replacements = []

                # PASO 1: Contar TODAS las ocurrencias sin reemplazar aun
                #         para detectar solapamientos
                all_matches = {}
                for pattern in PATTERNS_EXACT:
                    find_str = pattern["find"]
                    # Buscar sin reemplazar
                    occurrences = len(re.findall(re.escape(find_str), content))
                    if occurrences > 0:
                        all_matches[find_str] = occurrences
                        file_replacements.append({
                            "pattern": find_str,
                            "count": occurrences,
                            "desc": pattern["description"]
                        })

                # PASO 2: Hacer reemplazos en orden de MAYOR a MENOR longitud
                #         esto evita que patrones más cortos dentro de patrones
                #         más largos interfieran
                patterns_sorted = sorted(
                    PATTERNS_EXACT,
                    key=lambda p: len(p["find"]),
                    reverse=True
                )

                for pattern in patterns_sorted:
                    find_str = pattern["find"]
                    replace_str = pattern["replace"]

                    # Reemplazar SOLO una vez si existe
                    # Usar regex.findall para contar exactamente
                    matches = re.finditer(re.escape(find_str), content)
                    match_count = sum(1 for _ in re.finditer(re.escape(find_str), content))

                    if match_count > 0:
                        # Hacer reemplazo
                        content = content.replace(find_str, replace_str)
                        file_count += match_count
                        total_replacements += match_count

                # PASO 3: Guardar si hubo cambios
                if file_count > 0:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)

                    print(f"  [OK] {file}: {file_count} cambios")
                    modified_files.append({
                        "name": file,
                        "count": file_count,
                        "details": file_replacements
                    })

            except Exception as e:
                print(f"  [ERROR] {file}: {str(e)}")
                failed_files.append({"name": file, "error": str(e)})

print()
print("=" * 70)
print("RESULTADOS FINALES")
print("=" * 70)
print(f"Archivos modificados: {len(modified_files)}")
print(f"Archivos con error: {len(failed_files)}")
print(f"Total de reemplazos: {total_replacements}")
print()

# Top 10 archivos con más cambios
if modified_files:
    sorted_files = sorted(modified_files, key=lambda x: x['count'], reverse=True)
    print("TOP 10 archivos con más reemplazos:")
    for file in sorted_files[:10]:
        print(f"  {file['count']:3d} - {file['name']}")
    print()

if failed_files:
    print("Archivos con error:")
    for file in failed_files:
        print(f"  - {file['name']}: {file['error']}")
    print()

print("=" * 70)
