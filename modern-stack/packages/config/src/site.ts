/**
 * Configuración del sitio web - Bachillerato Héroes de la Patria
 */

export const siteConfig = {
  // Información básica del sitio
  name: 'Bachillerato Héroes de la Patria',
  fullName: 'Bachillerato Héroes de la Patria - Centro de Educación Media Superior',
  shortName: 'Héroes de la Patria',
  description: 'Bachillerato Héroes de la Patria - Institución educativa comprometida con la excelencia académica y la formación integral de nuestros estudiantes. Ofrecemos educación de calidad con especialidades técnicas.',
  
  // URLs del sitio
  url: 'https://sacrint.github.io',
  baseUrl: '/03-BachilleratoHeroesWeb',
  
  // Información de contacto
  contact: {
    phone: '(222) 555-0166',
    email: 'contacto@heroespatria.edu.mx',
    address: {
      street: 'Av. Reforma 123, Col. Centro',
      city: 'Heroica Puebla de Zaragoza',
      state: 'Puebla',
      zipCode: '72000',
      country: 'México'
    }
  },
  
  // Horarios
  schedule: {
    office: 'Lunes a Viernes de 7:00 a 15:00',
    classes: 'Turno Matutino: 7:00 - 13:30'
  },
  
  // Redes sociales
  social: {
    facebook: 'https://facebook.com/heroesdelapatria',
    instagram: 'https://instagram.com/heroespatria_oficial',
    twitter: 'https://twitter.com/heroespatria',
    youtube: 'https://youtube.com/@heroesdelapatria'
  },
  
  // SEO y metadatos
  seo: {
    defaultTitle: 'Bachillerato Héroes de la Patria - Educación de Excelencia',
    titleTemplate: '%s | Héroes de la Patria',
    defaultDescription: 'Bachillerato Héroes de la Patria - Institución educativa comprometida con la excelencia académica y la formación integral de nuestros estudiantes. Ofrecemos educación de calidad con especialidades técnicas.',
    keywords: [
      'Héroes de la Patria',
      'bachillerato',
      'educación media superior',
      'preparatoria',
      'Informática',
      'Contabilidad', 
      'Electricidad',
      'educación de calidad',
      'formación integral'
    ],
    locale: 'es_MX',
    type: 'website'
  },
  
  // Configuración de PWA
  pwa: {
    name: 'Bachillerato Héroes de la Patria',
    shortName: 'HéroesPatria',
    description: 'Portal oficial del Bachillerato Héroes de la Patria',
    themeColor: '#1e40af',
    backgroundColor: '#ffffff',
    display: 'standalone',
    startUrl: '/',
    scope: '/'
  },
  
  // Institucional
  institutional: {
    founded: '1995',
    cct: '21DCT0166K', // Clave de Centro de Trabajo
    zone: 'Zona Escolar 03',
    subsystem: 'DGETI',
    modality: 'Escolarizada',
    level: 'Medio Superior',
    specialties: [
      {
        name: 'Técnico en Informática',
        code: 'BTINF-2018-11',
        duration: '6 semestres'
      },
      {
        name: 'Técnico en Contabilidad', 
        code: 'BTCON-2018-11',
        duration: '6 semestres'
      },
      {
        name: 'Técnico en Electricidad',
        code: 'BTELE-2018-11', 
        duration: '6 semestres'
      }
    ],
    capacity: {
      total: 1200,
      perGroup: 35,
      groups: 18
    }
  },
  
  // API Configuration
  api: {
    baseUrl: process.env.NODE_ENV === 'production' 
      ? 'https://api.heroespatria.edu.mx'
      : 'http://localhost:3001',
    endpoints: {
      contact: '/api/contact',
      documents: '/api/documents',
      news: '/api/news',
      events: '/api/events'
    }
  },
  
  // Configuración de desarrollo
  development: {
    showDebugInfo: process.env.NODE_ENV === 'development',
    enableAnalytics: process.env.NODE_ENV === 'production'
  }
} as const;

export type SiteConfig = typeof siteConfig;