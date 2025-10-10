# 🎨 Mockups Visuales - Panel de Gestión de Egresados

## 📐 DISEÑO VISUAL DEL PANEL

Este documento describe visualmente cómo se verá el panel de egresados en el dashboard administrativo.

---

## 1️⃣ TARJETAS DE ESTADÍSTICAS (Dashboard Cards)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🎓 Gestión de Egresados                                                    │
│  Administración completa de egresados, historias de éxito y estadísticas    │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│  🎓              │  📅              │  ⭐              │  🕒              │
│  Total Egresados │  Generación 2024 │  Historias       │  Últimos 30 días │
│                  │                  │  Publicables     │                  │
│  250             │  55 egresados    │  75              │  12              │
│                  │  Generación      │  30% del total   │  Registros nuevos│
│                  │  reciente        │                  │                  │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘
   [Azul púrpura]     [Verde-rosa]       [Azul claro]       [Amarillo-rosa]
```

**Características:**
- Degradado de colores vibrantes
- Iconos de Font Awesome grandes
- Números destacados en grande
- Efecto hover: elevación con sombra
- Animación de entrada escalonada

---

## 2️⃣ PANEL DE FILTROS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔍 Filtros de Búsqueda                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┬───────────┬───────────┬──────────┬──────────────┐ │
│  │ 🔍 Buscar por       │ Generación│ Estatus   │ Ciudad   │  Acciones    │ │
│  │ nombre o email...   │ [2024 ▼]  │ [Todos ▼] │[Todas ▼] │              │ │
│  └─────────────────────┴───────────┴───────────┴──────────┴──────────────┘ │
│                                                    [× Limpiar]              │
│                                                    [🔄 Refrescar]           │
│                                                    [📊 Excel]               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Características:**
- Input de búsqueda con ícono
- Dropdowns para filtros categóricos
- Botones de acción con iconos
- Búsqueda en tiempo real (debounced)
- Filtros combinables

---

## 3️⃣ TABLA DE EGRESADOS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📋 Lista de Egresados                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ID | Nombre             | Email          | Gen  | Ciudad      | Ocupación  │
│────┼────────────────────┼────────────────┼──────┼─────────────┼────────────│
│ 1  │ Juan Pérez García⭐│ juan@email.com │ 2020 │ Guadalajara │ Developer  │
│ 2  │ María López S.     │ maria@mail.com │ 2021 │ Zapopan     │ Ingeniera  │
│ 3  │ Carlos Ruiz M.     │ carlos@gm..com │ 2022 │ Tlaquepaque │ Diseñador  │
│                                                                             │
│ Universidad         | Estatus            | Registro   | Acciones           │
│────────────────────┼────────────────────┼────────────┼────────────────────│
│ UdeG               │ [Estudiante 🔵]    │ 15/01/2025 │ [👁️] [✏️] [🗑️]    │
│ ITESO              │ [Profesionista 🟢] │ 20/02/2024 │ [👁️] [✏️] [🗑️]    │
│ TEC                │ [Posgrado 🟣]      │ 10/03/2023 │ [👁️] [✏️] [🗑️]    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Mostrando 1 - 20 de 250 egresados         [◀◀] [◀] [1] [2] [3] [▶] [▶▶]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Características:**
- Tabla alternada con hover effects
- Badges de colores para estatus
- Icono de estrella ⭐ para historias publicables
- Botones de acción con iconos (Ver | Editar | Eliminar)
- Paginación completa con navegación
- Ordenamiento por columnas (clic en encabezado)
- Responsive: scroll horizontal en tablet/móvil

---

## 4️⃣ MODAL DE DETALLES

```
┌─────────────────────────────────────────────────────────────────────┐
│  🎓 Detalles del Egresado                                      [×]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  INFORMACIÓN PERSONAL                                               │
│  ┌──────────────────────┬──────────────────────┐                   │
│  │ Nombre Completo      │ Email                │                   │
│  │ Juan Pérez García    │ juan.perez@email.com │                   │
│  ├──────────────────────┼──────────────────────┤                   │
│  │ Teléfono             │ Generación           │                   │
│  │ 3312345678           │ [2020]               │                   │
│  └──────────────────────┴──────────────────────┘                   │
│                                                                     │
│  📍 UBICACIÓN                                                       │
│  ┌──────────────────────┬──────────────────────┐                   │
│  │ Ciudad               │ Estado               │                   │
│  │ Guadalajara          │ Jalisco              │                   │
│  └──────────────────────┴──────────────────────┘                   │
│                                                                     │
│  🎓 INFORMACIÓN ACADÉMICA                                           │
│  ┌────────────────────────────────────────────┐                    │
│  │ Universidad                                │                    │
│  │ Universidad de Guadalajara                 │                    │
│  ├──────────────────────┬──────────────────────┤                   │
│  │ Carrera              │ Estatus Académico    │                   │
│  │ Ing. en Sistemas     │ [Estudiante 🔵]      │                   │
│  └──────────────────────┴──────────────────────┘                   │
│                                                                     │
│  💼 INFORMACIÓN LABORAL                                             │
│  ┌──────────────────────┬──────────────────────┐                   │
│  │ Ocupación            │ Empresa              │                   │
│  │ Desarrollador Junior │ Tech Company SA      │                   │
│  └──────────────────────┴──────────────────────┘                   │
│                                                                     │
│  ⭐ HISTORIA DE ÉXITO                                               │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ "Mi experiencia en el BGE Héroes de la Patria fue         │    │
│  │  fundamental para mi desarrollo profesional. Los valores   │    │
│  │  que me inculcaron me han ayudado a destacar en mi carrera"│    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ℹ️ INFORMACIÓN ADICIONAL                                           │
│  ┌───────────────┬──────────────────┬─────────────────┐            │
│  │ Fecha Registro│ Hist. Publicable │ Email Verificado│            │
│  │ 15/01/25 10:30│ [Sí ✓]          │ [Sí ✓]         │            │
│  └───────────────┴──────────────────┴─────────────────┘            │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                    [✏️ Editar]  [Cerrar]            │
└─────────────────────────────────────────────────────────────────────┘
```

**Características:**
- Modal grande y bien estructurado
- Secciones claramente delimitadas con iconos
- Historia de éxito destacada en card
- Badges para estados verificables
- Botón directo de edición

---

## 5️⃣ MODAL DE EDICIÓN

```
┌─────────────────────────────────────────────────────────────────────┐
│  ✏️ Editar Egresado                                            [×]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────┬──────────────────────┐                   │
│  │ Nombre Completo *    │ Email *              │                   │
│  │ [Juan Pérez García]  │ [juan@email.com]     │                   │
│  └──────────────────────┴──────────────────────┘                   │
│                                                                     │
│  ┌──────────────────────┬──────────────────────┐                   │
│  │ Teléfono             │ Generación *         │                   │
│  │ [3312345678]         │ [2020]               │                   │
│  └──────────────────────┴──────────────────────┘                   │
│                                                                     │
│  ┌──────────────────────┬──────────────────────┐                   │
│  │ Ciudad               │ Estado               │                   │
│  │ [Guadalajara]        │ [Jalisco]            │                   │
│  └──────────────────────┴──────────────────────┘                   │
│                                                                     │
│  ┌────────────────────────────────────────────┐                    │
│  │ Universidad                                │                    │
│  │ [Universidad de Guadalajara]               │                    │
│  └────────────────────────────────────────────┘                    │
│                                                                     │
│  ┌──────────────────────┬──────────────────────┐                   │
│  │ Carrera              │ Estatus Académico    │                   │
│  │ [Ing. en Sistemas]   │ [Estudiante ▼]       │                   │
│  └──────────────────────┴──────────────────────┘                   │
│                                                                     │
│  ┌──────────────────────┬──────────────────────┐                   │
│  │ Ocupación Actual     │ Empresa              │                   │
│  │ [Desarrollador Jr]   │ [Tech Company SA]    │                   │
│  └──────────────────────┴──────────────────────┘                   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Historia de Éxito                                          │    │
│  │ [Mi experiencia en el BGE...]                              │    │
│  │                                                            │    │
│  │                                                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ☑️ Autorizar publicación de historia de éxito                      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                    [Cancelar]  [💾 Guardar Cambios] │
└─────────────────────────────────────────────────────────────────────┘
```

**Características:**
- Formulario pre-llenado con datos actuales
- Validación en tiempo real
- Campos obligatorios marcados con *
- Checkbox para autorización de publicación
- Diseño coherente con modal de detalles

---

## 6️⃣ GRÁFICAS Y VISUALIZACIONES

### Gráfica de Barras: Egresados por Generación

```
┌─────────────────────────────────────────────────────────────────────┐
│  📊 Egresados por Generación                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  60│                                                                │
│    │                                        ▓▓▓                     │
│  50│                    ▓▓▓     ▓▓▓        ▓▓▓     ▓▓▓             │
│    │        ▓▓▓        ▓▓▓     ▓▓▓        ▓▓▓     ▓▓▓             │
│  40│        ▓▓▓        ▓▓▓     ▓▓▓        ▓▓▓     ▓▓▓             │
│    │        ▓▓▓        ▓▓▓     ▓▓▓        ▓▓▓     ▓▓▓             │
│  30│        ▓▓▓        ▓▓▓     ▓▓▓        ▓▓▓     ▓▓▓             │
│    │        ▓▓▓        ▓▓▓     ▓▓▓        ▓▓▓     ▓▓▓             │
│  20│        ▓▓▓        ▓▓▓     ▓▓▓        ▓▓▓     ▓▓▓             │
│    │        ▓▓▓        ▓▓▓     ▓▓▓        ▓▓▓     ▓▓▓             │
│  10│        ▓▓▓        ▓▓▓     ▓▓▓        ▓▓▓     ▓▓▓             │
│    │        ▓▓▓        ▓▓▓     ▓▓▓        ▓▓▓     ▓▓▓             │
│   0└────────────────────────────────────────────────────────────── │
│          2020      2021      2022      2023      2024             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Gráfica de Pie: Distribución por Estatus

```
┌─────────────────────────────────────────────────────────────────────┐
│  🥧 Distribución por Estatus Académico                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    ████████                                         │
│               ████          ████                                    │
│            ███                  ███                                 │
│          ██                        ██                               │
│         █    Estudiante 48%         █                               │
│        █                             █                              │
│       █                               █                             │
│       █          Profesionista         █                            │
│       █             32%                █                            │
│        █                             █                              │
│         █          Posgrado         █                               │
│          ██          12%          ██                                │
│            ███                  ███                                 │
│               ████    Otro   ████                                   │
│                    ████ 8% ████                                     │
│                                                                     │
│  ▪️ Estudiante universitario  ▪️ Profesionista                       │
│  ▪️ Estudiante de posgrado    ▪️ Otro                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Gráfica de Timeline: Registros por Mes

```
┌─────────────────────────────────────────────────────────────────────┐
│  📈 Registros por Mes (Últimos 12 meses)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  15│                                           ●                    │
│    │                                         ╱                      │
│    │                           ●           ╱                        │
│  10│                         ╱   ╲       ╱                          │
│    │             ●         ╱       ●   ╱                            │
│    │           ╱   ╲     ╱           ●                              │
│   5│         ╱       ● ╱                                            │
│    │       ╱           ●                                            │
│    │     ●                                                          │
│   0└────────────────────────────────────────────────────────────── │
│     Nov Dic Ene Feb Mar Abr May Jun Jul Ago Sep Oct               │
│     2024                                         2025              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Características de Gráficas:**
- Chart.js responsive
- Colores coherentes con el diseño
- Tooltips interactivos al hover
- Leyendas claras
- Animación al cargar

---

## 7️⃣ VISTA MÓVIL (< 768px)

### Cards Colapsables en Móvil

```
┌─────────────────────────────────┐
│  🎓 Juan Pérez García     [⭐]  │
├─────────────────────────────────┤
│  Email:  juan@email.com         │
│  Gen:    2020                   │
│  Ciudad: Guadalajara            │
│  Univ:   UdeG                   │
│  Status: [Estudiante 🔵]        │
│                                 │
│  [👁️ Ver] [✏️ Editar] [🗑️ Borrar]│
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  🎓 María López S.              │
├─────────────────────────────────┤
│  Email:  maria@mail.com         │
│  Gen:    2021                   │
│  Ciudad: Zapopan                │
│  Univ:   ITESO                  │
│  Status: [Profesionista 🟢]     │
│                                 │
│  [👁️ Ver] [✏️ Editar] [🗑️ Borrar]│
└─────────────────────────────────┘
```

**Características Móviles:**
- Estadísticas apiladas verticalmente
- Filtros en columna única
- Tabla → Cards en vista móvil
- Botones de acción de ancho completo
- Gráficas responsive y táctiles
- Navegación optimizada para pulgar

---

## 8️⃣ NOTIFICACIONES TOAST

```
                    ┌─────────────────────────────────┐
                    │ ✅ Egresado actualizado         │
                    │    exitosamente                 │
                    │                            [×]  │
                    └─────────────────────────────────┘

                    ┌─────────────────────────────────┐
                    │ ⚠️ Por favor completa           │
                    │    los campos obligatorios      │
                    │                            [×]  │
                    └─────────────────────────────────┘

                    ┌─────────────────────────────────┐
                    │ ❌ Error al eliminar egresado   │
                    │                            [×]  │
                    └─────────────────────────────────┘
```

**Características:**
- Aparecen en esquina inferior derecha
- Auto-desaparecen después de 5 segundos
- Colores según tipo (éxito, advertencia, error)
- Icono representativo
- Cerrable manualmente
- No bloquean interacción

---

## 9️⃣ ESTADO DE CARGA (Loading)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                          ⏳                                          │
│                        ◌ ◌ ◌                                        │
│                                                                     │
│              Cargando datos de egresados...                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Características:**
- Spinner animado de Bootstrap
- Mensaje contextual
- Semi-transparente sobre el contenido
- Previene interacción durante carga

---

## 🔟 ESTADO VACÍO (Sin Datos)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                          📭                                          │
│                                                                     │
│                 No se encontraron egresados                         │
│                                                                     │
│            Intenta ajustar los filtros de búsqueda                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Características:**
- Icono representativo grande
- Mensaje claro y amigable
- Sugerencia de acción
- No intimidante

---

## 🎨 PALETA DE COLORES

```
PRIMARY (Azul Oscuro):   #2c3e50  ████████
SUCCESS (Verde):         #27ae60  ████████
INFO (Azul):             #3498db  ████████
WARNING (Naranja):       #f39c12  ████████
DANGER (Rojo):           #e74c3c  ████████
LIGHT (Gris Claro):      #ecf0f1  ████████
DARK (Azul Oscuro):      #34495e  ████████

GRADIENTES:
Primary:  #667eea → #764ba2  ████████████████
Success:  #f093fb → #f5576c  ████████████████
Info:     #4facfe → #00f2fe  ████████████████
Warning:  #fa709a → #fee140  ████████████████
```

---

## 📏 ESPACIADO Y TIPOGRAFÍA

```
TAMAÑOS DE TEXTO:
- Títulos H2:         2rem (32px) - Bold
- Títulos H5:         1.25rem (20px) - Bold
- Texto normal:       1rem (16px) - Regular
- Texto pequeño:      0.875rem (14px) - Regular
- Labels:             0.75rem (12px) - Bold, Uppercase

ESPACIADO:
- Margen entre secciones:   40px
- Padding en cards:         20px
- Gap en grids:             15px
- Margen en botones:        8px
```

---

## ✨ ANIMACIONES Y TRANSICIONES

```javascript
// Tarjetas de estadísticas
fadeIn 0.5s ease forwards

// Hover en cards
transform: translateY(-5px)
box-shadow: 0 8px 15px rgba(0,0,0,0.2)
transition: all 0.3s ease

// Filas de tabla
hover {
    background-color: rgba(52, 152, 219, 0.05);
    transform: scale(1.01);
}

// Botones
hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}
```

---

## 📱 BREAKPOINTS RESPONSIVE

```
Desktop (> 1200px):   Tabla completa, 4 cards de stats por fila
Laptop (992-1199px):  Tabla completa, 4 cards de stats por fila
Tablet (768-991px):   Tabla con scroll, 2 cards de stats por fila
Mobile (< 768px):     Cards en lugar de tabla, 1 card de stats por fila
```

---

## ♿ CARACTERÍSTICAS DE ACCESIBILIDAD

```
✅ Navegación por teclado (Tab, Enter, Escape)
✅ ARIA labels en todos los elementos interactivos
✅ Contraste de colores WCAG AA
✅ Focus visible personalizado
✅ Soporte para lectores de pantalla
✅ Reducción de movimiento (prefers-reduced-motion)
✅ Modo de alto contraste
✅ Tamaño de texto escalable
```

---

## 🖨️ VISTA DE IMPRESIÓN

```
┌─────────────────────────────────────────────────────────────────────┐
│  REPORTE DE EGRESADOS - BGE HÉROES DE LA PATRIA                     │
│  Fecha: 03/10/2025                                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ESTADÍSTICAS GENERALES                                             │
│  - Total de Egresados: 250                                          │
│  - Generación más reciente: 2024 (55 egresados)                     │
│  - Historias publicables: 75 (30%)                                  │
│                                                                     │
│  LISTA DE EGRESADOS                                                 │
│                                                                     │
│  [Tabla simplificada sin botones de acción]                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

Este documento proporciona una referencia visual completa del diseño y comportamiento del panel de gestión de egresados. Todos los elementos están implementados en el código entregado.

**Versión:** 1.0.0
**Fecha:** 2025-10-03
**Diseñador:** Claude Code (Principal Frontend Engineer)
