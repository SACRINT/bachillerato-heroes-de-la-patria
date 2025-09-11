import { Router, Request, Response } from 'express';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    database?: 'connected' | 'disconnected';
    memory: {
      used: string;
      total: string;
      percentage: string;
    };
  };
}

/**
 * Health check endpoint
 * GET /health
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const memPercentage = ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1);

    const healthData: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0',
      services: {
        // database: await checkDatabaseConnection(), // TODO: Implement when Prisma is ready
        memory: {
          used: `${memUsedMB} MB`,
          total: `${memTotalMB} MB`,
          percentage: `${memPercentage}%`
        }
      }
    };

    res.status(200).json(healthData);
  } catch (error) {
    console.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    });
  }
});

/**
 * Detailed health check for monitoring systems
 * GET /health/detailed
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const memUsage = process.memoryUsage();
    
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0',
      node_version: process.version,
      platform: process.platform,
      architecture: process.arch,
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)} MB`,
        arrayBuffers: `${Math.round(memUsage.arrayBuffers / 1024 / 1024)} MB`
      },
      services: {
        api: 'operational',
        // database: await checkDatabaseConnection(), // TODO: Implement
        // cache: await checkCacheConnection(),        // TODO: Implement
      },
      endpoints: [
        { path: '/health', status: 'operational' },
        { path: '/api/contact', status: 'operational' }
      ]
    };

    res.status(200).json(detailedHealth);
  } catch (error) {
    console.error('Detailed health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed'
    });
  }
});

// TODO: Implement database connection check when Prisma is ready
async function checkDatabaseConnection(): Promise<'connected' | 'disconnected'> {
  try {
    // This will be implemented when we set up Prisma
    // await prisma.$queryRaw`SELECT 1`;
    return 'connected';
  } catch {
    return 'disconnected';
  }
}

export default router;