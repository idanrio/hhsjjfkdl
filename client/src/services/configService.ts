/**
 * Configuration service for managing API keys and service availability
 */

import { apiRequest } from '@/lib/queryClient';

type ServiceStatus = {
  available: boolean;
  service: string;
  message?: string;
  rateLimited?: boolean;
  lastChecked?: string;
}

type ServicesConfig = {
  openai: ServiceStatus;
  coinapi: ServiceStatus;
  alphaVantage: ServiceStatus;
}

// Cache for API status to avoid excessive checks
let cachedServicesStatus: ServicesConfig | null = null;
let lastCacheTime = 0;
const CACHE_VALIDITY_PERIOD = 5 * 60 * 1000; // 5 minutes

/**
 * Check which external services are available
 * With caching to prevent excessive API calls
 */
export const checkServicesAvailability = async (forceRefresh = false): Promise<ServicesConfig> => {
  // Return cached result if available and not expired
  const now = Date.now();
  if (!forceRefresh && cachedServicesStatus && (now - lastCacheTime < CACHE_VALIDITY_PERIOD)) {
    return cachedServicesStatus;
  }

  try {
    const response = await apiRequest('GET', '/api/config/services');
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const services = await response.json();
    
    // Update cache
    cachedServicesStatus = services;
    lastCacheTime = now;
    
    return services;
  } catch (error) {
    console.error('Error checking service availability:', error);
    
    // Only return a new object if we don't have a cached one
    if (!cachedServicesStatus) {
      return {
        openai: { available: false, service: 'OpenAI', message: 'Connection error' },
        coinapi: { available: false, service: 'CoinAPI', message: 'Connection error' },
        alphaVantage: { available: false, service: 'Alpha Vantage', message: 'Connection error' }
      };
    }
    
    // Return cached data even if it's expired when there's a connection issue
    return cachedServicesStatus;
  }
};

/**
 * Check if OpenAI is available
 * Handles transient errors and rate limiting
 */
export const isOpenAIAvailable = async (): Promise<boolean> => {
  try {
    const services = await checkServicesAvailability();
    
    // Check if OpenAI is marked as available
    if (!services.openai.available) {
      console.warn('OpenAI API is not available:', services.openai.message || 'No reason provided');
      
      // If rate limited, wait longer before next check
      if (services.openai.rateLimited) {
        // Force longer cache validity
        lastCacheTime = Date.now();
      }
      
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking OpenAI availability:', error);
    return false;
  }
};

/**
 * Verify if an API key is present
 * Gracefully handle errors
 */
export const verifyApiKey = async (service: 'openai' | 'coinapi' | 'alphaVantage'): Promise<{
  valid: boolean;
  message?: string;
}> => {
  try {
    const response = await apiRequest('POST', '/api/config/verify-key', { service });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      return { valid: false, message: errorData.message || `Service responded with status ${response.status}` };
    }
    
    const result = await response.json();
    return { 
      valid: result.valid, 
      message: result.message 
    };
  } catch (error) {
    console.error(`Error verifying ${service} API key:`, error);
    return { 
      valid: false, 
      message: error instanceof Error ? error.message : 'Connection error' 
    };
  }
};

export default {
  checkServicesAvailability,
  isOpenAIAvailable,
  verifyApiKey
};