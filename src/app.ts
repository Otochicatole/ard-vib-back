import express, { Application } from 'express';
import cors from 'cors';
import { createDeviceRouter } from './modules/devices/infrastructure/device.routes';
import { createTelemetryRouter } from './modules/telemetry/infrastructure/telemetry.routes';
import { errorHandler } from './shared/infrastructure/http/error-handler.middleware';
import { setupSwagger } from './shared/infrastructure/http/swagger';

export function createApp(): Application {
  const app = express();

  // Middlewares globales
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // Documentación interactiva Swagger UI
  setupSwagger(app);

  // Endpoint de salud del sistema
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'back-vib',
      timestamp: new Date().toISOString(),
    });
  });

  // Módulos de dominio (Screaming Architecture)
  app.use('/api/devices', createDeviceRouter());
  app.use('/api/telemetry', createTelemetryRouter());

  // Middleware global de manejo de errores
  app.use(errorHandler);

  return app;
}
