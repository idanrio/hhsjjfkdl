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

  const fetchAdvice = async () => {
    setLoading(true);
    setError('');

    try {
      const adviceText = await aiService.getPersonalizedAdvice(userId);
      setAdvice(adviceText);
    } catch (error) {
      console.error('Error fetching advice:', error);
      setError(t('personalizedAdvice.error'));
      toast({
        title: t('error'),
        description: t('personalizedAdvice.fetchFailed'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
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