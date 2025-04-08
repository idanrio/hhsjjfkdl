import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { format, subDays, subMonths, subYears } from 'date-fns';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  X,
  History,
  Clock
} from 'lucide-react';

interface ProTradingViewReplayProps {
  tradingViewRef: React.RefObject<any>;
  onReplayStart?: (startDate: Date, endDate: Date) => void;
  onReplayEnd?: () => void;
  symbol?: string;
}

export function ProTradingViewReplay({
  tradingViewRef,
  onReplayStart,
  onReplayEnd,
  symbol = 'Unknown'
}: ProTradingViewReplayProps) {
  const { t } = useTranslation();
  const [replayMode, setReplayMode] = useState(false);
  const [replayDialogOpen, setReplayDialogOpen] = useState(false);
  const [replayControlsOpen, setReplayControlsOpen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Replay date range
  const [replayRange, setReplayRange] = useState<{ start: Date, end: Date }>({
    start: subMonths(new Date(), 3), // Default to 3 months ago
    end: new Date() // Current date
  });
  
  // Current position in replay timeline
  const [currentReplayDate, setCurrentReplayDate] = useState<Date>(replayRange.start);
  
  // Reference to store interval ID for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Handle replay mode changes
  useEffect(() => {
    if (replayMode) {
      setReplayControlsOpen(true);
      if (tradingViewRef.current && tradingViewRef.current.toggleReplayMode) {
        tradingViewRef.current.toggleReplayMode();
      }
      if (onReplayStart) {
        onReplayStart(replayRange.start, replayRange.end);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPlaying(false);
      if (tradingViewRef.current && tradingViewRef.current.toggleReplayMode) {
        const isInReplayMode = tradingViewRef.current.isInReplayMode ? 
          tradingViewRef.current.isInReplayMode() : false;
        
        if (isInReplayMode) {
          tradingViewRef.current.toggleReplayMode();
        }
      }
      if (onReplayEnd) {
        onReplayEnd();
      }
    }
    
    // Initialize current date at the start of replay
    if (replayMode) {
      setCurrentReplayDate(replayRange.start);
    }
  }, [replayMode, replayRange, onReplayStart, onReplayEnd]);
  
  // Create a playback mechanism when isPlaying is true
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (isPlaying && replayMode) {
      intervalRef.current = setInterval(() => {
        // Calculate time increment based on speed
        let incrementMinutes = 1;
        switch (Math.floor(playbackSpeed)) {
          case 1: incrementMinutes = 1; break; // 1x -> 1 min
          case 2: incrementMinutes = 2; break; // 2x -> 2 min
          case 3: incrementMinutes = 5; break; // 3x -> 5 min
          case 4: incrementMinutes = 10; break; // 4x -> 10 min
          case 5: incrementMinutes = 15; break; // 5x -> 15 min
          case 10: incrementMinutes = 30; break; // 10x -> 30 min
          default: incrementMinutes = 1;
        }
        
        setCurrentReplayDate(prevDate => {
          const newDate = new Date(prevDate);
          newDate.setMinutes(newDate.getMinutes() + incrementMinutes);
          
          // Stop if we reach the end
          if (newDate > replayRange.end) {
            setIsPlaying(false);
            return replayRange.end;
          }
          
          return newDate;
        });
      }, 1000); // Update each second
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, playbackSpeed, replayMode, replayRange]);
  
  // Start replay with selected date range
  const startReplay = () => {
    setReplayMode(true);
    setReplayDialogOpen(false);
  };
  
  // Exit replay mode
  const exitReplay = () => {
    setReplayMode(false);
    setReplayControlsOpen(false);
  };
  
  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Navigation functions
  const stepBackward = () => {
    const newDate = new Date(currentReplayDate);
    newDate.setMinutes(newDate.getMinutes() - 1); // Move back one minute
    
    if (newDate < replayRange.start) {
      newDate.setTime(replayRange.start.getTime());
    }
    
    setCurrentReplayDate(newDate);
    setIsPlaying(false);
  };
  
  const stepForward = () => {
    const newDate = new Date(currentReplayDate);
    newDate.setMinutes(newDate.getMinutes() + 1); // Move forward one minute
    
    if (newDate > replayRange.end) {
      newDate.setTime(replayRange.end.getTime());
    }
    
    setCurrentReplayDate(newDate);
    setIsPlaying(false);
  };
  
  const skipBackward = () => {
    const newDate = new Date(currentReplayDate);
    newDate.setHours(newDate.getHours() - 1); // Skip back 1 hour
    
    if (newDate < replayRange.start) {
      newDate.setTime(replayRange.start.getTime());
    }
    
    setCurrentReplayDate(newDate);
    setIsPlaying(false);
  };
  
  const skipForward = () => {
    const newDate = new Date(currentReplayDate);
    newDate.setHours(newDate.getHours() + 1); // Skip forward 1 hour
    
    if (newDate > replayRange.end) {
      newDate.setTime(replayRange.end.getTime());
    }
    
    setCurrentReplayDate(newDate);
    setIsPlaying(false);
  };
  
  const goToStart = () => {
    setCurrentReplayDate(replayRange.start);
    setIsPlaying(false);
  };
  
  return (
    <div>
      {/* Replay Button */}
      <Button 
        variant="default" 
        className="gap-1.5 bg-[#1c3d86] hover:bg-[#1c3d86]/90 text-white"
        onClick={() => setReplayDialogOpen(true)}
      >
        <History className="h-4 w-4" />
        {t('Replay')}
      </Button>
      
      {/* Replay Setup Dialog */}
      <Dialog open={replayDialogOpen} onOpenChange={setReplayDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#131722] border-[#2a2e39] text-white">
          <DialogHeader>
            <DialogTitle className="text-[#22a1e2]">{t('Start Replay Session')}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {t('Choose a time range to replay market data for')} {symbol}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="preset" className="mt-2">
            <TabsList className="grid w-full grid-cols-2 bg-[#1E222D]">
              <TabsTrigger 
                value="preset" 
                className="data-[state=active]:bg-[#22a1e2] data-[state=active]:text-white"
              >
                {t('Preset Ranges')}
              </TabsTrigger>
              <TabsTrigger 
                value="custom" 
                className="data-[state=active]:bg-[#22a1e2] data-[state=active]:text-white"
              >
                {t('Custom Range')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="preset" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="bg-[#1E222D] hover:bg-[#2a2e39] border-[#2a2e39] text-white"
                  onClick={() => {
                    const end = new Date();
                    const start = subDays(end, 7);
                    setReplayRange({ start, end });
                  }}
                >
                  {t('Last 7 Days')}
                </Button>
                
                <Button 
                  variant="outline"
                  className="bg-[#1E222D] hover:bg-[#2a2e39] border-[#2a2e39] text-white"
                  onClick={() => {
                    const end = new Date();
                    const start = subDays(end, 30);
                    setReplayRange({ start, end });
                  }}
                >
                  {t('Last 30 Days')}
                </Button>
                
                <Button 
                  variant="outline"
                  className="bg-[#1E222D] hover:bg-[#2a2e39] border-[#2a2e39] text-white"
                  onClick={() => {
                    const end = new Date();
                    const start = subMonths(end, 3);
                    setReplayRange({ start, end });
                  }}
                >
                  {t('Last 3 Months')}
                </Button>
                
                <Button 
                  variant="outline"
                  className="bg-[#1E222D] hover:bg-[#2a2e39] border-[#2a2e39] text-white"
                  onClick={() => {
                    const end = new Date();
                    const start = subYears(end, 1);
                    setReplayRange({ start, end });
                  }}
                >
                  {t('Last Year')}
                </Button>
              </div>
              
              <div className="pt-2">
                <div className="text-sm text-gray-400 mb-1">{t('Selected Range')}:</div>
                <div className="flex items-center justify-between bg-[#1E222D] p-2 rounded border border-[#2a2e39]">
                  <div>{format(replayRange.start, 'MMM dd, yyyy')}</div>
                  <div>→</div>
                  <div>{format(replayRange.end, 'MMM dd, yyyy')}</div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="custom" className="py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-400">{t('Start Date')}</h4>
                  <Calendar
                    mode="single"
                    selected={replayRange.start}
                    onSelect={(date) => date && setReplayRange({ ...replayRange, start: date })}
                    disabled={(date) => date > replayRange.end || date > new Date()}
                    className="border border-[#2a2e39] bg-[#1E222D] rounded-md"
                  />
                </div>
                
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-400">{t('End Date')}</h4>
                  <Calendar
                    mode="single"
                    selected={replayRange.end}
                    onSelect={(date) => date && setReplayRange({ ...replayRange, end: date })}
                    disabled={(date) => date < replayRange.start || date > new Date()}
                    className="border border-[#2a2e39] bg-[#1E222D] rounded-md"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="sm:justify-start gap-2 mt-2">
            <Button 
              variant="default" 
              onClick={startReplay}
              className="bg-[#22a1e2] hover:bg-[#22a1e2]/90 text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              {t('Start Replay')}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setReplayDialogOpen(false)}
              className="bg-transparent hover:bg-[#2a2e39] border-[#2a2e39] text-white"
            >
              {t('Cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Replay Controls (TradingView style) */}
      {replayMode && replayControlsOpen && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#131722] border-t border-[#2a2e39] flex items-center justify-between px-4 py-1.5 z-50">
          <div className="flex items-center">
            <div className="bg-[#22a1e2]/10 text-[#22a1e2] rounded px-3 py-1 text-sm font-medium mr-4">
              {format(currentReplayDate, 'MMM dd yyyy HH:mm')}
            </div>
            
            <div className="flex space-x-2 items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-sm hover:bg-[#1E222D]" 
                onClick={goToStart}
                title={t("Go to Start")}
              >
                <SkipBack className="h-4 w-4 text-white" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-sm hover:bg-[#1E222D]" 
                onClick={skipBackward}
                title={t("Skip Backward")}
              >
                <SkipBack className="h-4 w-4 text-white" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-sm hover:bg-[#1E222D]" 
                onClick={stepBackward}
                title={t("Previous Bar")}
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-sm hover:bg-[#1E222D]"
                onClick={togglePlay}
                title={isPlaying ? t("Pause") : t("Play")}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 text-white" />
                ) : (
                  <Play className="h-5 w-5 text-white" />
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-sm hover:bg-[#1E222D]" 
                onClick={stepForward}
                title={t("Next Bar")}
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-sm hover:bg-[#1E222D]" 
                onClick={skipForward}
                title={t("Skip Forward")}
              >
                <SkipForward className="h-4 w-4 text-white" />
              </Button>
              
              <div className="flex items-center space-x-2 ml-2">
                <span className="text-xs text-white">{t("Speed")}:</span>
                <Badge variant="outline" className="h-6 bg-[#1E222D] border-[#2a2e39] text-white">
                  {playbackSpeed}x
                </Badge>
                <div className="w-32">
                  <Slider
                    defaultValue={[1]}
                    min={1}
                    max={10}
                    step={1}
                    value={[playbackSpeed]}
                    onValueChange={(values) => setPlaybackSpeed(values[0])}
                    className="h-1.5"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 rounded-sm bg-transparent hover:bg-[#1E222D] border-[#2a2e39] text-white"
              onClick={exitReplay}
            >
              {t("Exit Replay")}
            </Button>
            <Button
              size="sm"
              className="h-8 w-8 p-0 rounded-sm text-white"
              variant="ghost"
              onClick={exitReplay}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProTradingViewReplay;