import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  File, 
  Image as ImageIcon, 
  BarChart2, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  BookOpen,
  RefreshCw,
  Download
} from 'lucide-react';
import aiService from '@/services/aiService';
import { WyckoffAnalysisResult } from '@/types/trading';

interface TradingCoachProps {
  onAnalysisComplete?: (analysis: WyckoffAnalysisResult) => void;
}

export function TradingCoach({ onAnalysisComplete }: TradingCoachProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<WyckoffAnalysisResult | null>(null);
  const [traderNotes, setTraderNotes] = useState<string>("");
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate the file is an image
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setImageFile(file);
    setError(null);
    setAnalysisResult(null);
    setEnhancedImage(null);
  };
  
  // Trigger file browser
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate the file is an image
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setImageFile(file);
    setError(null);
    setAnalysisResult(null);
    setEnhancedImage(null);
  };
  
  // Submit image for analysis
  const handleAnalyzeChart = async () => {
    if (!imageFile) {
      setError('Please upload an image first');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Convert image to base64 if not already
      const base64Image = imagePreview?.split(',')[1] || '';
      
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
        enhancedImage: analysisResponse.enhancedImage
      };
      
      setAnalysisResult(result);
      setEnhancedImage(result.enhancedImage || null);
      
      // Switch to Analysis tab
      setActiveTab("analysis");
      
      // Notify parent component
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      console.error('Error analyzing chart:', err);
      setError('Failed to analyze the image. Please try again or use a clearer chart image.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Download enhanced analysis image
  const handleDownloadImage = () => {
    if (!enhancedImage) return;
    
    const link = document.createElement('a');
    link.href = enhancedImage;
    link.download = 'wyckoff-analysis.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle starting a new analysis
  const handleNewAnalysis = () => {
    setImageFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setEnhancedImage(null);
    setTraderNotes("");
    setError(null);
    setActiveTab("upload");
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("Trading Coach - Wyckoff Analysis")}</CardTitle>
        <CardDescription>
          {t("Upload your chart analysis for AI-powered Wyckoff method feedback")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="upload">{t("Upload Chart")}</TabsTrigger>
            <TabsTrigger value="analysis" disabled={!analysisResult}>{t("View Analysis")}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            {/* Error message if any */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Image upload area */}
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center ${imagePreview ? 'border-primary' : 'border-muted-foreground'}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {!imagePreview ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <Upload className="h-10 w-10 mb-3 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">{t("Upload Your Chart")}</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md">
                    {t("Drag and drop your chart image here, or click to browse")}
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleBrowseClick}>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      {t("Browse Files")}
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="relative max-h-[300px] overflow-hidden rounded-md mb-4">
                    <img 
                      src={imagePreview} 
                      alt="Chart Preview" 
                      className="w-full object-contain"
                      style={{ maxHeight: '300px' }} 
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleBrowseClick}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {t("Change Image")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Trading notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t("Your Analysis Notes (Optional)")}</Label>
              <Textarea
                id="notes"
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
                onClick={handleAnalyzeChart}
                disabled={!imageFile || isAnalyzing}
                className="w-full md:w-auto"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("Analyzing...")}
                  </>
                ) : (
                  <>
                    <BarChart2 className="mr-2 h-4 w-4" />
                    {t("Analyze with Wyckoff Method")}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-4">
            {analysisResult ? (
              <div className="space-y-6">
                {/* Enhanced image with annotations */}
                {enhancedImage && (
                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-muted p-2 flex justify-between items-center">
                      <h3 className="text-sm font-medium">{t("Wyckoff Analysis")}</h3>
                      <Button variant="ghost" size="sm" onClick={handleDownloadImage}>
                        <Download className="h-4 w-4 mr-1" />
                        {t("Download")}
                      </Button>
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
                            {analysisResult.events.map((event, index: number) => (
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
                        <p className="mb-4">{analysisResult.feedback || t("No feedback available")}</p>
                        
                        {analysisResult.tradingRecommendations && analysisResult.tradingRecommendations.length > 0 && (
                          <>
                            <Separator className="my-3" />
                            <h4 className="font-medium mb-2">{t("Recommendations")}</h4>
                            <ul className="space-y-2">
                              {analysisResult.tradingRecommendations.map((rec: string, index: number) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" />
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">{t("Educational Resources")}</h3>
                      <div className="rounded-md border p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <BookOpen className="h-5 w-5 mt-0.5 text-primary" />
                          <div>
                            <h4 className="font-medium">{t("Wyckoff Method Resources")}</h4>
                            <p className="text-sm text-muted-foreground">{t("Learn more about the concepts identified in this analysis")}</p>
                          </div>
                        </div>
                        
                        {analysisResult.learningResources && analysisResult.learningResources.length > 0 ? (
                          <ul className="space-y-2 mt-3">
                            {analysisResult.learningResources.map((resource: any, index: number) => (
                              <li key={index} className="text-sm">
                                <a 
                                  href={resource.url || "#"} 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center"
                                >
                                  {resource.title}
                                  {resource.type && (
                                    <Badge variant="outline" className="ml-2">{resource.type}</Badge>
                                  )}
                                </a>
                                {resource.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{resource.description}</p>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">{t("No specific resources available for this analysis")}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium mb-2">{t("No Analysis Available")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("Please upload a chart image and run the analysis first")}
                </p>
                <Button onClick={() => setActiveTab("upload")}>
                  {t("Go to Upload")}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleNewAnalysis} disabled={isAnalyzing}>
          {t("New Analysis")}
        </Button>
        {analysisResult && (
          <Button variant="default" onClick={handleDownloadImage} disabled={!enhancedImage}>
            <Download className="mr-2 h-4 w-4" />
            {t("Save Analysis")}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default TradingCoach;