import { APIGatewayProxyResult } from 'aws-lambda';

export interface LambdaResponse extends APIGatewayProxyResult {
  statusCode: number;
  headers?: { [header: string]: string | number | boolean };
  body: string;
}


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


export interface EventBridgeConfig {
  region: string;
  eventBusName: string;
}