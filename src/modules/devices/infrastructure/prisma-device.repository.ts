import { PrismaClient } from '@prisma/client';
import { Device, CreateDeviceDTO } from '../domain/device.entity';
import { DeviceRepository } from '../domain/device.repository';

export class PrismaDeviceRepository implements DeviceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Device | null> {
    const record = await this.prisma.device.findUnique({
      where: { id },
    });
    return record;
  }

  async findAll(): Promise<Device[]> {
    return this.prisma.device.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async save(data: CreateDeviceDTO): Promise<Device> {
    const record = await this.prisma.device.upsert({
      where: { id: data.id },
      update: {
        name: data.name,
        location: data.location,
      },
      create: {
        id: data.id,
        name: data.name,
        location: data.location,
      },
    });
    return record;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.device.count({
      where: { id },
    });
    return count > 0;
  }
}
