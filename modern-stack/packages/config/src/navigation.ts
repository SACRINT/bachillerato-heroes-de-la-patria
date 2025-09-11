import type { NavigationItem } from '@heroes-patria/types';

/**
 * Configuración de navegación del sitio web
 */
export const navigationConfig: NavigationItem[] = [
  {
    label: 'Inicio',
    href: '/',
    icon: 'fas fa-home'
  },
  {
    label: 'Conócenos', 
    href: '/conocenos#hero',
    icon: 'fas fa-users',
    children: [
      { label: 'Misión y Visión', href: '/conocenos#mision-vision', icon: 'fas fa-bullseye' },
      { label: 'Nuestra Historia', href: '/conocenos#historia', icon: 'fas fa-history' },
      { label: 'Infraestructura', href: '/conocenos#infraestructura', icon: 'fas fa-building' },
      { label: 'Video Institucional', href: '/conocenos#video-institucional', icon: 'fas fa-video' },
      { label: 'Mensaje del Director', href: '/conocenos#mensaje-director', icon: 'fas fa-user-tie' },
      { label: 'Organigrama', href: '/conocenos#organigrama', icon: 'fas fa-sitemap' }
    ]
  },
  {
    label: 'Oferta Educativa',
    href: '/oferta-educativa#hero', 
    icon: 'fas fa-graduation-cap',
    children: [
      { label: 'Modelo Educativo', href: '/oferta-educativa#modelo-educativo', icon: 'fas fa-lightbulb' },
      { label: 'Plan de Estudios', href: '/oferta-educativa#plan-estudios', icon: 'fas fa-book' },
      { label: 'Capacitación para el Trabajo', href: '/oferta-educativa#capacitacion-trabajo', icon: 'fas fa-tools' },
      { label: 'Perfil de Egreso', href: '/oferta-educativa#perfil-egreso', icon: 'fas fa-user-graduate' },
      { label: 'Proceso de Admisión', href: '/oferta-educativa#proceso-admision', icon: 'fas fa-clipboard-check' }
    ]
  },
  {
    label: 'Portales Académicos',
    href: '#',
    icon: 'fas fa-user-graduate',
    children: [
      {
        label: 'Estudiantes',
        href: '/estudiantes#hero',
        icon: 'fas fa-user-graduate',
        children: [
          { label: 'Acceso Directo', href: '/estudiantes#acceso-rapido', icon: 'fas fa-sign-in-alt' },
          { label: 'Recursos', href: '/estudiantes#recursos-academicos', icon: 'fas fa-book' }
        ]
      },
      {
        label: 'Padres de Familia', 
        href: '/padres#hero',
        icon: 'fas fa-users',
        children: [
          { label: 'Ingresar', href: '/padres#loginSection', icon: 'fas fa-sign-in-alt' },
          { label: 'Primer Acceso', href: '/padres#primera-vez', icon: 'fas fa-user-plus' },
          { label: 'FAQ', href: '/padres#preguntas-frecuentes', icon: 'fas fa-question-circle' }
        ]
      },
      {
        label: 'Calificaciones',
        href: '/calificaciones#hero',
        icon: 'fas fa-chart-bar',
        children: [
          { label: 'Funciones', href: '/calificaciones#caracteristicas-plataforma', icon: 'fas fa-cogs' },
          { label: 'Evaluación', href: '/calificaciones#sistema-evaluacion', icon: 'fas fa-clipboard-check' },
          { label: 'Escalas', href: '/calificaciones#escala-calificaciones', icon: 'fas fa-ruler' }
        ]
      },
      {
        label: 'Portal de Egresados',
        href: '/egresados#hero', 
        icon: 'fas fa-graduation-cap'
      },
      {
        label: 'Bolsa de Trabajo',
        href: '/bolsa-trabajo#hero',
        icon: 'fas fa-briefcase'
      }
    ]
  },
  {
    label: 'Servicios',
    href: '/servicios#hero',
    icon: 'fas fa-cogs',
    children: [
      {
        label: 'Sistema de Citas',
        href: '/citas#hero',
        icon: 'fas fa-calendar-check',
        children: [
          { label: 'Departamentos y Servicios', href: '/citas#departamentos-servicios', icon: 'fas fa-building' },
          { label: 'Cómo Funciona', href: '/citas#como-funciona', icon: 'fas fa-question-circle' }
        ]
      },
      {
        label: 'Sistema de Pagos',
        href: '/pagos#hero',
        icon: 'fas fa-credit-card',
        children: [
          { label: 'Servicios Disponibles', href: '/pagos#servicios-disponibles', icon: 'fas fa-list' },
          { label: 'Métodos de Pago', href: '/pagos#metodos-pago', icon: 'fas fa-credit-card' }
        ]
      },
      {
        label: 'Centro de Descargas',
        href: '/descargas#hero',
        icon: 'fas fa-download'
      }
    ]
  },
  {
    label: 'Comunidad',
    href: '/comunidad#hero',
    icon: 'fas fa-heart',
    children: [
      { label: 'Noticias Actuales', href: '/comunidad#noticias', icon: 'fas fa-newspaper' },
      { label: 'Eventos y Actividades', href: '/comunidad#eventos', icon: 'fas fa-calendar-alt' },
      { label: 'Testimonios', href: '/comunidad#testimonios', icon: 'fas fa-comment-dots' },
      { label: 'Galería', href: '/comunidad#galeria', icon: 'fas fa-images' }
    ]
  },
  {
    label: 'Información Institucional',
    href: '/transparencia#hero',
    icon: 'fas fa-file-alt',
    children: [
      {
        label: 'Transparencia',
        href: '/transparencia#hero',
        icon: 'fas fa-eye'
      },
      {
        label: 'Normatividad',
        href: '/normatividad#hero',
        icon: 'fas fa-gavel'
      },
      {
        label: 'Calendario Escolar',
        href: '/calendario#hero',
        icon: 'fas fa-calendar-alt'
      },
      {
        label: 'Convocatorias',
        href: '/convocatorias#hero',
        icon: 'fas fa-bullhorn'
      }
    ]
  },
  {
    label: 'Contacto y Ayuda',
    href: '/contacto#hero',
    icon: 'fas fa-phone',
    children: [
      { label: 'Información de Contacto', href: '/contacto#info-contacto', icon: 'fas fa-info-circle' },
      { label: 'Ubicación', href: '/contacto#ubicacion', icon: 'fas fa-map-marker-alt' },
      { label: 'Preguntas Frecuentes', href: '/#faq', icon: 'fas fa-question-circle' },
      { label: 'Mapa del Sitio', href: '/#mapa-sitio', icon: 'fas fa-sitemap' }
    ]
  }
] as const;

export type NavigationConfig = typeof navigationConfig;