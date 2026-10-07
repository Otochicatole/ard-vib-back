import { Router } from 'express';
import { TelemetryController } from './telemetry.controller';
import { PrismaTelemetryRepository } from './prisma-telemetry.repository';
import { PrismaDeviceRepository } from '../../devices/infrastructure/prisma-device.repository';
import { RecordTelemetryUseCase } from '../application/record-telemetry.use-case';
import { GetLatestTelemetryUseCase } from '../application/get-latest-telemetry.use-case';
import { GetTelemetryHistoryUseCase } from '../application/get-telemetry-history.use-case';
import { prisma } from '../../../shared/infrastructure/database/prisma';

export function createTelemetryRouter(): Router {
  const router = Router();

  // Inyección de dependencias
  const telemetryRepository = new PrismaTelemetryRepository(prisma);
  const deviceRepository = new PrismaDeviceRepository(prisma);

  const recordTelemetryUseCase = new RecordTelemetryUseCase(telemetryRepository, deviceRepository);
  const getLatestTelemetryUseCase = new GetLatestTelemetryUseCase(telemetryRepository);
  const getTelemetryHistoryUseCase = new GetTelemetryHistoryUseCase(telemetryRepository);

  const telemetryController = new TelemetryController(
    recordTelemetryUseCase,
    getLatestTelemetryUseCase,
    getTelemetryHistoryUseCase
  );

  // Endpoints HTTP
  // 1. Recepción de datos del Arduino/IoT
  router.post('/', telemetryController.record);

  // 2. Consulta de último estado en tiempo real para el dashboard
  router.get('/:deviceId/latest', telemetryController.getLatest);

  // 3. Consulta de histórico para gráficos y métricas
  router.get('/:deviceId/history', telemetryController.getHistory);

  return router;
}
