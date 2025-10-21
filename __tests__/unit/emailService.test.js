/**
 * Tests Unitarios para EmailService
 * BGE Héroes de la Patria
 *
 * @jest-environment node
 */

// IMPORTANTE: Los mocks DEBEN declararse ANTES de cualquier import
jest.mock('nodemailer');
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));
jest.mock('handlebars', () => ({
  compile: jest.fn(),
  registerHelper: jest.fn(),
}));

const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;

describe('EmailService', () => {
  let emailService;
  let mockTransporter;
  let mockCompiledTemplate;

  beforeEach(() => {
    // Limpiar todos los mocks antes de cada test
    jest.clearAllMocks();

    // Mock del transporter
    mockTransporter = {
      verify: jest.fn().mockResolvedValue(true),
      sendMail: jest.fn().mockResolvedValue({
        messageId: 'test-message-id-123',
        response: '250 OK',
      }),
    };

    // Mock de nodemailer.createTransport
    nodemailer.createTransport.mockReturnValue(mockTransporter);

    // Mock de nodemailer.createTestAccount para desarrollo
    nodemailer.createTestAccount.mockResolvedValue({
      user: 'test.user@ethereal.email',
      pass: 'test-password',
    });

    // Mock de nodemailer.getTestMessageUrl
    nodemailer.getTestMessageUrl.mockReturnValue('https://ethereal.email/message/test');

    // Mock de handlebars.compile
    mockCompiledTemplate = jest.fn().mockReturnValue('<html>Test Email</html>');
    handlebars.compile.mockReturnValue(mockCompiledTemplate);

    // Mock de fs.readFile
    fs.readFile.mockResolvedValue('<html>{{nombre}}</html>');

    // Obtener instancia de EmailService (singleton)
    emailService = require('../../backend/services/emailService');

    // Resetear estado de inicialización del singleton
    emailService.initialized = false;
    emailService.transporter = null;
    emailService.templatesCache = {};
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('debería inicializar con valores por defecto', () => {
      expect(emailService.transporter).toBeNull();
      expect(emailService.templatesCache).toEqual({});
      expect(emailService.initialized).toBe(false);
      expect(emailService.from).toBeDefined();
    });

    test('debería usar EMAIL_FROM del entorno si está disponible', () => {
      const originalFrom = emailService.from;
      process.env.EMAIL_FROM = 'custom@test.com';
      // Actualizar manualmente el from del singleton para simular re-construcción
      emailService.from = process.env.EMAIL_FROM;
      expect(emailService.from).toBe('custom@test.com');
      // Restaurar
      emailService.from = originalFrom;
      delete process.env.EMAIL_FROM;
    });
  });

  describe('init() - Modo Desarrollo', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    test('debería inicializar con cuenta de prueba Ethereal', async () => {
      await emailService.init();

      expect(nodemailer.createTestAccount).toHaveBeenCalled();
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'test.user@ethereal.email',
          pass: 'test-password',
        },
      });
      expect(mockTransporter.verify).toHaveBeenCalled();
      expect(emailService.initialized).toBe(true);
    });

    test('no debería reinicializar si ya está inicializado', async () => {
      emailService.initialized = true;

      await emailService.init();

      expect(nodemailer.createTestAccount).not.toHaveBeenCalled();
    });

    test('debería registrar Handlebars helpers al inicializar', async () => {
      await emailService.init();

      expect(handlebars.registerHelper).toHaveBeenCalled();
      // Verificar que se registraron los helpers esperados
      const helperNames = handlebars.registerHelper.mock.calls.map(call => call[0]);
      expect(helperNames).toContain('formatDate');
      expect(helperNames).toContain('formatDateTime');
      expect(helperNames).toContain('ifEquals');
      expect(helperNames).toContain('absoluteUrl');
    });
  });

  describe('init() - Modo Producción', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.SMTP_HOST = 'smtp.production.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_SECURE = 'true';
      process.env.SMTP_USER = 'prod@test.com';
      process.env.SMTP_PASS = 'prod-password';
    });

    afterEach(() => {
      process.env.NODE_ENV = 'test';
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_SECURE;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
    });

    test('debería inicializar con configuración de producción', async () => {
      await emailService.init();

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.production.com',
        port: 587,
        secure: true,
        auth: {
          user: 'prod@test.com',
          pass: 'prod-password',
        },
      });
      expect(mockTransporter.verify).toHaveBeenCalled();
      expect(emailService.initialized).toBe(true);
    });
  });

  describe('init() - Manejo de Errores', () => {
    test('debería manejar error en verify()', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      await expect(emailService.init()).rejects.toThrow('Connection failed');
      expect(emailService.initialized).toBe(false);
    });

    test('debería manejar error en createTestAccount()', async () => {
      nodemailer.createTestAccount.mockRejectedValue(new Error('Test account creation failed'));

      await expect(emailService.init()).rejects.toThrow('Test account creation failed');
    });
  });

  describe('loadTemplate()', () => {
    test('debería cargar y compilar una plantilla', async () => {
      const template = await emailService.loadTemplate('welcome');

      expect(fs.readFile).toHaveBeenCalled();
      expect(handlebars.compile).toHaveBeenCalledWith('<html>{{nombre}}</html>');
      expect(template).toBe(mockCompiledTemplate);
    });

    test('debería cachear plantillas cargadas', async () => {
      // Primera llamada
      await emailService.loadTemplate('welcome');

      // Segunda llamada
      await emailService.loadTemplate('welcome');

      // fs.readFile solo debe ser llamado una vez
      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    test('debería retornar plantilla del caché si existe', async () => {
      // Pre-cargar en caché
      emailService.templatesCache['cached-template'] = mockCompiledTemplate;

      const template = await emailService.loadTemplate('cached-template');

      expect(fs.readFile).not.toHaveBeenCalled();
      expect(template).toBe(mockCompiledTemplate);
    });

    test('debería lanzar error si la plantilla no existe', async () => {
      fs.readFile.mockRejectedValue(new Error('ENOENT: no such file'));

      await expect(emailService.loadTemplate('nonexistent')).rejects.toThrow(
        'No se pudo cargar la plantilla de email: nonexistent'
      );
    });
  });

  describe('sendEmail()', () => {
    beforeEach(async () => {
      await emailService.init();
    });

    test('debería enviar email con plantilla correctamente', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        template: 'welcome',
        data: { nombre: 'Juan' },
        attachments: [],
      });

      expect(fs.readFile).toHaveBeenCalled();
      expect(mockCompiledTemplate).toHaveBeenCalledWith({ nombre: 'Juan' });
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: emailService.from,
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<html>Test Email</html>',
        attachments: [],
      });

      expect(result).toEqual({
        success: true,
        messageId: 'test-message-id-123',
        previewUrl: 'https://ethereal.email/message/test',
      });
    });

    test('debería inicializar automáticamente si no está inicializado', async () => {
      emailService.initialized = false;

      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        template: 'welcome',
        data: {},
      });

      expect(emailService.initialized).toBe(true);
    });

    test('debería manejar attachments', async () => {
      const attachments = [
        { filename: 'test.pdf', path: '/path/to/test.pdf' },
      ];

      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test with Attachment',
        template: 'welcome',
        data: {},
        attachments,
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments,
        })
      );
    });

    test('debería lanzar error si falla el envío', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      await expect(
        emailService.sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          template: 'welcome',
          data: {},
        })
      ).rejects.toThrow('SMTP error');
    });
  });

  describe('sendWelcomeEmail()', () => {
    beforeEach(async () => {
      await emailService.init();
    });

    test('debería enviar email de bienvenida con datos correctos', async () => {
      const user = {
        email: 'newuser@example.com',
        nombre: 'Juan Pérez',
      };

      await emailService.sendWelcomeEmail(user);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'newuser@example.com',
          subject: '¡Bienvenido al Bachillerato Héroes de la Patria!',
        })
      );

      expect(mockCompiledTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Juan Pérez',
          email: 'newuser@example.com',
        })
      );
    });
  });

  describe('sendPasswordRecovery()', () => {
    beforeEach(async () => {
      await emailService.init();
    });

    test('debería enviar email de recuperación con token', async () => {
      const user = {
        email: 'user@example.com',
        nombre: 'Juan',
      };
      const resetToken = 'abc123token';

      await emailService.sendPasswordRecovery(user, resetToken);

      expect(mockCompiledTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Juan',
          resetUrl: expect.stringContaining(resetToken),
          expiresIn: '1 hora',
        })
      );
    });
  });

  describe('sendBulkEmails()', () => {
    beforeEach(async () => {
      await emailService.init();
    });

    test('debería enviar múltiples emails correctamente', async () => {
      const emails = [
        { to: 'user1@test.com', subject: 'Test 1', template: 'welcome', data: {} },
        { to: 'user2@test.com', subject: 'Test 2', template: 'welcome', data: {} },
        { to: 'user3@test.com', subject: 'Test 3', template: 'welcome', data: {} },
      ];

      const result = await emailService.sendBulkEmails(emails, 0); // Sin delay para test

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(3);
      expect(result.total).toBe(3);
      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
    });

    test('debería manejar emails fallidos en lote', async () => {
      // Configurar el mock para que falle el segundo email
      mockTransporter.sendMail
        .mockResolvedValueOnce({ messageId: 'msg-1' })
        .mockRejectedValueOnce(new Error('SMTP error'))
        .mockResolvedValueOnce({ messageId: 'msg-3' });

      const emails = [
        { to: 'user1@test.com', subject: 'Test 1', template: 'welcome', data: {} },
        { to: 'user2@test.com', subject: 'Test 2', template: 'welcome', data: {} },
        { to: 'user3@test.com', subject: 'Test 3', template: 'welcome', data: {} },
      ];

      const result = await emailService.sendBulkEmails(emails, 0);

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].error).toBe('SMTP error');
    });

    test('debería respetar el delay entre envíos', async () => {
      jest.useFakeTimers();

      const emails = [
        { to: 'user1@test.com', subject: 'Test 1', template: 'welcome', data: {} },
        { to: 'user2@test.com', subject: 'Test 2', template: 'welcome', data: {} },
      ];

      const promise = emailService.sendBulkEmails(emails, 100);

      // Avanzar timers
      await jest.runAllTimersAsync();

      await promise;

      jest.useRealTimers();
    });
  });

  describe('clearTemplateCache()', () => {
    test('debería limpiar el caché de plantillas', () => {
      // Pre-cargar algunas plantillas en caché
      emailService.templatesCache = {
        welcome: jest.fn(),
        'event-notification': jest.fn(),
      };

      emailService.clearTemplateCache();

      expect(emailService.templatesCache).toEqual({});
    });
  });

  describe('Métodos de Email Específicos', () => {
    beforeEach(async () => {
      await emailService.init();
    });

    test('sendEventNotification() debería enviar con datos del evento', async () => {
      const user = { email: 'user@test.com', nombre: 'Juan' };
      const event = {
        titulo: 'Evento de Prueba',
        descripcion: 'Descripción del evento',
        fecha_inicio: '2025-10-20',
        ubicacion: 'Auditorio',
        slug: 'evento-prueba',
      };

      await emailService.sendEventNotification(user, event);

      expect(mockCompiledTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Juan',
          evento: expect.objectContaining({
            titulo: 'Evento de Prueba',
            slug: 'evento-prueba',
          }),
        })
      );
    });

    test('sendNewsletter() debería incluir URL de unsubscribe', async () => {
      const user = { email: 'user@test.com', nombre: 'Juan', id: 123 };
      const newsletter = {
        asunto: 'Newsletter Octubre',
        titulo: 'Newsletter de Octubre',
        contenido: 'Contenido del newsletter',
      };

      await emailService.sendNewsletter(user, newsletter);

      expect(mockCompiledTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          unsubscribeUrl: expect.stringContaining('/unsubscribe/123'),
        })
      );
    });

    test('sendInscriptionConfirmation() debería enviar confirmación de actividad', async () => {
      const user = { email: 'user@test.com', nombre: 'Juan' };
      const activity = {
        nombre: 'Taller de Matemáticas',
        descripcion: 'Taller avanzado',
        fecha: '2025-10-25',
        ubicacion: 'Aula 101',
      };

      await emailService.sendInscriptionConfirmation(user, activity);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Confirmación de Inscripción: Taller de Matemáticas',
        })
      );
    });

    test('sendNewsNotification() debería enviar notificación de noticia', async () => {
      const user = { email: 'user@test.com', nombre: 'Juan' };
      const noticia = {
        titulo: 'Nueva Noticia',
        resumen: 'Resumen de la noticia',
        slug: 'nueva-noticia',
      };

      await emailService.sendNewsNotification(user, noticia);

      expect(mockCompiledTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          noticia: expect.objectContaining({
            titulo: 'Nueva Noticia',
            slug: 'nueva-noticia',
          }),
        })
      );
    });
  });
});
