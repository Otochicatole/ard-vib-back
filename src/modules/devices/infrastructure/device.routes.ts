import { Router } from 'express';
import { DeviceController } from './device.controller';
import { PrismaDeviceRepository } from './prisma-device.repository';
import { GetDevicesUseCase } from '../application/get-devices.use-case';
import { RegisterDeviceUseCase } from '../application/register-device.use-case';
import { prisma } from '../../../shared/infrastructure/database/prisma';

export function createDeviceRouter(): Router {
  const router = Router();

  // Composición de dependencias (IoC / Dependency Injection manual)
  const deviceRepository = new PrismaDeviceRepository(prisma);
  const getDevicesUseCase = new GetDevicesUseCase(deviceRepository);
  const registerDeviceUseCase = new RegisterDeviceUseCase(deviceRepository);
  const deviceController = new DeviceController(getDevicesUseCase, registerDeviceUseCase);

  router.get('/', deviceController.getAll);
  router.post('/', deviceController.register);

  return router;
}
