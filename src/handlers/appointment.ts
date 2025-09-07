import { APIGatewayProxyEvent, APIGatewayProxyResult, SQSEvent } from 'aws-lambda';
import { AppointmentService } from '../services';
import { repositoryFactory } from '../repositories';
import { AppointmentRequest } from '../types';
import { validateAppointmentRequest, validateInsuredId } from '../utils/validation';

// Initialize service with factory
const appointmentService = new AppointmentService(repositoryFactory);

// Main Lambda handler - handles HTTP requests and SQS confirmations
export const handler = async (event: APIGatewayProxyEvent | SQSEvent): Promise<APIGatewayProxyResult | void> => {
  
  // Handle SQS events (confirmations from EventBridge)
  if ('Records' in event && event.Records[0]?.eventSource === 'aws:sqs') {
    return handleConfirmations(event as SQSEvent);
  }
  
  // Handle HTTP events (API Gateway)
  return handleHttpRequest(event as APIGatewayProxyEvent);
};

// Handle HTTP requests - POST and GET endpoints
async function handleHttpRequest(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    // Handle OPTIONS request (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      };
    }

    // POST /appointments - Create appointment
    if (event.httpMethod === 'POST') {
      return await handleCreateAppointment(event, headers);
    }

    // GET /appointments/{insuredId} - Get appointments by insured ID
    if (event.httpMethod === 'GET' && event.pathParameters?.insuredId) {
      return await handleGetAppointments(event, headers);
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
}

// Handle POST request - create new appointment
async function handleCreateAppointment(
  event: APIGatewayProxyEvent, 
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  
  if (!event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Request body is required' })
    };
  }

  try {
    const request: AppointmentRequest = JSON.parse(event.body);
    
    // Joi validation
    const validation = validateAppointmentRequest(request);
    if (!validation.isValid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: validation.error })
      };
    }

    // Create appointment via service
    const result = await appointmentService.createAppointment(request);
    
    if (!result.success) {
      return {
        statusCode: result.error?.statusCode || 500,
        headers,
        body: JSON.stringify({ message: result.error?.message || 'Failed to create appointment' })
      };
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(result.data)
    };

  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Invalid JSON in request body' })
    };
  }
}

// Handle GET request - get appointments by insured ID
async function handleGetAppointments(
  event: APIGatewayProxyEvent,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  
  const insuredId = event.pathParameters!.insuredId!;
  
  // Validate insured ID format (5 digits)
  if (!validateInsuredId(insuredId)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'insuredId must be exactly 5 digits' })
    };
  }

  // Get appointments via service
  const result = await appointmentService.getAppointmentsByInsuredId(insuredId);
  
  if (!result.success) {
    return {
      statusCode: result.error?.statusCode || 500,
      headers,
      body: JSON.stringify({ message: result.error?.message || 'Failed to get appointments' })
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      appointments: result.data,
      count: result.data?.length || 0
    })
  };
}

// Handle SQS confirmations from EventBridge
async function handleConfirmations(event: SQSEvent): Promise<void> {
  console.log('Processing confirmation messages:', event.Records.length);

  for (const record of event.Records) {
    try {
      // Parse EventBridge event from SQS message
      const sqsBody = JSON.parse(record.body!);
      const eventData = sqsBody.detail || sqsBody;
      
      // Confirm appointment via service
      const result = await appointmentService.confirmAppointment(eventData);
      
      if (!result.success) {
        console.error('Failed to confirm appointment:', result.error);
        // In production, you might want to send to DLQ
      } else {
        console.log('Appointment confirmed:', eventData.appointmentId);
      }

    } catch (error) {
      console.error('Error processing confirmation:', error);
      // In production, you might want to send to DLQ
    }
  }
}