import { Request, Response, NextFunction } from 'express';
import { RecordTelemetryUseCase } from '../application/record-telemetry.use-case';
import { GetLatestTelemetryUseCase } from '../application/get-latest-telemetry.use-case';
import { GetTelemetryHistoryUseCase } from '../application/get-telemetry-history.use-case';
import { recordTelemetrySchema, telemetryHistoryQuerySchema } from './telemetry.schema';

export class TelemetryController {
  constructor(
    private readonly recordTelemetryUseCase: RecordTelemetryUseCase,
    private readonly getLatestTelemetryUseCase: GetLatestTelemetryUseCase,
    private readonly getTelemetryHistoryUseCase: GetTelemetryHistoryUseCase
  ) {}

  record = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedInput = recordTelemetrySchema.parse(req.body);
      const measurement = await this.recordTelemetryUseCase.execute(validatedInput);

      res.status(201).json({
        success: true,
        message: 'Medición registrada exitosamente',
        data: measurement,
      });
    } catch (error) {
      next(error);
    }
  };

  getLatest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { deviceId } = req.params;
      const latest = await this.getLatestTelemetryUseCase.execute(deviceId);

      res.status(200).json({
        success: true,
        data: latest,
      });
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { deviceId } = req.params;
      const query = telemetryHistoryQuerySchema.parse(req.query);

      const history = await this.getTelemetryHistoryUseCase.execute({
        deviceId,
        from: query.from,
        to: query.to,
        limit: query.limit,
      });

      res.status(200).json({
        success: true,
        count: history.length,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  };
}
