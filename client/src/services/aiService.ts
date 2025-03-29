import OpenAI from "openai";
import axios from "axios";

// Initialize OpenAI client to be used on the server-side only
// The client side will make requests through our API endpoint

/**
 * Types for AI Service responses
 */
export interface AIQuestionResponse {
  answer: string;
  sources?: string[];
  confidence?: number;
}

export interface PatternRecognitionResult {
  pattern: string;
  confidence: number;
  description: string;
  recommendations: string[];
  areas: {
    start: number;
    end: number;
    type: string;
  }[];
}

/**
 * Client-side service for interacting with AI features
 */
export const aiService = {
  /**
   * Ask a question to the AI assistant about trading or Wyckoff methodology
   */
  askQuestion: async (question: string): Promise<AIQuestionResponse> => {
    try {
      const response = await axios.post('/api/ai/ask', { question });
      return response.data;
    } catch (error) {
      console.error('Error asking question:', error);
      throw new Error('Failed to get an answer. Please try again.');
    }
  },

  /**
   * Analyze a chart for Wyckoff patterns
   */
  analyzeChart: async (
    symbol: string,
    timeframe: string,
    data: any
  ): Promise<PatternRecognitionResult[]> => {
    try {
      const response = await axios.post('/api/ai/analyze-chart', {
        symbol,
        timeframe,
        data
      });
      return response.data.patterns;
    } catch (error) {
      console.error('Error analyzing chart:', error);
      throw new Error('Failed to analyze the chart. Please try again.');
    }
  },

  /**
   * Get personalized trading advice based on user history and current market
   */
  getPersonalizedAdvice: async (userId: number): Promise<string> => {
    try {
      const response = await axios.get(`/api/ai/personalized-advice/${userId}`);
      return response.data.advice;
    } catch (error) {
      console.error('Error getting personalized advice:', error);
      throw new Error('Failed to get personalized advice. Please try again.');
    }
  }
};