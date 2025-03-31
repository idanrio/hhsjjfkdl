import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Send, Book, User, Bot, X, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { aiService, type AIQuestionResponse } from '../services/aiService';
import { isOpenAIAvailable } from '../services/configService';

interface Message {
  role: 'user' | 'bot';
  content: string;
  sources?: string[];
}

export function AIAssistant() {
  const { t } = useTranslation();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyAvailable, setApiKeyAvailable] = useState<boolean>(true);
  
  // Check if the OpenAI API key is available
  useEffect(() => {
    const checkApiKeyStatus = async () => {
      try {
        // Check if OpenAI API key is available through the server
        const isAvailable = await isOpenAIAvailable();
        setApiKeyAvailable(isAvailable);
      } catch (error) {
        console.error('Error checking API key availability:', error);
        setApiKeyAvailable(false);
      }
    };
    
    checkApiKeyStatus();
  }, []);

  // Sample trading questions to help guide users
  const sampleQuestions = [
    "What is the Wyckoff method?",
    "How do I identify a double bottom pattern?",
    "What is the difference between swing trading and day trading?",
    "How can I improve my risk management?",
    "What indicators work best for cryptocurrency trading?"
  ];

  // Sample trading insights to demonstrate functionality
  const generateDefaultResponse = (userQuestion: string): AIQuestionResponse => {
    // This is a fallback when the API fails
    const defaultResponses: Record<string, AIQuestionResponse> = {
      "wyckoff": {
        answer: "The Wyckoff Method is a technical analysis approach developed by Richard Wyckoff in the early 20th century. It's based on the principle that price movements are driven by supply and demand, which can be observed through price and volume analysis.\n\nWyckoff identified several market cycles and developed a methodology to identify optimal entry and exit points. The key phases in Wyckoff's market cycle are:\n\n1. Accumulation - When institutions begin buying\n2. Markup - When price trends upward\n3. Distribution - When institutions begin selling\n4. Markdown - When price trends downward\n\nTraders use Wyckoff's principles to identify these phases and trade accordingly.",
        sources: ["Wyckoff Analytics", "Technical Analysis of Stock Trends"],
        confidence: 0.95
      },
      "double bottom": {
        answer: "A double bottom is a bullish reversal pattern that forms after a downtrend and signals a potential change in trend from bearish to bullish.\n\nHow to identify a double bottom pattern:\n\n1. Look for two distinct lows that are roughly equal in price.\n2. The two lows should be separated by a moderate peak (the neckline).\n3. Volume typically decreases on the second bottom compared to the first.\n4. Confirmation occurs when the price breaks above the intermediate peak.\n\nTrading strategy:\n- Enter a long position when price breaks above the neckline with increased volume.\n- Set a stop loss below the second bottom.\n- Target a price move equal to the height of the pattern.",
        sources: ["Chart Pattern Analysis", "Technical Trading Principles"],
        confidence: 0.9
      },
      "risk management": {
        answer: "Effective risk management is crucial for long-term trading success. Here are key principles to improve your risk management:\n\n1. Position Sizing: Never risk more than 1-2% of your capital on a single trade.\n\n2. Stop Loss Orders: Always use stop losses to define your risk before entering a trade.\n\n3. Risk/Reward Ratio: Aim for trades with at least a 1:2 risk-to-reward ratio, preferably 1:3 or higher.\n\n4. Correlation: Be aware of correlation between positions to avoid overexposure to similar market movements.\n\n5. Maximum Drawdown: Define the maximum account drawdown you're willing to accept and take a break if you reach it.\n\n6. Trading Journal: Document all trades to analyze what works and what doesn't.\n\n7. Plan Before Trading: Determine entry, exit, and risk management rules before placing any trade.",
        sources: ["Risk Management for Traders", "Trading Psychology"],
        confidence: 0.95
      }
    };

    // Find a relevant response based on keywords in the question
    const lowerQuestion = userQuestion.toLowerCase();
    for (const [keyword, response] of Object.entries(defaultResponses)) {
      if (lowerQuestion.includes(keyword)) {
        return response;
      }
    }

    // Default response if no keyword matches
    return {
      answer: "Trading success requires a combination of technical analysis, fundamental understanding, and proper risk management. To improve your trading, focus on developing a consistent methodology, controlling your emotions, and continuously learning from both winning and losing trades.\n\nRemember that markets evolve, so strategies that work today may need adjustment in the future. The most successful traders maintain flexibility while following their trading plans.",
      sources: ["Trading Fundamentals", "Market Analysis Principles"],
      confidence: 0.8
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userQuestion = question.trim();
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userQuestion }]);
    
    // Clear input and errors
    setQuestion('');
    setError(null);
    setLoading(true);

    try {
      // Attempt to get response from AI service
      const response = await aiService.askQuestion(userQuestion);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: response.answer,
        sources: response.sources
      }]);
    } catch (error) {
      console.error('Error asking question:', error);
      
      // In case of API failure, use the fallback response generator
      const fallbackResponse = generateDefaultResponse(userQuestion);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: fallbackResponse.answer,
        sources: fallbackResponse.sources
      }]);
      
      // Still show an error toast to let the user know there was an issue
      toast({
        title: t('error'),
        description: t('aiAssistant.error'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Use a sample question
  const handleUseSampleQuestion = (q: string) => {
    setQuestion(q);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {!apiKeyAvailable && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API Key Missing</AlertTitle>
          <AlertDescription>
            The OpenAI API key is missing or unavailable. The AI assistant will use fallback responses.
            Please provide a valid API key to enable full AI functionality.
          </AlertDescription>
        </Alert>
      )}
      
      <ScrollArea className="flex-1 pr-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 h-[200px] border rounded-md border-dashed">
            <div>
              <Bot className="mx-auto h-8 w-8 mb-4 opacity-70" />
              <h3 className="text-lg font-medium mb-2">{t('aiAssistant.title')}</h3>
              <p className="text-muted-foreground mb-4">{t('aiAssistant.emptyState')}</p>
              
              <div className="flex flex-wrap gap-2 justify-center">
                {sampleQuestions.slice(0, 3).map((q, i) => (
                  <Badge 
                    key={i} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary/10 transition-colors py-1.5"
                    onClick={() => handleUseSampleQuestion(q)}
                  >
                    {q}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {messages.map((message, i) => (
              <div key={i} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`rounded-lg px-4 py-3 max-w-[90%] ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted/70 border border-border/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {message.role === 'user' ? (
                      <User size={14} className="shrink-0" />
                    ) : (
                      <Bot size={14} className="shrink-0 text-primary" />
                    )}
                    <span className="text-xs font-medium">
                      {message.role === 'user' ? t('aiAssistant.you') : t('aiAssistant.assistant')}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                  
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3">
                      <Separator className="my-2" />
                      <div className="text-xs">
                        <p className="mb-1.5 font-medium text-muted-foreground">{t('aiAssistant.sources')}:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {message.sources.map((source, j) => (
                            <Badge key={j} variant="secondary" className="font-normal text-[10px]">
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg px-6 py-4 bg-muted/70 border border-border/50 flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">{t('loading')}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="pt-4 mt-auto">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t('aiAssistant.placeholder')}
            className="resize-none min-h-[60px] border-primary/20 focus-visible:ring-primary/30"
            disabled={loading}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={loading || !question.trim()}
            className="bg-primary hover:bg-primary/90 hover-glow-primary"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        
        {error && (
          <p className="text-xs text-destructive mt-2">{error}</p>
        )}
        
        {messages.length === 0 && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">{t('Try asking about')}:</p>
            <div className="flex flex-wrap gap-2">
              {sampleQuestions.map((q, i) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => handleUseSampleQuestion(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}