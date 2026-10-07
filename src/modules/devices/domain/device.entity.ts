export interface Device {
  readonly id: string;
  readonly name: string;
  readonly location: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateDeviceDTO {
  readonly id: string;
  readonly name: string;
  readonly location?: string | null;
}
