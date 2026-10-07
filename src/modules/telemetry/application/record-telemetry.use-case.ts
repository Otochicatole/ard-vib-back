import { Measurement, RecordTelemetryCommand } from '../domain/measurement.entity';
import { TelemetryRepository } from '../domain/telemetry.repository';
import { DeviceRepository } from '../../devices/domain/device.repository';

export class RecordTelemetryUseCase {
  constructor(
    private readonly telemetryRepository: TelemetryRepository,
    private readonly deviceRepository: DeviceRepository
  ) {}

  async execute(command: RecordTelemetryCommand): Promise<Measurement> {
    // Si el dispositivo aún no está registrado, se auto-registra para facilitar el despliegue del Arduino
    const deviceExists = await this.deviceRepository.exists(command.deviceId);
    if (!deviceExists) {
      await this.deviceRepository.save({
        id: command.deviceId,
        name: `Dispositivo ${command.deviceId}`,
        location: 'No especificada',
      });
    }

    const measurement: Measurement = {
      deviceId: command.deviceId,
      recordedAt: command.recordedAt ?? new Date(),
      temperature: command.temperature ?? null,
      humidity: command.humidity ?? null,
      soilMoisture: command.soilMoisture ?? null,
      light: command.light ?? null,
      co2: command.co2 ?? null,
      waterPump: command.waterPump ?? null,
      exhaustFan: command.exhaustFan ?? null,
      growLight: command.growLight ?? null,
    };

    return this.telemetryRepository.save(measurement);
  }
}
