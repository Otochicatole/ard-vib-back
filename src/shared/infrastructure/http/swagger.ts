import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from '../../config/env';

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: '🌿 API de Monitoreo de Vivero (back-vib)',
    version: '1.0.0',
    description:
      'Backend para la recepción de mediciones IoT de microcontroladores (Arduino/ESP32) y consulta de métricas e históricos para el vivero.',
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: 'Servidor local de desarrollo',
    },
  ],
  tags: [
    { name: 'Telemetría', description: 'Recepción y consulta de mediciones ambientales y actuadores' },
    { name: 'Dispositivos', description: 'Gestión y consulta de nodos/Arduinos registrados' },
    { name: 'Sistema', description: 'Salud y monitoreo del servicio backend' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Verificar estado del servicio',
        responses: {
          '200': {
            description: 'Servicio operando normalmente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'back-vib' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/telemetry': {
      post: {
        tags: ['Telemetría'],
        summary: 'Registrar nueva medición desde un Arduino / dispositivo IoT',
        description:
          'Recibe datos de sensores ambientales y estados de actuadores. Si el dispositivo no existía previamente, se auto-registra automáticamente.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RecordTelemetryInput' },
              example: {
                deviceId: 'vivero-nodo-01',
                temperature: 24.5,
                humidity: 65.2,
                soilMoisture: 52.0,
                light: 1200,
                co2: 430,
                waterPump: false,
                exhaustFan: true,
                growLight: true,
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Medición registrada exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Medición registrada exitosamente' },
                    data: { $ref: '#/components/schemas/Measurement' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Error de validación en los datos enviados',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' },
              },
            },
          },
        },
      },
    },
    '/api/telemetry/{deviceId}/latest': {
      get: {
        tags: ['Telemetría'],
        summary: 'Obtener última medición registrada (Estado en vivo para Dashboard)',
        parameters: [
          {
            name: 'deviceId',
            in: 'path',
            required: true,
            description: 'Identificador del dispositivo / nodo IoT',
            schema: { type: 'string', example: 'vivero-nodo-01' },
          },
        ],
        responses: {
          '200': {
            description: 'Última medición encontrada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Measurement' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Dispositivo no encontrado o sin lecturas',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
    },
    '/api/telemetry/{deviceId}/history': {
      get: {
        tags: ['Telemetría'],
        summary: 'Obtener histórico de mediciones para gráficos y tendencias',
        parameters: [
          {
            name: 'deviceId',
            in: 'path',
            required: true,
            description: 'Identificador del dispositivo',
            schema: { type: 'string', example: 'vivero-nodo-01' },
          },
          {
            name: 'from',
            in: 'query',
            required: false,
            description: 'Fecha/hora inicial (ISO 8601)',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'to',
            in: 'query',
            required: false,
            description: 'Fecha/hora final (ISO 8601)',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: 'Límite de registros a recuperar (máximo 1000)',
            schema: { type: 'integer', default: 100, maximum: 1000 },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de mediciones ordenadas cronológicamente (más recientes primero)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'integer', example: 50 },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Measurement' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/devices': {
      get: {
        tags: ['Dispositivos'],
        summary: 'Listar todos los dispositivos registrados',
        responses: {
          '200': {
            description: 'Lista de dispositivos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Device' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Dispositivos'],
        summary: 'Registrar o actualizar manualmente un dispositivo',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterDeviceInput' },
              example: {
                id: 'vivero-nodo-02',
                name: 'Sensor Sector Huerto',
                location: 'Invernadero 2 - Fila Central',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Dispositivo registrado o actualizado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Device' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Error de validación en los datos del dispositivo',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      RecordTelemetryInput: {
        type: 'object',
        required: ['deviceId'],
        properties: {
          deviceId: { type: 'string', example: 'vivero-nodo-01' },
          recordedAt: { type: 'string', format: 'date-time', description: 'Opcional (se asigna fecha actual si no se provee)' },
          temperature: { type: 'number', minimum: -40, maximum: 85, example: 24.5, description: '°C' },
          humidity: { type: 'number', minimum: 0, maximum: 100, example: 65.2, description: '% humedad ambiental' },
          soilMoisture: { type: 'number', minimum: 0, maximum: 100, example: 52.0, description: '% humedad sustrato' },
          light: { type: 'number', minimum: 0, example: 1200, description: 'Lux' },
          co2: { type: 'number', minimum: 0, example: 430, description: 'ppm' },
          waterPump: { type: 'boolean', example: false, description: 'Estado bomba de agua' },
          exhaustFan: { type: 'boolean', example: true, description: 'Estado extractor' },
          growLight: { type: 'boolean', example: true, description: 'Estado luz de cultivo' },
        },
      },
      Measurement: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          deviceId: { type: 'string' },
          recordedAt: { type: 'string', format: 'date-time' },
          temperature: { type: 'number', nullable: true },
          humidity: { type: 'number', nullable: true },
          soilMoisture: { type: 'number', nullable: true },
          light: { type: 'number', nullable: true },
          co2: { type: 'number', nullable: true },
          waterPump: { type: 'boolean', nullable: true },
          exhaustFan: { type: 'boolean', nullable: true },
          growLight: { type: 'boolean', nullable: true },
        },
      },
      RegisterDeviceInput: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'string', example: 'vivero-nodo-01' },
          name: { type: 'string', example: 'Sensor Sector Huerto' },
          location: { type: 'string', nullable: true, example: 'Invernadero 2' },
        },
      },
      Device: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          location: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Error de validación en la petición' },
          issues: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: { type: 'string', example: 'temperature' },
                message: { type: 'string', example: 'Temperatura fuera de rango físico máximo (85°C)' },
              },
            },
          },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Recurso no encontrado' },
        },
      },
    },
  },
};

export function setupSwagger(app: Application): void {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customSiteTitle: 'Vivero IoT API Docs',
      customCss: '.swagger-ui .topbar { display: none }',
    })
  );
}
