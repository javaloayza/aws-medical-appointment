import { repositoryFactory } from '../repositories/factory/repository.factory';
import { DynamoDBAppointmentRepository } from '../repositories/dynamodb.repository';
import { PostgreSQLAppointmentRepository } from '../repositories/postgresql.repository';

describe('Repository Factory Tests', () => {
  describe('createDynamoDBRepository', () => {
    it('should create and return DynamoDBAppointmentRepository instance', () => {
      const repository = repositoryFactory.createDynamoDBRepository();
      
      expect(repository).toBeInstanceOf(DynamoDBAppointmentRepository);
      expect(repository).toBeDefined();
      expect(typeof repository.save).toBe('function');
      expect(typeof repository.findByInsuredId).toBe('function');
      expect(typeof repository.findById).toBe('function');
      expect(typeof repository.updateStatus).toBe('function');
    });
  });

  describe('createPostgreSQLRepository', () => {
    it('should create PostgreSQLRepository with correct config for PE and CL', () => {
      // Test Peru repository
      const peRepository = repositoryFactory.createPostgreSQLRepository('PE');
      expect(peRepository).toBeInstanceOf(PostgreSQLAppointmentRepository);
      expect(peRepository).toBeDefined();
      expect(typeof peRepository.save).toBe('function');
      
      // Test Chile repository  
      const clRepository = repositoryFactory.createPostgreSQLRepository('CL');
      expect(clRepository).toBeInstanceOf(PostgreSQLAppointmentRepository);
      expect(clRepository).toBeDefined();
      expect(typeof clRepository.save).toBe('function');
      
      // Verify they are different instances
      expect(peRepository).not.toBe(clRepository);
    });

    it('should handle different country codes correctly', () => {
      // Should work with valid countries
      expect(() => repositoryFactory.createPostgreSQLRepository('PE')).not.toThrow();
      expect(() => repositoryFactory.createPostgreSQLRepository('CL')).not.toThrow();
      
      // Should still create repository for invalid countries (config handles defaults)
      expect(() => repositoryFactory.createPostgreSQLRepository('US' as any)).not.toThrow();
    });
  });
});