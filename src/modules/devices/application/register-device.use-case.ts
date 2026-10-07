import { Device, CreateDeviceDTO } from '../domain/device.entity';
import { DeviceRepository } from '../domain/device.repository';

export class RegisterDeviceUseCase {
  constructor(private readonly deviceRepository: DeviceRepository) {}

  async execute(dto: CreateDeviceDTO): Promise<Device> {
    return this.deviceRepository.save(dto);
  }
}
