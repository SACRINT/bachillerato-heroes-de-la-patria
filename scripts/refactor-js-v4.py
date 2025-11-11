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

# Patrones con CONTEXTO para evitar reemplazos dentro de ya-reemplazados
# Usamos lookahead/lookbehind negativo para evitar strings dentro de getTenantConfigValue()

PATTERNS = [
    # Patrón 1: "Bachillerato General Estatal "Héroes de la Patria"" - CON COMILLAS INTERNAS
    # Evitar si ya está dentro de getTenantConfigValue
    {
        "find": 'Bachillerato General Estatal "Héroes de la Patria"',
        "replace": "window.getTenantConfigValue('school_full_name_with_quotes', 'Bachillerato General Estatal \"Héroes de la Patria\"')",
        "avoid_if_inside": "getTenantConfigValue"
    },
    # Patrón 2: Bachillerato General Estatal Héroes de la Patria - SIN COMILLAS INTERNAS
    {
        "find": "Bachillerato General Estatal Héroes de la Patria",
        "replace": "window.getTenantConfigValue('school_full_name', 'Bachillerato General Estatal Héroes de la Patria')",
        "avoid_if_inside": "getTenantConfigValue"
    },
    # Patrón 3: BGE Héroes de la Patria
    {
        "find": "BGE Héroes de la Patria",
        "replace": "window.getTenantConfigValue('school_name', 'BGE Héroes de la Patria')",
        "avoid_if_inside": "getTenantConfigValue"
    },
    # Patrón 4: BGE Héroes
    {
        "find": "BGE Héroes",
        "replace": "window.getTenantConfigValue('school_short_form', 'BGE Héroes')",
        "avoid_if_inside": "getTenantConfigValue"
    },
    # Patrón 5: Héroes de la Patria - ÚLTIMO porque es parte de otros
    {
        "find": "Héroes de la Patria",
        "replace": "window.getTenantConfigValue('school_institution_name', 'Héroes de la Patria')",
        "avoid_if_inside": "getTenantConfigValue"
    }
]

def is_inside_function_call(content, match_start, match_end, function_name="getTenantConfigValue"):
    """
    Verifica si una coincidencia está dentro de una llamada a función específica.
    Si está dentro, retorna True.
    """
    # Buscar hacia atrás la función
    before = content[:match_start]
    after = content[match_end:]

    # Contar paréntesis abiertos en lo que viene antes
    # Si la última ocurrencia de function_name está sin cerrar, estamos dentro
    last_func_index = before.rfind(function_name)
    if last_func_index == -1:
        return False

    # Contar paréntesis entre la función y el match
    between = before[last_func_index:]
    open_parens = between.count('(')
    close_parens = between.count(')')

    # Si hay más abiertos que cerrados, estamos dentro de la función
    return open_parens > close_parens

def replace_with_context_awareness(content, find_str, replace_str, avoid_func="getTenantConfigValue"):
    """
    Realiza reemplazo pero evita reemplazar si el match está dentro de una función específica.
    """
    result = []
    last_end = 0

    # Encontrar todos los matches
    for match in re.finditer(re.escape(find_str), content):
        match_start = match.start()
        match_end = match.end()

        # Verificar si está dentro de función
        if is_inside_function_call(content, match_start, match_end, avoid_func):
            # No reemplazar, mantener como está
            result.append(content[last_end:match_end])
        else:
            # Reemplazar
            result.append(content[last_end:match_start])
            result.append(replace_str)

        last_end = match_end

    # Agregar el resto del contenido
    result.append(content[last_end:])
    return ''.join(result)

total_replacements = 0
modified_files = []
failed_files = []

print("=" * 70)
print("REFACTORIZACION V4 - CONTEXTO INTELIGENTE (ANTISOLAPAMIENTOS)")
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

                # Aplicar patrones en orden decreciente de longitud
                patterns_sorted = sorted(PATTERNS, key=lambda p: len(p["find"]), reverse=True)

                for pattern in patterns_sorted:
                    find_str = pattern["find"]
                    replace_str = pattern["replace"]
                    avoid_func = pattern.get("avoid_if_inside", "getTenantConfigValue")

                    # Contar matches ANTES de reemplazar
                    matches_before = len(list(re.finditer(re.escape(find_str), content)))

                    if matches_before > 0:
                        # Reemplazar con contexto
                        content = replace_with_context_awareness(content, find_str, replace_str, avoid_func)

                        # Contar matches DESPUÉS para ver cuántos se reemplazaron
                        matches_after = len(list(re.finditer(re.escape(find_str), content)))
                        replacements_this_pattern = matches_before - matches_after

                        file_count += replacements_this_pattern
                        total_replacements += replacements_this_pattern

                # Guardar si hubo cambios
                if file_count > 0:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)

                    print(f"  [OK] {file}: {file_count} cambios")
                    modified_files.append({"name": file, "count": file_count})

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

if modified_files:
    sorted_files = sorted(modified_files, key=lambda x: x['count'], reverse=True)
    print("TOP 10 archivos con más reemplazos:")
    for file in sorted_files[:10]:
        print(f"  {file['count']:3d} - {file['name']}")

print("=" * 70)
