import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Separator 
} from "@/components/ui/separator";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Badge 
} from "@/components/ui/badge";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Loader2, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  MoveHorizontal,
  Target
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import aiService from '@/services/aiService';
import { ChartPatternRecognitionResult } from '@/types/trading';
import { OHLCV } from '@/services/enhancedMarketService';

interface ChartPatternAnalysisProps {
  symbol: string;
  chartData: OHLCV[]; // This will be the OHLCV data
  onPatternClick?: (pattern: ChartPatternRecognitionResult) => void;
}

export function ChartPatternAnalysis({ symbol, chartData, onPatternClick }: ChartPatternAnalysisProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('patterns');
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Request analysis on mount or when chart data changes
  useEffect(() => {
    if (chartData && chartData.length > 0) {
      analyzeChart();
    }
  }, [symbol]);

  const analyzeChart = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Make sure we have enough data for analysis
      if (!chartData || chartData.length < 10) {
        setError('Not enough data for pattern analysis.');
        return;
      }
      
      const result = await aiService.analyzeChart(symbol, chartData, '1d');
      setAnalysis(result);
    } catch (err) {
      console.error('Error analyzing chart:', err);
      setError('Failed to analyze chart patterns. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle pattern click to display details
  const handlePatternClick = (pattern: ChartPatternRecognitionResult) => {
    if (onPatternClick) {
      onPatternClick(pattern);
    }
  };

  // Display loading state
  if (loading) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>{t('Pattern Analysis')}</CardTitle>
          <CardDescription>{t('Analyzing chart patterns and market structure')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-56">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">{t('Analyzing market patterns...')}</p>
        </CardContent>
      </Card>
    );
  }

  // Display error state
  if (error) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>{t('Pattern Analysis')}</CardTitle>
          <CardDescription>{t('Analyzing chart patterns and market structure')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-56">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={analyzeChart} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('Try Again')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If no analysis yet
  if (!analysis) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>{t('Pattern Analysis')}</CardTitle>
          <CardDescription>{t('Analyze chart patterns and market structure')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-56">
          <Button onClick={analyzeChart} className="mb-4">
            <Target className="mr-2 h-4 w-4" />
            {t('Analyze Chart')}
          </Button>
          <p className="text-muted-foreground text-sm text-center">
            {t('AI-powered analysis can identify patterns, support/resistance levels, and market structure')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Get direction icon based on market structure
  const getDirectionIcon = () => {
    if (!analysis.marketStructure) return <MoveHorizontal />;
    
    switch (analysis.marketStructure.toLowerCase()) {
      case 'bullish':
        return <TrendingUp className="text-green-500" />;
      case 'bearish':
        return <TrendingDown className="text-red-500" />;
      default:
        return <MoveHorizontal className="text-yellow-500" />;
    }
  };

  // Get color based on pattern direction
  const getPatternColor = (direction: string) => {
    switch (direction.toLowerCase()) {
      case 'bullish':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'bearish':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  // Main component render with analysis results
  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t('Pattern Analysis')}</CardTitle>
            <CardDescription>{t('AI-powered chart analysis')}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={analyzeChart} title={t('Refresh Analysis')}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="patterns">{t('Patterns')}</TabsTrigger>
            <TabsTrigger value="structure">{t('Structure')}</TabsTrigger>
            <TabsTrigger value="levels">{t('Key Levels')}</TabsTrigger>
          </TabsList>

          <TabsContent value="patterns" className="mt-0">
            <ScrollArea className="h-[220px] pr-4">
              {analysis.patterns && analysis.patterns.length > 0 ? (
                <div className="space-y-3">
                  {analysis.patterns.map((pattern: ChartPatternRecognitionResult, index: number) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-md border cursor-pointer hover:bg-accent transition-colors ${getPatternColor(pattern.direction)}`}
                      onClick={() => handlePatternClick(pattern)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium">{pattern.pattern}</h4>
                        <Badge variant="outline" className={getPatternColor(pattern.direction)}>
                          {pattern.direction}
                        </Badge>
                      </div>
                      <p className="text-sm opacity-80 line-clamp-2">{pattern.description}</p>
                      <div className="mt-2 flex items-center text-xs">
                        <span className="opacity-70">Confidence: </span>
                        <div className="w-full h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full ml-2 mr-1">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${pattern.confidence * 100}%` }}
                          />
                        </div>
                        <span>{Math.round(pattern.confidence * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  {t('No significant patterns detected in current timeframe')}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="structure" className="mt-0">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-full bg-muted">
                  {getDirectionIcon()}
                </div>
                <div>
                  <h3 className="font-medium">
                    {analysis.marketStructure || t('Neutral')} {t('Market Structure')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {analysis.wyckoffPhase 
                      ? t('Wyckoff Phase') + ': ' + analysis.wyckoffPhase
                      : t('No clear Wyckoff phase identified')}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">{t('Summary')}</h3>
                <p className="text-sm text-muted-foreground">{analysis.summary}</p>
              </div>
              
              {analysis.recommendation && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2">{t('Recommendation')}</h3>
                    <p className="text-sm text-muted-foreground">{analysis.recommendation}</p>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="levels" className="mt-0">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">{t('Support Levels')}</h3>
                {analysis.keyLevels?.support && analysis.keyLevels.support.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {analysis.keyLevels.support.map((level: number, index: number) => (
                      <Badge key={index} variant="outline" className="bg-green-500/5 border-green-500/20 p-2 flex justify-center">
                        {level.toFixed(2)}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('No clear support levels identified')}</p>
                )}
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">{t('Resistance Levels')}</h3>
                {analysis.keyLevels?.resistance && analysis.keyLevels.resistance.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {analysis.keyLevels.resistance.map((level: number, index: number) => (
                      <Badge key={index} variant="outline" className="bg-red-500/5 border-red-500/20 p-2 flex justify-center">
                        {level.toFixed(2)}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('No clear resistance levels identified')}</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ChartPatternAnalysis;