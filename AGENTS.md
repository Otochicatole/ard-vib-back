# AGENTS.md - Reglas y Directrices de Desarrollo para Agentes de IA

Este documento define los estándares arquitectónicos, principios de diseño y reglas de desarrollo obligatorias para cualquier agente de IA o desarrollador que colabore en el backend del sistema de monitoreo de viveros (**back-vib**).

---

## 1. Principios Arquitectónicos Fundamentales

### 1.1 Screaming Architecture (Arquitectura Gritante)
- La estructura de directorios y módulos debe **gritar el dominio del negocio** (ej. `telemetry`, `devices`, `greenhouse-metrics`, `actuators`, `alerts`), NO la tecnología o patrones técnicos genéricos (evitar carpetas raíz monolíticas como `controllers/`, `services/`, `repositories/`).
- Cada módulo funcional debe ser autocontenido, exponiendo solo interfaces públicas claras y encapsulando su lógica interna.

### 1.2 Principios SOLID
- **S (Single Responsibility):** Cada clase, función y módulo debe tener una única razón para cambiar.
- **O (Open/Closed):** El código debe estar abierto a extensión pero cerrado a modificación (ej. añadir un nuevo tipo de sensor no debe romper los existentes).
- **L (Liskov Substitution):** Cualquier implementación concreta de un repositorio o servicio debe poder sustituir a su abstracción/interfaz sin alterar la corrección del sistema.
- **I (Interface Segregation):** Diseñar interfaces pequeñas y específicas para el cliente, evitando interfaces "dios".
- **D (Dependency Inversion):** Los módulos de alto nivel (dominio/casos de uso) nunca deben depender de módulos de bajo nivel (bases de datos, Express, frameworks). Ambos deben depender de abstracciones (interfaces/puertos).

### 1.3 Separación de Capas por Módulo (Clean / Hexagonal)
Dentro de cada módulo o contexto delimitado, se deben respetar tres capas lógicas cuando aplique:
1. **Dominio (`domain/`):** Entidades, Value Objects, eventos de dominio, reglas de negocio puras e interfaces de puertos (repositorios/gateways). Cero dependencias de librerías externas o frameworks web.
2. **Aplicación (`application/`):** Casos de uso (Use Cases / Commands / Queries), DTOs y orquestación. Los casos de uso implementan la lógica de la aplicación y coordinan entidades y puertos.
3. **Infraestructura (`infrastructure/`):** Adaptadores de entrada (HTTP controllers, middlewares, listeners) y adaptadores de salida (repositorios SQL/NoSQL, clientes de correo, mensajería).

---

## 2. Reglas Estrictas de Framework y Transporte

### 2.1 Casos de Uso Agnósticos de Express
- **PROHIBIDO** importar `express`, `Request`, `Response` o `NextFunction` dentro de la capa de dominio o casos de uso.
- Los casos de uso deben recibir tipos de entrada planos (o Command/Query objects tipados) y devolver resultados estructurados o lanzar errores de dominio/aplicación.
- Cambiar Express por Fastify o exponer un caso de uso vía CLI / WebSocket / MQTT no debe requerir modificar ni una sola línea de los casos de uso.

### 2.2 Controladores Delgados (Thin Controllers)
- Los controladores HTTP y rutas solo se encargan de:
  1. Extraer y validar el payload y parámetros (usando esquemas Zod).
  2. Invocar el caso de uso correspondiente pasándole los datos tipados.
  3. Mapear el resultado o error del caso de uso al código de estado HTTP y formato de respuesta adecuado.
- **PROHIBIDO** incluir lógica de cálculo, transformaciones complejas de negocio o llamadas directas a la base de datos dentro de controladores o archivos de rutas.

---

## 3. Estándares de TypeScript y Calidad de Código

### 3.1 TypeScript Estricto
- La configuración del compilador debe mantener `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`.
- **PROHIBIDO** el uso de `any`. Si el tipo es desconocido en tiempo de compilación, utilizar `unknown` junto con type guards o validación Zod.
- Modelar estados con tipos discriminados (`discriminated unions`) y tipos inmutables (`readonly`) donde sea apropiado.

### 3.2 Validación en Fronteras con Zod
- Toda entrada externa (cuerpo de peticiones HTTP, query params, variables de entorno, payloads de sensores) debe ser validada mediante esquemas de **Zod**.
- Los tipos TypeScript de entrada deben ser inferidos a partir de los esquemas Zod (`z.infer<typeof schema>`), garantizando una única fuente de verdad (Single Source of Truth).
- El parseo debe ejecutarse en la frontera de entrada (middleware o controlador) antes de que los datos alcancen la capa de aplicación.

### 3.3 Funciones y Módulos con Responsabilidades Claras
- Funciones cortas, declarativas y con nombres que expresen intención.
- Preferir inmutabilidad y evitar efectos secundarios inesperados.
- Manejo explícito de errores: definir jerarquías de errores de dominio/aplicación (ej. `NotFoundError`, `DeviceUnauthorizedError`, `InvalidMeasurementError`).

---

## 4. Gestión de Dependencias y Modularidad

### 4.1 Dependencias Mínimas y Justificadas
- No instalar dependencias de terceros sin una justificación clara de necesidad técnica y mantenimiento.
- Evitar librerías pesadas para operaciones triviales que Node.js nativo o TypeScript resuelven con soltura.

### 4.2 Modularidad y Acoplamiento
- Los módulos deben comunicarse entre sí a través de contratos públicos (interfaces/servicios de aplicación o eventos).
- Evitar acoplamiento directo entre bases de datos de módulos distintos si se evoluciona hacia una arquitectura orientada a servicios o microservicios.

---

## 5. Testabilidad y Estrategia de Pruebas

- Diseñar siempre pensando en la testabilidad: gracias a la inyección de dependencias mediante interfaces, los casos de uso deben poder probarse unitariamente sustituyendo los repositorios por mocks o stubs en memoria.
- Estructura de pruebas:
  - **Pruebas Unitarias:** Para dominio y casos de uso (rápidas, sin I/O ni bases de datos).
  - **Pruebas de Integración:** Para adaptadores de infraestructura (repositorios contra base de datos de test, endpoints HTTP con supertest).

---

## 6. Documentación y Evolución

- Cualquier cambio estructural, adición de nuevo módulo o modificación de contratos públicos debe documentarse adecuadamente.
- Mantener este archivo `AGENTS.md` y los diagramas arquitectónicos sincronizados con el estado real del repositorio.
