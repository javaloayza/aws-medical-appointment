export * from './appointment';
export * from './aws';

export interface ApiError {
  statusCode: number;
  message: string;
  details?: any;
}

export interface ValidationError extends ApiError {
  field: string;
  value: any;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export type CountryISO = 'PE' | 'CL';

export interface RepositoryConfig {
  dynamodb: {
    tableName: string;
    region: string;
  };
  postgresql: {
    pe: {
      host: string;
      port: number;
      username: string;
      password: string;
      database: string;
    };
    cl: {
      host: string;
      port: number;
      username: string;
      password: string;
      database: string;
    };
  };
}