import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Send, Book, User, Bot, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { aiService, type AIQuestionResponse } from '../services/aiService';

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
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    
    // Clear input
    setQuestion('');
    setLoading(true);

    try {
      const response = await aiService.askQuestion(question);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: response.answer,
        sources: response.sources
      }]);
    } catch (error) {
      console.error('Error asking question:', error);
      toast({
        title: t('error'),
        description: t('aiAssistant.error'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <Button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 rounded-full p-4 shadow-lg bg-primary hover:bg-primary/90"
          size="icon"
        >
          <Bot size={24} />
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <Card className="fixed bottom-4 right-4 w-[350px] sm:w-[450px] shadow-lg border-primary/10 max-h-[600px] flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl flex items-center gap-2">
                <Bot size={20} className="text-primary" />
                {t('aiAssistant.title')}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </Button>
            </div>
            <CardDescription>
              {t('aiAssistant.description')}
            </CardDescription>
          </CardHeader>
          
          <ScrollArea className="flex-1 px-4 py-2 max-h-[400px] min-h-[300px]">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-8 text-muted-foreground">
                <div>
                  <Book className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>{t('aiAssistant.emptyState')}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, i) => (
                  <div key={i} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {message.role === 'user' ? (
                          <User size={16} className="shrink-0" />
                        ) : (
                          <Bot size={16} className="shrink-0" />
                        )}
                        <span className="text-xs font-medium">
                          {message.role === 'user' ? t('aiAssistant.you') : t('aiAssistant.assistant')}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                      
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2">
                          <Separator className="my-2" />
                          <div className="text-xs text-muted-foreground">
                            <p className="mb-1 font-medium">{t('aiAssistant.sources')}:</p>
                            <div className="flex flex-wrap gap-1">
                              {message.sources.map((source, j) => (
                                <Badge key={j} variant="outline" className="font-normal">
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
              </div>
            )}
          </ScrollArea>

          <CardFooter className="pt-4">
            <form onSubmit={handleSubmit} className="w-full flex gap-2">
              <Textarea 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t('aiAssistant.placeholder')}
                className="resize-none h-[60px] min-h-[60px]"
                disabled={loading}
              />
              <Button type="submit" size="icon" disabled={loading || !question.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}