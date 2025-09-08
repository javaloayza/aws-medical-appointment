# Medical Appointment System

Sistema de agendamiento médico serverless para Perú y Chile que procesa reservas de citas médicas mediante un flujo asíncrono de 6 pasos utilizando AWS Lambda, DynamoDB, SNS, SQS, EventBridge y PostgreSQL.

## ⚡ Quick Start - URLs de Producción

### 🌐 URL REPOSITORIO
- **GitHub**: `https://github.com/javaloayza/aws-medical-appointment`

### 🚀 URL DE DESPLIEGUE  
**API Base URL**: `https://vccyo6v0s8.execute-api.us-east-1.amazonaws.com/dev`

### 📚 Documentación API (OpenAPI 3.0)
- **Swagger UI Interactivo**: https://vccyo6v0s8.execute-api.us-east-1.amazonaws.com/dev/docs
- **Especificación JSON**: https://vccyo6v0s8.execute-api.us-east-1.amazonaws.com/dev/docs/openapi.json

### 🔗 Endpoints Funcionales
- **POST Crear Cita**: `https://vccyo6v0s8.execute-api.us-east-1.amazonaws.com/dev/appointments`
- **GET Consultar por Usuario**: `https://vccyo6v0s8.execute-api.us-east-1.amazonaws.com/dev/appointments/{insuredId}`

## 📋 Ejemplos de Uso

### 1. Crear Cita Médica
**Endpoint:** `POST /appointments`

**Request para Perú:**
```json
{
  "insuredId": "12345",
  "scheduleId": 100,
  "countryISO": "PE"
}
```

**Response exitosa (201):**
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

**Error 409 - Slot ya reservado:**
```json
{
  "message": "Schedule slot 100 is already taken"
}
```

### 2. Consultar Citas por Usuario
**Endpoint:** `GET /appointments/{insuredId}`

**Response exitosa (200):**
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

## 🏗️ Arquitectura

![Flujo de Arquitectura](./assets/architecture-flow.jpg)

El sistema implementa un flujo asíncrono de 6 pasos:

1. **POST /appointments** → Crea cita pendiente en DynamoDB
2. **SNS** → Distribuye mensaje por país (PE/CL)
3. **SQS** → Cola específica por país procesa el mensaje
4. **Lambda Processor** → Almacena datos completos en PostgreSQL
5. **EventBridge** → Envía confirmación de procesamiento
6. **Confirmation Handler** → Actualiza estado de cita a "completed"

## 🚀 Características

- **Clean Architecture** con separación de responsabilidades
- **Repository Pattern** para abstracción de datos
- **Factory Pattern** para creación de repositorios
- **Principios SOLID**
- **TypeScript** con tipado estricto
- **Validación** con Joi y reglas de negocio
- **Documentación OpenAPI 3.0** con Swagger UI
- **Testing** con Jest - 17 tests (4 suites)

## 🔍 Validaciones

### Business Rules
- **insuredId**: Código del asegurado - Exactamente 5 dígitos (puede incluir ceros: "00123")
- **scheduleId**: Identificador del espacio médico por país - Un scheduleId puede existir en PE y CL independientemente
- **countryISO**: País de procesamiento - Solo "PE" (Perú) o "CL" (Chile)  
- **Duplicados**: Un scheduleId solo puede tener una cita activa por país

### Códigos de Error
- **400**: Datos de solicitud inválidos (formato incorrecto)
- **405**: Método no permitido
- **409**: Conflicto - Schedule slot ya reservado por otro asegurado
- **500**: Error interno del servidor

## 🧪 Testing

```bash
npm test  # 17 tests pasando
```

**Cobertura completa:**
- ✅ **6 Tests de Validación** - Joi schemas y formatos
- ✅ **5 Tests de Patrones** - Factory y Repository  
- ✅ **6 Tests de Integración** - Flujo completo con mocks AWS

## ⚙️ Configuración Técnica

### PostgreSQL vs MySQL
> **Nota**: El challenge especifica MySQL, pero se utilizó PostgreSQL debido a que ya tengo una instancia PostgreSQL activa en AWS Free Tier y no es posible crear una segunda instancia RDS gratuita.

### Infraestructura AWS Desplegada
- ✅ **DynamoDB**: aws-medical-appointment-appointments-dev
- ✅ **SNS**: aws-medical-appointment-appointments-dev  
- ✅ **SQS Queues**: sqs-pe, sqs-cl, sqs-confirmation
- ✅ **EventBridge**: Custom bus para confirmaciones
- ✅ **3 Lambda Functions**: appointment, appointmentPE, appointmentCL
- ✅ **API Gateway**: Endpoints POST/GET configurados

## 📖 Decisiones Arquitectónicas

### Repository + Factory Patterns
- **Múltiples fuentes de datos**: DynamoDB para estados de procesamiento (pending/completed) + PostgreSQL separado por país para datos permanentes
- **Factory para selección dinámica**: Crea repositorio PostgreSQL según país sin lógica condicional en servicios
- **Clean Architecture**: Separa capa de infraestructura (AWS/DB) de lógica de dominio (servicios)

### Testing con Mocks
- **Evaluación técnica**: Enfoque en lógica de negocio, no en infraestructura
- **Cobertura completa**: Cada paso del flujo de 6 pasos está validado
- **Ejecución rápida**: Tests sin dependencias de AWS real

---

## 🛠️ Desarrollo Local (Opcional)

### Configuración Inicial
```bash
# 1. Clonar proyecto
git clone <repository-url>
cd aws-medical-appointment
npm install

# 2. Configurar AWS CLI
aws configure
# AWS Access Key ID: [tu-access-key]
# AWS Secret Access Key: [tu-secret-key] 
# Default region: us-east-1

# 3. Variables de entorno
cp .env.example .env
```

### Variables de Entorno (.env)
```env
AWS_REGION=us-east-1
POSTGRES_HOST=your-rds-endpoint
POSTGRES_PORT=5432  
POSTGRES_USER=your-username
POSTGRES_PASSWORD=your-password
DB_NAME_PE=appointments_pe
DB_NAME_CL=appointments_cl
```

### Base de Datos PostgreSQL
Crear 2 databases con tabla `appointments`:
```sql
-- En appointments_pe y appointments_cl
CREATE TABLE appointments (
    appointment_id VARCHAR(50) PRIMARY KEY,
    insured_id VARCHAR(5) NOT NULL,
    schedule_id INTEGER NOT NULL, 
    country_iso CHAR(2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_appointments_insured_id ON appointments(insured_id);
CREATE INDEX idx_appointments_country ON appointments(country_iso);
```

### Scripts Disponibles
```bash
npm run deploy    # Desplegar a AWS
npm test         # Ejecutar tests (17 tests)
npm run build    # Compilar TypeScript
```

---

## 👨‍💻 Autor

**Aldo Loayza**