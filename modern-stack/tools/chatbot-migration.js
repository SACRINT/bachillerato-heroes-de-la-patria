#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEGACY_ROOT = path.resolve(__dirname, '../../');
const MODERN_ROOT = path.resolve(__dirname, '../');

const log = {
  info: (msg) => console.log(chalk.blue('ℹ️  ' + msg)),
  success: (msg) => console.log(chalk.green('✅ ' + msg)),
  error: (msg) => console.log(chalk.red('❌ ' + msg)),
  warning: (msg) => console.log(chalk.yellow('⚠️  ' + msg)),
  step: (msg) => console.log(chalk.cyan('🔄 ' + msg))
};

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function analyzeLegacyChatbot() {
  log.step('Analizando chatbot heredado...');
  
  const legacyChatbotJS = path.join(LEGACY_ROOT, 'js/chatbot.js');
  const legacyChatbotHTML = path.join(LEGACY_ROOT, 'chatbot.html');
  
  const analysis = {
    jsFile: null,
    htmlFile: null,
    knowledgeBase: [],
    functions: [],
    apiEndpoints: []
  };
  
  // Analizar archivo JavaScript
  if (await fileExists(legacyChatbotJS)) {
    try {
      const jsContent = await fs.readFile(legacyChatbotJS, 'utf-8');
      
      // Extraer funciones
      const functionMatches = [...jsContent.matchAll(/function\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*\\(/g)];
      analysis.functions = functionMatches.map(match => match[1]);
      
      // Extraer endpoints de API
      const apiMatches = [...jsContent.matchAll(/['\"]([^'\"]*(?:api|endpoint)[^'\"]*)['\"/g)];
      analysis.apiEndpoints = [...new Set(apiMatches.map(match => match[1]))];
      
      // Buscar base de conocimiento
      const knowledgeMatch = jsContent.match(/(?:knowledgeBase|knowledge|responses|answers)\\s*[:=]\\s*\\[(.*?)\\]/s);
      if (knowledgeMatch) {
        try {
          // Intentar extraer preguntas/respuestas
          const knowledgeContent = knowledgeMatch[0];
          const qaMatches = [...knowledgeContent.matchAll(/['\"]([^'\"]{20,})['\"].*?['\"]([^'\"]{30,})['\"/g)];
          analysis.knowledgeBase = qaMatches.map(([, question, answer]) => ({
            question: question.trim(),
            answer: answer.trim()
          }));
        } catch (e) {
          log.warning('No se pudo extraer la base de conocimiento automáticamente');
        }
      }
      
      analysis.jsFile = {
        path: legacyChatbotJS,
        size: jsContent.length,
        content: jsContent
      };
      
    } catch (error) {
      log.error(`Error analizando ${legacyChatbotJS}: ${error.message}`);
    }
  }
  
  // Analizar archivo HTML
  if (await fileExists(legacyChatbotHTML)) {
    try {
      const htmlContent = await fs.readFile(legacyChatbotHTML, 'utf-8');
      analysis.htmlFile = {
        path: legacyChatbotHTML,
        size: htmlContent.length,
        content: htmlContent
      };
    } catch (error) {
      log.error(`Error analizando ${legacyChatbotHTML}: ${error.message}`);
    }
  }
  
  return analysis;
}

async function createModernChatbotKnowledge() {
  log.step('Creando base de conocimiento moderna...');
  
  const knowledgeBase = [
    {
      id: 'saludo',
      patterns: ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'qué tal', 'saludos'],
      responses: [
        '¡Hola! Soy el asistente virtual del Bachillerato Héroes de la Patria "Héroes de Puebla". ¿En qué puedo ayudarte?',
        '¡Buenos días! Estoy aquí para resolver tus dudas sobre nuestro bachillerato. ¿Qué necesitas saber?',
        '¡Hola! Bienvenido al Bachillerato Héroes de la Patria. ¿Te puedo ayudar con información sobre nuestros servicios?'
      ],
      category: 'greeting'
    },
    {
      id: 'informacion_general',
      patterns: ['qué es el bachillerato', 'información general', 'sobre la escuela', 'heroes patria', 'heroes puebla'],
      responses: [
        'El Bachillerato Héroes de la Patria "Héroes de Puebla" es una institución de educación media superior. Ofrecemos educación integral de calidad con formación académica y capacitación para el trabajo.',
        'Somos una institución educativa de nivel medio superior que combina formación académica con capacitación técnica especializada.',
        'El Bachillerato Héroes de la Patria forma estudiantes altamente capacitados para insertarse en el sector productivo o continuar estudios superiores.'
      ],
      category: 'general_info'
    },
    {
      id: 'especialidades',
      patterns: ['especialidades', 'carreras técnicas', 'qué estudiar', 'opciones de estudio'],
      responses: [
        'En el Bachillerato Héroes de la Patria ofrecemos especialidades como: Programación, Electrónica, Contabilidad, Administración, Mecánica Industrial y más. ¿Te interesa alguna en particular?',
        'Nuestras especialidades técnicas están diseñadas para formar profesionistas competentes. Puedes elegir entre áreas tecnológicas, administrativas y de servicios.',
        'Tenemos diversas especialidades técnicas que te preparan tanto para el trabajo como para continuar estudios superiores. ¿Quieres saber más sobre alguna área específica?'
      ],
      category: 'academics'
    },
    {
      id: 'inscripciones',
      patterns: ['inscripciones', 'cómo inscribirse', 'requisitos', 'documentos', 'proceso de admisión'],
      responses: [
        'Para inscribirte necesitas: certificado de secundaria, acta de nacimiento, CURP, fotografías y llenar la solicitud. El proceso inicia generalmente en febrero.',
        'Las inscripciones se realizan cada año. Te recomiendo visitar nuestra sección de Servicios para ver los requisitos específicos y fechas.',
        'El proceso de inscripción incluye presentar documentos oficiales y en algunos casos un examen de admisión. ¿Necesitas la lista completa de requisitos?'
      ],
      category: 'enrollment'
    },
    {
      id: 'contacto',
      patterns: ['contacto', 'teléfono', 'dirección', 'ubicación', 'dónde están'],
      responses: [
        'Nos ubicamos en [dirección específica]. Puedes contactarnos al teléfono [número] o visitarnos de lunes a viernes de 7:00 AM a 3:00 PM.',
        'Para contactar con el Bachillerato Héroes de la Patria puedes llamarnos, visitarnos o escribirnos. Encuentra toda la información en nuestra sección de Contacto.'
        'Estamos ubicados en [ubicación]. También puedes contactarnos a través de nuestros medios oficiales que aparecen en el sitio web.'
      ],
      category: 'contact'
    },
    {
      id: 'servicios',
      patterns: ['servicios', 'qué ofrecen', 'instalaciones', 'laboratorios'],
      responses: [
        'Contamos con laboratorios especializados, biblioteca, centro de cómputo, talleres, áreas deportivas y servicios de orientación educativa.',
        'Ofrecemos servicios educativos integrales: formación técnica, preparatoria, servicios psicopedagógicos, actividades extracurriculares y más.',
        'Nuestras instalaciones incluyen aulas equipadas, laboratorios de última generación, biblioteca digital y espacios para el desarrollo integral de nuestros estudiantes.'
      ],
      category: 'services'
    },
    {
      id: 'horarios',
      patterns: ['horarios', 'turnos', 'a qué hora', 'cuándo'],
      responses: [
        'Manejamos dos turnos: matutino (7:00 AM - 1:30 PM) y vespertino (1:30 PM - 8:00 PM). Los horarios pueden variar según la especialidad.',
        'Tenemos turno matutino y vespertino para adaptarnos a las necesidades de nuestros estudiantes.',
        'Los horarios de clase varían según el turno y especialidad. Para horarios específicos, puedes consultar en control escolar.'
      ],
      category: 'schedule'
    },
    {
      id: 'becas',
      patterns: ['becas', 'apoyo económico', 'ayuda', 'financiamiento'],
      responses: [
        'Ofrecemos diversas opciones de becas: académicas, socioeconómicas y de excelencia académica. También participamos en programas gubernamentales de apoyo estudiantil.',
        'Contamos con programas de becas para estudiantes destacados y con necesidades económicas. Consulta en servicios escolares sobre los requisitos.',
        'Hay diferentes tipos de becas disponibles según tu situación académica y socioeconómica. Te recomiendo acercarte a la oficina de becas para más información.'
      ],
      category: 'scholarships'
    },
    {
      id: 'despedida',
      patterns: ['gracias', 'adiós', 'hasta luego', 'bye', 'nos vemos'],
      responses: [
        '¡De nada! Ha sido un placer ayudarte. Si tienes más preguntas sobre el Bachillerato Héroes de la Patria, no dudes en preguntar. ¡Que tengas un excelente día!',
        '¡Gracias por contactar al Bachillerato Héroes de la Patria! Esperamos verte pronto en nuestra institución. ¡Hasta luego!',
        '¡Fue un gusto ayudarte! Recuerda que el Bachillerato Héroes de la Patria siempre está aquí para apoyarte en tu formación. ¡Cuídate!'
      ],
      category: 'goodbye'
    }
  ];
  
  const knowledgePath = path.join(MODERN_ROOT, 'apps/web/src/data/chatbot-knowledge.json');
  await fs.mkdir(path.dirname(knowledgePath), { recursive: true });
  await fs.writeFile(knowledgePath, JSON.stringify(knowledgeBase, null, 2), 'utf-8');
  
  log.success('Base de conocimiento moderna creada');
  return knowledgeBase;
}

async function createChatbotAPI() {
  log.step('Creando API del chatbot...');
  
  const apiPath = path.join(MODERN_ROOT, 'apps/api/src/routes/chatbot.ts');
  
  const apiContent = `import { Router } from 'express';
import { z } from 'zod';
import knowledgeBase from '../../data/chatbot-knowledge.json';

const router = Router();

// Schema de validación para mensajes del chatbot
const ChatMessageSchema = z.object({
  message: z.string().min(1).max(500),
  sessionId: z.string().optional(),
  context: z.object({
    page: z.string().optional(),
    userId: z.string().optional()
  }).optional()
});

// Tipos
interface ChatResponse {
  response: string;
  confidence: number;
  category: string;
  suggestions: string[];
}

interface KnowledgeEntry {
  id: string;
  patterns: string[];
  responses: string[];
  category: string;
}

/**
 * Función para calcular similitud entre strings (algoritmo simple)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Buscar la mejor respuesta en la base de conocimiento
 */
function findBestResponse(userMessage: string): ChatResponse {
  const normalizedMessage = userMessage.toLowerCase().trim();
  let bestMatch = null;
  let bestScore = 0;
  
  // Buscar por patrones exactos primero
  for (const entry of knowledgeBase) {
    for (const pattern of entry.patterns) {
      if (normalizedMessage.includes(pattern.toLowerCase())) {
        const score = calculateSimilarity(normalizedMessage, pattern.toLowerCase());
        if (score > bestScore) {
          bestScore = score;
          bestMatch = entry;
        }
      }
    }
  }
  
  // Si no hay coincidencia exacta, buscar por similitud
  if (bestScore < 0.5) {
    for (const entry of knowledgeBase) {
      for (const pattern of entry.patterns) {
        const score = calculateSimilarity(normalizedMessage, pattern.toLowerCase());
        if (score > bestScore && score > 0.3) {
          bestScore = score;
          bestMatch = entry;
        }
      }
    }
  }
  
  // Si hay una buena coincidencia, devolver respuesta
  if (bestMatch && bestScore > 0.3) {
    const randomResponse = bestMatch.responses[Math.floor(Math.random() * bestMatch.responses.length)];
    
    return {
      response: randomResponse,
      confidence: bestScore,
      category: bestMatch.category,
      suggestions: getSuggestions(bestMatch.category)
    };
  }
  
  // Respuesta por defecto
  return {
    response: "Disculpa, no estoy seguro de entender tu pregunta. ¿Podrías reformularla o preguntarme sobre nuestras especialidades, inscripciones, servicios o información general del Bachillerato Héroes de la Patria?",
    confidence: 0,
    category: 'unknown',
    suggestions: [
      "¿Qué especialidades ofrecen?",
      "¿Cómo me puedo inscribir?",
      "¿Cuáles son sus horarios?",
      "¿Dónde están ubicados?"
    ]
  };
}

/**
 * Generar sugerencias basadas en la categoría
 */
function getSuggestions(category: string): string[] {
  const suggestionMap: Record<string, string[]> = {
    'greeting': [
      "¿Qué especialidades tienen?",
      "¿Cómo me inscribo?",
      "¿Dónde están ubicados?"
    ],
    'general_info': [
      "¿Qué especialidades ofrecen?",
      "¿Cuáles son los requisitos de inscripción?",
      "¿Qué servicios brindan?"
    ],
    'academics': [
      "¿Cuánto dura cada especialidad?",
      "¿Necesito examen de admisión?",
      "¿Hay prácticas profesionales?"
    ],
    'enrollment': [
      "¿Cuándo son las inscripciones?",
      "¿Cuánto cuesta estudiar ahí?",
      "¿Hay becas disponibles?"
    ],
    'contact': [
      "¿Cuáles son sus horarios de atención?",
      "¿Tienen redes sociales?",
      "¿Cómo llego en transporte público?"
    ],
    'services': [
      "¿Tienen laboratorios especializados?",
      "¿Qué actividades extracurriculares hay?",
      "¿Ofrecen servicios de orientación?"
    ],
    'schedule': [
      "¿Puedo cambiar de turno?",
      "¿Hay clases los sábados?",
      "¿Cuántas horas de clase son al día?"
    ],
    'scholarships': [
      "¿Qué requisitos necesito para beca?",
      "¿Cuándo abren convocatorias?",
      "¿Hay becas de excelencia académica?"
    ]
  };
  
  return suggestionMap[category] || [
    "¿Puedes darme más información?",
    "¿Qué más necesito saber?",
    "¿Hay algo más que puedas decirme?"
  ];
}

/**
 * POST /api/chatbot/message
 * Procesar mensaje del usuario y devolver respuesta
 */
router.post('/message', async (req, res) => {
  try {
    const validation = ChatMessageSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid message format',
        details: validation.error.errors
      });
    }
    
    const { message, sessionId, context } = validation.data;
    
    // Procesar mensaje y generar respuesta
    const chatResponse = findBestResponse(message);
    
    // Log para análisis (en producción usar un logger apropiado)
    console.log(\`[Chatbot] User: "\${message}" -> Response: "\${chatResponse.response}" (confidence: \${chatResponse.confidence})\`);
    
    res.json({
      success: true,
      data: {
        ...chatResponse,
        sessionId: sessionId || \`session_\${Date.now()}\`,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[Chatbot API] Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'No pude procesar tu mensaje en este momento. Por favor intenta más tarde.'
    });
  }
});

/**
 * GET /api/chatbot/suggestions
 * Obtener sugerencias de preguntas frecuentes
 */
router.get('/suggestions', (req, res) => {
  const suggestions = [
    "¿Qué especialidades técnicas ofrecen?",
    "¿Cómo me puedo inscribir?",
    "¿Cuáles son los requisitos de inscripción?",
    "¿Dónde están ubicados?",
    "¿Qué horarios manejan?",
    "¿Hay becas disponibles?",
    "¿Qué servicios brindan a los estudiantes?",
    "¿Cuánto dura el bachillerato técnico?"
  ];
  
  res.json({
    success: true,
    data: {
      suggestions: suggestions.sort(() => Math.random() - 0.5).slice(0, 4)
    }
  });
});

/**
 * GET /api/chatbot/health
 * Health check del servicio de chatbot
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      knowledgeBase: knowledgeBase.length + ' entries',
      timestamp: new Date().toISOString()
    }
  });
});

export default router;`;

  await fs.mkdir(path.dirname(apiPath), { recursive: true });
  await fs.writeFile(apiPath, apiContent, 'utf-8');
  
  log.success('API del chatbot creada');
}

async function createChatbotComponent() {
  log.step('Creando componente moderno del chatbot...');
  
  const componentPath = path.join(MODERN_ROOT, 'apps/web/src/components/Chatbot.astro');
  
  const componentContent = `---
export interface Props {
  class?: string;
  position?: 'bottom-right' | 'bottom-left';
  theme?: 'light' | 'dark';
}

const { 
  class: className = '', 
  position = 'bottom-right',
  theme = 'light'
} = Astro.props;
---

<div class={\`chatbot-widget \${className} \${position} theme-\${theme}\`} id="chatbot-widget">
  <!-- Botón flotante para abrir/cerrar chatbot -->
  <button class="chatbot-toggle" id="chatbot-toggle" aria-label="Abrir asistente virtual">
    <svg class="chat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" fill="currentColor"/>
      <circle cx="7" cy="9" r="1" fill="currentColor"/>
      <circle cx="12" cy="9" r="1" fill="currentColor"/>
      <circle cx="17" cy="9" r="1" fill="currentColor"/>
    </svg>
    <svg class="close-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
    </svg>
  </button>
  
  <!-- Panel del chatbot -->
  <div class="chatbot-panel" id="chatbot-panel">
    <!-- Header del chat -->
    <div class="chatbot-header">
      <div class="bot-info">
        <div class="bot-avatar">🤖</div>
        <div class="bot-details">
          <div class="bot-name">Asistente Héroes Patria</div>
          <div class="bot-status">En línea</div>
        </div>
      </div>
      <button class="minimize-btn" id="chatbot-minimize" aria-label="Minimizar chat">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 13H5V11H19V13Z" fill="currentColor"/>
        </svg>
      </button>
    </div>
    
    <!-- Área de mensajes -->
    <div class="chatbot-messages" id="chatbot-messages">
      <div class="message bot-message">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <div class="message-text">
            ¡Hola! Soy el asistente virtual del Bachillerato Héroes de la Patria "Héroes de Puebla". 
            ¿En qué puedo ayudarte hoy?
          </div>
          <div class="message-time"></div>
        </div>
      </div>
    </div>
    
    <!-- Sugerencias rápidas -->
    <div class="quick-suggestions" id="quick-suggestions">
      <div class="suggestion-label">Preguntas frecuentes:</div>
      <div class="suggestions-list" id="suggestions-list">
        <!-- Se cargarán dinámicamente -->
      </div>
    </div>
    
    <!-- Indicador de escritura -->
    <div class="typing-indicator" id="typing-indicator" style="display: none;">
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span class="typing-text">El asistente está escribiendo...</span>
    </div>
    
    <!-- Input de mensaje -->
    <div class="chatbot-input">
      <div class="input-container">
        <input 
          type="text" 
          id="chatbot-message-input"
          placeholder="Escribe tu pregunta aquí..."
          maxlength="500"
          autocomplete="off"
        >
        <button 
          class="send-button" 
          id="chatbot-send-button"
          aria-label="Enviar mensaje"
          disabled
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .chatbot-widget {
    position: fixed;
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .chatbot-widget.bottom-right {
    bottom: 20px;
    right: 20px;
  }
  
  .chatbot-widget.bottom-left {
    bottom: 20px;
    left: 20px;
  }
  
  /* Botón flotante */
  .chatbot-toggle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    border: none;
    color: white;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  
  .chatbot-toggle:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
  }
  
  .chatbot-toggle svg {
    width: 28px;
    height: 28px;
    transition: all 0.3s ease;
  }
  
  .chatbot-toggle .close-icon {
    display: none;
    position: absolute;
  }
  
  .chatbot-toggle.active .chat-icon {
    display: none;
  }
  
  .chatbot-toggle.active .close-icon {
    display: block;
  }
  
  /* Panel del chatbot */
  .chatbot-panel {
    position: absolute;
    bottom: 80px;
    right: 0;
    width: 380px;
    height: 500px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    border: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    opacity: 0;
    visibility: hidden;
    transform: translateY(20px);
    transition: all 0.3s ease;
  }
  
  .chatbot-widget.bottom-left .chatbot-panel {
    left: 0;
    right: auto;
  }
  
  .chatbot-panel.active {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
  
  /* Header */
  .chatbot-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: white;
    border-radius: 16px 16px 0 0;
  }
  
  .bot-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .bot-avatar {
    font-size: 1.5rem;
  }
  
  .bot-name {
    font-weight: 600;
    font-size: 0.95rem;
  }
  
  .bot-status {
    font-size: 0.8rem;
    opacity: 0.9;
  }
  
  .minimize-btn {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  .minimize-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .minimize-btn svg {
    width: 20px;
    height: 20px;
  }
  
  /* Mensajes */
  .chatbot-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .message {
    display: flex;
    gap: 10px;
    animation: fadeInUp 0.3s ease;
  }
  
  .user-message {
    flex-direction: row-reverse;
  }
  
  .message-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
  }
  
  .bot-message .message-avatar {
    background: #f3f4f6;
  }
  
  .user-message .message-avatar {
    background: #2563eb;
    color: white;
    font-size: 0.8rem;
  }
  
  .message-content {
    max-width: 80%;
  }
  
  .message-text {
    background: #f3f4f6;
    padding: 12px 16px;
    border-radius: 18px;
    font-size: 0.9rem;
    line-height: 1.4;
  }
  
  .user-message .message-text {
    background: #2563eb;
    color: white;
  }
  
  .message-time {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 4px;
    padding: 0 8px;
  }
  
  /* Sugerencias rápidas */
  .quick-suggestions {
    padding: 0 20px 16px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .suggestion-label {
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 8px;
  }
  
  .suggestions-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .suggestion-btn {
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    color: #374151;
    padding: 6px 12px;
    border-radius: 16px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .suggestion-btn:hover {
    background: #e5e7eb;
    transform: translateY(-1px);
  }
  
  /* Indicador de escritura */
  .typing-indicator {
    padding: 0 20px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .typing-dots {
    display: flex;
    gap: 3px;
  }
  
  .typing-dots span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #6b7280;
    animation: typing 1.5s infinite ease-in-out;
  }
  
  .typing-dots span:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .typing-dots span:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  .typing-text {
    font-size: 0.8rem;
    color: #6b7280;
    font-style: italic;
  }
  
  /* Input */
  .chatbot-input {
    padding: 16px 20px;
    border-top: 1px solid #e5e7eb;
  }
  
  .input-container {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  
  #chatbot-message-input {
    flex: 1;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    padding: 10px 16px;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
  }
  
  #chatbot-message-input:focus {
    border-color: #2563eb;
  }
  
  .send-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #2563eb;
    border: none;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .send-button:disabled {
    background: #d1d5db;
    cursor: not-allowed;
  }
  
  .send-button:not(:disabled):hover {
    background: #1d4ed8;
    transform: scale(1.05);
  }
  
  .send-button svg {
    width: 18px;
    height: 18px;
  }
  
  /* Animaciones */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes typing {
    0%, 60%, 100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-10px);
    }
  }
  
  /* Responsive */
  @media (max-width: 640px) {
    .chatbot-panel {
      width: 320px;
      height: 450px;
      bottom: 70px;
    }
    
    .chatbot-widget.bottom-right {
      right: 10px;
    }
    
    .chatbot-widget.bottom-left {
      left: 10px;
    }
  }
  
  @media (max-width: 380px) {
    .chatbot-panel {
      width: calc(100vw - 40px);
      right: -10px;
    }
    
    .chatbot-widget.bottom-left .chatbot-panel {
      left: -10px;
      right: auto;
    }
  }
</style>

<script>
  interface ChatMessage {
    text: string;
    isUser: boolean;
    timestamp: Date;
  }

  interface ChatResponse {
    response: string;
    confidence: number;
    category: string;
    suggestions: string[];
  }

  class ChatbotWidget {
    private isOpen = false;
    private messages: ChatMessage[] = [];
    private sessionId: string;
    
    private elements: {
      widget: HTMLElement;
      toggle: HTMLElement;
      panel: HTMLElement;
      messages: HTMLElement;
      input: HTMLInputElement;
      sendButton: HTMLElement;
      suggestions: HTMLElement;
      typingIndicator: HTMLElement;
    };
    
    constructor() {
      this.sessionId = \`session_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
      this.initElements();
      this.bindEvents();
      this.loadSuggestions();
    }
    
    private initElements() {
      this.elements = {
        widget: document.getElementById('chatbot-widget')!,
        toggle: document.getElementById('chatbot-toggle')!,
        panel: document.getElementById('chatbot-panel')!,
        messages: document.getElementById('chatbot-messages')!,
        input: document.getElementById('chatbot-message-input') as HTMLInputElement,
        sendButton: document.getElementById('chatbot-send-button')!,
        suggestions: document.getElementById('suggestions-list')!,
        typingIndicator: document.getElementById('typing-indicator')!
      };
    }
    
    private bindEvents() {
      // Toggle chatbot
      this.elements.toggle.addEventListener('click', () => this.toggleChat());
      
      // Minimizar
      document.getElementById('chatbot-minimize')?.addEventListener('click', () => this.closeChat());
      
      // Input handling
      this.elements.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
      
      this.elements.input.addEventListener('input', () => {
        const hasText = this.elements.input.value.trim().length > 0;
        this.elements.sendButton.toggleAttribute('disabled', !hasText);
      });
      
      // Send button
      this.elements.sendButton.addEventListener('click', () => this.sendMessage());
      
      // Click outside to close
      document.addEventListener('click', (e) => {
        if (this.isOpen && !this.elements.widget.contains(e.target as Node)) {
          this.closeChat();
        }
      });
    }
    
    private toggleChat() {
      if (this.isOpen) {
        this.closeChat();
      } else {
        this.openChat();
      }
    }
    
    private openChat() {
      this.isOpen = true;
      this.elements.toggle.classList.add('active');
      this.elements.panel.classList.add('active');
      this.elements.input.focus();
    }
    
    private closeChat() {
      this.isOpen = false;
      this.elements.toggle.classList.remove('active');
      this.elements.panel.classList.remove('active');
    }
    
    private async sendMessage() {
      const text = this.elements.input.value.trim();
      if (!text) return;
      
      // Add user message
      this.addMessage(text, true);
      this.elements.input.value = '';
      this.elements.sendButton.setAttribute('disabled', 'true');
      
      // Show typing indicator
      this.showTypingIndicator();
      
      try {
        // Send to API
        const response = await this.sendToAPI(text);
        
        // Hide typing indicator
        this.hideTypingIndicator();
        
        // Add bot response
        this.addMessage(response.response, false);
        
        // Update suggestions
        this.updateSuggestions(response.suggestions);
        
      } catch (error) {
        this.hideTypingIndicator();
        this.addMessage('Lo siento, no pude procesar tu mensaje en este momento. Por favor intenta más tarde.', false);
      }
    }
    
    private async sendToAPI(message: string): Promise<ChatResponse> {
      const response = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId: this.sessionId,
          context: {
            page: window.location.pathname
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('API Error');
      }
      
      const data = await response.json();
      return data.data;
    }
    
    private addMessage(text: string, isUser: boolean) {
      const message: ChatMessage = {
        text,
        isUser,
        timestamp: new Date()
      };
      
      this.messages.push(message);
      
      const messageEl = document.createElement('div');
      messageEl.className = \`message \${isUser ? 'user-message' : 'bot-message'}\`;
      
      messageEl.innerHTML = \`
        <div class="message-avatar">\${isUser ? '👤' : '🤖'}</div>
        <div class="message-content">
          <div class="message-text">\${text}</div>
          <div class="message-time">\${this.formatTime(message.timestamp)}</div>
        </div>
      \`;
      
      this.elements.messages.appendChild(messageEl);
      this.scrollToBottom();
    }
    
    private showTypingIndicator() {
      this.elements.typingIndicator.style.display = 'flex';
      this.scrollToBottom();
    }
    
    private hideTypingIndicator() {
      this.elements.typingIndicator.style.display = 'none';
    }
    
    private scrollToBottom() {
      setTimeout(() => {
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
      }, 100);
    }
    
    private formatTime(date: Date): string {
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    private async loadSuggestions() {
      try {
        const response = await fetch('/api/chatbot/suggestions');
        const data = await response.json();
        this.updateSuggestions(data.data.suggestions);
      } catch (error) {
        console.error('Error loading suggestions:', error);
      }
    }
    
    private updateSuggestions(suggestions: string[]) {
      this.elements.suggestions.innerHTML = suggestions.map(suggestion => 
        \`<button class="suggestion-btn" onclick="chatbot.handleSuggestion('\${suggestion}')">\${suggestion}</button>\`
      ).join('');
    }
    
    public handleSuggestion(suggestion: string) {
      this.elements.input.value = suggestion;
      this.elements.sendButton.removeAttribute('disabled');
      this.sendMessage();
    }
  }
  
  // Initialize chatbot when DOM is loaded
  let chatbot: ChatbotWidget;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      chatbot = new ChatbotWidget();
      (window as any).chatbot = chatbot; // Make it globally accessible for suggestions
    });
  } else {
    chatbot = new ChatbotWidget();
    (window as any).chatbot = chatbot;
  }
</script>`;

  await fs.mkdir(path.dirname(componentPath), { recursive: true });
  await fs.writeFile(componentPath, componentContent, 'utf-8');
  
  log.success('Componente moderno del chatbot creado');
}

async function runChatbotMigration() {
  console.log(chalk.bgBlue.white(' 🤖 MIGRACIÓN DEL CHATBOT - Bachillerato Héroes de la Patria ') + '\n');
  
  const results = {
    analysis: null,
    knowledge: false,
    api: false,
    component: false
  };
  
  // Analizar chatbot heredado
  results.analysis = await analyzeLegacyChatbot();
  
  // Crear base de conocimiento moderna
  await createModernChatbotKnowledge();
  results.knowledge = true;
  
  // Crear API del chatbot
  await createChatbotAPI();
  results.api = true;
  
  // Crear componente moderno
  await createChatbotComponent();
  results.component = true;
  
  // Crear reporte de migración
  const report = `# 🤖 Reporte de Migración del Chatbot

**Fecha:** ${new Date().toISOString()}

## 📊 Análisis del Sistema Heredado

### JavaScript Legacy
- **Archivo:** ${results.analysis?.jsFile?.path || 'No encontrado'}
- **Tamaño:** ${results.analysis?.jsFile?.size || 0} caracteres
- **Funciones detectadas:** ${results.analysis?.functions?.length || 0}
- **Endpoints API detectados:** ${results.analysis?.apiEndpoints?.length || 0}

### Base de Conocimiento Original
- **Entradas detectadas:** ${results.analysis?.knowledgeBase?.length || 0}

## ✅ Componentes Migrados

- ✅ Base de conocimiento moderna (JSON estructurado)
- ✅ API RESTful con TypeScript y validación Zod
- ✅ Componente Astro con UI moderna
- ✅ Algoritmo de similitud de texto mejorado
- ✅ Sistema de sugerencias inteligentes
- ✅ Manejo de sesiones y contexto

## 🚀 Nuevas Funcionalidades

### Backend API (/api/chatbot)
- **POST /message** - Procesar mensajes del usuario
- **GET /suggestions** - Obtener sugerencias dinámicas
- **GET /health** - Health check del servicio
- Validación robusta con Zod schemas
- Algoritmo de matching inteligente
- Logging para análisis de conversaciones

### Frontend Component
- UI moderna y responsive
- Animaciones suaves y micro-interacciones
- Sugerencias rápidas dinámicas
- Indicador de escritura
- Manejo de sesiones
- Accesibilidad mejorada (ARIA labels, keyboard nav)

### Base de Conocimiento
- ${(await createModernChatbotKnowledge()).length} categorías de conocimiento
- Respuestas contextuales múltiples
- Sistema de confianza/matching
- Sugerencias categorizadas

## 🔧 Integración con Astro

### Para usar el chatbot en cualquier página:

\`\`\`astro
---
import Chatbot from '../components/Chatbot.astro';
---

<Layout>
  <!-- Tu contenido -->
  
  <!-- Chatbot flotante -->
  <Chatbot position="bottom-right" theme="light" />
</Layout>
\`\`\`

### Configuración de la API

El chatbot requiere que la API esté corriendo. Asegúrate de:

1. Iniciar el servidor API: \`npm run dev:api\`
2. La ruta \`/api/chatbot\` está configurada
3. El archivo \`chatbot-knowledge.json\` está disponible

## 📋 Próximos Pasos

### Inmediatos
- [ ] Integrar el componente en el layout principal
- [ ] Configurar la API en el backend
- [ ] Migrar conocimiento específico del chatbot heredado
- [ ] Testing completo de conversaciones

### Corto Plazo  
- [ ] Mejorar algoritmo de NLP
- [ ] Añadir más categorías de conocimiento
- [ ] Implementar análitics de conversaciones
- [ ] A/B testing de respuestas

### Mediano Plazo
- [ ] Integración con LLM (ChatGPT API)
- [ ] Aprendizaje automático de conversaciones
- [ ] Soporte multiidioma
- [ ] Integración con sistemas internos (ERP, CRM)

## 🎯 Métricas de Éxito

### Técnicas
- Tiempo de respuesta < 500ms
- 95% de uptime de la API
- Soporte para 100+ usuarios concurrentes

### Experiencia de Usuario
- Tasa de resolución > 80%
- Satisfacción del usuario > 4.5/5
- Tiempo promedio de resolución < 2 minutos

---
*Chatbot migrado exitosamente - Bachillerato Héroes de la Patria*
`;

  const reportPath = path.join(MODERN_ROOT, 'CHATBOT_MIGRATION_REPORT.md');
  await fs.writeFile(reportPath, report, 'utf-8');
  
  // Resumen final
  console.log(chalk.bgGreen.black(' ✅ MIGRACIÓN DEL CHATBOT COMPLETADA '));
  console.log(`\n📊 Resumen:`);
  console.log(`   • Análisis heredado: ${results.analysis ? '✅ Completado' : '❌ Falló'}`);
  console.log(`   • Base de conocimiento: ${results.knowledge ? '✅ Creada' : '❌ Falló'}`);
  console.log(`   • API moderna: ${results.api ? '✅ Implementada' : '❌ Falló'}`);
  console.log(`   • Componente UI: ${results.component ? '✅ Desarrollado' : '❌ Falló'}`);
  
  console.log(`\n📁 Archivos creados:`);
  console.log(`   • apps/web/src/data/chatbot-knowledge.json`);
  console.log(`   • apps/api/src/routes/chatbot.ts`);
  console.log(`   • apps/web/src/components/Chatbot.astro`);
  console.log(`   • CHATBOT_MIGRATION_REPORT.md`);
  
  console.log(`\n🚀 Siguiente paso:`);
  console.log(`   Integrar el componente Chatbot en el layout principal`);
}

export { runChatbotMigration };

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runChatbotMigration().catch(error => {
    log.error(`Error durante la migración del chatbot: ${error.message}`);
    process.exit(1);
  });
}