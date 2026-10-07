import { PrismaClient } from '@prisma/client';
import { Measurement, TelemetryQueryFilters } from '../domain/measurement.entity';
import { TelemetryRepository } from '../domain/telemetry.repository';

export class PrismaTelemetryRepository implements TelemetryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(measurement: Measurement): Promise<Measurement> {
    const record = await this.prisma.measurement.create({
      data: {
        deviceId: measurement.deviceId,
        recordedAt: measurement.recordedAt,
        temperature: measurement.temperature,
        humidity: measurement.humidity,
        soilMoisture: measurement.soilMoisture,
        light: measurement.light,
        co2: measurement.co2,
        waterPump: measurement.waterPump,
        exhaustFan: measurement.exhaustFan,
        growLight: measurement.growLight,
      },
    });

    return record;
  }

  async findLatestByDevice(deviceId: string): Promise<Measurement | null> {
    const record = await this.prisma.measurement.findFirst({
      where: { deviceId },
      orderBy: { recordedAt: 'desc' },
    });

    return record;
  }

  async findHistoryByDevice(filters: TelemetryQueryFilters): Promise<Measurement[]> {
    const { deviceId, from, to, limit = 100 } = filters;

    const whereClause: {
      deviceId: string;
      recordedAt?: { gte?: Date; lte?: Date };
    } = {
      deviceId,
    };

    if (from || to) {
      whereClause.recordedAt = {};
      if (from) whereClause.recordedAt.gte = from;
      if (to) whereClause.recordedAt.lte = to;
    }

    const records = await this.prisma.measurement.findMany({
      where: whereClause,
      orderBy: { recordedAt: 'desc' },
      take: Math.min(limit, 1000), // Protección contra consultas excesivas
    });

    return records;
  }
}
