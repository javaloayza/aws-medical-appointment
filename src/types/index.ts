export * from './appointment';
export * from './aws';

export interface ApiError {
  statusCode: number;
  message: string;
  details?: any;
}


export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export type CountryISO = 'PE' | 'CL';

