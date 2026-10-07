import { Device, CreateDeviceDTO } from './device.entity';

export interface DeviceRepository {
  findById(id: string): Promise<Device | null>;
  findAll(): Promise<Device[]>;
  save(data: CreateDeviceDTO): Promise<Device>;
  exists(id: string): Promise<boolean>;
}
