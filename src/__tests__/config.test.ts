import { getPostgresConfig } from '../config';

describe('Config Tests', () => {
  describe('getPostgresConfig', () => {
    it('should return correct database config for PE and CL countries', () => {
      // Test Peru configuration
      const peConfig = getPostgresConfig('PE');
      expect(peConfig.database).toBe('appointments_pe');
      expect(peConfig.host).toBeDefined();
      expect(peConfig.port).toBeDefined();
      expect(peConfig.username).toBeDefined();
      expect(peConfig.password).toBeDefined();
      
      // Test Chile configuration
      const clConfig = getPostgresConfig('CL');
      expect(clConfig.database).toBe('appointments_cl');
      expect(clConfig.host).toBeDefined();
      expect(clConfig.port).toBeDefined();
      expect(clConfig.username).toBeDefined();
      expect(clConfig.password).toBeDefined();
      
      // Verify they have different database names
      expect(peConfig.database).not.toBe(clConfig.database);
      
      // Verify common properties are the same
      expect(peConfig.host).toBe(clConfig.host);
      expect(peConfig.port).toBe(clConfig.port);
      expect(peConfig.username).toBe(clConfig.username);
    });

    it('should handle invalid country codes gracefully', () => {
      // Should not throw for invalid countries (fallback behavior)
      expect(() => getPostgresConfig('US' as any)).not.toThrow();
      expect(() => getPostgresConfig('INVALID' as any)).not.toThrow();
      expect(() => getPostgresConfig('' as any)).not.toThrow();
      expect(() => getPostgresConfig(null as any)).not.toThrow();
      
      // Should return a valid config object even for invalid countries
      const invalidConfig = getPostgresConfig('US' as any);
      expect(invalidConfig).toBeDefined();
      expect(typeof invalidConfig).toBe('object');
      expect(invalidConfig.host).toBeDefined();
      expect(invalidConfig.database).toBeDefined();
    });
  });
});