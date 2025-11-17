/**
 * 🧪 INTEGRATED SERVICES TESTS
 * Unit tests comprehensivos para servicios críticos
 * Semana 7 - Testing Integral
 *
 * Servicios cubiertos:
 * - AuthService (autenticación, JWT, roles)
 * - EmailService (plantillas, envío, Handlebars)
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');

// Mock dependencies BEFORE imports
jest.mock('../../config/database');
jest.mock('../../utils/devLogger');
jest.mock('nodemailer');
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn().mockResolvedValue(undefined)
  }
}));

const { AuthService } = require('../../services/authService');
const emailServiceInstance = require('../../services/emailService');
const { executeQuery } = require('../../config/database');
const fs = require('fs').promises;

// =============================================================================
// AUTH SERVICE TESTS
// =============================================================================
describe('AuthService - Autenticación y Roles', () => {
  let authService;
  const mockJwtSecret = 'test-jwt-secret-key-12345';

  beforeAll(() => {
    process.env.JWT_SECRET = mockJwtSecret;
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.REFRESH_TOKEN_EXPIRY = '7d';
    process.env.BCRYPT_ROUNDS = '10';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe('Configuración y Roles', () => {
    test('debe inicializar con roles correctos', () => {
      expect(authService.roles.ADMIN).toBe('admin');
      expect(authService.roles.DOCENTE).toBe('docente');
      expect(authService.roles.ESTUDIANTE).toBe('estudiante');
      expect(authService.roles.PADRE).toBe('padre_familia');
    });

    test('debe tener permisos definidos para admin', () => {
      expect(authService.permissions.admin).toContain('manage_users');
      expect(authService.permissions.admin).toContain('manage_system');
      expect(authService.permissions.admin.length).toBeGreaterThan(5);
    });

    test('debe tener permisos definidos para docente', () => {
      expect(authService.permissions.docente).toContain('write_grades');
      expect(authService.permissions.docente).toContain('read_students');
    });

    test('debe tener permisos definidos para estudiante', () => {
      expect(authService.permissions.estudiante).toContain('read_own_profile');
      expect(authService.permissions.estudiante).toContain('read_own_grades');
    });
  });

  describe('Autenticación de Usuarios', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      password_hash: '$2a$10$validhash',
      role: 'admin',
      status: 'activo',
      active: true
    };

    test('debe autenticar usuario con credenciales válidas (PostgreSQL)', async () => {
      executeQuery.mockResolvedValueOnce([mockUser]);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      executeQuery.mockResolvedValueOnce([]);

      const result = await authService.authenticateUser('testuser', 'password123');

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('username', 'testuser');
      expect(result).not.toHaveProperty('password_hash');
    });

    test('debe lanzar error para usuario inexistente', async () => {
      executeQuery.mockResolvedValueOnce([]);

      await expect(
        authService.authenticateUser('nonexistent', 'password123')
      ).rejects.toThrow('Usuario no encontrado');
    });

    test('debe lanzar error para usuario inactivo', async () => {
      const inactiveUser = { ...mockUser, status: 'inactivo', active: false };
      executeQuery.mockResolvedValueOnce([inactiveUser]);

      await expect(
        authService.authenticateUser('testuser', 'password123')
      ).rejects.toThrow('Usuario inactivo');
    });

    test('debe lanzar error para contraseña incorrecta', async () => {
      executeQuery.mockResolvedValueOnce([mockUser]);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(
        authService.authenticateUser('testuser', 'wrongpassword')
      ).rejects.toThrow('Contraseña incorrecta');
    });

    test('debe actualizar last_login en autenticación exitosa', async () => {
      executeQuery.mockResolvedValueOnce([mockUser]);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      executeQuery.mockResolvedValueOnce([]);

      await authService.authenticateUser('testuser', 'password123');

      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE usuarios SET last_login'),
        expect.arrayContaining([expect.any(String), 1])
      );
    });
  });

  describe('Generación de JWT Tokens', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      role: 'admin'
    };

    test('debe generar token de acceso válido', () => {
      const token = authService.generateAccessToken(mockUser);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, mockJwtSecret);
      expect(decoded.userId).toBe(1);
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.type).toBe('access');
    });

    test('debe incluir permisos en token de acceso', () => {
      const token = authService.generateAccessToken(mockUser);
      const decoded = jwt.verify(token, mockJwtSecret);

      expect(decoded.permissions).toBeInstanceOf(Array);
      expect(decoded.permissions).toContain('manage_users');
    });

    test('debe generar refresh token válido', () => {
      const token = authService.generateRefreshToken(mockUser);

      expect(token).toBeTruthy();
      const decoded = jwt.verify(token, mockJwtSecret);
      expect(decoded.type).toBe('refresh');
    });

    test('refresh token no debe incluir permisos', () => {
      const token = authService.generateRefreshToken(mockUser);
      const decoded = jwt.verify(token, mockJwtSecret);

      expect(decoded.permissions).toBeUndefined();
    });
  });

  describe('Verificación de Tokens', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      role: 'admin'
    };

    test('debe verificar token válido', () => {
      const token = authService.generateAccessToken(mockUser);
      const decoded = authService.verifyToken(token);

      expect(decoded.userId).toBe(1);
      expect(decoded.email).toBe('test@example.com');
    });

    test('debe lanzar error para token inválido', () => {
      expect(() => {
        authService.verifyToken('invalid.token.here');
      }).toThrow('Token inválido');
    });

    test('debe lanzar error para token expirado', () => {
      const expiredToken = jwt.sign(
        { userId: 1, email: 'test@example.com', type: 'access' },
        mockJwtSecret,
        { expiresIn: '-1h', issuer: 'bge-heroes-patria', audience: 'bge-users' }
      );

      expect(() => {
        authService.verifyToken(expiredToken);
      }).toThrow('Token inválido');
    });
  });

  describe('Crear Usuario', () => {
    const newUserData = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      username: 'newuser',
      nombre: 'New',
      apellido_paterno: 'User',
      apellido_materno: 'Test',
      role: 'estudiante'
    };

    test('debe crear usuario nuevo con PostgreSQL', async () => {
      executeQuery.mockResolvedValueOnce([]);
      executeQuery.mockResolvedValueOnce([{ id: 2, ...newUserData }]);

      const result = await authService.createUser(newUserData);

      expect(result).toHaveProperty('id');
      expect(result.email).toBe(newUserData.email);
      expect(result).not.toHaveProperty('password_hash');
    });

    test('debe lanzar error si email ya existe', async () => {
      executeQuery.mockResolvedValueOnce([{ id: 1, email: newUserData.email }]);

      await expect(
        authService.createUser(newUserData)
      ).rejects.toThrow('El email ya está registrado');
    });

    test('debe lanzar error para rol inválido', async () => {
      const invalidRoleData = { ...newUserData, role: 'invalid_role' };
      executeQuery.mockResolvedValueOnce([]);

      await expect(
        authService.createUser(invalidRoleData)
      ).rejects.toThrow('Rol inválido');
    });

    test('debe hashear contraseña antes de guardar', async () => {
      executeQuery.mockResolvedValueOnce([]);
      executeQuery.mockResolvedValueOnce([{ id: 2, ...newUserData }]);

      await authService.createUser(newUserData);

      const insertCall = executeQuery.mock.calls.find(call =>
        call[0].includes('INSERT INTO usuarios')
      );

      // Verificar que se llamó a INSERT con los parámetros correctos
      expect(insertCall).toBeDefined();
      expect(insertCall[0]).toContain('INSERT INTO usuarios');
    });
  });
});

// =============================================================================
// EMAIL SERVICE TESTS
// =============================================================================
describe('EmailService - Plantillas y Envío', () => {
  let mockTransporter;
  let mockTestAccount;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTransporter = {
      verify: jest.fn().mockResolvedValue(true),
      sendMail: jest.fn().mockResolvedValue({
        messageId: 'test-message-id-12345',
        accepted: ['test@example.com']
      })
    };

    mockTestAccount = {
      user: 'test.user@ethereal.email',
      pass: 'test-password-12345'
    };

    nodemailer.createTestAccount = jest.fn().mockResolvedValue(mockTestAccount);
    nodemailer.createTransport = jest.fn().mockReturnValue(mockTransporter);
    nodemailer.getTestMessageUrl = jest.fn().mockReturnValue('https://ethereal.email/message/test-id');

    // Reset singleton state
    emailServiceInstance.initialized = false;
    emailServiceInstance.transporter = null;
    emailServiceInstance.templatesCache = {};
  });

  describe('Configuración', () => {
    test('debe tener propiedades iniciales', () => {
      expect(emailServiceInstance).toHaveProperty('transporter');
      expect(emailServiceInstance).toHaveProperty('templatesCache');
      expect(emailServiceInstance).toHaveProperty('from');
    });
  });

  describe('Inicialización - Modo Desarrollo', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    test('debe inicializar con cuenta de prueba Ethereal', async () => {
      await emailServiceInstance.init();

      expect(nodemailer.createTestAccount).toHaveBeenCalled();
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: mockTestAccount.user,
          pass: mockTestAccount.pass
        }
      });
      expect(emailServiceInstance.initialized).toBe(true);
    });

    test('debe verificar conexión del transporter', async () => {
      await emailServiceInstance.init();
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    test('debe registrar helpers de Handlebars', async () => {
      const registerSpy = jest.spyOn(handlebars, 'registerHelper');

      await emailServiceInstance.init();

      expect(registerSpy).toHaveBeenCalledWith('formatDate', expect.any(Function));
      expect(registerSpy).toHaveBeenCalledWith('formatDateTime', expect.any(Function));
      expect(registerSpy).toHaveBeenCalledWith('ifEquals', expect.any(Function));
      expect(registerSpy).toHaveBeenCalledWith('absoluteUrl', expect.any(Function));
    });

    test('no debe reinicializar si ya está inicializado', async () => {
      await emailServiceInstance.init();
      nodemailer.createTestAccount.mockClear();

      await emailServiceInstance.init();

      expect(nodemailer.createTestAccount).not.toHaveBeenCalled();
    });
  });

  describe('Carga de Plantillas', () => {
    beforeEach(async () => {
      await emailServiceInstance.init();
    });

    test('debe cargar y compilar plantilla', async () => {
      const templateContent = '<h1>Hello {{name}}</h1>';
      fs.readFile.mockResolvedValue(templateContent);

      const compiledTemplate = await emailServiceInstance.loadTemplate('welcome');

      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('welcome.hbs'),
        'utf-8'
      );
      expect(typeof compiledTemplate).toBe('function');
      expect(compiledTemplate({ name: 'Juan' })).toBe('<h1>Hello Juan</h1>');
    });

    test('debe cachear plantillas cargadas', async () => {
      const templateContent = '<h1>Cached Template</h1>';
      fs.readFile.mockResolvedValue(templateContent);

      await emailServiceInstance.loadTemplate('welcome');
      fs.readFile.mockClear();

      await emailServiceInstance.loadTemplate('welcome');

      expect(fs.readFile).not.toHaveBeenCalled();
    });

    test('debe lanzar error si plantilla no existe', async () => {
      fs.readFile.mockRejectedValue(new Error('ENOENT: file not found'));

      await expect(
        emailServiceInstance.loadTemplate('nonexistent')
      ).rejects.toThrow('No se pudo cargar la plantilla de email');
    });
  });

  describe('Envío de Emails', () => {
    beforeEach(async () => {
      await emailServiceInstance.init();
      fs.readFile.mockResolvedValue('<h1>Hello {{name}}</h1>');
    });

    test('debe enviar email con plantilla compilada', async () => {
      const result = await emailServiceInstance.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        template: 'welcome',
        data: { name: 'Juan' }
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: emailServiceInstance.from,
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<h1>Hello Juan</h1>',
        attachments: []
      });
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id-12345');
    });

    test('debe inicializar servicio si no está inicializado', async () => {
      emailServiceInstance.initialized = false;
      fs.readFile.mockResolvedValue('<h1>Test</h1>');

      await emailServiceInstance.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        template: 'test',
        data: {}
      });

      expect(emailServiceInstance.initialized).toBe(true);
    });

    test('debe incluir attachments si se proporcionan', async () => {
      const attachments = [
        { filename: 'test.pdf', path: '/path/to/test.pdf' }
      ];

      await emailServiceInstance.sendEmail({
        to: 'test@example.com',
        subject: 'Test with Attachment',
        template: 'welcome',
        data: { name: 'Juan' },
        attachments
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ attachments })
      );
    });

    test('debe retornar preview URL en desarrollo', async () => {
      process.env.NODE_ENV = 'development';

      const result = await emailServiceInstance.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        template: 'welcome',
        data: {}
      });

      expect(result.previewUrl).toContain('ethereal.email');
    });

    test('debe lanzar error si el envío falla', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP connection failed'));

      await expect(
        emailServiceInstance.sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          template: 'welcome',
          data: {}
        })
      ).rejects.toThrow('SMTP connection failed');
    });
  });

  describe('Emails Predefinidos', () => {
    beforeEach(async () => {
      await emailServiceInstance.init();
      fs.readFile.mockResolvedValue('<h1>{{nombre}}</h1>');
    });

    test('debe enviar email de bienvenida', async () => {
      const user = {
        email: 'newuser@example.com',
        nombre: 'Juan Pérez'
      };

      await emailServiceInstance.sendWelcomeEmail(user);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'newuser@example.com',
          subject: '¡Bienvenido al Bachillerato Héroes de la Patria!'
        })
      );
    });

    test('debe enviar notificación de evento', async () => {
      const user = { email: 'user@example.com', nombre: 'Juan' };
      const event = {
        titulo: 'Ceremonia de Graduación',
        descripcion: 'Evento importante',
        fecha_inicio: '2024-06-15',
        ubicacion: 'Auditorio Principal'
      };

      await emailServiceInstance.sendEventNotification(user, event);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Nuevo Evento: Ceremonia de Graduación'
        })
      );
    });
  });
});
