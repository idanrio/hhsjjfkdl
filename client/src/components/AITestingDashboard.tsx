import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Button 
} from '@/components/ui/button';
import { 
  Alert,
  AlertTitle,
  AlertDescription 
} from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { abTestingService } from '../services/abTestingService';
import { CheckCircle, AlertCircle, Clock, RefreshCw, Zap, Server, Layout, Lock } from 'lucide-react';

interface TestResult {
  testName: string;
  success: boolean;
  component: string;
  details: string;
}

interface TestResults {
  success: boolean;
  results: TestResult[];
  summary: string;
  timestamp: string;
}

export function AITestingDashboard() {
  const { t } = useTranslation();
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [progress, setProgress] = useState(0);
  
  const runTests = async () => {
    setIsRunningTests(true);
    setTestResults(null);
    setProgress(5);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          return 95;
        }
        // Simulate progress with random increments between 5-15%
        return prev + Math.floor(Math.random() * 10) + 5;
      });
    }, 1000);
    
    try {
      const results = await abTestingService.runAllTests();
      setTestResults(results);
      setProgress(100);
      
      // Log results to console for debugging
      console.log('AI Testing completed:', results);
    } catch (error) {
      console.error('Error running tests:', error);
      setTestResults({
        success: false,
        results: [{
          testName: 'Testing Framework',
          success: false,
          component: 'Framework',
          details: `Error running tests: ${error instanceof Error ? error.message : String(error)}`
        }],
        summary: 'Testing failed due to an error',
        timestamp: new Date().toISOString()
      });
      setProgress(100);
    } finally {
      clearInterval(progressInterval);
      setIsRunningTests(false);
    }
  };
  
  // Group test results by component
  const getGroupedResults = () => {
    if (!testResults) return {};
    
    const groupedResults: Record<string, TestResult[]> = {};
    
    testResults.results.forEach(result => {
      if (!groupedResults[result.component]) {
        groupedResults[result.component] = [];
      }
      groupedResults[result.component].push(result);
    });
    
    return groupedResults;
  };
  
  // Calculate pass rate for each component
  const getComponentPassRate = (results: TestResult[]) => {
    const total = results.length;
    const passed = results.filter(r => r.success).length;
    return {
      rate: Math.round((passed / total) * 100),
      passed,
      total
    };
  };
  
  // Get icon for component
  const getComponentIcon = (component: string) => {
    switch (component.toLowerCase()) {
      case 'authentication':
        return <Lock className="h-4 w-4" />;
      case 'ui':
      case 'navigation':
        return <Layout className="h-4 w-4" />;
      case 'api':
      case 'api configuration':
        return <Server className="h-4 w-4" />;
      case 'trading':
      case 'chart':
        return <Zap className="h-4 w-4" />;
      case 'aiassistant':
      case 'chartpatternanalysis':
      case 'tradingcoach':
      case 'personalizedadvice':
      case 'ai':
        return <Zap className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };
  
  const groupedResults = getGroupedResults();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-brand-primary" />
          {t("AI-Powered A/B Testing Environment")}
        </CardTitle>
        <CardDescription>
          {t("Automatically scan and test all application features and functionality")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Test Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium">{t("Test Application Features")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("Run comprehensive AI-powered tests on all application features")}
              </p>
            </div>
            <Button
              onClick={runTests}
              disabled={isRunningTests}
              className="bg-brand-primary hover:bg-brand-primary/90"
            >
              {isRunningTests ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t("Running Tests...")}
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  {t("Run All Tests")}
                </>
              )}
            </Button>
          </div>
          
          {/* Progress bar when tests are running */}
          {isRunningTests && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("Testing Progress")}</span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {/* Test results summary */}
          {testResults && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">
                    {testResults.success ? (
                      <span className="flex items-center text-green-600">
                        <CheckCircle className="mr-2 h-5 w-5" />
                        {t("All Tests Passed")}
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600">
                        <AlertCircle className="mr-2 h-5 w-5" />
                        {t("Some Tests Failed")}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {testResults.summary}
                  </p>
                </div>
                <div className="flex items-center mt-2 sm:mt-0">
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {new Date(testResults.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <Separator />
              
              {/* Component results */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t("Component Results")}</h3>
                
                <Accordion type="multiple" className="w-full">
                  {Object.entries(groupedResults).map(([component, results], index) => {
                    const { rate, passed, total } = getComponentPassRate(results);
                    const icon = getComponentIcon(component);
                    
                    return (
                      <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center">
                              {icon}
                              <span className="ml-2">{component}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={rate === 100 ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                                {passed}/{total} {t("Passed")} ({rate}%)
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ScrollArea className="h-[300px] rounded-md border p-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[150px]">{t("Status")}</TableHead>
                                  <TableHead>{t("Test Name")}</TableHead>
                                  <TableHead className="w-[350px]">{t("Details")}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {results.map((result, testIndex) => (
                                  <TableRow key={testIndex}>
                                    <TableCell>
                                      {result.success ? (
                                        <Badge className="bg-green-500 text-white flex items-center">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          {t("Pass")}
                                        </Badge>
                                      ) : (
                                        <Badge variant="destructive" className="flex items-center">
                                          <AlertCircle className="h-3 w-3 mr-1" />
                                          {t("Fail")}
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="font-medium">{result.testName}</TableCell>
                                    <TableCell className="text-sm">{result.details}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AITestingDashboard;