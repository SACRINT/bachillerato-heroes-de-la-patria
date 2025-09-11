import { Router, Request, Response } from 'express';
import { z } from 'zod';
import nodemailer from 'nodemailer';

const router = Router();

// Validation schemas
const ContactMessageSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  
  email: z.string()
    .email('Debe proporcionar un email válido')
    .max(100, 'El email no puede exceder 100 caracteres'),
  
  subject: z.string()
    .min(5, 'El asunto debe tener al menos 5 caracteres')
    .max(100, 'El asunto no puede exceder 100 caracteres')
    .optional(),
  
  message: z.string()
    .min(10, 'El mensaje debe tener al menos 10 caracteres')
    .max(1000, 'El mensaje no puede exceder 1000 caracteres'),
  
  type: z.enum(['GENERAL', 'ACADEMIC', 'ADMINISTRATIVE', 'TECHNICAL', 'ADMISSION'])
    .default('GENERAL')
});

const ComplaintSuggestionSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  
  email: z.string()
    .email('Debe proporcionar un email válido')
    .max(100, 'El email no puede exceder 100 caracteres'),
  
  type: z.enum(['COMPLAINT', 'SUGGESTION', 'COMPLIMENT']),
  
  description: z.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
});

// Email transporter configuration
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Submit contact form
 * POST /api/contact
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate request data
    const validatedData = ContactMessageSchema.parse(req.body);
    
    // TODO: Save to database when Prisma is ready
    // const contactMessage = await prisma.contactMessage.create({
    //   data: validatedData
    // });
    
    // Send notification email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = createEmailTransporter();
        
        const mailOptions = {
          from: process.env.EMAIL_FROM || validatedData.email,
          to: process.env.EMAIL_TO || '21ebh0200x.sep@gmail.com',
          subject: `[BGE Héroes de la Patria] ${validatedData.subject || 'Nuevo mensaje de contacto'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #1976D2, #1565C0); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">📧 Nuevo mensaje de contacto</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Bachillerato General Estatal "Héroes de la Patria"</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #1976D2; margin-top: 0;">Información del remitente</h2>
                  <p><strong>Nombre:</strong> ${validatedData.name}</p>
                  <p><strong>Email:</strong> ${validatedData.email}</p>
                  <p><strong>Tipo:</strong> ${getContactTypeLabel(validatedData.type)}</p>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px;">
                  <h2 style="color: #1976D2; margin-top: 0;">Mensaje</h2>
                  <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #1976D2;">
                    ${validatedData.message.replace(/\n/g, '<br>')}
                  </div>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 5px; font-size: 12px; color: #666;">
                  <p style="margin: 0;">Este mensaje fue enviado desde el formulario de contacto del sitio web oficial.</p>
                  <p style="margin: 5px 0 0 0;">Fecha: ${new Date().toLocaleString('es-MX')}</p>
                </div>
              </div>
            </div>
          `
        };
        
        await transporter.sendMail(mailOptions);
        console.log('Notification email sent successfully');
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
        // Don't fail the request if email fails, just log it
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Mensaje enviado correctamente. Te responderemos pronto.',
      data: {
        id: `temp_${Date.now()}`, // TODO: Use real ID from database
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Contact form error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos de formulario inválidos',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'No se pudo procesar tu mensaje. Por favor intenta nuevamente.'
    });
  }
});

/**
 * Submit complaint/suggestion form  
 * POST /api/contact/complaint
 */
router.post('/complaint', async (req: Request, res: Response) => {
  try {
    const validatedData = ComplaintSuggestionSchema.parse(req.body);
    
    // TODO: Save to database when Prisma is ready
    
    // Send notification email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = createEmailTransporter();
        
        const typeLabels = {
          'COMPLAINT': 'Queja',
          'SUGGESTION': 'Sugerencia', 
          'COMPLIMENT': 'Felicitación'
        };
        
        const mailOptions = {
          from: process.env.EMAIL_FROM || validatedData.email,
          to: process.env.EMAIL_TO || '21ebh0200x.sep@gmail.com',
          subject: `[BGE Héroes de la Patria] ${typeLabels[validatedData.type]} de ${validatedData.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #1976D2, #1565C0); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">📝 ${typeLabels[validatedData.type]}</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Bachillerato General Estatal "Héroes de la Patria"</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #1976D2; margin-top: 0;">Información</h2>
                  <p><strong>Nombre:</strong> ${validatedData.name}</p>
                  <p><strong>Email:</strong> ${validatedData.email}</p>
                  <p><strong>Tipo:</strong> ${typeLabels[validatedData.type]}</p>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px;">
                  <h2 style="color: #1976D2; margin-top: 0;">Descripción</h2>
                  <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #1976D2;">
                    ${validatedData.description.replace(/\n/g, '<br>')}
                  </div>
                </div>
              </div>
            </div>
          `
        };
        
        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Tu mensaje ha sido recibido. Gracias por tu retroalimentación.',
      data: {
        id: `temp_${Date.now()}`,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Complaint/suggestion form error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos de formulario inválidos',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * Get contact form statistics (for admin)
 * GET /api/contact/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // TODO: Implement with real database queries
    const mockStats = {
      total_messages: 0,
      messages_by_type: {
        GENERAL: 0,
        ACADEMIC: 0,
        ADMINISTRATIVE: 0,
        TECHNICAL: 0,
        ADMISSION: 0
      },
      messages_by_status: {
        PENDING: 0,
        IN_PROGRESS: 0,
        RESOLVED: 0,
        CLOSED: 0
      },
      response_time_avg: '24 hours',
      last_updated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: mockStats
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Error retrieving statistics'
    });
  }
});

// Helper function to get contact type labels
function getContactTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'GENERAL': 'General',
    'ACADEMIC': 'Académico',
    'ADMINISTRATIVE': 'Administrativo', 
    'TECHNICAL': 'Técnico',
    'ADMISSION': 'Admisiones'
  };
  
  return labels[type] || type;
}

export default router;