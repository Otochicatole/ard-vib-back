# back-vib — API IoT para monitoreo de viveros

Backend modular en TypeScript que recibe telemetría de nodos Arduino/ESP32, la persiste en SQLite y expone endpoints REST para el dashboard **Vivero Smart** (`font-vib` / [ard-vib-front](https://github.com/Otochicatole/ard-vib-front)).

**Repositorio:** [github.com/Otochicatole/ard-vib-back](https://github.com/Otochicatole/ard-vib-back)

---

## Tabla de contenidos

1. [Descripción](#descripción)
2. [Stack tecnológico](#stack-tecnológico)
3. [Arquitectura](#arquitectura)
4. [Estructura del proyecto](#estructura-del-proyecto)
5. [Requisitos previos](#requisitos-previos)
6. [Instalación y arranque](#instalación-y-arranque)
7. [Variables de entorno](#variables-de-entorno)
8. [API REST](#api-rest)
9. [Modelo de datos](#modelo-de-datos)
10. [Swagger](#swagger)
11. [Seed de datos de prueba](#seed-de-datos-de-prueba)
12. [Pruebas](#pruebas)
13. [Scripts npm](#scripts-npm)
14. [Integración con el frontend](#integración-con-el-frontend)
15. [Convenciones para contribuidores](#convenciones-para-contribuidores)

---

## Descripción

El sistema modela un vivero/invernadero con:

- **Dispositivos (nodos IoT):** sensores/actuadores identificados por un `id` estable (ej. `vivero-nodo-01`).
- **Mediciones (tabla ancha):** temperatura, humedad ambiental, humedad de suelo, luz, CO₂ y estados de actuadores (bomba, extractor, luz de cultivo) en cada registro.

Casos de uso típicos:

| Actor | Acción |
|--------|--------|
| Arduino / ESP32 | `POST /api/telemetry` con lecturas periódicas |
| Dashboard web | Listar dispositivos, ver última medición e historial |
| Operador / demos | Registrar dispositivos y cargar datos seed |

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Runtime | Node.js + TypeScript (`strict`) |
| HTTP | Express 4 |
| Validación | Zod (body, query, env) |
| Persistencia | Prisma 5 + SQLite |
| Documentación API | swagger-ui-express (OpenAPI 3.0) |
| CORS | `cors` |
| Config | `dotenv` + esquema Zod |
| Tests | Vitest |
| Dev | `tsx watch` |

---

## Arquitectura

Se aplica **Screaming Architecture** (carpetas por dominio de negocio) y capas **Clean / Hexagonal** dentro de cada módulo:

```
Módulo (devices | telemetry)
├── domain/          → entidades, puertos (interfaces de repositorio), reglas puras
├── application/     → casos de uso (orquestación, sin Express)
└── infrastructure/  → rutas, controladores, esquemas Zod, adaptadores Prisma
```

Reglas clave (detalle en [`AGENTS.md`](./AGENTS.md)):

- Los **casos de uso no importan Express**; reciben datos tipados y devuelven resultados o lanzan errores de dominio.
- Los **controladores son delgados**: validar → invocar use case → mapear HTTP.
- **Inyección de dependencias manual** en las factories de routers (`createDeviceRouter`, `createTelemetryRouter`).

```
Cliente HTTP
    ↓
Rutas / Controladores (infrastructure)
    ↓
Casos de uso (application)
    ↓
Puertos (domain) ←── implementados por ──→ Repositorios Prisma (infrastructure)
```

---

## Estructura del proyecto

```
back-vib/
├── prisma/
│   ├── schema.prisma      # Modelos Device y Measurement
│   └── seed.ts            # Datos de demo (~24h de telemetría)
├── src/
│   ├── app.ts             # Factory Express (CORS, JSON, mounts, error handler)
│   ├── server.ts          # Bootstrap, listen, shutdown graceful
│   ├── modules/
│   │   ├── devices/       # Registro y listado de nodos
│   │   └── telemetry/     # Ingesta, latest e historial
│   └── shared/
│       ├── config/env.ts
│       ├── domain/errors/app-error.ts
│       └── infrastructure/
│           ├── database/prisma.ts
│           └── http/      # error-handler, swagger
├── tests/
│   └── modules/telemetry/
│       └── record-telemetry.use-case.test.ts
├── AGENTS.md              # Reglas de arquitectura para agentes/devs
├── .env.example
└── package.json
```

---

## Requisitos previos

- **Node.js** 20+ (recomendado)
- **npm** 10+
- No se requiere servidor PostgreSQL/MySQL: SQLite embebido vía Prisma

---

## Instalación y arranque

```bash
cd back-vib

# Dependencias
npm install

# Variables de entorno
cp .env.example .env
# Editar PORT / DATABASE_URL si hace falta

# Generar cliente Prisma y crear/actualizar tablas
npm run prisma:generate
npm run prisma:push

# (Opcional) Cargar datos de demo
npx tsx prisma/seed.ts

# Desarrollo con hot-reload
npm run dev
```

Al arrancar deberías ver logs con:

- Health: `GET /health`
- Swagger: `GET /api/docs`
- Devices / Telemetry bajo `/api/...`

**Producción:**

```bash
npm run build
npm start
```

---

## Variables de entorno

Archivo de referencia: [`.env.example`](./.env.example). Validadas en `src/shared/config/env.ts` (el proceso termina si fallan).

| Variable | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `PORT` | number | `3000` | Puerto HTTP del API |
| `DATABASE_URL` | string | `file:./dev.db` | URL SQLite para Prisma |
| `NODE_ENV` | `development` \| `production` \| `test` | `development` | Entorno de ejecución |

> **Nota sobre el frontend:** el proxy de Vite en `font-vib` apunta por defecto a `http://localhost:3001`. Si el back corre en `3000`, o bien cambias `PORT=3001` en `.env`, o ajustas el `target` del proxy en el front.

Los archivos `.env` y las bases `*.db` están en `.gitignore`.

---

## API REST

Formato de éxito habitual:

```json
{ "success": true, "data": { } }
```

Errores:

| Caso | Status | Cuerpo |
|------|--------|--------|
| Validación Zod | 400 | `{ "success": false, "error": "...", "issues": [{ "path", "message" }] }` |
| `AppError` (ej. NotFound) | código del error | `{ "success": false, "error": "mensaje" }` |
| No controlado | 500 | `{ "success": false, "error": "Ocurrió un error interno en el servidor" }` |

### Health

#### `GET /health`

```json
{
  "status": "ok",
  "service": "back-vib",
  "timestamp": "2026-04-07T12:00:00.000Z"
}
```

---

### Dispositivos — `/api/devices`

#### `GET /api/devices`

Lista todos los dispositivos.

**Respuesta 200**

```json
{
  "success": true,
  "data": [
    {
      "id": "vivero-nodo-01",
      "name": "Nodo Principal - Invernadero 1",
      "location": "Sector Germinación y Plantines",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### `POST /api/devices`

Registra o actualiza (upsert por `id`).

**Body**

| Campo | Requerido | Reglas |
|-------|-----------|--------|
| `id` | sí | 2–50 chars, `/^[a-zA-Z0-9_-]+$/` |
| `name` | sí | 2–100 chars |
| `location` | no | max 150, o `null` |

**Respuesta 201:** `{ "success": true, "data": Device }`

---

### Telemetría — `/api/telemetry`

#### `POST /api/telemetry`

Ingesta una medición. Si el `deviceId` no existe, **auto-registra** el dispositivo con nombre `Dispositivo {deviceId}` y ubicación `No especificada`.

**Body**

| Campo | Requerido | Tipo / rango |
|-------|-----------|----------------|
| `deviceId` | sí | string 2–50 |
| `recordedAt` | no | fecha (coerced) |
| `temperature` | no | −40 … 85 (°C) |
| `humidity` | no | 0 … 100 (%) |
| `soilMoisture` | no | 0 … 100 (%) |
| `light` | no | ≥ 0 (lux / %) |
| `co2` | no | ≥ 0 (ppm) |
| `waterPump` | no | boolean |
| `exhaustFan` | no | boolean |
| `growLight` | no | boolean |

**Ejemplo**

```json
{
  "deviceId": "vivero-nodo-01",
  "temperature": 24.5,
  "humidity": 62,
  "soilMoisture": 48,
  "light": 850,
  "co2": 420,
  "waterPump": false,
  "exhaustFan": true,
  "growLight": false
}
```

**Respuesta 201**

```json
{
  "success": true,
  "message": "Medición registrada exitosamente",
  "data": { /* Measurement */ }
}
```

#### `GET /api/telemetry/:deviceId/latest`

Última medición del dispositivo.

- **200:** `{ "success": true, "data": Measurement }`
- **404:** si no hay mediciones

#### `GET /api/telemetry/:deviceId/history`

Historial ordenado por `recordedAt` descendente.

**Query**

| Param | Default | Descripción |
|-------|---------|-------------|
| `from` | — | Fecha inicio (ISO / parseable) |
| `to` | — | Fecha fin |
| `limit` | `100` | Máx. 1000 |

**Respuesta 200**

```json
{
  "success": true,
  "count": 42,
  "data": [ /* Measurement[] */ ]
}
```

Una lista vacía sigue siendo **200** (no 404).

---

### Forma de `Measurement`

| Campo | Tipo |
|-------|------|
| `id` | string (UUID) |
| `deviceId` | string |
| `recordedAt` | DateTime (ISO en JSON) |
| `temperature`, `humidity`, `soilMoisture`, `light`, `co2` | `number \| null` |
| `waterPump`, `exhaustFan`, `growLight` | `boolean \| null` |

---

## Modelo de datos

Definido en [`prisma/schema.prisma`](./prisma/schema.prisma).

```
Device 1 ─────── * Measurement
  id (PK)           id (UUID)
  name              deviceId (FK, cascade)
  location?         recordedAt
  createdAt         sensores (Float?)
  updatedAt         actuadores (Boolean?)
```

Índice compuesto: `(deviceId, recordedAt)` para consultas de historial.

Tablas mapeadas: `devices`, `measurements`.

---

## Swagger

Con el servidor en marcha:

```
http://localhost:{PORT}/api/docs
```

Documento OpenAPI 3.0 mantenido a mano en `src/shared/infrastructure/http/swagger.ts` (incluye esquemas de telemetría, dispositivos y errores).

---

## Seed de datos de prueba

[`prisma/seed.ts`](./prisma/seed.ts):

1. Upsert del dispositivo `vivero-nodo-01`.
2. Borra mediciones previas de ese dispositivo.
3. Inserta **49** mediciones (cada 30 min, ~24 h) con valores circadianos simulados y actuadores según umbrales (riego si suelo bajo, extractor si temp alta, luces en franja nocturna).

```bash
npx tsx prisma/seed.ts
```

No hay script `prisma:seed` en `package.json`; el comando anterior es el flujo soportado.

Inspección visual de la DB:

```bash
npm run prisma:studio
```

---

## Pruebas

```bash
npm test          # una corrida
npm run test:watch
```

Actualmente hay tests unitarios del caso de uso `RecordTelemetryUseCase` (repositorios en memoria): registro completo y auto-registro de dispositivo desconocido.

Ubicación: `tests/modules/telemetry/record-telemetry.use-case.test.ts`.

---

## Scripts npm

| Script | Comando | Uso |
|--------|---------|-----|
| `dev` | `tsx watch src/server.ts` | Desarrollo |
| `build` | `tsc` | Compilar a `dist/` |
| `start` | `node dist/server.js` | Producción |
| `test` | `vitest run` | Tests |
| `test:watch` | `vitest` | Tests en watch |
| `prisma:generate` | `prisma generate` | Cliente Prisma |
| `prisma:push` | `prisma db push` | Sincronizar schema → DB |
| `prisma:studio` | `prisma studio` | UI de base de datos |

---

## Integración con el frontend

| Concepto | Backend | Frontend (`font-vib`) |
|----------|---------|------------------------|
| Listar nodos | `GET /api/devices` | Selector de dispositivo |
| Estado en vivo | `GET .../latest` | KPI + panel de actuadores |
| Gráfica / tabla | `GET .../history` | Chart SVG + tabla + CSV |
| Simulación | `POST /api/telemetry` | Modal “Simular Envío” |

Los actuadores en el dashboard son **solo lectura** derivados de la última medición; no hay endpoint de control remoto de relays.

Flujo recomendado en local:

1. Arrancar back en el puerto que use el proxy del front (p. ej. `PORT=3001`).
2. Arrancar Vite (`npm run dev` en `font-vib`).
3. Abrir `http://localhost:5173`.

---

## Convenciones para contribuidores

Leer [`AGENTS.md`](./AGENTS.md) antes de añadir módulos o endpoints. Resumen:

1. Nuevo dominio → carpeta bajo `src/modules/<dominio>/` con `domain` / `application` / `infrastructure`.
2. Validar entradas con Zod en la frontera HTTP.
3. Errores de negocio → jerarquía `AppError` (`NotFoundError`, etc.).
4. Preferir tests de casos de uso con mocks de puertos.
5. Actualizar Swagger y este README si cambian contratos públicos.

---

## Licencia

ISC (ver `package.json`).
