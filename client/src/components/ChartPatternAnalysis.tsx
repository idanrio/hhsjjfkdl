import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { aiService, type PatternRecognitionResult } from '../services/aiService';

interface ChartPatternAnalysisProps {
  symbol: string;
  chartData: any; // This will be the OHLCV data
  onPatternClick?: (pattern: PatternRecognitionResult) => void;
}

export function ChartPatternAnalysis({ symbol, chartData, onPatternClick }: ChartPatternAnalysisProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [patterns, setPatterns] = useState<PatternRecognitionResult[]>([]);
  const [timeframe, setTimeframe] = useState('1h');
  const [error, setError] = useState('');

  const analyzeChart = async () => {
    if (!chartData || chartData.length === 0) {
      setError(t('chartAnalysis.noData'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const results = await aiService.analyzeChart(symbol, timeframe, chartData);
      setPatterns(results);
      
      if (results.length === 0) {
        setError(t('chartAnalysis.noPatterns'));
      }
    } catch (error) {
      console.error('Error analyzing chart:', error);
      setError(t('chartAnalysis.error'));
      toast({
        title: t('error'),
        description: t('chartAnalysis.analyzeFailed'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'bg-green-500';
    if (confidence >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="w-full shadow-sm border-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart2 size={18} className="text-primary" />
          {t('chartAnalysis.title')}
        </CardTitle>
        <CardDescription>
          {t('chartAnalysis.description')}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={t('chartAnalysis.timeframe')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">{t('chartAnalysis.timeframes.1m')}</SelectItem>
              <SelectItem value="5m">{t('chartAnalysis.timeframes.5m')}</SelectItem>
              <SelectItem value="15m">{t('chartAnalysis.timeframes.15m')}</SelectItem>
              <SelectItem value="1h">{t('chartAnalysis.timeframes.1h')}</SelectItem>
              <SelectItem value="4h">{t('chartAnalysis.timeframes.4h')}</SelectItem>
              <SelectItem value="1d">{t('chartAnalysis.timeframes.1d')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={analyzeChart} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('chartAnalysis.analyzing')}
              </>
            ) : (
              t('chartAnalysis.analyze')
            )}
          </Button>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('chartAnalysis.attention')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {patterns.length > 0 && (
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-3">
              {patterns.map((pattern, index) => (
                <Card key={index} className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => onPatternClick?.(pattern)}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-primary" />
                      <h4 className="font-medium">{pattern.pattern}</h4>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground mb-1">
                        {t('chartAnalysis.confidence')}
                      </span>
                      <div className="w-24 flex items-center gap-2">
                        <Progress value={pattern.confidence * 100} 
                          className={`h-2 ${getConfidenceColor(pattern.confidence)}`} />
                        <span className="text-xs font-mono">
                          {Math.round(pattern.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {pattern.description}
                  </p>
                  
                  <Separator className="my-2" />
                  
                  <div className="pt-2">
                    <h5 className="text-xs font-medium mb-1">
                      {t('chartAnalysis.recommendations')}:
                    </h5>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {pattern.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}