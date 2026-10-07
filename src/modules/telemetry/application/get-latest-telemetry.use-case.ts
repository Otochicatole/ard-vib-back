import { Measurement } from '../domain/measurement.entity';
import { TelemetryRepository } from '../domain/telemetry.repository';
import { NotFoundError } from '../../../shared/domain/errors/app-error';

export class GetLatestTelemetryUseCase {
  constructor(private readonly telemetryRepository: TelemetryRepository) {}

  async execute(deviceId: string): Promise<Measurement> {
    const latest = await this.telemetryRepository.findLatestByDevice(deviceId);
    if (!latest) {
      throw new NotFoundError('Medición para el dispositivo', deviceId);
    }
    return latest;
  }
}
