export interface AppointmentRequest {
  insuredId: string;
  scheduleId: number;
  countryISO: 'PE' | 'CL';
}

export interface AppointmentResponse {
  appointmentId: string;
  insuredId: string;
  scheduleId: number;
  countryISO: 'PE' | 'CL';
  status: AppointmentStatus;
  createdAt: string;
  updatedAt?: string | undefined;
}

export type AppointmentStatus = 'pending' | 'completed' | 'failed';

export interface DynamoDBAppointment {
  appointmentId: string;
  insuredId: string;
  scheduleId: number;
  countryISO: 'PE' | 'CL';
  status: AppointmentStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface PostgreSQLAppointment {
  id?: number;
  appointment_id: string;
  insured_id: string;
  schedule_id: number;
  country_iso: 'PE' | 'CL';
  status: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface SNSMessage {
  appointmentId: string;
  insuredId: string;
  scheduleId: number;
  countryISO: 'PE' | 'CL';
}

export interface EventBridgeEvent {
  appointmentId: string;
  insuredId: string;
  status: AppointmentStatus;
  processedAt: string;
  countryISO: 'PE' | 'CL';
}

export interface AppointmentListResponse {
  appointments: AppointmentResponse[];
  count: number;
}