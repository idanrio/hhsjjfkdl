import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { aiService } from '../services/aiService';

interface PersonalizedAdviceProps {
  userId: number;
}

export function PersonalizedAdvice({ userId }: PersonalizedAdviceProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Fallback advice to use when the API call fails
  const getFallbackAdvice = () => {
    // A few different pieces of advice to rotate through
    const fallbackAdvice = [
      "Based on your recent trading patterns, consider focusing more on risk management. Many of your trades show potential for higher returns if you allow winners to run a bit longer.\n\nYour win rate is solid, but your risk-to-reward ratio could be improved by setting tighter stop losses and more ambitious profit targets.\n\nI've noticed you tend to trade more successfully during certain market conditions. Consider tracking market volatility and adapting your strategy accordingly.",
      
      "Your recent trading history shows a preference for momentum-based entries. While these have been successful, you might benefit from incorporating more volume analysis into your decision-making.\n\nConsider reducing position sizes slightly and increasing the number of trades to improve your statistical edge.\n\nYour best performing trades tend to be those that align with the overall market trend. Try to be more selective with counter-trend positions.",
      
      "Looking at your trading history, I notice you've had success with longer-term positions. Consider allocating a portion of your capital to swing trades that capitalize on multi-day price movements.\n\nYour technical analysis skills appear strong, but adding fundamental analysis might provide additional context for your trades.\n\nTry journaling specific market conditions alongside your trades to identify which environments are most profitable for your strategy."
    ];
    
    // Return a random piece of advice
    return fallbackAdvice[Math.floor(Math.random() * fallbackAdvice.length)];
  };

  const fetchAdvice = async () => {
    setLoading(true);
    setError('');

    try {
      const adviceText = await aiService.getPersonalizedAdvice(userId);
      setAdvice(adviceText);
    } catch (error) {
      console.error('Error fetching advice:', error);
      
      // Use fallback advice instead of showing an error
      const fallbackText = getFallbackAdvice();
      setAdvice(fallbackText);
      
      // Still notify the user that we're using fallback content
      toast({
        title: t('personalizedAdvice.usingFallback'),
        description: t('personalizedAdvice.fallbackNotice'),
        variant: 'default'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Short delay before fetching to prevent API hammering
    const timer = setTimeout(() => {
      fetchAdvice();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [userId]);

  const formatAdviceText = (text: string) => {
    // Split the advice into paragraphs for better readability
    return text.split('\n\n').map((paragraph, index) => (
      <p key={index} className="mb-3">{paragraph}</p>
    ));
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb size={18} className="text-primary" />
            {t('personalizedAdvice.title')}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={fetchAdvice}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="sr-only">{t('refresh')}</span>
          </Button>
        </div>
        <CardDescription>
          {t('personalizedAdvice.description')}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[95%]" />
            <Skeleton className="h-4 w-[75%]" />
          </div>
        )}
        
        {error && !loading && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('personalizedAdvice.attention')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {advice && !loading && (
          <div className="text-sm">
            {formatAdviceText(advice)}
            
            <Separator className="my-4" />
            
            <div className="text-xs text-muted-foreground italic">
              {t('personalizedAdvice.disclaimer')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}