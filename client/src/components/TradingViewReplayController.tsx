import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { addDays, format, subDays, subMonths, subYears } from 'date-fns';
import { Play, Pause, SkipBack, SkipForward, CalendarIcon } from 'lucide-react';

interface ReplayControllerProps {
  isActive: boolean;
  onToggleReplay: () => void;
  onDateChange?: (date: Date) => void;
  onSpeedChange?: (speed: number) => void;
  symbol?: string;
  className?: string;
}

export function TradingViewReplayController({
  isActive,
  onToggleReplay,
  onDateChange,
  onSpeedChange,
  symbol = 'Unknown',
  className = ''
}: ReplayControllerProps) {
  const { t } = useTranslation();
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 3));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [progress, setProgress] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // When replay is toggled or becomes inactive, stop any existing timers
  useEffect(() => {
    if (!isActive && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsPlaying(false);
    }
    
    // If dialog is opened, set to not playing
    if (isSetupDialogOpen) {
      setIsPlaying(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, isSetupDialogOpen]);
  
  // Manage play/pause
  useEffect(() => {
    if (!isActive) return;
    
    if (isPlaying) {
      // Start playback
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      timerRef.current = setInterval(() => {
        setCurrentDate(prevDate => {
          const newDate = addDays(prevDate, replaySpeed * 0.01);
          
          // Stop if we reached the end
          if (newDate > endDate) {
            setIsPlaying(false);
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            return endDate;
          }
          
          // Calculate progress
          const totalTimespan = endDate.getTime() - startDate.getTime();
          const elapsed = newDate.getTime() - startDate.getTime();
          const newProgress = (elapsed / totalTimespan) * 100;
          setProgress(newProgress);
          
          if (onDateChange) {
            onDateChange(newDate);
          }
          
          return newDate;
        });
      }, 100);
    } else if (timerRef.current) {
      // Stop playback
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, replaySpeed, isActive, startDate, endDate, onDateChange]);
  
  // Reset everything when replay is first activated
  useEffect(() => {
    if (isActive && !isSetupDialogOpen) {
      setIsSetupDialogOpen(true);
    }
  }, [isActive, isSetupDialogOpen]);
  
  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Step forward one bar
  const stepForward = () => {
    setIsPlaying(false);
    const newDate = addDays(currentDate, 1);
    if (newDate > endDate) {
      setCurrentDate(endDate);
    } else {
      setCurrentDate(newDate);
      
      // Calculate progress
      const totalTimespan = endDate.getTime() - startDate.getTime();
      const elapsed = newDate.getTime() - startDate.getTime();
      const newProgress = (elapsed / totalTimespan) * 100;
      setProgress(newProgress);
      
      if (onDateChange) {
        onDateChange(newDate);
      }
    }
  };
  
  // Step backward one bar
  const stepBackward = () => {
    setIsPlaying(false);
    const newDate = subDays(currentDate, 1);
    if (newDate < startDate) {
      setCurrentDate(startDate);
    } else {
      setCurrentDate(newDate);
      
      // Calculate progress
      const totalTimespan = endDate.getTime() - startDate.getTime();
      const elapsed = newDate.getTime() - startDate.getTime();
      const newProgress = (elapsed / totalTimespan) * 100;
      setProgress(newProgress);
      
      if (onDateChange) {
        onDateChange(newDate);
      }
    }
  };
  
  // Start from beginning
  const resetToStart = () => {
    setIsPlaying(false);
    setCurrentDate(startDate);
    setProgress(0);
    
    if (onDateChange) {
      onDateChange(startDate);
    }
  };
  
  // Handle speed change
  const handleSpeedChange = (value: number[]) => {
    const speed = value[0];
    setReplaySpeed(speed);
    
    if (onSpeedChange) {
      onSpeedChange(speed);
    }
  };
  
  // Handle range preset selection
  const selectRangePreset = (preset: 'week' | 'month' | '3months' | 'year') => {
    const end = new Date();
    let start;
    
    switch (preset) {
      case 'week':
        start = subDays(end, 7);
        break;
      case 'month':
        start = subDays(end, 30);
        break;
      case '3months':
        start = subMonths(end, 3);
        break;
      case 'year':
        start = subYears(end, 1);
        break;
      default:
        start = subMonths(end, 3);
    }
    
    setStartDate(start);
    setEndDate(end);
  };
  
  // Start replay with current settings
  const startReplay = () => {
    setIsSetupDialogOpen(false);
    setCurrentDate(startDate);
    setProgress(0);
    
    if (onDateChange) {
      onDateChange(startDate);
    }
  };
  
  // Cancel replay
  const cancelReplay = () => {
    setIsSetupDialogOpen(false);
    onToggleReplay(); // Turn off replay mode
  };
  
  if (!isActive) return null;
  
  return (
    <>
      {/* Setup Dialog */}
      <Dialog open={isSetupDialogOpen} onOpenChange={setIsSetupDialogOpen}>
        <DialogContent className="bg-[#131722] border-[#2A2E39] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#22a1e2]">Start Replay</DialogTitle>
            <DialogDescription className="text-[#9598A1]">
              Choose a time range to replay {symbol}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div className="space-y-3">
              <div className="font-medium">Preset Ranges</div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="bg-[#1E222D] border-[#2A2E39] hover:bg-[#2A2E39] text-white w-full justify-start"
                  onClick={() => selectRangePreset('week')}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Last 7 Days
                </Button>
                <Button
                  variant="outline"
                  className="bg-[#1E222D] border-[#2A2E39] hover:bg-[#2A2E39] text-white w-full justify-start"
                  onClick={() => selectRangePreset('month')}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Last 30 Days
                </Button>
                <Button
                  variant="outline"
                  className="bg-[#1E222D] border-[#2A2E39] hover:bg-[#2A2E39] text-white w-full justify-start"
                  onClick={() => selectRangePreset('3months')}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Last 3 Months
                </Button>
                <Button
                  variant="outline"
                  className="bg-[#1E222D] border-[#2A2E39] hover:bg-[#2A2E39] text-white w-full justify-start"
                  onClick={() => selectRangePreset('year')}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Last Year
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium">Custom Range</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[#9598A1] mb-1">Start Date</div>
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    disabled={(date) => date > endDate || date > new Date()}
                    className="border border-[#2A2E39] bg-[#1E222D] rounded-md"
                  />
                </div>
                <div>
                  <div className="text-xs text-[#9598A1] mb-1">End Date</div>
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    disabled={(date) => date < startDate || date > new Date()}
                    className="border border-[#2A2E39] bg-[#1E222D] rounded-md"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium">Selected Range</div>
              <div className="flex items-center justify-between bg-[#1E222D] p-2 rounded border border-[#2A2E39]">
                <div>{format(startDate, 'MMM dd, yyyy')}</div>
                <div>→</div>
                <div>{format(endDate, 'MMM dd, yyyy')}</div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button
              className="bg-[#22a1e2] hover:bg-[#22a1e2]/80 text-white"
              onClick={startReplay}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Replay
            </Button>
            <Button
              variant="outline"
              className="bg-transparent border-[#2A2E39] text-white hover:bg-[#2A2E39]"
              onClick={cancelReplay}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Replay Controls Bar */}
      {isActive && !isSetupDialogOpen && (
        <div className={`fixed bottom-0 left-0 right-0 z-50 border-t border-[#2A2E39] bg-[#131722] py-2 px-4 ${className}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              {/* Current Date */}
              <div className="bg-[#1E222D] text-white px-3 py-1 rounded text-sm font-medium">
                {format(currentDate, 'MMM dd, yyyy')}
              </div>
              
              {/* Playback Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-white hover:bg-[#2A2E39]"
                  onClick={resetToStart}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-white hover:bg-[#2A2E39]"
                  onClick={stepBackward}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-white hover:bg-[#2A2E39]"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-white hover:bg-[#2A2E39]"
                  onClick={stepForward}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Playback Speed */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-white">Speed:</span>
                <div className="bg-[#1E222D] text-white px-2 py-0.5 rounded text-xs font-medium">
                  {replaySpeed}x
                </div>
                <div className="w-24">
                  <Slider
                    value={[replaySpeed]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={handleSpeedChange}
                    className="h-1"
                  />
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="relative flex-1 h-1.5 bg-[#2A2E39] rounded-full overflow-hidden max-w-xs">
                <div
                  className="absolute top-0 left-0 h-full bg-[#2962FF] rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            
            {/* Exit Button */}
            <Button
              size="sm"
              variant="outline"
              className="ml-4 bg-transparent border-[#2A2E39] text-white hover:bg-[#2A2E39]"
              onClick={onToggleReplay}
            >
              Exit Replay
            </Button>
          </div>
        </div>
      )}
      
      {/* Indicator that replay mode is active - blue bar at top */}
      {isActive && !isSetupDialogOpen && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-[#2962FF] z-40"></div>
      )}
      
      {/* Replay Mode Indicator Floating Badge */}
      {isActive && !isSetupDialogOpen && (
        <div className="fixed top-1 left-1/2 transform -translate-x-1/2 bg-[#2962FF] text-white text-xs font-bold px-2 py-0.5 rounded z-40">
          REPLAY MODE
        </div>
      )}
    </>
  );
}

export default TradingViewReplayController;