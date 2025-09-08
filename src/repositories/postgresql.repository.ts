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

  // Find appointment by schedule ID to prevent duplicates
  async findByScheduleId(scheduleId: number, countryISO: string): Promise<PostgreSQLAppointment | null> {
    const query = `
      SELECT * FROM appointments 
      WHERE schedule_id = $1 AND country_iso = $2 AND status IN ('pending', 'completed')
      LIMIT 1
    `;
    
    const result = await this.pool.query(query, [scheduleId, countryISO]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      appointment_id: row.appointment_id,
      insured_id: row.insured_id,
      schedule_id: row.schedule_id,
      country_iso: row.country_iso,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  // Close database connections
  async close(): Promise<void> {
    await this.pool.end();
  }
}