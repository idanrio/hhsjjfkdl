import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { WyckoffAnalysisResult } from '../types/trading';

interface SimpleWyckoffCoachProps {
  chartElementId: string;
  onAnalysisComplete?: (analysis: WyckoffAnalysisResult) => void;
}

const SimpleWyckoffCoach: React.FC<SimpleWyckoffCoachProps> = ({
  chartElementId,
  onAnalysisComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<WyckoffAnalysisResult | null>(null);
  const [userComment, setUserComment] = useState('');

  const captureChartImage = async (): Promise<string | null> => {
    try {
      const chartElement = document.getElementById(chartElementId);
      if (!chartElement) {
        throw new Error('Chart element not found');
      }

      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#131722', // Dark theme background
        scale: 2,
        logging: false,
        allowTaint: true,
        useCORS: true
      });

      return canvas.toDataURL('image/png');
    } catch (err) {
      console.error('Error capturing chart image:', err);
      return null;
    }
  };

  const analyzeChart = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Step 1: Capture the chart image
      const chartImage = await captureChartImage();
      if (!chartImage) {
        throw new Error('Failed to capture chart image');
      }
      
      // Step 2: Prepare data for AI analysis
      const analysisData = {
        image: chartImage,
        userComment: userComment,
        timestamp: new Date().toISOString()
      };
      
      // Step 3: Send to API for analysis
      // For this simplified version, we'll simulate a response
      setTimeout(() => {
        // Simulated response
        const simulatedAnalysis: WyckoffAnalysisResult = {
          phase: 'Accumulation (Phase C)',
          confidence: 0.85,
          patterns: ['Spring', 'Test', 'Sign of Strength'],
          description: 'The chart appears to be in Phase C of an accumulation pattern. A spring (point 5) has occurred, followed by a secondary test and a sign of strength. This suggests institutional accumulation and potential for an upward move.',
          priceTarget: {
            direction: 'long',
            price: 90000,
            confidence: 0.75,
            timeframe: '3-6 months',
            rationale: 'Based on the measured move from the trading range and volume patterns indicating accumulation.',
            riskRewardRatio: '3.5:1'
          },
          recommendations: [
            'Consider establishing long positions after pullbacks that hold above the spring low.',
            'Watch for increasing volume on upward moves as confirmation.',
            'Use the point of spring as your stop-loss level for risk management.',
            'Target the upper range of the accumulation structure as an initial profit target.'
          ]
        };
        
        setAnalysis(simulatedAnalysis);
        
        // Call the callback if provided
        if (onAnalysisComplete) {
          onAnalysisComplete(simulatedAnalysis);
        }
        
        setLoading(false);
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis');
      setLoading(false);
    }
  };

  return (
    <div className="wyckoff-coach-panel p-4 space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Wyckoff Analysis Coach</h3>
        <p className="text-sm text-muted-foreground">
          This tool analyzes your chart using Wyckoff methodology to identify market phases,
          patterns, and potential trade opportunities.
        </p>
      </div>
      
      <div className="space-y-2">
        <div className="flex flex-col">
          <label htmlFor="user-analysis" className="text-sm font-medium mb-1">
            Your Analysis (Optional)
          </label>
          <textarea
            id="user-analysis"
            value={userComment}
            onChange={(e) => setUserComment(e.target.value)}
            placeholder="Describe your Wyckoff analysis of this chart, including any patterns you've identified..."
            className="min-h-[100px] p-2 text-sm border rounded resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Adding your own analysis will help the AI compare your interpretations with Wyckoff principles
          </p>
        </div>
        
        <button
          onClick={analyzeChart}
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
            'Analyze with Wyckoff Method'
          )}
        </button>
      </div>
      
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded">
          {error}
        </div>
      )}
      
      {analysis && (
        <div className="analysis-results border rounded p-4 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">{analysis.phase}</h3>
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground">Confidence:</span>
                <div className="w-24 h-2 bg-gray-200 rounded ml-2">
                  <div 
                    className="h-full bg-blue-600 rounded" 
                    style={{ width: `${analysis.confidence * 100}%` }} 
                  />
                </div>
                <span className="ml-1 text-sm">{Math.round(analysis.confidence * 100)}%</span>
              </div>
            </div>
            
            <div className="px-3 py-1 rounded bg-blue-100 text-blue-800 font-medium text-sm">
              {analysis.priceTarget.direction === 'long' ? 'Bullish' : 
               analysis.priceTarget.direction === 'short' ? 'Bearish' : 'Neutral'}
            </div>
          </div>
          
          {/* Patterns */}
          <div>
            <h4 className="font-medium mb-1">Identified Patterns:</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.patterns.map((pattern, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                  {pattern}
                </span>
              ))}
            </div>
          </div>
          
          {/* Description */}
          <div>
            <h4 className="font-medium mb-1">Analysis:</h4>
            <p className="text-sm">{analysis.description}</p>
          </div>
          
          {/* Price Target */}
          {analysis.priceTarget && (
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-medium mb-2">Price Target:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {analysis.priceTarget.price && (
                  <div>
                    <span className="text-muted-foreground">Target Price:</span>
                    <span className="ml-1 font-medium">${analysis.priceTarget.price.toLocaleString()}</span>
                  </div>
                )}
                {analysis.priceTarget.timeframe && (
                  <div>
                    <span className="text-muted-foreground">Timeframe:</span>
                    <span className="ml-1">{analysis.priceTarget.timeframe}</span>
                  </div>
                )}
                {analysis.priceTarget.riskRewardRatio && (
                  <div>
                    <span className="text-muted-foreground">Risk/Reward:</span>
                    <span className="ml-1">{analysis.priceTarget.riskRewardRatio}</span>
                  </div>
                )}
              </div>
              {analysis.priceTarget.rationale && (
                <p className="text-xs mt-2">{analysis.priceTarget.rationale}</p>
              )}
            </div>
          )}
          
          {/* Recommendations */}
          <div>
            <h4 className="font-medium mb-1">Recommendations:</h4>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {analysis.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
          
          <div className="pt-2 border-t mt-4">
            <button
              onClick={() => setAnalysis(null)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Start New Analysis
            </button>
          </div>
        </div>
      )}
      
      {/* Help section */}
      <div className="mt-8 text-sm text-muted-foreground">
        <details className="group">
          <summary className="flex items-center cursor-pointer">
            <span className="font-medium">Help</span>
            <svg className="ml-1 h-4 w-4 group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <div className="mt-2 space-y-2">
            <h4 className="font-medium">About Wyckoff Analysis</h4>
            <p className="text-xs">
              The Wyckoff Method is a technical analysis approach based on the work of Richard D. Wyckoff, focusing on the relationships between price, volume, and time to determine market direction.
            </p>
            <p className="text-xs">
              Key concepts include accumulation/distribution phases, springs/upthrusts, tests, and the principle of cause and effect.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
};

export default SimpleWyckoffCoach;