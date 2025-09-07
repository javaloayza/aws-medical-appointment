import { Pool } from 'pg';
import { IPostgreSQLAppointmentRepository } from './interfaces/appointment.repository';
import { PostgreSQLAppointment, AppointmentStatus, DatabaseConfig } from '../types';

// PostgreSQL repository implementation - permanent appointment storage
export class PostgreSQLAppointmentRepository implements IPostgreSQLAppointmentRepository {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      max: 10, // maximum number of connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: {
        rejectUnauthorized: false // For RDS
      }
    });
  }

  // Save appointment to PostgreSQL (country-specific database)
  async save(appointment: PostgreSQLAppointment): Promise<void> {
    const query = `
      INSERT INTO appointments 
      (appointment_id, insured_id, schedule_id, country_iso, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    
    const values = [
      appointment.appointment_id,
      appointment.insured_id,
      appointment.schedule_id,
      appointment.country_iso,
      appointment.status,
      appointment.created_at || new Date(),
      appointment.updated_at || new Date()
    ];

    await this.pool.query(query, values);
  }

  // Find appointments by insured ID
  async findByInsuredId(insuredId: string): Promise<PostgreSQLAppointment[]> {
    const query = `
      SELECT * FROM appointments 
      WHERE insured_id = $1 
      ORDER BY created_at DESC
    `;
    
    const result = await this.pool.query(query, [insuredId]);
    return result.rows;
  }

  // Find appointment by appointment ID
  async findById(appointmentId: string): Promise<PostgreSQLAppointment | null> {
    const query = `
      SELECT * FROM appointments 
      WHERE appointment_id = $1
    `;
    
    const result = await this.pool.query(query, [appointmentId]);
    return result.rows[0] || null;
  }

  // Update appointment status
  async updateStatus(appointmentId: string, status: AppointmentStatus): Promise<void> {
    const query = `
      UPDATE appointments 
      SET status = $1, updated_at = $2 
      WHERE appointment_id = $3
    `;
    
    await this.pool.query(query, [status, new Date(), appointmentId]);
  }

  // Close database connections
  async close(): Promise<void> {
    await this.pool.end();
  }
}