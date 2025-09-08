import { DynamoDBClient, PutItemCommand, QueryCommand, GetItemCommand, UpdateItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
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

  // Find appointment by schedule ID to prevent duplicates
  async findByScheduleId(scheduleId: number, countryISO: string): Promise<DynamoDBAppointment | null> {
    const params = {
      TableName: this.tableName,
      FilterExpression: 'scheduleId = :scheduleId AND countryISO = :countryISO AND #status IN (:pending, :completed)',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: marshall({
        ':scheduleId': scheduleId,
        ':countryISO': countryISO,
        ':pending': 'pending',
        ':completed': 'completed'
      })
    };

    const result = await this.client.send(new ScanCommand(params));
    
    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return unmarshall(result.Items[0]) as DynamoDBAppointment;
  }
}