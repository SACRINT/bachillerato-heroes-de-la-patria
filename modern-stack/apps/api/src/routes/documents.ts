import express from 'express';
import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Document metadata schema
const DocumentSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  category: z.enum(['formatos', 'reglamentos', 'academicos', 'administrativos', 'estudiantes', 'padres']),
  type: z.enum(['pdf', 'doc', 'xls']),
  size: z.string(),
  downloadCount: z.number(),
  lastUpdated: z.string(),
  tags: z.array(z.string()),
  filename: z.string()
});

// Document database (in a real app, this would be in a database)
const documentsDB = [
  {
    id: 1,
    title: "Solicitud de Constancia de Estudios",
    description: "Formato para solicitar constancia de estudios vigente",
    category: "formatos",
    type: "pdf",
    size: "245 KB",
    downloadCount: 1250,
    lastUpdated: "2024-08-15",
    tags: ["constancia", "estudios", "trámite"],
    filename: "solicitud-constancia-estudios.pdf"
  },
  {
    id: 2,
    title: "Solicitud de Beca",
    description: "Formato oficial para solicitud de becas académicas y socioeconómicas",
    category: "formatos",
    type: "pdf",
    size: "320 KB",
    downloadCount: 890,
    lastUpdated: "2024-08-20",
    tags: ["beca", "apoyo", "económico"],
    filename: "solicitud-beca.pdf"
  },
  {
    id: 5,
    title: "Reglamento Escolar Interno",
    description: "Reglamento oficial del plantel con normas y procedimientos",
    category: "reglamentos",
    type: "pdf",
    size: "1.2 MB",
    downloadCount: 3200,
    lastUpdated: "2024-08-01",
    tags: ["reglamento", "normas", "disciplina"],
    filename: "reglamento-escolar-interno.pdf"
  },
  {
    id: 8,
    title: "Plan de Estudios Bachillerato",
    description: "Plan de estudios completo del bachillerato tecnológico",
    category: "academicos",
    type: "pdf",
    size: "2.1 MB",
    downloadCount: 2800,
    lastUpdated: "2024-08-25",
    tags: ["plan estudios", "bachillerato", "curriculum"],
    filename: "plan-estudios-bachillerato.pdf"
  },
  {
    id: 15,
    title: "Guía del Estudiante",
    description: "Manual completo con información esencial para estudiantes",
    category: "estudiantes",
    type: "pdf",
    size: "1.8 MB",
    downloadCount: 3500,
    lastUpdated: "2024-08-28",
    tags: ["guía", "estudiante", "manual"],
    filename: "guia-estudiante.pdf"
  },
  {
    id: 18,
    title: "Manual para Padres de Familia",
    description: "Guía informativa para padres sobre procesos y servicios",
    category: "padres",
    type: "pdf",
    size: "1.4 MB",
    downloadCount: 2400,
    lastUpdated: "2024-08-18",
    tags: ["padres", "familia", "información"],
    filename: "manual-padres-familia.pdf"
  }
];

// Get all documents or filtered documents
router.get('/', (req, res) => {
  try {
    const { category, type, search } = req.query;
    
    let filteredDocs = [...documentsDB];
    
    // Apply filters
    if (category && category !== 'all') {
      filteredDocs = filteredDocs.filter(doc => doc.category === category);
    }
    
    if (type && type !== 'all') {
      filteredDocs = filteredDocs.filter(doc => doc.type === type);
    }
    
    if (search) {
      const searchTerm = search.toString().toLowerCase();
      filteredDocs = filteredDocs.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm) ||
        doc.description.toLowerCase().includes(searchTerm) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    res.json({
      success: true,
      documents: filteredDocs,
      total: filteredDocs.length
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los documentos'
    });
  }
});

// Get document by ID
router.get('/:id', (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const document = documentsDB.find(doc => doc.id === documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
    
    res.json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el documento'
    });
  }
});

// Download document
router.get('/:id/download', async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const document = documentsDB.find(doc => doc.id === documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
    
    // In a real implementation, check if file exists
    const filePath = path.join(process.cwd(), 'public', 'documents', document.filename);
    
    try {
      await fs.access(filePath);
      
      // Increment download count (in a real app, update database)
      document.downloadCount++;
      
      // Set proper headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      // Send file
      res.sendFile(filePath);
    } catch (fileError) {
      // File doesn't exist, return sample PDF content or redirect
      res.status(404).json({
        success: false,
        message: 'Archivo no encontrado en el servidor'
      });
    }
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar el documento'
    });
  }
});

// Track document view/access
router.post('/:id/track', (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const document = documentsDB.find(doc => doc.id === documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
    
    // In a real implementation, you would track analytics here
    // For now, just return success
    res.json({
      success: true,
      message: 'Acceso registrado'
    });
  } catch (error) {
    console.error('Error tracking document access:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar el acceso'
    });
  }
});

// Get document statistics
router.get('/stats/overview', (req, res) => {
  try {
    const stats = {
      totalDocuments: documentsDB.length,
      totalDownloads: documentsDB.reduce((sum, doc) => sum + doc.downloadCount, 0),
      categoriesCount: {
        formatos: documentsDB.filter(doc => doc.category === 'formatos').length,
        reglamentos: documentsDB.filter(doc => doc.category === 'reglamentos').length,
        academicos: documentsDB.filter(doc => doc.category === 'academicos').length,
        administrativos: documentsDB.filter(doc => doc.category === 'administrativos').length,
        estudiantes: documentsDB.filter(doc => doc.category === 'estudiantes').length,
        padres: documentsDB.filter(doc => doc.category === 'padres').length
      },
      mostDownloaded: documentsDB
        .sort((a, b) => b.downloadCount - a.downloadCount)
        .slice(0, 5),
      recentlyUpdated: documentsDB
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
        .slice(0, 5)
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting document statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas'
    });
  }
});

export default router;