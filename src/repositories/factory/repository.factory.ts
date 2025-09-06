import { IDynamoDBAppointmentRepository, IPostgreSQLAppointmentRepository } from '../interfaces/appointment.repository';
import { DynamoDBAppointmentRepository } from '../dynamodb.repository';
import { PostgreSQLAppointmentRepository } from '../postgresql.repository';
import { dynamoDBConfig, getPostgresConfig } from '@/config';
import { CountryISO } from '@/types';

// Factory Pattern interface for repository creation
export interface IRepositoryFactory {
  // Create DynamoDB repository for appointment states
  createDynamoDBRepository(): IDynamoDBAppointmentRepository;
  
  // Create PostgreSQL repository for country-specific storage
  createPostgreSQLRepository(country: CountryISO): IPostgreSQLAppointmentRepository;
}

// Repository factory implementation - creates repositories based on requirements
export class RepositoryFactory implements IRepositoryFactory {
  
  // Create DynamoDB repository with configuration
  createDynamoDBRepository(): IDynamoDBAppointmentRepository {
    return new DynamoDBAppointmentRepository(dynamoDBConfig);
  }

  // Create PostgreSQL repository for specific country (PE or CL)
  createPostgreSQLRepository(country: CountryISO): IPostgreSQLAppointmentRepository {
    const config = getPostgresConfig(country);
    return new PostgreSQLAppointmentRepository(config);
  }
}

// Singleton factory instance for application use
export const repositoryFactory = new RepositoryFactory();