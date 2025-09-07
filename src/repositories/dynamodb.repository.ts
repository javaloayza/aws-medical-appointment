import { DynamoDBClient, PutItemCommand, QueryCommand, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { IDynamoDBAppointmentRepository } from './interfaces/appointment.repository';
import { DynamoDBAppointment, AppointmentStatus, DynamoDBConfig } from '../types';

// DynamoDB repository implementation - manages appointment states
export class DynamoDBAppointmentRepository implements IDynamoDBAppointmentRepository {
  private client: DynamoDBClient;
  private tableName: string;

  constructor(config: DynamoDBConfig) {
    this.client = new DynamoDBClient({ region: config.region });
    this.tableName = config.tableName;
  }

  // Save appointment with pending status to DynamoDB
  async save(appointment: DynamoDBAppointment): Promise<void> {
    const params = {
      TableName: this.tableName,
      Item: marshall(appointment)
    };

    await this.client.send(new PutItemCommand(params));
  }

  // Find appointments by insured ID using GSI
  async findByInsuredId(insuredId: string): Promise<DynamoDBAppointment[]> {
    const params = {
      TableName: this.tableName,
      IndexName: 'InsuredIdIndex',
      KeyConditionExpression: 'insuredId = :insuredId',
      ExpressionAttributeValues: marshall({
        ':insuredId': insuredId
      })
    };

    const result = await this.client.send(new QueryCommand(params));
    
    if (!result.Items) {
      return [];
    }

    return result.Items.map(item => unmarshall(item) as DynamoDBAppointment);
  }

  // Find appointment by appointment ID - primary key lookup
  async findById(appointmentId: string): Promise<DynamoDBAppointment | null> {
    const params = {
      TableName: this.tableName,
      Key: marshall({
        appointmentId
      })
    };

    const result = await this.client.send(new GetItemCommand(params));
    
    if (!result.Item) {
      return null;
    }

    return unmarshall(result.Item) as DynamoDBAppointment;
  }

  // Update appointment status (pending -> completed/failed)
  async updateStatus(appointmentId: string, status: AppointmentStatus): Promise<void> {
    const params = {
      TableName: this.tableName,
      Key: marshall({
        appointmentId
      }),
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: marshall({
        ':status': status,
        ':updatedAt': new Date().toISOString()
      }, {
        removeUndefinedValues: true
      })
    };

    await this.client.send(new UpdateItemCommand(params));
  }
}