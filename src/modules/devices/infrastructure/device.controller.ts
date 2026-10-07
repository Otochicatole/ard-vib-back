import { Request, Response, NextFunction } from 'express';
import { GetDevicesUseCase } from '../application/get-devices.use-case';
import { RegisterDeviceUseCase } from '../application/register-device.use-case';
import { registerDeviceSchema } from './device.schema';

export class DeviceController {
  constructor(
    private readonly getDevicesUseCase: GetDevicesUseCase,
    private readonly registerDeviceUseCase: RegisterDeviceUseCase
  ) {}

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const devices = await this.getDevicesUseCase.execute();
      res.status(200).json({
        success: true,
        data: devices,
      });
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedInput = registerDeviceSchema.parse(req.body);
      const device = await this.registerDeviceUseCase.execute(validatedInput);
      res.status(201).json({
        success: true,
        data: device,
      });
    } catch (error) {
      next(error);
    }
  };
}
