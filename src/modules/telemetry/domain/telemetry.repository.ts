import { Measurement, TelemetryQueryFilters } from './measurement.entity';

export interface TelemetryRepository {
  save(measurement: Measurement): Promise<Measurement>;
  findLatestByDevice(deviceId: string): Promise<Measurement | null>;
  findHistoryByDevice(filters: TelemetryQueryFilters): Promise<Measurement[]>;
}
