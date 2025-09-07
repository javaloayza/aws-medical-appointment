import { APIGatewayProxyEvent, APIGatewayProxyResult, SQSEvent } from 'aws-lambda';

export interface LambdaResponse extends APIGatewayProxyResult {
  statusCode: number;
  headers?: { [header: string]: string | number | boolean };
  body: string;
}

export interface AppointmentEvent extends APIGatewayProxyEvent {
  pathParameters: {
    insuredId?: string;
  };
}

// SQS Event type alias for cleaner imports
export type SQSAppointmentEvent = SQSEvent;

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface DynamoDBConfig {
  region: string;
  tableName: string;
}

export interface SNSConfig {
  region: string;
  topicArn: string;
}

export interface SQSConfig {
  region: string;
  queueUrl: string;
}

export interface EventBridgeConfig {
  region: string;
  eventBusName: string;
}