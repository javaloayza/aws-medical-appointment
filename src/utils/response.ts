import { LambdaResponse } from '../types';

// Standard HTTP response headers with CORS
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// Success response helper
export const successResponse = (data: any, statusCode: number = 200): LambdaResponse => ({
  statusCode,
  headers: defaultHeaders,
  body: JSON.stringify(data)
});

// Error response helper
export const errorResponse = (message: string, statusCode: number = 500): LambdaResponse => ({
  statusCode,
  headers: defaultHeaders,
  body: JSON.stringify({ message })
});

// Created response helper (201)
export const createdResponse = (data: any): LambdaResponse => 
  successResponse(data, 201);

// Bad request response helper (400)
export const badRequestResponse = (message: string): LambdaResponse => 
  errorResponse(message, 400);

// Not found response helper (404)
export const notFoundResponse = (message: string = 'Resource not found'): LambdaResponse => 
  errorResponse(message, 404);

// Internal server error response helper (500)
export const internalServerErrorResponse = (message: string = 'Internal server error'): LambdaResponse => 
  errorResponse(message, 500);