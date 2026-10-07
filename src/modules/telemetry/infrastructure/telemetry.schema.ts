import { z } from 'zod';

export const recordTelemetrySchema = z.object({
  deviceId: z
    .string({ required_error: 'El identificador del dispositivo (deviceId) es obligatorio' })
    .min(2, 'El deviceId debe tener al menos 2 caracteres')
    .max(50),
  recordedAt: z.coerce.date().optional(),
  temperature: z
    .number({ invalid_type_error: 'La temperatura debe ser un número' })
    .min(-40, 'Temperatura fuera de rango físico mínimo (-40°C)')
    .max(85, 'Temperatura fuera de rango físico máximo (85°C)')
    .optional()
    .nullable(),
  humidity: z
    .number({ invalid_type_error: 'La humedad debe ser un número' })
    .min(0, 'La humedad no puede ser inferior a 0%')
    .max(100, 'La humedad no puede ser superior a 100%')
    .optional()
    .nullable(),
  soilMoisture: z
    .number({ invalid_type_error: 'La humedad del suelo debe ser un número' })
    .min(0, 'La humedad del suelo no puede ser inferior a 0%')
    .max(100, 'La humedad del suelo no puede ser superior a 100%')
    .optional()
    .nullable(),
  light: z
    .number({ invalid_type_error: 'La luminosidad debe ser un número' })
    .min(0, 'La luminosidad no puede ser negativa')
    .optional()
    .nullable(),
  co2: z
    .number({ invalid_type_error: 'El nivel de CO2 debe ser un número' })
    .min(0, 'El nivel de CO2 no puede ser negativo')
    .optional()
    .nullable(),
  waterPump: z.boolean().optional().nullable(),
  exhaustFan: z.boolean().optional().nullable(),
  growLight: z.boolean().optional().nullable(),
});

export const telemetryHistoryQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(1000).default(100),
});

export type RecordTelemetryInput = z.infer<typeof recordTelemetrySchema>;
export type TelemetryHistoryQuery = z.infer<typeof telemetryHistoryQuerySchema>;
