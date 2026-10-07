import { Measurement, TelemetryQueryFilters } from '../domain/measurement.entity';
import { TelemetryRepository } from '../domain/telemetry.repository';

export class GetTelemetryHistoryUseCase {
  constructor(private readonly telemetryRepository: TelemetryRepository) {}

  async execute(filters: TelemetryQueryFilters): Promise<Measurement[]> {
    return this.telemetryRepository.findHistoryByDevice(filters);
  }
}
