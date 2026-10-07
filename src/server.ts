import { createApp } from './app';
import { env } from './shared/config/env';
import { initializeDatabase, prisma } from './shared/infrastructure/database/prisma';

async function bootstrap() {
  await initializeDatabase();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`🌿 Backend del Vivero (back-vib) activo en: http://localhost:${env.PORT}`);
    console.log(`📡 Endpoints disponibles:`);
    console.log(`   - Documentación Swagger: http://localhost:${env.PORT}/api/docs`);
    console.log(`   - Health:    GET  http://localhost:${env.PORT}/health`);
    console.log(`   - Dispositivos: GET/POST http://localhost:${env.PORT}/api/devices`);
    console.log(`   - Telemetría:   POST http://localhost:${env.PORT}/api/telemetry`);
    console.log(`   - Dashboard:    GET  http://localhost:${env.PORT}/api/telemetry/:deviceId/latest`);
    console.log(`   - Histórico:    GET  http://localhost:${env.PORT}/api/telemetry/:deviceId/history`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\nCerrando servidor (${signal})...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Conexión con base de datos cerrada.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});
