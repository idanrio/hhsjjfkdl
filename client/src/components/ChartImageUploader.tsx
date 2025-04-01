import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  BookOpen,
  Camera,
  Download,
  Loader2,
  Upload,
  Info,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface ChartImageUploaderProps {
  onImageAnalysis: (imageBase64: string, notes: string) => Promise<any>;
}

export function ChartImageUploader({ onImageAnalysis }: ChartImageUploaderProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload for chart analysis
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPEG, etc.)');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setUploadedImage(result);
        setActiveTab('analyze');
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      console.error('Error reading file:', reader.error);
      setError('Failed to read the image file. Please try again.');
      setIsLoading(false);
    };
    
    reader.readAsDataURL(file);
  };

  // Trigger file input click
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Analyze the uploaded chart image
  const analyzeChart = async () => {
    if (!uploadedImage) {
      setError('Please upload a chart image first');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Extract base64 image data
      const base64Image = uploadedImage.split(',')[1];
      
      // Call analysis service
      const result = await onImageAnalysis(base64Image, notes);
      
      setAnalysisResult(result);
      setActiveTab('results');
    } catch (err: any) {
      console.error('Error analyzing chart:', err);
      setError(`Failed to analyze the chart: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset the analysis and start over
  const handleNewAnalysis = () => {
    setUploadedImage(null);
    setAnalysisResult(null);
    setNotes('');
    setError(null);
    setActiveTab('upload');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          {t("Upload & Analyze Chart")}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-full max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t("Wyckoff Chart Analysis")}
          </DialogTitle>
          <DialogDescription>
            {t("Upload and analyze your trading chart with expert Wyckoff methodology")}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="upload">{t("Upload Chart")}</TabsTrigger>
            <TabsTrigger value="analyze" disabled={!uploadedImage}>{t("Analyze")}</TabsTrigger>
            <TabsTrigger value="results" disabled={!analysisResult}>{t("View Results")}</TabsTrigger>
          </TabsList>
          
          {/* Step 1: Upload Chart Tab */}
          <TabsContent value="upload" className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="bg-muted rounded-lg p-4 text-center">
              <div className="flex flex-col items-center justify-center py-6">
                <Upload className="h-12 w-12 mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  {t("Upload a Trading Chart Image")}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  {t("Upload a saved chart image to analyze it with Wyckoff methodology")}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  onClick={triggerFileUpload} 
                  disabled={isLoading}
                  className="mb-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("Processing...")}
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {t("Select Image")}
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("Supported formats: PNG, JPEG, GIF")}
                </p>
              </div>
            </div>
            
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center mb-2">
                <Info className="h-4 w-4 mr-2 text-blue-500" />
                <h3 className="text-sm font-medium">{t("How It Works")}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t("The Wyckoff analysis will identify:")}
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
            
            {/* Show uploaded image */}
            {uploadedImage && (
              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted p-2 flex justify-between items-center">
                  <h3 className="text-sm font-medium">{t("Uploaded Chart")}</h3>
                  <Button variant="ghost" size="sm" onClick={triggerFileUpload}>
                    <Upload className="h-4 w-4 mr-1" />
                    {t("Upload New")}
                  </Button>
                </div>
                <div className="p-4 flex justify-center">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded Chart" 
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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
                disabled={!uploadedImage || isLoading}
                className="w-full md:w-auto"
              >
                {isLoading ? (
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
                {/* Analysis results would be displayed here */}
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-semibold mb-2">
                    {t("Wyckoff Analysis Results")}
                  </h3>
                  <p>
                    {analysisResult.summary || t("Analysis completed successfully.")}
                  </p>
                  
                  {/* More detailed results would be rendered here based on the response structure */}
                </div>
                
                {/* Action buttons */}
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleNewAnalysis}>
                    {t("New Analysis")}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}