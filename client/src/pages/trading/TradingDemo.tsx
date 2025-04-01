import React, { useState } from 'react';
import SimpleTradingPanel from '../../components/SimpleTradingPanel';
import SimpleWyckoffCoach from '../../components/SimpleWyckoffCoach';
import { WyckoffAnalysisResult } from '../../types/trading';

const TradingDemo: React.FC = () => {
  const [showWyckoffCoach, setShowWyckoffCoach] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<WyckoffAnalysisResult | null>(null);
  
  const handleAnalysisComplete = (analysis: WyckoffAnalysisResult) => {
    setAnalysisResult(analysis);
  };
  
  return (
    <div className="trading-demo-page container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[#1c3d86] mb-2">Capitulre Trading Environment</h1>
        <p className="text-gray-600">
          Professional TradingView integration with Wyckoff methodology analysis
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main chart area */}
        <div className="lg:col-span-2 border rounded-lg overflow-hidden bg-[#131722] shadow-lg">
          <SimpleTradingPanel
            defaultSymbol="BINANCE:BTCUSDT"
            defaultInterval="1D"
            height={600}
            width="100%"
            theme="dark"
          />
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Analysis toggle */}
          <div className="p-4 bg-white border rounded-lg shadow-sm">
            <button
              onClick={() => setShowWyckoffCoach(!showWyckoffCoach)}
              className="w-full py-3 px-4 bg-[#22a1e2] hover:bg-[#1c3d86] text-white font-medium rounded-md transition-colors"
            >
              {showWyckoffCoach ? 'Hide Wyckoff Coach' : 'Show Wyckoff Coach'}
            </button>
            
            <p className="mt-3 text-sm text-gray-600">
              The Wyckoff Coach analyzes chart patterns using Richard Wyckoff's methodology to identify market phases and potential trading opportunities.
            </p>
          </div>
          
          {/* Analysis panel */}
          {showWyckoffCoach && (
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
              <SimpleWyckoffCoach
                chartElementId="tv_BINANCE_BTCUSDT"
                onAnalysisComplete={handleAnalysisComplete}
              />
            </div>
          )}
          
          {/* Analysis results summary */}
          {analysisResult && (
            <div className="p-4 bg-white border rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-[#1c3d86] mb-2">Analysis Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phase:</span>
                  <span className="font-medium">{analysisResult.phase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Direction:</span>
                  <span className={`font-medium ${
                    analysisResult.priceTarget.direction === 'long' ? 'text-green-600' : 
                    analysisResult.priceTarget.direction === 'short' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {analysisResult.priceTarget.direction === 'long' ? 'Bullish' : 
                     analysisResult.priceTarget.direction === 'short' ? 'Bearish' : 'Neutral'}
                  </span>
                </div>
                {analysisResult.priceTarget.price && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target Price:</span>
                    <span className="font-medium">${analysisResult.priceTarget.price.toLocaleString()}</span>
                  </div>
                )}
                {analysisResult.priceTarget.riskRewardRatio && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risk/Reward:</span>
                    <span className="font-medium">{analysisResult.priceTarget.riskRewardRatio}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Feature highlight */}
          <div className="p-4 bg-white border rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-[#1c3d86] mb-2">Key Features</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="inline-block bg-[#22a1e2] text-white rounded-full p-1 mr-2 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span>Professional TradingView chart integration</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block bg-[#22a1e2] text-white rounded-full p-1 mr-2 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span>AI-powered Wyckoff pattern recognition</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block bg-[#22a1e2] text-white rounded-full p-1 mr-2 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span>Real-time market data with technical analysis</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block bg-[#22a1e2] text-white rounded-full p-1 mr-2 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span>Personalized trading recommendations</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block bg-[#22a1e2] text-white rounded-full p-1 mr-2 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span>Advanced educational resources</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingDemo;