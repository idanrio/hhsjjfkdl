/**
 * Configuration service for managing API keys and service availability
 */

import { apiRequest } from '@/lib/queryClient';

type ServiceStatus = {
  available: boolean;
  service: string;
}

type ServicesConfig = {
  openai: ServiceStatus;
  coinapi: ServiceStatus;
  alphaVantage: ServiceStatus;
}

/**
 * Check which external services are available
 */
export const checkServicesAvailability = async (): Promise<ServicesConfig> => {
  try {
    const response = await apiRequest('GET', '/api/config/services');
    
    return await response.json();
  } catch (error) {
    console.error('Error checking service availability:', error);
    
    // Return a default configuration with all services marked as unavailable
    return {
      openai: { available: false, service: 'OpenAI' },
      coinapi: { available: false, service: 'CoinAPI' },
      alphaVantage: { available: false, service: 'Alpha Vantage' }
    };
  }
};

/**
 * Check if OpenAI is available
 */
export const isOpenAIAvailable = async (): Promise<boolean> => {
  try {
    const services = await checkServicesAvailability();
    
    // Add debug information to help troubleshoot
    console.log('OpenAI service status:', services.openai);
    
    return services.openai.available;
  } catch (error) {
    console.error('Error checking OpenAI availability:', error);
    // In case of network error, assume API key might still be available
    // The actual API calls will still fail appropriately if the key is missing
    return true;
  }
};

export default {
  checkServicesAvailability,
  isOpenAIAvailable
};