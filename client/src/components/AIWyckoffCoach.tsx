import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TradingViewRef } from './EnhancedTradingViewWidget';
import { WyckoffAnalysisResult } from '@/types/trading';
import aiService from '@/services/aiService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  BookOpen,
  Camera,
  Download,
  HelpCircle,
  Info,
  Lightbulb,
  Loader2,
  PenTool,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { isOpenAIAvailable } from '@/services/configService';

interface AIWyckoffCoachProps {
  tradingViewRef: React.RefObject<TradingViewRef>;
  symbol: string;
  timeframe: string;
  onAnalysisComplete?: (analysis: WyckoffAnalysisResult) => void;
}

export function AIWyckoffCoach({ tradingViewRef, symbol, timeframe, onAnalysisComplete }: AIWyckoffCoachProps) {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<WyckoffAnalysisResult | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [traderNotes, setTraderNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('capture');
  const [isOpenAIReady, setIsOpenAIReady] = useState(false);

  // Check if OpenAI is available
  useEffect(() => {
    const checkOpenAI = async () => {
      const available = await isOpenAIAvailable();
      setIsOpenAIReady(available);
      if (!available) {
        setError('OpenAI API key is not configured. Please add your API key in settings.');
      }
    };
    
    checkOpenAI();
  }, []);

  // Capture screenshot of the current TradingView chart
  const captureChart = async () => {
    if (!tradingViewRef.current?.widget) {
      setError('TradingView chart is not ready');
      return;
    }
    
    setIsCapturing(true);
    setError(null);
    
    try {
      // Get the current symbol and timeframe from TradingView
      const widget = tradingViewRef.current.widget;
      const chart = widget.chart();
      const currentSymbol = chart.symbol();
      const currentResolution = chart.resolution();
      
      // Use TradingView's built-in capture function if available
      if (typeof chart.takeScreenshot === 'function') {
        const screenshot = await chart.takeScreenshot();
        setCapturedImage(screenshot);
      } else {
        // Fallback to DOM capture using html2canvas
        try {
          // Using the widget container to find the chart
          const container = document.getElementById(tradingViewRef.current.widget._id);
          if (!container) throw new Error('Chart container not found');
          
          // If html2canvas is not available, we need to dynamically import it
          const html2canvas = (await import('html2canvas')).default;
          const canvas = await html2canvas(container, {
            backgroundColor: '#131722', // TradingView dark theme background
            scale: 2, // Increase quality
            logging: false,
          });
          
          setCapturedImage(canvas.toDataURL('image/png'));
        } catch (err) {
          console.error('Error capturing chart:', err);
          setError('Failed to capture chart. Please try again.');
        }
      }
      
      // Switch to the analysis tab
      setActiveTab('analyze');
    } catch (err) {
      console.error('Error capturing chart:', err);
      setError('Failed to capture chart. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Analyze the captured chart
  const analyzeChart = async () => {
    if (!capturedImage) {
      setError('Please capture chart first');
      return;
    }
    
    if (!isOpenAIReady) {
      setError('OpenAI API is not available. Please check your API key.');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Extract base64 image data
      const base64Image = capturedImage.split(',')[1];
      
      // Call AI service for Wyckoff analysis
      const analysisResponse = await aiService.analyzeChartImage(base64Image, traderNotes);
      
      if (!analysisResponse.success) {
        throw new Error(analysisResponse.error || 'Analysis failed');
      }
      
      const result: WyckoffAnalysisResult = {
        wyckoffPhase: analysisResponse.wyckoffPhase,
        confidence: analysisResponse.confidence,
        phaseDescription: analysisResponse.phaseDescription,
        feedback: analysisResponse.feedback,
        tradingRecommendations: analysisResponse.tradingRecommendations,
        events: analysisResponse.events,
        learningResources: analysisResponse.learningResources,
        enhancedImage: analysisResponse.enhancedImage,
        symbolInfo: {
          name: symbol,
          timeframe: timeframe
        }
      };
      
      setAnalysisResult(result);
      setEnhancedImage(result.enhancedImage || null);
      
      // Switch to results tab
      setActiveTab('results');
      
      // Notify parent component
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      console.error('Error analyzing chart:', err);
      setError('Failed to analyze the chart. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Apply Wyckoff patterns directly to TradingView chart
  const applyPatternsToChart = () => {
    if (!tradingViewRef.current?.widget || !analysisResult) return;
    
    try {
      const widget = tradingViewRef.current.widget;
      const chart = widget.chart();
      
      // Clear existing drawings
      chart.executeActionById("drawings.clear");
      
      // Add text marker showing the Wyckoff phase
      if (analysisResult.wyckoffPhase) {
        chart.createShape(
          { price: 0, time: 0 },
          { shape: "text", overrides: { 
            text: `Wyckoff Phase: ${analysisResult.wyckoffPhase.toUpperCase()}`,
            fontsize: 14,
            bold: true,
            fixedSize: true,
            backgroundColor: "#131722",
            borderColor: "#2196F3",
            textColor: "#E6ECEE",
            drawBorder: true,
            drawBackground: true
          }}
        );
      }
      
      // Add Wyckoff events if available
      if (analysisResult.events && analysisResult.events.length > 0) {
        // TODO: Add markers or annotations for each event
        // This requires finding the appropriate time/price coordinates
      }
      
      // Draw key price levels if available
      if (analysisResult.priceTarget) {
        const { entryPrice, stopLoss, takeProfit } = analysisResult.priceTarget;
        
        if (entryPrice) {
          // Draw entry level
          chart.createShape(
            { price: entryPrice, time: chart.getVisibleRange().from },
            { shape: "horizontal_line", overrides: { 
              linecolor: "#2196F3", 
              linewidth: 2,
              linestyle: 0,
              showPrice: true,
              text: "Entry",
              textColor: "#2196F3"
            }}
          );
        }
        
        if (stopLoss) {
          // Draw stop loss level
          chart.createShape(
            { price: stopLoss, time: chart.getVisibleRange().from },
            { shape: "horizontal_line", overrides: { 
              linecolor: "#FF5252", 
              linewidth: 2,
              linestyle: 0,
              showPrice: true,
              text: "Stop Loss",
              textColor: "#FF5252"
            }}
          );
        }
        
        if (takeProfit) {
          // Draw take profit level
          chart.createShape(
            { price: takeProfit, time: chart.getVisibleRange().from },
            { shape: "horizontal_line", overrides: { 
              linecolor: "#4CAF50", 
              linewidth: 2,
              linestyle: 0,
              showPrice: true,
              text: "Take Profit",
              textColor: "#4CAF50"
            }}
          );
        }
      }
      
      // Show success message
      console.log('Applied Wyckoff patterns to chart');
    } catch (error) {
      console.error('Error applying patterns to chart:', error);
      setError('Failed to apply patterns to chart');
    }
  };

  // Handle download of enhanced image
  const handleDownloadImage = () => {
    if (!enhancedImage) return;
    
    // Generate timestamp for the filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const phase = analysisResult?.wyckoffPhase?.toLowerCase().replace(/\s+/g, '-') || 'analysis';
    const symbolName = symbol.replace(':', '-').replace('/', '');
    
    // Create meaningful filename with symbol, phase and timestamp
    const filename = `wyckoff-${symbolName}-${phase}-${timestamp}.png`;
    
    // Create temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = enhancedImage;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset the analysis and start over
  const handleNewAnalysis = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setEnhancedImage(null);
    setTraderNotes('');
    setError(null);
    setActiveTab('capture');
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      {/* Button to open the AI Coach dialog */}
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {t("Wyckoff Coach")}
        </Button>
      </DialogTrigger>
      
      {/* Main Dialog */}
      <DialogContent className="w-full max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t("Wyckoff AI Trading Coach")}
          </DialogTitle>
          <DialogDescription>
            {t("Analyze your chart with expert Wyckoff methodology and get real-time trading feedback")}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="capture">{t("Capture Chart")}</TabsTrigger>
            <TabsTrigger value="analyze" disabled={!capturedImage}>{t("Analyze")}</TabsTrigger>
            <TabsTrigger value="results" disabled={!analysisResult}>{t("View Results")}</TabsTrigger>
          </TabsList>
          
          {/* Step 1: Capture Chart Tab */}
          <TabsContent value="capture" className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="bg-muted rounded-lg p-4 text-center">
              <div className="flex flex-col items-center justify-center py-6">
                <Camera className="h-12 w-12 mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  {t("Capture Your Current TradingView Chart")}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  {t("Take a snapshot of your current chart to analyze it with Wyckoff methodology")}
                </p>
                <Button 
                  onClick={captureChart} 
                  disabled={isCapturing || !tradingViewRef.current?.widget}
                  className="mb-2"
                >
                  {isCapturing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("Capturing...")}
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      {t("Capture Chart")}
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("Make sure your chart shows the areas you want to analyze")}
                </p>
              </div>
            </div>
            
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center mb-2">
                <Info className="h-4 w-4 mr-2 text-blue-500" />
                <h3 className="text-sm font-medium">{t("How It Works")}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t("The Wyckoff AI Coach will analyze your chart and identify:")}
              </p>
              <ul className="text-sm space-y-2 mb-4">
                <li className="flex items-start">
                  <span className="bg-blue-500/20 text-blue-500 rounded-full p-1 mr-2 mt-0.5">
                    <CheckCircle className="h-3 w-3" />
                  </span>
                  {t("Market phase (Accumulation, Distribution, Markup, Markdown)")}
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500/20 text-blue-500 rounded-full p-1 mr-2 mt-0.5">
                    <CheckCircle className="h-3 w-3" />
                  </span>
                  {t("Wyckoff events (Springs, Upthrusts, Tests, Signs of Strength/Weakness)")}
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500/20 text-blue-500 rounded-full p-1 mr-2 mt-0.5">
                    <CheckCircle className="h-3 w-3" />
                  </span>
                  {t("Specific trading recommendations with entry, stop loss, and take profit")}
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500/20 text-blue-500 rounded-full p-1 mr-2 mt-0.5">
                    <CheckCircle className="h-3 w-3" />
                  </span>
                  {t("Personalized feedback on your trading approach")}
                </li>
              </ul>
            </div>
          </TabsContent>
          
          {/* Step 2: Analysis Tab */}
          <TabsContent value="analyze" className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Show captured image */}
            {capturedImage && (
              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted p-2 flex justify-between items-center">
                  <h3 className="text-sm font-medium">{t("Captured Chart")}</h3>
                  <Button variant="ghost" size="sm" onClick={captureChart}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    {t("Recapture")}
                  </Button>
                </div>
                <div className="p-4 flex justify-center">
                  <img 
                    src={capturedImage} 
                    alt="Captured Chart" 
                    className="max-w-full object-contain rounded"
                    style={{ maxHeight: '300px' }} 
                  />
                </div>
              </div>
            )}
            
            {/* Trading notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("Your Analysis Notes (Optional)")}
              </label>
              <Textarea
                placeholder={t("Describe your Wyckoff analysis of this chart, including any patterns you've identified...")}
                value={traderNotes}
                onChange={(e) => setTraderNotes(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                {t("Adding your own analysis will help the AI compare your interpretations with Wyckoff principles")}
              </p>
            </div>
            
            {/* Analysis button */}
            <div className="flex justify-end mt-4">
              <Button 
                onClick={analyzeChart}
                disabled={!capturedImage || isAnalyzing || !isOpenAIReady}
                className="w-full md:w-auto"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("Analyzing...")}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t("Analyze with Wyckoff Method")}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          {/* Step 3: Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {analysisResult && (
              <>
                {/* Enhanced image with annotations */}
                {enhancedImage && (
                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-muted p-2 flex justify-between items-center">
                      <h3 className="text-sm font-medium">{t("Wyckoff Analysis")}</h3>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={applyPatternsToChart}>
                          <PenTool className="h-4 w-4 mr-1" />
                          {t("Apply to Chart")}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleDownloadImage}>
                          <Download className="h-4 w-4 mr-1" />
                          {t("Download")}
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 flex justify-center">
                      <img 
                        src={enhancedImage} 
                        alt="Wyckoff Analysis" 
                        className="max-w-full object-contain rounded"
                        style={{ maxHeight: '400px' }} 
                      />
                    </div>
                  </div>
                )}
                
                {/* Analysis details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left column */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">{t("Wyckoff Phase")}</h3>
                      <div className="bg-muted/30 rounded-md p-3">
                        <div className="flex items-center mb-2">
                          <Badge 
                            variant="outline" 
                            className={`px-2 py-1 ${
                              analysisResult.wyckoffPhase?.includes('accumulation') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                              analysisResult.wyckoffPhase?.includes('markup') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              analysisResult.wyckoffPhase?.includes('distribution') ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' :
                              analysisResult.wyckoffPhase?.includes('markdown') ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                              ''
                            }`}
                          >
                            {analysisResult.wyckoffPhase || t("Undetermined")}
                          </Badge>
                          {analysisResult.confidence && (
                            <Badge variant="secondary" className="ml-2">
                              {`${Math.round(analysisResult.confidence * 100)}% ${t("Confidence")}`}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{analysisResult.phaseDescription || t("No phase description available")}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">{t("Key Events")}</h3>
                      <ScrollArea className="h-[200px] rounded-md border p-4">
                        {analysisResult.events && analysisResult.events.length > 0 ? (
                          <div className="space-y-4">
                            {analysisResult.events.map((event, index) => (
                              <div key={index} className="border-b pb-2 last:border-b-0 last:pb-0">
                                <div className="flex justify-between items-center mb-1">
                                  <Badge>{event.type}</Badge>
                                  <span className="text-xs text-muted-foreground">{event.location}</span>
                                </div>
                                <p className="text-sm mt-1">{event.description}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">{t("No significant Wyckoff events identified")}</p>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                  
                  {/* Right column */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">{t("Analysis Feedback")}</h3>
                      <div className="rounded-md border p-4">
                        <p className="mb-4 text-sm">{analysisResult.feedback || t("No feedback available")}</p>
                        
                        {analysisResult.priceTarget && (
                          <>
                            <Separator className="my-3" />
                            <h4 className="font-medium mb-2 text-sm">{t("Price Targets")}</h4>
                            <div className="bg-muted rounded-md p-3 mb-3">
                              <div className="grid grid-cols-3 gap-2 mb-2 text-sm">
                                {analysisResult.priceTarget.entryPrice && (
                                  <div>
                                    <span className="text-xs text-muted-foreground block">{t("Entry")}</span>
                                    <span className="font-medium">{analysisResult.priceTarget.entryPrice}</span>
                                  </div>
                                )}
                                {analysisResult.priceTarget.stopLoss && (
                                  <div>
                                    <span className="text-xs text-muted-foreground block">{t("Stop Loss")}</span>
                                    <span className="font-medium text-red-500">{analysisResult.priceTarget.stopLoss}</span>
                                  </div>
                                )}
                                {analysisResult.priceTarget.takeProfit && (
                                  <div>
                                    <span className="text-xs text-muted-foreground block">{t("Take Profit")}</span>
                                    <span className="font-medium text-green-500">{analysisResult.priceTarget.takeProfit}</span>
                                  </div>
                                )}
                              </div>
                              {analysisResult.priceTarget.direction && (
                                <div className="flex items-center mb-2">
                                  <Badge
                                    className={`${
                                      analysisResult.priceTarget.direction === 'long'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                        : analysisResult.priceTarget.direction === 'short'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                        : ''
                                    }`}
                                  >
                                    {analysisResult.priceTarget.direction === 'long'
                                      ? t('Long')
                                      : analysisResult.priceTarget.direction === 'short'
                                      ? t('Short')
                                      : t('Neutral')}
                                  </Badge>
                                  {analysisResult.priceTarget.riskRewardRatio && (
                                    <span className="text-xs ml-2">
                                      {t("Risk/Reward")}: {analysisResult.priceTarget.riskRewardRatio}
                                    </span>
                                  )}
                                </div>
                              )}
                              {analysisResult.priceTarget.rationale && (
                                <p className="text-xs">{analysisResult.priceTarget.rationale}</p>
                              )}
                            </div>
                          </>
                        )}
                        
                        {analysisResult.tradingRecommendations && analysisResult.tradingRecommendations.length > 0 && (
                          <>
                            <Separator className="my-3" />
                            <h4 className="font-medium mb-2 text-sm">{t("Recommendations")}</h4>
                            <ul className="space-y-2 text-sm">
                              {analysisResult.tradingRecommendations.map((rec, index) => (
                                <li key={index} className="flex items-start">
                                  <Lightbulb className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-500" />
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {analysisResult.learningResources && analysisResult.learningResources.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">{t("Learning Resources")}</h3>
                        <div className="rounded-md border p-4">
                          <ul className="space-y-3 text-sm">
                            {analysisResult.learningResources.map((resource, index) => (
                              <li key={index} className="flex items-start">
                                <BookOpen className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="font-medium">{resource.title}</p>
                                  {resource.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{resource.description}</p>
                                  )}
                                  {resource.url && (
                                    <a
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-500 hover:text-blue-700 mt-1 inline-block"
                                    >
                                      {t("Learn more")}
                                    </a>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Dialog footer with action buttons */}
        <DialogFooter className="flex justify-between">
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <HelpCircle className="h-4 w-4 mr-1" />
                  {t("Help")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">{t("About Wyckoff Analysis")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t("The Wyckoff Method is a technical analysis approach based on the work of Richard D. Wyckoff, focusing on the relationships between price, volume, and time to determine market direction.")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("Key concepts include accumulation/distribution phases, springs/upthrusts, tests, and the principle of cause and effect.")}
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex gap-2">
            {activeTab === 'results' && (
              <Button variant="outline" onClick={handleNewAnalysis}>
                <RefreshCw className="h-4 w-4 mr-1" />
                {t("New Analysis")}
              </Button>
            )}
            <Button onClick={() => setIsDialogOpen(false)}>
              {t("Close")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AIWyckoffCoach;