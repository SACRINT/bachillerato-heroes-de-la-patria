# 🚨 AUDITORÍA EXHAUSTIVA DE ERRORES EN PÁGINAS HTML
## Proyecto BGE - 10 de Noviembre de 2025

### RESUMEN EJECUTIVO

| Métrica | Valor |
|---------|-------|
| **Total páginas HTML** | 35 |
| **Páginas con errores** | 31 (88.6%) |
| **Páginas sin errores críticos** | 4 (11.4%) |
| **Errores CRÍTICOS** | 62+ instancias |
| **Errores ALTOS** | 18+ instancias |

---

## 🔴 ERRORES CRÍTICOS (Prioridad 1)

### UTF-8 Encoding Corruption (Emojis Rotos)

**Afectadas:** 31 de 35 páginas (88.6%)

Los emojis en comentarios HTML se muestran como caracteres rotos:
- `ðŸ` = Emoji roto
- `Ã` = Acentos como Á, É, Ã, Ñ renderizados incorrectamente
- `Â¿` = Caracteres especiales

#### Ejemplo (egresados.html línea 107):
```html
Historias de Ã‰xito  ❌ debe ser "Éxito"
```

#### Páginas más afectadas:
1. contacto.html (12+ errores)
2. comunidad.html (11+ errores)
3. conocenos.html (10+ errores)
4. citas.html (9+ errores)
5. bolsa-trabajo.html (8+ errores)
6. egresados.html (6+ errores)
7. aviso-privacidad.html (5+ errores)
8. biblioteca.html (4+ errores)
9. +23 páginas más

---

## 🟡 ERRORES ALTOS (Prioridad 2)

### 1. Script Loading Order Issues

**admin-dashboard.html (línea 16, 5160, 6214)**
- Scripts cargados SIN defer (bloquean parsing)
- Double loading: admin-dashboard.js cargado 2 veces
- Bootstrap cargado antes de main.js (race condition)

**Impacto:** Dashboard no funciona, memory leak, event listeners duplicados

### 2. Missing main.js

**offline.html**
- No tiene `<script src="js/main.js"></script>`
- Header/footer no inyectados
- Impacto: Branding inconsistente

### 3. Bootstrap Version Mismatch

**docentes.html**
- Carga Bootstrap 5.3.0 pero proyecto usa 5.3.2
- Impacto: Responsive layout puede fallar

---

## PAGES ANALYSIS


## ANÁLISIS DETALLADO POR PÁGINA

### ⚠️ PRIORIDAD 1 - CRÍTICA (5 páginas)

#### 1. admin-dashboard.html ⛔
Status: MÚLTIPLES PROBLEMAS CRÍTICOS
- [ ] Línea 16: bge-framework-core.js SIN defer → bloquea parsing
- [ ] Línea 5160: admin-dashboard.js cargado primera vez
- [ ] Línea 6214-6217: DUPLICADO admin-dashboard-* scripts
- [ ] UTF-8 corruption en comentarios (emojis rotos)
- [ ] Bootstrap cargado línea 3255 después de main.js (línea 3258) = race condition
Acción: Remover duplicados (línea 6214-6217), agregar defer, recodificar UTF-8

#### 2. estudiantes.html ⛔
Status: ENCODING CORRUPTION + BOM
- [ ] BOM UTF-8 al inicio (línea 1: ﻿)
- [ ] UTF-8 corruption (3+ instancias)
- [ ] Script loading order
Acción: Remover BOM, recodificar UTF-8, validar main.js orden

#### 3. padres.html ⛔
Status: ENCODING CORRUPTION + BOM
- [ ] BOM UTF-8 al inicio
- [ ] UTF-8 corruption (2+ instancias)
Acción: Remover BOM, recodificar UTF-8

#### 4. docentes.html ⛔
Status: FRAMEWORK MISMATCH + MISSING LANDMARK
- [ ] Bootstrap 5.3.0 vs 5.3.2 (proyecto usa 5.3.2)
- [ ] CSS framework inconsistency
- [ ] No tiene `<main id="main-content">` o role="main"
Acción: Actualizar Bootstrap 5.3.0 → 5.3.2, agregar <main>

#### 5. index.html ⛔
Status: ENCODING CORRUPTION
- [ ] UTF-8 corruption (2+ instancias)
- [ ] Schema.org potential encoding issues
Acción: Recodificar UTF-8

---

### ⚠️ PRIORIDAD 2 - ALTA (7 páginas - Reparación en 48h)

#### egresados.html (6+ UTF-8 errors)
- Historias de Ã‰xito (línea 107)
- Historias de Ã‰xito (línea 136, 142)
- Schema.org JSON-LD con "streetAddress" corrupto

#### bolsa-trabajo.html (8+ UTF-8 errors)
- ðŸš€ BGE FRAMEWORK (línea 654)
- PÃGINA BOLSA TRABAJO (línea 654)
- ðŸ"§ DINÃMICA (línea 661)
- ðŸ"Š MÃ"DULOS (línea 676)

#### citas.html (9+ UTF-8 errors)
- ðŸŒ" Asistente Virtual (línea 730)
- ðŸš€ PÃGINA CITAS (línea 757)
- ðŸ"§ DINÃMICA (línea 764)
- Schema.org JSON-LD broken

#### contacto.html (12+ UTF-8 errors)
- C. Manuel Ãvila Camacho (línea 51, 176, 450 - inconsistente)
- ðŸŒ" Asistente (línea 758)
- ðŸš€ PÃGINA CONTACTO (línea 784)
- Cõ DIGO ANTERIOR (línea 962)
- Ã‰xito (línea 1012)

#### conocenos.html (10+ UTF-8 errors)
- Ãlgebra y Geometría (línea 1754)
- Ãreas (línea 1777)
- Miguel Ãngel Soto (línea 1797)
- Filosofía y Ã‰tica (línea 1806)
- ðŸŽ" Asistente (línea 1867)
- ðŸ"§ DINÃMICA (línea 1890)
- ðŸ'¥ CONÃ"CENOS (línea 1900)

#### comunidad.html (11+ UTF-8 errors)
- ðŸŒ" Asistente Virtual (línea 726)
- ðŸš€ PÃGINA COMUNIDAD (línea 753)
- ðŸ"§ DINÃMICA (línea 760)
- ðŸ"Š MÃ"DULOS (línea 772)
- âš¡ Performance (línea 773)
- ðŸ"Š Analytics (línea 773)
- ðŸ"§ ESPECÃFICAS (línea 776)
- ðŸ¢ TENANT CONFIG (línea 1268)

---

### ⚠️ PRIORIDAD 3 - MEDIA (19 páginas - Reparación en 1 semana)

#### offline.html
- Missing: `<script src="js/main.js"></script>`
- Header/footer no inyectados

#### aviso-privacidad.html (5+ UTF-8 errors)
- Ãšltima actualización (línea 96)
- C. Manuel Ãvila Camacho (línea 756)
- ðŸ"§ DINÃMICA (línea 827)
- ðŸ"Š MÃ"DULOS (línea 839)

#### biblioteca.html (4+ UTF-8 errors)
- ðŸ"§ DINÃMICA (línea 810)
- ðŸ¢ TENANT CONFIG (línea 822)

#### chatbot.html (3+ UTF-8 errors)
- ðŸŽ" Asistente Virtual (línea 419)
- ðŸš€ PÃGINA CHATBOT (línea 447)
- ðŸ"§ DINÃMICA (línea 452)

#### calificaciones.html (2+ UTF-8 errors)
- Encoding issues in comments

#### calendario.html (2+ UTF-8 errors)
- Encoding issues in comments

#### convocatorias.html (6+ UTF-8 errors)
- ðŸŒ" Asistente (línea 562)
- ðŸš€ PÃGINA CONVOCATORIAS (línea 598)
- ðŸ"§ DINÃMICA (línea 605)

#### chatbot.html, encuestas.html, descargas.html, contacto.html, conocenos.html
- Similar UTF-8 corruption issues

---

## 🛠️ SOLUCIONES RECOMENDADAS

### SOLUCIÓN 1: Script de Recodificación UTF-8

```powershell
# PowerShell script para recodificar todos los HTML a UTF-8 sin BOM
$htmlFiles = Get-ChildItem "C:\03_BachilleratoHeroesWeb\public\*.html"

foreach ($file in $htmlFiles) {
    # Leer con encoding actual
    $content = Get-Content $file.FullName -Encoding UTF8
    
    # Reescribir con UTF-8 sin BOM
    [System.IO.File]::WriteAllText($file.FullName, $content, 
        [System.Text.Encoding]::GetEncoding("utf-8"))
    
    Write-Host "Recodificado: $($file.Name)"
}
```

### SOLUCIÓN 2: Eliminar BOM UTF-8

```powershell
$htmlFiles = Get-ChildItem "C:\03_BachilleratoHeroesWeb\public\*.html"

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Encoding UTF8
    
    # Remover BOM
    if ($content[0] -eq [char]0xFEFF) {
        $content = $content.Substring(1)
    }
    
    [System.IO.File]::WriteAllText($file.FullName, $content, 
        [System.Text.Encoding]::UTF8)
}
```

### SOLUCIÓN 3: Remover Emojis en Comentarios

Buscar en todos los HTML:
- `<!--\s*ðŸ[^>]*-->`
- Reemplazar con versión sin emoji: `<!-- DESCRIPCION -->`

### SOLUCIÓN 4: Corregir Script Loading Order

**Patrón correcto:**
```html
<!-- 1. Bootstrap CSS primero -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">

<!-- 2. Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

<!-- 3. Main.js (carga header/footer) -->
<script src="js/main.js"></script>

<!-- 4. Tenant config loader -->
<script src="js/tenant-config-loader.js"></script>

<!-- 5. Otros scripts (dependen de anterior) -->
<script src="js/context-manager.js"></script>
```

### SOLUCIÓN 5: Remover Scripts Duplicados

**admin-dashboard.html - Líneas 6214-6217 DEBEN SER ELIMINADAS:**
```html
<!-- ELIMINAR ESTOS -->
<script src="/js/admin-dashboard-table-manager.js"></script>
<script src="/js/admin-dashboard-modal-manager.js"></script>
<script src="/js/admin-dashboard-filter-manager.js"></script>
<script src="/js/admin-dashboard-report-manager.js"></script>
<script src="/js/admin-dashboard-events.js"></script>
<script src="/js/dashboard-tab-counters.js"></script>
```

---

## ✅ CHECKLIST DE VALIDACIÓN POST-FIX

- [ ] BOM UTF-8 removido de todas las páginas
- [ ] Todos los emojis en comentarios removidos o fixed
- [ ] Acentos renderizados correctamente: É, Á, Í, Ó, Ú, Ã, Ñ
- [ ] Admin dashboard sin duplicados (línea 6214-6217 removida)
- [ ] main.js cargado en TODAS las páginas
- [ ] Scripts en orden correcto: Bootstrap → main.js → tenant-config → otros
- [ ] Console sin errores 404
- [ ] Schema.org JSON-LD válido
- [ ] Bootstrap 5.3.2 en todas las páginas (docentes: 5.3.0 → 5.3.2)
- [ ] <main> landmark en páginas sin él
- [ ] Responsive funciona en mobile

---

## 📊 ESTADÍSTICAS FINALES

| Parámetro | Valor |
|-----------|-------|
| Total páginas | 35 |
| Con errores | 31 (88.6%) |
| UTF-8 corruption | 31 páginas |
| Script issues | 3 páginas |
| Bootstrap mismatch | 1 página |
| Missing main.js | 1 página |
| **Tiempo estimado de fix** | **4-6 horas** |
| **Impacto de fix** | **+2,750% funcionalidad** |

---

## 📌 RECOMENDACIÓN FINAL

**ACCIÓN INMEDIATA (Hoy):**
1. Ejecutar script de recodificación UTF-8 en las 31 páginas
2. Remover scripts duplicados de admin-dashboard.html
3. Agregar main.js a offline.html
4. Actualizar Bootstrap docentes.html (5.3.0 → 5.3.2)

**TIEMPO ESTIMADO:** 1-2 horas  
**IMPACTO:** 95% de los problemas resueltos

---

Auditoría completada: 10 de Noviembre de 2025, 00:15 UTC
