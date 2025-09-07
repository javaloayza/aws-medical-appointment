import { SQSEvent } from 'aws-lambda';
import { AppointmentService } from '../services';
import { repositoryFactory } from '../repositories';
import { SNSMessage } from '../types';

// Initialize service with factory
const appointmentService = new AppointmentService(repositoryFactory);

// Chile appointment processor - handles SQS messages for CL country
export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('Processing CL appointments:', event.Records.length);

  for (const record of event.Records) {
    try {
      // Parse SNS message from SQS (SNS wraps the actual message)
      const sqsBody = JSON.parse(record.body);
      const snsMessage: SNSMessage = JSON.parse(sqsBody.Message);
      
      console.log('Processing CL appointment:', snsMessage.appointmentId);

      // Process appointment for Chile via service
      const result = await appointmentService.processAppointment(snsMessage, 'CL');
      
      if (!result.success) {
        console.error('Failed to process CL appointment:', result.error);
        // In production, you might want to send to DLQ or retry
        throw new Error(`Failed to process appointment: ${result.error?.message}`);
      } else {
        console.log('CL appointment processed successfully:', snsMessage.appointmentId);
      }

    } catch (error) {
      console.error('Error processing CL appointment:', error);
      // Let Lambda retry mechanism handle the failure
      throw error;
    }
  }
};