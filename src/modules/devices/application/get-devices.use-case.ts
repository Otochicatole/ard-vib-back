import { Device } from '../domain/device.entity';
import { DeviceRepository } from '../domain/device.repository';

export class GetDevicesUseCase {
  constructor(private readonly deviceRepository: DeviceRepository) {}

  async execute(): Promise<Device[]> {
    return this.deviceRepository.findAll();
  }
}
