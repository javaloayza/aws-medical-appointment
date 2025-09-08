import * as yaml from 'yaml';

const yamlSpec = `
openapi: 3.0.0
info:
  title: Medical Appointment API
  description: Serverless medical appointment system for Peru and Chile
  version: 1.0.0
  contact:
    name: API Support
servers:
  - url: https://vccyo6v0s8.execute-api.us-east-1.amazonaws.com/dev
    description: Production server

paths:
  /appointments:
    post:
      summary: Create medical appointment
      description: Creates a new medical appointment and triggers async processing by country
      tags:
        - Appointments
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AppointmentRequest'
            examples:
              peru_example:
                summary: Peru appointment
                value:
                  insuredId: "12345"
                  scheduleId: 100
                  countryISO: "PE"
              chile_example:
                summary: Chile appointment
                value:
                  insuredId: "67890"
                  scheduleId: 200
                  countryISO: "CL"
      responses:
        '201':
          description: Appointment created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AppointmentResponse'
              example:
                appointmentId: "550e8400-e29b-41d4-a716-446655440000"
                insuredId: "12345"
                scheduleId: 100
                countryISO: "PE"
                status: "pending"
                createdAt: "2025-09-06T21:48:53.752Z"
        '400':
          description: Invalid request data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                invalid_insured_id:
                  summary: Invalid insured ID
                  value:
                    message: "insuredId must be exactly 5 digits"
                invalid_country:
                  summary: Invalid country code
                  value:
                    message: "countryISO must be either PE or CL"
                missing_fields:
                  summary: Missing required fields
                  value:
                    message: "scheduleId is required"
        '409':
          description: Schedule slot already taken
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                message: "Schedule slot 100 is already taken"
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                message: "Internal server error"

  /appointments/{insuredId}:
    get:
      summary: Get appointments by insured ID
      description: Retrieves all appointments for a specific insured person
      tags:
        - Appointments
      parameters:
        - name: insuredId
          in: path
          required: true
          description: Insured person identifier (exactly 5 digits)
          schema:
            type: string
            pattern: '^\\d{5}$'
          example: "12345"
      responses:
        '200':
          description: List of appointments for the insured person
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AppointmentListResponse'
              examples:
                with_appointments:
                  summary: User with appointments
                  value:
                    appointments:
                      - appointmentId: "550e8400-e29b-41d4-a716-446655440000"
                        insuredId: "12345"
                        scheduleId: 100
                        countryISO: "PE"
                        status: "completed"
                        createdAt: "2025-09-06T21:48:53.752Z"
                        updatedAt: "2025-09-06T21:49:10.123Z"
                      - appointmentId: "550e8400-e29b-41d4-a716-446655440001"
                        insuredId: "12345"
                        scheduleId: 300
                        countryISO: "PE"
                        status: "pending"
                        createdAt: "2025-09-06T22:15:30.456Z"
                    count: 2
                empty_result:
                  summary: User with no appointments
                  value:
                    appointments: []
                    count: 0
        '400':
          description: Invalid insured ID format
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                message: "insuredId must be exactly 5 digits"
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                message: "Internal server error"

  /docs:
    get:
      summary: Get API documentation
      description: Returns the complete OpenAPI 3.0 specification or Swagger UI
      tags:
        - Documentation
      parameters:
        - name: format
          in: query
          description: Response format (json for raw spec, default redirects to Swagger UI)
          required: false
          schema:
            type: string
            enum: [json]
      responses:
        '200':
          description: OpenAPI specification in JSON format
          content:
            application/json:
              schema:
                type: object
        '302':
          description: Redirect to Swagger UI
          headers:
            Location:
              description: URL to Swagger UI with embedded specification
              schema:
                type: string

components:
  schemas:
    AppointmentRequest:
      type: object
      required:
        - insuredId
        - scheduleId
        - countryISO
      properties:
        insuredId:
          type: string
          pattern: '^\\d{5}$'
          description: Insured person identifier (exactly 5 digits)
          example: "12345"
        scheduleId:
          type: integer
          minimum: 1
          description: Medical slot identifier representing a specific combination of medical center, specialty, doctor, and date/time. Only one appointment can be created per scheduleId.
          example: 100
        countryISO:
          type: string
          enum: ["PE", "CL"]
          description: Country code (Peru or Chile)
          example: "PE"

    AppointmentResponse:
      type: object
      properties:
        appointmentId:
          type: string
          format: uuid
          description: Unique appointment identifier
          example: "550e8400-e29b-41d4-a716-446655440000"
        insuredId:
          type: string
          pattern: '^\\d{5}$'
          description: Insured person identifier
          example: "12345"
        scheduleId:
          type: integer
          description: Schedule slot identifier
          example: 100
        countryISO:
          type: string
          enum: ["PE", "CL"]
          description: Country code
          example: "PE"
        status:
          type: string
          enum: ["pending", "completed", "failed"]
          description: Current appointment status
          example: "pending"
        createdAt:
          type: string
          format: date-time
          description: Appointment creation timestamp
          example: "2025-09-06T21:48:53.752Z"
        updatedAt:
          type: string
          format: date-time
          description: Last update timestamp
          example: "2025-09-06T21:49:10.123Z"

    AppointmentListResponse:
      type: object
      properties:
        appointments:
          type: array
          items:
            $ref: '#/components/schemas/AppointmentResponse'
          description: List of appointments
        count:
          type: integer
          description: Total number of appointments
          example: 2

    ErrorResponse:
      type: object
      properties:
        message:
          type: string
          description: Error message
          example: "Invalid request data"

tags:
  - name: Appointments
    description: Medical appointment management endpoints
  - name: Documentation
    description: API documentation endpoint
`;

export const openApiSpec = yaml.parse(yamlSpec);