export interface Measurement {
  readonly id?: string;
  readonly deviceId: string;
  readonly recordedAt: Date;
  readonly temperature: number | null;
  readonly humidity: number | null;
  readonly soilMoisture: number | null;
  readonly light: number | null;
  readonly co2: number | null;
  readonly waterPump: boolean | null;
  readonly exhaustFan: boolean | null;
  readonly growLight: boolean | null;
}

export interface RecordTelemetryCommand {
  readonly deviceId: string;
  readonly recordedAt?: Date;
  readonly temperature?: number | null;
  readonly humidity?: number | null;
  readonly soilMoisture?: number | null;
  readonly light?: number | null;
  readonly co2?: number | null;
  readonly waterPump?: boolean | null;
  readonly exhaustFan?: boolean | null;
  readonly growLight?: boolean | null;
}

export interface TelemetryQueryFilters {
  readonly deviceId: string;
  readonly from?: Date;
  readonly to?: Date;
  readonly limit?: number;
}
