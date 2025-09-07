# Medical Appointment System

Sistema de agendamiento médico serverless para Perú y Chile utilizando AWS Lambda, DynamoDB, SNS, SQS, EventBridge y PostgreSQL.

## 🏗️ Arquitectura

El sistema implementa un flujo asíncrono de 6 pasos:

1. **POST /appointments** → Crea cita pendiente en DynamoDB
2. **SNS** → Distribuye mensaje por país (PE/CL)
3. **SQS** → Cola específica por país procesa el mensaje
4. **Lambda Processor** → Almacena datos completos en PostgreSQL
5. **EventBridge** → Envía confirmación de procesamiento
6. **Confirmation Handler** → Actualiza estado de cita a "completed"

```
┌─────────────┐    ┌─────────┐    ┌─────────┐    ┌──────────────┐
│ API Gateway │ → │ Lambda  │ → │   SNS   │ → │ SQS (PE/CL) │
└─────────────┘    └─────────┘    └─────────┘    └──────────────┘
                        ↓                              ↓
                   ┌─────────┐                 ┌─────────────┐
                   │DynamoDB │                 │Lambda       │
                   │(pending)│                 │Processor    │
                        ↑                           ↓
                   ┌─────────┐    ┌─────────┐  ┌─────────┐
                   │DynamoDB │ ← │EventBridge│←│PostgreSQL│
                   │(completed)│   └─────────┘  └─────────┘
```

## 🚀 Características

- **Clean Architecture** con separación de responsabilidades
- **Repository Pattern** para abstracción de datos
- **Factory Pattern** para creación de repositorios
- **Principios SOLID**
- **TypeScript** con tipado estricto
- **Validación** con Joi
- **Documentación OpenAPI 3.0**
- **Testing** con Jest
- **ESLint** para calidad de código

## 📋 Prerequisitos

- Node.js >= 18.0.0
- AWS CLI configurado
- Serverless Framework
- PostgreSQL (RDS o local)

## 🛠️ Instalación

```bash
# Clonar repositorio
git clone <repository-url>
cd aws-medical-appointment

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

## ⚙️ Configuración

### Variables de Entorno (.env)

```env
# AWS Configuration
AWS_REGION=us-east-1

# PostgreSQL Configuration
POSTGRES_HOST=your-rds-endpoint
POSTGRES_PORT=5432
POSTGRES_DB=medical_appointments
POSTGRES_USER=your-username
POSTGRES_PASSWORD=your-password
```

### Configuración AWS

```bash
aws configure
# AWS Access Key ID: your-access-key
# AWS Secret Access Key: your-secret-key
# Default region: us-east-1
# Default output format: json
```

## 🗄️ Configuración de Base de Datos

### PostgreSQL Schema

```sql
CREATE DATABASE medical_appointments;

CREATE TABLE appointments (
    appointment_id UUID PRIMARY KEY,
    insured_id VARCHAR(5) NOT NULL,
    schedule_id INTEGER NOT NULL,
    country_iso VARCHAR(2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_appointments_insured_id ON appointments(insured_id);
CREATE INDEX idx_appointments_country ON appointments(country_iso);
```

## 🚀 Despliegue

```bash
# Desarrollo local
npm run dev

# Desplegar a AWS
npm run deploy

# Remover infraestructura
npm remove
```

## 📝 Uso de la API

### Base URL
```
https://vccyo6v0s8.execute-api.us-east-1.amazonaws.com/dev
```

### 1. Obtener Documentación de la API

**🌐 Documentación interactiva (Swagger UI):**
[https://vccyo6v0s8.execute-api.us-east-1.amazonaws.com/dev/docs](https://vccyo6v0s8.execute-api.us-east-1.amazonaws.com/dev/docs)

**📋 Especificación JSON:**
```bash
curl -X GET https://vccyo6v0s8.execute-api.us-east-1.amazonaws.com/dev/docs/openapi.json
# O alternativamente:
curl -X GET https://vccyo6v0s8.execute-api.us-east-1.amazonaws.com/dev/docs?format=json
```

### 2. Crear Cita Médica

#### Para Perú:
```bash
curl -X POST https://vccyo6v0s8.execute-api.us-east-1.amazonaws.com/dev/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "insuredId": "12345",
    "scheduleId": 100,
    "countryISO": "PE"
  }'
```

#### Para Chile:
```bash
curl -X POST https://vccyo6v0s8.execute-api.us-east-1.amazonaws.com/dev/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "insuredId": "67890",
    "scheduleId": 200,
    "countryISO": "CL"
  }'
```

**Respuesta exitosa (201):**
```json
{
  "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
  "insuredId": "12345",
  "scheduleId": 100,
  "countryISO": "PE",
  "status": "pending",
  "createdAt": "2025-09-06T21:48:53.752Z"
}
```

### 3. Consultar Citas por Usuario

```bash
curl -X GET https://vccyo6v0s8.execute-api.us-east-1.amazonaws.com/dev/appointments/12345
```

**Respuesta exitosa (200):**
```json
{
  "appointments": [
    {
      "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
      "insuredId": "12345",
      "scheduleId": 100,
      "countryISO": "PE",
      "status": "completed",
      "createdAt": "2025-09-06T21:48:53.752Z",
      "updatedAt": "2025-09-06T21:49:10.123Z"
    }
  ],
  "count": 1
}
```

### 4. Casos de Error

#### InsuredId inválido:
```bash
curl -X POST https://vccyo6v0s8.execute-api.us-east-1.amazonaws.com/dev/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "insuredId": "123",
    "scheduleId": 100,
    "countryISO": "PE"
  }'
```

**Respuesta (400):**
```json
{
  "message": "insuredId must be exactly 5 digits"
}
```

#### País no soportado:
```bash
curl -X POST https://vccyo6v0s8.execute-api.us-east-1.amazonaws.com/dev/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "insuredId": "12345",
    "scheduleId": 100,
    "countryISO": "US"
  }'
```

**Respuesta (400):**
```json
{
  "message": "countryISO must be either PE or CL"
}
```

## 🧪 Testing

### Test Suite Completado ✅
```bash
Test Suites: 4 passed, 4 total
Tests:       17 passed, 17 total
```

### Tipos de Tests Implementados:

#### **🔧 Tests Unitarios (7 tests)**
- **Validation Tests**: Validación de `AppointmentRequest` y `insuredId`
- **Factory Tests**: Creación de repositorios DynamoDB y PostgreSQL  
- **Config Tests**: Configuración de base de datos por país

#### **⚡ Tests de Integración (3 tests)**
- **createAppointment**: Flujo DynamoDB + SNS con mocks
- **processAppointment**: Flujo PostgreSQL + EventBridge con mocks
- **confirmAppointment**: Actualización de estado pending→completed

### Comandos disponibles:
```bash
# Ejecutar todos los tests
npm test

# Tests con watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Cobertura:
- ✅ **Lógica de negocio crítica**: 100% cubierta
- ✅ **Flujo completo de 6 pasos**: Validado con mocks
- ✅ **Validaciones de dominio**: Completamente testeadas
- ✅ **Patrones de diseño**: Factory y Repository verificados

## 🔍 Validaciones

### Appointment Request
- **insuredId**: Exactamente 5 dígitos (ej: "12345")
- **scheduleId**: Número entero mayor a 0
- **countryISO**: Solo "PE" o "CL"

### Códigos de Error
- **400**: Datos de solicitud inválidos
- **405**: Método no permitido
- **500**: Error interno del servidor

## 📊 Monitoreo

### CloudWatch Logs
- `/aws/lambda/medical-appointment-dev-appointment`
- `/aws/lambda/medical-appointment-dev-appointment-pe`
- `/aws/lambda/medical-appointment-dev-appointment-cl`

### Métricas
- Invocaciones de Lambda
- Errores y duraciones
- Mensajes en SQS
- Escrituras en DynamoDB

## 🏗️ Infraestructura AWS

### Recursos Creados
- **Lambda Functions**: 3 funciones (main, PE processor, CL processor)
- **DynamoDB**: Tabla `appointments` con GSI
- **SNS**: Topic con filtros por país
- **SQS**: 3 colas (PE, CL, confirmations)
- **EventBridge**: Bus personalizado
- **API Gateway**: REST API con CORS

### Permisos IAM
- DynamoDB: Read/Write en tabla appointments
- SNS: Publish en topic
- SQS: Receive/Delete mensajes
- EventBridge: PutEvents
- RDS: Connect (via Security Groups)

## 📖 Documentación API

### Acceso a la documentación:
- **🌐 Swagger UI interactivo**: [/docs](https://vccyo6v0s8.execute-api.us-east-1.amazonaws.com/dev/docs)
- **📋 Especificación JSON**: [/docs/openapi.json](https://vccyo6v0s8.execute-api.us-east-1.amazonaws.com/dev/docs/openapi.json)
- **📁 Código fuente**: `src/docs/openapi.ts`

### Características:
- **Formato**: OpenAPI 3.0
- **Swagger UI**: Interfaz completa con testing integrado
- **Incluye**: Esquemas, ejemplos, validaciones y códigos de error
- **Arquitectura**: YAML como código + HTML autogenerado

## 🛠️ Scripts Disponibles

```json
{
  "dev": "serverless offline",
  "deploy": "serverless deploy",
  "remove": "serverless remove", 
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "lint": "eslint src/**/*.ts",
  "lint:fix": "eslint src/**/*.ts --fix",
  "build": "tsc"
}
```

## 🔧 Troubleshooting

### Problemas Comunes

**Error de conexión PostgreSQL**
```
Solution: Verificar Security Groups permiten puerto 5432
```

**Error de credenciales AWS**
```bash
aws sts get-caller-identity
# Verificar que retorne información válida
```

**Timeout en Lambda**
```
Solution: Aumentar timeout en serverless.yml
```

### Debug Mode
```bash
# Habilitar logs detallados
export SLS_DEBUG=*
npm run deploy
```

## 📄 Licencia

MIT License - ver archivo [LICENSE](LICENSE) para detalles.

## 👥 Autor

**Reto Rimac Backend Challenge**
- Implementación serverless para sistema de citas médicas
- Arquitectura multi-país (Perú y Chile)
- Patrones de diseño y Clean Architecture