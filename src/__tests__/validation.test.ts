import { validateAppointmentRequest, validateInsuredId } from '../utils/validation';
import { AppointmentRequest } from '../types';

describe('Validation Tests', () => {
  describe('validateAppointmentRequest', () => {
    it('should return valid for correct appointment data', () => {
      const validRequest: AppointmentRequest = {
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE'
      };

      const result = validateAppointmentRequest(validRequest);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid insuredId format', () => {
      const invalidRequest: AppointmentRequest = {
        insuredId: '123', // Only 3 digits
        scheduleId: 100,
        countryISO: 'PE'
      };

      const result = validateAppointmentRequest(invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('insuredId');
      expect(result.error).toContain('5 digits');
    });

    it('should return error for invalid countryISO', () => {
      const invalidRequest = {
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'US' // Invalid country
      } as any; // Use any to bypass TypeScript type checking for test

      const result = validateAppointmentRequest(invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('countryISO');
    });

    it('should return error for missing required fields', () => {
      const invalidRequest = {
        insuredId: '12345',
        // scheduleId missing
        countryISO: 'PE'
      } as AppointmentRequest;

      const result = validateAppointmentRequest(invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('scheduleId');
    });
  });

  describe('validateInsuredId', () => {
    it('should validate correct insuredId formats', () => {
      // Valid 5-digit formats
      expect(validateInsuredId('12345')).toBe(true);
      expect(validateInsuredId('00001')).toBe(true);
      expect(validateInsuredId('99999')).toBe(true);
    });

    it('should reject invalid insuredId formats', () => {
      // Too short
      expect(validateInsuredId('123')).toBe(false);
      expect(validateInsuredId('1234')).toBe(false);
      
      // Too long
      expect(validateInsuredId('123456')).toBe(false);
      
      // Non-numeric
      expect(validateInsuredId('abcde')).toBe(false);
      expect(validateInsuredId('1234a')).toBe(false);
      
      // Empty or null
      expect(validateInsuredId('')).toBe(false);
      expect(validateInsuredId(null as any)).toBe(false);
      expect(validateInsuredId(undefined as any)).toBe(false);
    });
  });
});