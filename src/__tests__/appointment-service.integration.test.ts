import { AppointmentService } from '../services/appointment.service';
import { repositoryFactory } from '../repositories/factory/repository.factory';
import { AppointmentRequest, SNSMessage, EventBridgeEvent } from '../types';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/client-sns');
jest.mock('@aws-sdk/client-eventbridge');
jest.mock('pg');

// Mock repositories with simplified interface
const mockDynamoDBRepository = {
  save: jest.fn(),
  findByInsuredId: jest.fn(),
  findById: jest.fn(),
  updateStatus: jest.fn()
};

const mockPostgreSQLRepository = {
  save: jest.fn(),
  findByInsuredId: jest.fn(),
  findById: jest.fn(),
  updateStatus: jest.fn()
};

// Mock factory
jest.mock('../repositories/factory/repository.factory', () => ({
  repositoryFactory: {
    createDynamoDBRepository: jest.fn(() => mockDynamoDBRepository),
    createPostgreSQLRepository: jest.fn(() => mockPostgreSQLRepository)
  }
}));

// Mock SNS and EventBridge clients
const mockSNSPublish = jest.fn();
const mockEventBridgePutEvents = jest.fn();

jest.mock('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn(() => ({
    send: mockSNSPublish
  })),
  PublishCommand: jest.fn((params) => params)
}));

jest.mock('@aws-sdk/client-eventbridge', () => ({
  EventBridgeClient: jest.fn(() => ({
    send: mockEventBridgePutEvents
  })),
  PutEventsCommand: jest.fn((params) => params)
}));

describe('AppointmentService Integration Tests', () => {
  let appointmentService: AppointmentService;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create service instance
    appointmentService = new AppointmentService(repositoryFactory);
    
    // Setup default mock responses
    mockSNSPublish.mockResolvedValue({ MessageId: 'test-message-id' });
    mockEventBridgePutEvents.mockResolvedValue({ Entries: [{ EventId: 'test-event-id' }] });
  });

  describe('createAppointment - Step 1: DynamoDB pending + SNS publish', () => {
    it('should create appointment with pending status and send SNS message', async () => {
      const appointmentRequest: AppointmentRequest = {
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE'
      };

      // Mock successful creation
      mockDynamoDBRepository.save.mockResolvedValue(undefined);

      // Execute
      const result = await appointmentService.createAppointment(appointmentRequest);

      // Verify DynamoDB save was called
      expect(mockDynamoDBRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          insuredId: '12345',
          scheduleId: 100,
          countryISO: 'PE',
          status: 'pending'
        })
      );

      // Verify SNS publish was called
      expect(mockSNSPublish).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.any(String),
          MessageAttributes: expect.objectContaining({
            countryISO: expect.objectContaining({
              DataType: 'String',
              StringValue: 'PE'
            })
          })
        })
      );

      // Verify successful result
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('pending');
    });

    it('should handle DynamoDB errors gracefully', async () => {
      const appointmentRequest: AppointmentRequest = {
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE'
      };

      // Mock DynamoDB failure
      mockDynamoDBRepository.save.mockRejectedValue(new Error('DynamoDB error'));

      // Execute
      const result = await appointmentService.createAppointment(appointmentRequest);

      // Verify DynamoDB was called
      expect(mockDynamoDBRepository.save).toHaveBeenCalled();

      // Verify SNS was NOT called due to DynamoDB failure
      expect(mockSNSPublish).not.toHaveBeenCalled();

      // Verify error result
      expect(result.success).toBe(false);
      expect(result.error?.message).toBeDefined();
    });
  });

  describe('processAppointment - Step 4: PostgreSQL save + EventBridge confirmation', () => {
    it('should save to PostgreSQL and send EventBridge confirmation', async () => {
      const snsMessage: SNSMessage = {
        appointmentId: '550e8400-e29b-41d4-a716-446655440000',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE'
      };

      // Mock PostgreSQL success
      mockPostgreSQLRepository.save.mockResolvedValue(undefined);

      // Execute - provide country parameter
      const result = await appointmentService.processAppointment(snsMessage, 'PE');

      // Verify PostgreSQL save was called
      expect(mockPostgreSQLRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          appointment_id: '550e8400-e29b-41d4-a716-446655440000',
          insured_id: '12345',
          schedule_id: 100,
          country_iso: 'PE',
          status: 'completed'
        })
      );

      // Verify EventBridge was called
      expect(mockEventBridgePutEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          Entries: expect.arrayContaining([
            expect.objectContaining({
              Source: 'appointment.processor',
              DetailType: 'Appointment Processed'
            })
          ])
        })
      );

      // Verify result
      expect(result.success).toBe(true);
    });

    it('should handle PostgreSQL errors and not send EventBridge', async () => {
      const snsMessage: SNSMessage = {
        appointmentId: '550e8400-e29b-41d4-a716-446655440000',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE'
      };

      // Mock PostgreSQL failure
      mockPostgreSQLRepository.save.mockRejectedValue(new Error('PostgreSQL connection error'));

      // Execute
      const result = await appointmentService.processAppointment(snsMessage, 'PE');

      // Verify PostgreSQL was called
      expect(mockPostgreSQLRepository.save).toHaveBeenCalled();

      // Verify EventBridge was NOT called due to PostgreSQL failure
      expect(mockEventBridgePutEvents).not.toHaveBeenCalled();

      // Verify error result
      expect(result.success).toBe(false);
      expect(result.error?.message).toBeDefined();
    });
  });

  describe('confirmAppointment - Step 6: DynamoDB status update to completed', () => {
    it('should update appointment status from pending to completed', async () => {
      const eventBridgeEvent: EventBridgeEvent = {
        appointmentId: '550e8400-e29b-41d4-a716-446655440000',
        insuredId: '12345',
        status: 'completed',
        processedAt: '2025-09-06T21:49:10.123Z',
        countryISO: 'PE'
      };

      // Mock DynamoDB update success
      mockDynamoDBRepository.updateStatus.mockResolvedValue(undefined);

      // Execute
      const result = await appointmentService.confirmAppointment(eventBridgeEvent);

      // Verify DynamoDB update was called
      expect(mockDynamoDBRepository.updateStatus).toHaveBeenCalledWith(
        eventBridgeEvent.appointmentId,
        'completed'
      );

      // Verify result
      expect(result.success).toBe(true);
    });

    it('should handle DynamoDB update failures', async () => {
      const eventBridgeEvent: EventBridgeEvent = {
        appointmentId: '550e8400-e29b-41d4-a716-446655440000',
        insuredId: '12345',
        status: 'completed',
        processedAt: '2025-09-06T21:49:10.123Z',
        countryISO: 'PE'
      };

      // Mock DynamoDB update failure
      mockDynamoDBRepository.updateStatus.mockRejectedValue(new Error('Failed to update appointment status'));

      // Execute
      const result = await appointmentService.confirmAppointment(eventBridgeEvent);

      // Verify DynamoDB update was called
      expect(mockDynamoDBRepository.updateStatus).toHaveBeenCalledWith(
        eventBridgeEvent.appointmentId,
        'completed'
      );

      // Verify error result
      expect(result.success).toBe(false);
      expect(result.error?.message).toBeDefined();
    });
  });
});