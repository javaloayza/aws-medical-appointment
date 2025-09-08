import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { v4 as uuidv4 } from 'uuid';
import { 
  AppointmentRequest, 
  AppointmentResponse, 
  DynamoDBAppointment, 
  PostgreSQLAppointment,
  SNSMessage,
  EventBridgeEvent,
  CountryISO,
  ServiceResponse 
} from '../types';
import { 
  IRepositoryFactory 
} from '../repositories';
import { snsConfig, eventBridgeConfig } from '../config';

// Core appointment service - handles business logic and orchestrates repositories
export class AppointmentService {
  private snsClient: SNSClient;
  private eventBridgeClient: EventBridgeClient;
  private repositoryFactory: IRepositoryFactory;

  constructor(repositoryFactory: IRepositoryFactory) {
    this.repositoryFactory = repositoryFactory;
    this.snsClient = new SNSClient({ region: snsConfig.region });
    this.eventBridgeClient = new EventBridgeClient({ region: eventBridgeConfig.region });
  }

  // Step 1: Create appointment - save to DynamoDB and publish to SNS
  async createAppointment(request: AppointmentRequest): Promise<ServiceResponse<AppointmentResponse>> {
    try {
      // Check if schedule slot is already taken
      const dynamoRepo = this.repositoryFactory.createDynamoDBRepository();
      const existingAppointment = await dynamoRepo.findByScheduleId(request.scheduleId, request.countryISO);
      
      if (existingAppointment) {
        return {
          success: false,
          error: {
            statusCode: 409,
            message: `Schedule slot ${request.scheduleId} is already taken`
          }
        };
      }

      const appointmentId = uuidv4();
      const now = new Date().toISOString();

      // Create DynamoDB record with pending status
      const dynamoAppointment: DynamoDBAppointment = {
        appointmentId,
        insuredId: request.insuredId,
        scheduleId: request.scheduleId,
        countryISO: request.countryISO,
        status: 'pending',
        createdAt: now
      };

      // Save to DynamoDB
      await dynamoRepo.save(dynamoAppointment);

      // Publish to SNS with country filter
      const snsMessage: SNSMessage = {
        appointmentId,
        insuredId: request.insuredId,
        scheduleId: request.scheduleId,
        countryISO: request.countryISO
      };

      await this.publishToSNS(snsMessage, request.countryISO);

      // Return appointment response
      const response: AppointmentResponse = {
        appointmentId,
        insuredId: request.insuredId,
        scheduleId: request.scheduleId,
        countryISO: request.countryISO,
        status: 'pending',
        createdAt: now
      };

      return { success: true, data: response };

    } catch (error) {
      return { 
        success: false, 
        error: { 
          statusCode: 500, 
          message: 'Failed to create appointment',
          details: error 
        } 
      };
    }
  }

  // Step 4: Process appointment - save to PostgreSQL and send confirmation
  async processAppointment(message: SNSMessage, country: CountryISO): Promise<ServiceResponse<void>> {
    try {
      // Create PostgreSQL record
      const postgresAppointment: PostgreSQLAppointment = {
        appointment_id: message.appointmentId,
        insured_id: message.insuredId,
        schedule_id: message.scheduleId,
        country_iso: country,
        status: 'completed',
        created_at: new Date(),
        updated_at: new Date()
      };

      // Save to country-specific PostgreSQL database
      const postgresRepo = this.repositoryFactory.createPostgreSQLRepository(country);
      await postgresRepo.save(postgresAppointment);

      // Send confirmation via EventBridge
      const confirmationEvent: EventBridgeEvent = {
        appointmentId: message.appointmentId,
        insuredId: message.insuredId,
        status: 'completed',
        processedAt: new Date().toISOString(),
        countryISO: country
      };

      await this.sendConfirmation(confirmationEvent);

      return { success: true };

    } catch (error) {
      return { 
        success: false, 
        error: { 
          statusCode: 500, 
          message: 'Failed to process appointment',
          details: error 
        } 
      };
    }
  }

  // Step 6: Confirm appointment - update DynamoDB status to completed
  async confirmAppointment(event: EventBridgeEvent): Promise<ServiceResponse<void>> {
    try {
      const dynamoRepo = this.repositoryFactory.createDynamoDBRepository();
      await dynamoRepo.updateStatus(event.appointmentId, event.status);

      return { success: true };

    } catch (error) {
      return { 
        success: false, 
        error: { 
          statusCode: 500, 
          message: 'Failed to confirm appointment',
          details: error 
        } 
      };
    }
  }

  // GET endpoint: List appointments by insured ID
  async getAppointmentsByInsuredId(insuredId: string): Promise<ServiceResponse<AppointmentResponse[]>> {
    try {
      const dynamoRepo = this.repositoryFactory.createDynamoDBRepository();
      const appointments = await dynamoRepo.findByInsuredId(insuredId);

      const response: AppointmentResponse[] = appointments.map(appointment => ({
        appointmentId: appointment.appointmentId,
        insuredId: appointment.insuredId,
        scheduleId: appointment.scheduleId,
        countryISO: appointment.countryISO,
        status: appointment.status,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt || undefined
      }));

      return { success: true, data: response };

    } catch (error) {
      return { 
        success: false, 
        error: { 
          statusCode: 500, 
          message: 'Failed to get appointments',
          details: error 
        } 
      };
    }
  }

  // Private: Publish message to SNS with country filter
  private async publishToSNS(message: SNSMessage, country: CountryISO): Promise<void> {
    const params = {
      TopicArn: snsConfig.topicArn,
      Message: JSON.stringify(message),
      MessageAttributes: {
        countryISO: {
          DataType: 'String',
          StringValue: country
        }
      }
    };

    await this.snsClient.send(new PublishCommand(params));
  }

  // Private: Send confirmation via EventBridge
  private async sendConfirmation(event: EventBridgeEvent): Promise<void> {
    const params = {
      Entries: [
        {
          Source: 'appointment.processor',
          DetailType: 'Appointment Processed',
          Detail: JSON.stringify(event),
          EventBusName: eventBridgeConfig.eventBusName
        }
      ]
    };

    await this.eventBridgeClient.send(new PutEventsCommand(params));
  }
}