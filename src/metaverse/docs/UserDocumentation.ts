/**
 * Semana 10: Documentación de Usuario
 * Archivo exportable como HTML o mostrar in-game
 */

export const USER_DOCUMENTATION = {
    title: 'Guía de Usuario - BGE Metaverse',
    version: '1.0.0 Alpha',
    lastUpdated: '2026-01-15',

    sections: [
        {
            id: 'movement',
            title: '🎮 Movimiento',
            content: `
## Controles Básicos

| Tecla | Acción |
|-------|--------|
| W / ↑ | Caminar hacia adelante |
| S / ↓ | Caminar hacia atrás |
| A / ← | Girar/Caminar izquierda |
| D / → | Girar/Caminar derecha |
| Espacio | Saltar |
| Shift | Correr (mantener) |

## Controles Móviles
- **Joystick izquierdo**: Movimiento
- **Botón ⬆️**: Saltar
- **Botón 🏃**: Alternar correr
- **Botón E**: Interactuar
      `
        },
        {
            id: 'interaction',
            title: '🖐️ Interacción',
            content: `
## Cómo Interactuar

1. Acércate a un objeto interactuable (pizarra, puerta, NPC)
2. Cuando aparezca el prompt "Presiona E"
3. Presiona **E** para interactuar

## Tipos de Objetos
- **📚 Pizarras**: Abren lecciones educativas
- **🚪 Puertas**: Se abren/cierran automáticamente
- **💬 NPCs**: Muestran diálogos informativos
- **🪙 Monedas**: Se recolectan automáticamente
- **✨ Teletransportes**: Te llevan a otras zonas
      `
        },
        {
            id: 'chat',
            title: '💬 Chat',
            content: `
## Sistema de Chat

- Presiona **Enter** para abrir el chat
- Escribe tu mensaje y presiona **Enter** para enviar
- Presiona **Escape** para cerrar el chat

## Emojis y Reacciones
- Presiona **Q** para abrir barra de emojis
- Selecciona un emoji para enviarlo flotando sobre tu avatar
      `
        },
        {
            id: 'settings',
            title: '⚙️ Configuración',
            content: `
## Ajustes Gráficos

Accede al menú de configuración con **Escape** > Configuración

### Presets de Calidad:
- **Bajo**: Para equipos antiguos (30 FPS)
- **Medio**: Balance recomendado (45 FPS)
- **Alto**: Calidad visual completa (60 FPS)
- **Ultra**: Máxima calidad (60 FPS, GPU dedicada)

### Photo Mode
- Presiona **P** para activar modo foto
- Ajusta la cámara libremente
- Presiona **P** de nuevo para capturar
      `
        },
        {
            id: 'troubleshooting',
            title: '🔧 Solución de Problemas',
            content: `
## Problemas Comunes

### El juego va lento
1. Baja la calidad gráfica en Configuración
2. Cierra otras pestañas del navegador
3. Actualiza los drivers de tu GPU

### No veo a otros jugadores
1. Verifica tu conexión a internet
2. Revisa que estés en la misma sala
3. Recarga la página (F5)

### El sonido no funciona
1. Haz clic en cualquier parte de la pantalla
2. Revisa el volumen de tu navegador
3. Verifica que los altavoces estén conectados

## Reportar Bugs
Presiona **F8** para abrir el sistema de reportes.
      `
        }
    ]
}

/**
 * Generar HTML de documentación
 */
export function generateDocumentationHTML(): string {
    const { title, version, lastUpdated, sections } = USER_DOCUMENTATION

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background: #0a1525; color: #e0e0e0; }
    h1 { color: #00ddff; border-bottom: 2px solid #00ddff; padding-bottom: 10px; }
    h2 { color: #00aaff; margin-top: 30px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #334455; padding: 12px; text-align: left; }
    th { background: #1a2a40; color: #00ddff; }
    code { background: #1a2a40; padding: 2px 6px; border-radius: 4px; color: #00ff88; }
    .version { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="version">Versión ${version} | Actualizado: ${lastUpdated}</p>
  ${sections.map(s => `<section id="${s.id}"><h2>${s.title}</h2>${markdownToHTML(s.content)}</section>`).join('')}
</body>
</html>
  `
}

function markdownToHTML(md: string): string {
    return md
        .replace(/^## (.+)$/gm, '<h3>$1</h3>')
        .replace(/^### (.+)$/gm, '<h4>$1</h4>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\| (.+) \|/g, (match) => {
            const cells = match.split('|').filter(c => c.trim())
            return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>'
        })
        .replace(/<tr>(.+?)<\/tr>\n<tr>(.+?)<\/tr>/g, '<table><tr>$1</tr><tr>$2</tr></table>')
}

export default USER_DOCUMENTATION
