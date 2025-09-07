import { DatabaseConfig, DynamoDBConfig, SNSConfig, EventBridgeConfig } from '../types';

// DynamoDB configuration - appointment states storage
export const dynamoDBConfig: DynamoDBConfig = {
  region: process.env.REGION || 'us-east-1',
  tableName: process.env.APPOINTMENTS_TABLE || 'aws-medical-appointment-appointments-dev'
};

// PostgreSQL configuration for Peru database
export const postgresConfigPE: DatabaseConfig = {
  host: process.env.RDS_ENDPOINT || 'localhost',
  port: parseInt(process.env.RDS_PORT || '5432'),
  username: process.env.RDS_USERNAME || 'postgres',
  password: process.env.RDS_PASSWORD || '',
  database: process.env.DB_NAME_PE || 'appointments_pe'
};

// PostgreSQL configuration for Chile database
export const postgresConfigCL: DatabaseConfig = {
  host: process.env.RDS_ENDPOINT || 'localhost',
  port: parseInt(process.env.RDS_PORT || '5432'),
  username: process.env.RDS_USERNAME || 'postgres',
  password: process.env.RDS_PASSWORD || '',
  database: process.env.DB_NAME_CL || 'appointments_cl'
};

// SNS configuration - topic for country distribution
export const snsConfig: SNSConfig = {
  region: process.env.REGION || 'us-east-1',
  topicArn: process.env.SNS_TOPIC_ARN || ''
};

// EventBridge configuration - custom bus for confirmations
export const eventBridgeConfig: EventBridgeConfig = {
  region: process.env.REGION || 'us-east-1',
  eventBusName: process.env.EVENTBRIDGE_BUS_NAME || ''
};

// Helper function to get PostgreSQL config by country
export const getPostgresConfig = (country: 'PE' | 'CL'): DatabaseConfig => {
  return country === 'PE' ? postgresConfigPE : postgresConfigCL;
};