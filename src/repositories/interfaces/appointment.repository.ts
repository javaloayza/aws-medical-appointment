import { DynamoDBAppointment, PostgreSQLAppointment, AppointmentStatus } from '@/types';

// Repository interface for appointment data access - Repository Pattern
export interface IAppointmentRepository {
  // Save appointment to storage
  save(appointment: DynamoDBAppointment | PostgreSQLAppointment): Promise<void>;
  
  // Find appointments by insured ID
  findByInsuredId(insuredId: string): Promise<DynamoDBAppointment[] | PostgreSQLAppointment[]>;
  
  // Find appointment by appointment ID
  findById(appointmentId: string): Promise<DynamoDBAppointment | PostgreSQLAppointment | null>;
  
  // Update appointment status
  updateStatus(appointmentId: string, status: AppointmentStatus): Promise<void>;
}

// DynamoDB repository interface - manages appointment states
export interface IDynamoDBAppointmentRepository extends IAppointmentRepository {
  save(appointment: DynamoDBAppointment): Promise<void>;
  findByInsuredId(insuredId: string): Promise<DynamoDBAppointment[]>;
  findById(appointmentId: string): Promise<DynamoDBAppointment | null>;
}

// PostgreSQL repository interface - permanent storage by country
export interface IPostgreSQLAppointmentRepository extends IAppointmentRepository {
  save(appointment: PostgreSQLAppointment): Promise<void>;
  findByInsuredId(insuredId: string): Promise<PostgreSQLAppointment[]>;
  findById(appointmentId: string): Promise<PostgreSQLAppointment | null>;
}