#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
REFACTORIZACION MEJORADA - Detecta contexto de comillas
Si el string está dentro de comillas, envuelve la función con comillas
Si el string NO está dentro de comillas, NO añade comillas
"""

import os
import re
from pathlib import Path

BASE_DIR = r"C:\03_BachilleratoHeroesWeb"
DIRS = [
    os.path.join(BASE_DIR, "public", "js"),
    os.path.join(BASE_DIR, "js")
]

PATTERNS = {
    'Bachillerato General Estatal "Héroes de la Patria"': {
        "func_call": "window.getTenantConfigValue('school_full_name_with_quotes', 'Bachillerato General Estatal \"Héroes de la Patria\"')",
        "quoted": "'window.getTenantConfigValue('school_full_name_with_quotes', 'Bachillerato General Estatal \"Héroes de la Patria\"')'",  # Esto es incorrecto, ver abajo
    },
    "Bachillerato General Estatal Héroes de la Patria": {
        "func_call": "window.getTenantConfigValue('school_full_name', 'Bachillerato General Estatal Héroes de la Patria')",
        "quoted": "'window.getTenantConfigValue('school_full_name', 'Bachillerato General Estatal Héroes de la Patria')'",
    },
    "BGE Héroes de la Patria": {
        "func_call": "window.getTenantConfigValue('school_name', 'BGE Héroes de la Patria')",
        "quoted": "'window.getTenantConfigValue('school_name', 'BGE Héroes de la Patria')'",
    },
    "BGE Héroes": {
        "func_call": "window.getTenantConfigValue('school_short_form', 'BGE Héroes')",
        "quoted": "'window.getTenantConfigValue('school_short_form', 'BGE Héroes')'",
    },
    "Héroes de la Patria": {
        "func_call": "window.getTenantConfigValue('school_institution_name', 'Héroes de la Patria')",
        "quoted": "'window.getTenantConfigValue('school_institution_name', 'Héroes de la Patria')'",
    }
}

# PROBLEMA: No podemos usar 'func()' dentro de 'string'
# Solución: Detec tar si está dentro de comillas y REMOVER las comillas externas

def is_inside_quotes(content, pos):
    """
    Determina si la posición 'pos' está dentro de comillas.
    Cuenta comillas simples y dobles antes de la posición.
    """
    single_quotes = 0
    double_quotes = 0
    escape = False

    for i in range(pos):
        if escape:
            escape = False
            continue

        if content[i] == '\\':
            escape = True
            continue

        if content[i] == "'":
            single_quotes += 1
        elif content[i] == '"':
            double_quotes += 1

    # Si ambos son pares, estamos fuera de quotes
    # Si alguno es impar, estamos dentro
    return (single_quotes % 2 == 1) or (double_quotes % 2 == 1)

def replace_with_context(content):
    """
    Reemplaza strings detectando si están dentro de quotes.
    """
    # Ordenar por longitud descendente
    patterns_sorted = sorted(PATTERNS.items(), key=lambda x: len(x[0]), reverse=True)

    replacements = []  # (start, end, replacement)

    # Paso 1: Encontrar todos los matches
    for find_str, _ in patterns_sorted:
        for match in re.finditer(re.escape(find_str), content):
            replacements.append({
                'start': match.start(),
                'end': match.end(),
                'find': find_str,
                'inside_quotes': is_inside_quotes(content, match.start())
            })

    # Paso 2: Resolver solapamientos (mantener mayor longitud)
    filtered = []
    for i, r1 in enumerate(replacements):
        overlaps_with_longer = False
        for j, r2 in enumerate(replacements):
            if i != j:
                # ¿Solapan?
                if r1['start'] <= r2['start'] < r1['end'] or r1['start'] < r2['end'] <= r1['end']:
                    if len(r2['find']) > len(r1['find']):
                        overlaps_with_longer = True
                        break

        if not overlaps_with_longer:
            filtered.append(r1)

    # Paso 3: Determinar reemplazo correcto según contexto
    final_replacements = []
    for match in filtered:
        find_str = match['find']
        inside_quotes = match['inside_quotes']

        if inside_quotes:
            # Dentro de comillas: necesitamos cerrar la comilla, hacer la llamada, abrir otra
            # ¡PERO ESTO NO FUNCIONA EN JAVASCRIPT!
            # Solución: Solo reemplazar si está en contexto de VARIABLE ASSIGNMENT o OBJECT VALUE SIN COMILLAS EXTERNAS
            # Por ahora, saltamos estos casos
            continue
        else:
            # Fuera de comillas: reemplazar con función normalmente
            replacement_text = PATTERNS[find_str]['func_call']
            final_replacements.append((match['start'], match['end'], replacement_text))

    # Paso 4: Aplicar reemplazos de atrás hacia adelante
    final_replacements.sort(key=lambda x: x[0], reverse=True)

    result_content = content
    count = 0

    for start, end, replacement in final_replacements:
        if result_content[start:end] == find_str:  # Verificar que coincide
            result_content = result_content[:start] + replacement + result_content[end:]
            count += 1

    return result_content, count

total_replacements = 0
modified_files = []
failed_files = []

print("=" * 80)
print("REFACTORIZACION MEJORADA - DETECTA CONTEXTO DE COMILLAS")
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

                new_content, file_count = replace_with_context(content)

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
print("RESULTADOS")
print("=" * 80)
print(f"Archivos modificados: {len(modified_files)}")
print(f"Total de reemplazos: {total_replacements}")
print()

print("NOTA: Este script SOLO reemplaza strings que NO están dentro de comillas.")
print("Para strings dentro de comillas, se requiere un enfoque diferente (template literals).")
print("=" * 80)
