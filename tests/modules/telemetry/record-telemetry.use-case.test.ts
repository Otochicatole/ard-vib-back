import { describe, it, expect, beforeEach } from 'vitest';
import { RecordTelemetryUseCase } from '../../../src/modules/telemetry/application/record-telemetry.use-case';
import { TelemetryRepository } from '../../../src/modules/telemetry/domain/telemetry.repository';
import { Measurement, TelemetryQueryFilters } from '../../../src/modules/telemetry/domain/measurement.entity';
import { DeviceRepository } from '../../../src/modules/devices/domain/device.repository';
import { Device, CreateDeviceDTO } from '../../../src/modules/devices/domain/device.entity';

// Mock en memoria de TelemetryRepository (sin I/O ni base de datos)
class InMemoryTelemetryRepository implements TelemetryRepository {
  public measurements: Measurement[] = [];

  async save(measurement: Measurement): Promise<Measurement> {
    const saved: Measurement = {
      ...measurement,
      id: `m-${this.measurements.length + 1}`,
    };
    this.measurements.push(saved);
    return saved;
  }

  async findLatestByDevice(deviceId: string): Promise<Measurement | null> {
    const filtered = this.measurements
      .filter((m) => m.deviceId === deviceId)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
    return filtered[0] ?? null;
  }

  async findHistoryByDevice(filters: TelemetryQueryFilters): Promise<Measurement[]> {
    return this.measurements.filter((m) => m.deviceId === filters.deviceId);
  }
}

// Mock en memoria de DeviceRepository
class InMemoryDeviceRepository implements DeviceRepository {
  public devices: Device[] = [];

  async findById(id: string): Promise<Device | null> {
    return this.devices.find((d) => d.id === id) ?? null;
  }

  async findAll(): Promise<Device[]> {
    return [...this.devices];
  }

  async save(data: CreateDeviceDTO): Promise<Device> {
    const device: Device = {
      id: data.id,
      name: data.name,
      location: data.location ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.devices.push(device);
    return device;
  }

  async exists(id: string): Promise<boolean> {
    return this.devices.some((d) => d.id === id);
  }
}

describe('RecordTelemetryUseCase', () => {
  let telemetryRepo: InMemoryTelemetryRepository;
  let deviceRepo: InMemoryDeviceRepository;
  let useCase: RecordTelemetryUseCase;

  beforeEach(() => {
    telemetryRepo = new InMemoryTelemetryRepository();
    deviceRepo = new InMemoryDeviceRepository();
    useCase = new RecordTelemetryUseCase(telemetryRepo, deviceRepo);
  });

  it('debe registrar una medición de sensores correctamente', async () => {
    const result = await useCase.execute({
      deviceId: 'vivero-nodo-01',
      temperature: 24.5,
      humidity: 60.2,
      soilMoisture: 45.0,
      light: 850,
      co2: 420,
      waterPump: false,
      exhaustFan: true,
      growLight: true,
    });

    expect(result.id).toBeDefined();
    expect(result.deviceId).toBe('vivero-nodo-01');
    expect(result.temperature).toBe(24.5);
    expect(result.humidity).toBe(60.2);
    expect(result.exhaustFan).toBe(true);
    expect(telemetryRepo.measurements).toHaveLength(1);
  });

  it('debe autoregistrar el dispositivo si aún no existe en el sistema', async () => {
    const deviceId = 'nuevo-arduino-02';
    expect(await deviceRepo.exists(deviceId)).toBe(false);

    await useCase.execute({
      deviceId,
      temperature: 21.0,
    });

    expect(await deviceRepo.exists(deviceId)).toBe(true);
  });
});
