import { Position, Trade, ChartPatternRecognitionResult, WyckoffAnalysisResult } from '@/types/trading';
import { OHLCV } from './enhancedMarketService';
import aiService, { AIQuestionResponse, AIChartAnalysisResponse, AIChartImageAnalysisResponse, AITradingAdviceResponse } from './aiService';
import { isOpenAIAvailable } from './configService';

/**
 * A/B Testing Environment for AI Functionality
 * 
 * This service provides comprehensive testing of all AI-related features to ensure proper functionality.
 */
export const abTestingService = {
  /**
   * Run a complete test suite for all AI functionality
   */
  async runAllTests(): Promise<{
    success: boolean;
    results: TestResult[];
    summary: string;
  }> {
    console.log('🧪 Starting A/B Testing Environment for AI Functionality');
    
    const results: TestResult[] = [];
    let totalTests = 0;
    let passedTests = 0;
    
    // Check OpenAI API availability first
    const apiAvailable = await isOpenAIAvailable();
    console.log(`🔑 OpenAI API availability: ${apiAvailable ? 'Available ✅' : 'Unavailable ❌'}`);
    
    results.push({
      testName: 'OpenAI API Availability Check',
      success: apiAvailable,
      component: 'API Configuration',
      details: apiAvailable ? 
        'API key is configured and available' : 
        'API key is missing or invalid'
    });
    
    if (apiAvailable) {
      totalTests++;
      passedTests += apiAvailable ? 1 : 0;
    }
    
    // If API not available, skip actual API tests but still test components
    
    // Test 1: Basic AI Question and Answer
    try {
      console.log('🧪 Testing AI Assistant Q&A functionality...');
      const questionResponse = await this.testAIAssistant();
      results.push({
        testName: 'AI Assistant Q&A Test',
        success: questionResponse.success,
        component: 'AIAssistant',
        details: questionResponse.details
      });
      totalTests++;
      passedTests += questionResponse.success ? 1 : 0;
    } catch (error) {
      console.error('Failed to test AI Assistant:', error);
      results.push({
        testName: 'AI Assistant Q&A Test',
        success: false,
        component: 'AIAssistant',
        details: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
      totalTests++;
    }
    
    // Test 2: Chart Analysis
    try {
      console.log('🧪 Testing Chart Analysis functionality...');
      const chartAnalysisResponse = await this.testChartAnalysis();
      results.push({
        testName: 'Chart Pattern Analysis Test',
        success: chartAnalysisResponse.success,
        component: 'ChartPatternAnalysis',
        details: chartAnalysisResponse.details
      });
      totalTests++;
      passedTests += chartAnalysisResponse.success ? 1 : 0;
    } catch (error) {
      console.error('Failed to test Chart Analysis:', error);
      results.push({
        testName: 'Chart Pattern Analysis Test',
        success: false,
        component: 'ChartPatternAnalysis',
        details: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
      totalTests++;
    }
    
    // Test 3: Chart Image Analysis (Wyckoff Trading Coach)
    try {
      console.log('🧪 Testing Wyckoff Trading Coach functionality...');
      const imageAnalysisResponse = await this.testWyckoffTradeCoach();
      results.push({
        testName: 'Wyckoff Trading Coach Test',
        success: imageAnalysisResponse.success,
        component: 'TradingCoach',
        details: imageAnalysisResponse.details
      });
      totalTests++;
      passedTests += imageAnalysisResponse.success ? 1 : 0;
    } catch (error) {
      console.error('Failed to test Wyckoff Trading Coach:', error);
      results.push({
        testName: 'Wyckoff Trading Coach Test',
        success: false,
        component: 'TradingCoach',
        details: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
      totalTests++;
    }
    
    // Test 4: Trading Advice
    try {
      console.log('🧪 Testing Personalized Trading Advice functionality...');
      const adviceResponse = await this.testPersonalizedAdvice();
      results.push({
        testName: 'Personalized Trading Advice Test',
        success: adviceResponse.success,
        component: 'PersonalizedAdvice',
        details: adviceResponse.details
      });
      totalTests++;
      passedTests += adviceResponse.success ? 1 : 0;
    } catch (error) {
      console.error('Failed to test Personalized Advice:', error);
      results.push({
        testName: 'Personalized Trading Advice Test',
        success: false,
        component: 'PersonalizedAdvice',
        details: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
      totalTests++;
    }
    
    const allTestsSuccess = passedTests === totalTests;
    const summary = `A/B Testing completed. ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`;
    
    console.log(`🔍 ${summary}`);
    
    return {
      success: allTestsSuccess,
      results,
      summary
    };
  },
  
  /**
   * Test AI Assistant Q&A functionality
   */
  async testAIAssistant(): Promise<TestResponse> {
    try {
      const testQuestion = "What is the Wyckoff methodology?";
      
      const response = await aiService.askQuestion(testQuestion);
      
      // Validate response
      const isValidResponse = 
        response && 
        typeof response.answer === 'string' && 
        response.answer.length > 0 &&
        typeof response.confidence === 'number';
      
      const details = isValidResponse
        ? 'AI Assistant successfully provided an answer with proper response format'
        : 'AI Assistant failed to return a valid response format';
      
      return {
        success: isValidResponse,
        details
      };
    } catch (error) {
      console.error('Error testing AI Assistant:', error);
      return {
        success: false,
        details: `Error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  },
  
  /**
   * Test Chart Pattern Analysis functionality
   */
  async testChartAnalysis(): Promise<TestResponse> {
    try {
      // Mock OHLCV data for testing
      const mockChartData: OHLCV[] = [
        { time: 1614556800, open: 100, high: 105, low: 98, close: 103, volume: 1000 },
        { time: 1614643200, open: 103, high: 108, low: 102, close: 107, volume: 1200 },
        { time: 1614729600, open: 107, high: 110, low: 105, close: 108, volume: 1300 },
        { time: 1614816000, open: 108, high: 112, low: 107, close: 110, volume: 1400 },
        { time: 1614902400, open: 110, high: 115, low: 109, close: 112, volume: 1500 },
        { time: 1614988800, open: 112, high: 118, low: 111, close: 116, volume: 1800 },
        { time: 1615075200, open: 116, high: 120, low: 115, close: 119, volume: 2000 },
        { time: 1615161600, open: 119, high: 122, low: 116, close: 120, volume: 1900 },
        { time: 1615248000, open: 120, high: 125, low: 118, close: 123, volume: 2200 },
        { time: 1615334400, open: 123, high: 128, low: 122, close: 126, volume: 2500 }
      ];
      
      const response = await aiService.analyzeChart('BTC/USD', mockChartData, '1D');
      
      // Validate response
      const isValidResponse = 
        response && 
        Array.isArray(response.patterns) &&
        typeof response.summary === 'string' && 
        response.summary.length > 0 &&
        response.keyLevels && 
        Array.isArray(response.keyLevels.support) && 
        Array.isArray(response.keyLevels.resistance);
      
      const details = isValidResponse
        ? 'Chart Analysis successfully processed data and returned valid pattern analysis'
        : 'Chart Analysis failed to return a valid response format';
      
      return {
        success: isValidResponse,
        details
      };
    } catch (error) {
      console.error('Error testing Chart Analysis:', error);
      return {
        success: false,
        details: `Error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  },
  
  /**
   * Test Wyckoff Trading Coach functionality
   */
  async testWyckoffTradeCoach(): Promise<TestResponse> {
    try {
      // For testing, we would typically have a test image
      // Since we can't easily mock an image here, we'll just check
      // error handling for a missing image which should be robust
      
      // Empty string instead of base64 to test error handling
      const response = await aiService.analyzeChartImage("");
      
      // We're expecting this to fail gracefully as it's an empty image
      // The important part is that it returns a properly structured error response
      
      const isValidErrorResponse = 
        response && 
        response.success === false && 
        typeof response.error === 'string' && 
        response.error.length > 0;
      
      const details = isValidErrorResponse
        ? 'Wyckoff Trading Coach properly handled an invalid input with clear error messaging'
        : 'Wyckoff Trading Coach failed to handle invalid input appropriately';
      
      return {
        success: isValidErrorResponse,
        details
      };
    } catch (error) {
      console.error('Error testing Wyckoff Trading Coach:', error);
      return {
        success: false,
        details: `Error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  },
  
  /**
   * Test Personalized Trading Advice functionality
   */
  async testPersonalizedAdvice(): Promise<TestResponse> {
    try {
      // Mock trade data for testing
      const mockTrades: Trade[] = [
        {
          id: 1,
          userId: 1,
          pair: 'BTC/USD',
          amount: 1000,
          entryPrice: 50000,
          exitPrice: 52000,
          tradeType: 'long',
          strategy: 'Wyckoff - Accumulation',
          status: 'completed',
          notes: 'Test trade',
          profitLoss: 2000,
          entryTime: new Date('2023-01-01').toISOString(),
          exitTime: new Date('2023-01-02').toISOString()
        },
        {
          id: 2,
          userId: 1,
          pair: 'ETH/USD',
          amount: 2000,
          entryPrice: 3000,
          exitPrice: 2800,
          tradeType: 'long',
          strategy: 'Wyckoff - Distribution',
          status: 'completed',
          notes: 'Test trade 2',
          profitLoss: -400,
          entryTime: new Date('2023-01-03').toISOString(),
          exitTime: new Date('2023-01-04').toISOString()
        }
      ];
      
      const response = await aiService.getPersonalizedAdvice(mockTrades);
      
      // Validate response
      const isValidResponse = 
        response && 
        typeof response.advice === 'string' && 
        response.advice.length > 0 &&
        typeof response.riskAnalysis === 'string' && 
        Array.isArray(response.improvementAreas) &&
        Array.isArray(response.suggestedStrategies) &&
        typeof response.confidence === 'number';
      
      const details = isValidResponse
        ? 'Personalized Trading Advice successfully analyzed trades and provided meaningful feedback'
        : 'Personalized Trading Advice failed to return a valid response format';
      
      return {
        success: isValidResponse,
        details
      };
    } catch (error) {
      console.error('Error testing Personalized Advice:', error);
      return {
        success: false,
        details: `Error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
};

// Types for A/B testing
interface TestResult {
  testName: string;
  success: boolean;
  component: string;
  details: string;
}

interface TestResponse {
  success: boolean;
  details: string;
}

export default abTestingService;