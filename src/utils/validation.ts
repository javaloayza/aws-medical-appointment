import Joi from 'joi';
import { AppointmentRequest } from '../types';

// Joi schema for appointment request validation
export const appointmentRequestSchema = Joi.object({
  insuredId: Joi.string()
    .pattern(/^\d{5}$/)
    .required()
    .messages({
      'string.pattern.base': 'insuredId must be exactly 5 digits',
      'any.required': 'insuredId is required'
    }),
  
  scheduleId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.positive': 'scheduleId must be a positive number',
      'any.required': 'scheduleId is required'
    }),
  
  countryISO: Joi.string()
    .valid('PE', 'CL')
    .required()
    .messages({
      'any.only': 'countryISO must be either PE or CL',
      'any.required': 'countryISO is required'
    })
});

// Validate appointment request data
export const validateAppointmentRequest = (data: any): { 
  isValid: boolean; 
  error?: string; 
  value?: AppointmentRequest 
} => {
  const { error, value } = appointmentRequestSchema.validate(data);
  
  if (error) {
    return {
      isValid: false,
      error: error.details[0].message
    };
  }
  
  return {
    isValid: true,
    value: value as AppointmentRequest
  };
};

// Validate insured ID format (5 digits)
export const validateInsuredId = (insuredId: string): boolean => {
  return /^\d{5}$/.test(insuredId);
};