import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { format, subDays, subMonths, addDays } from 'date-fns';

interface TradingViewReplayModeProps {
  symbol?: string;
  isActive?: boolean;
  onExit?: () => void;
  onDateChange?: (date: Date) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export function TradingViewReplayMode({
  symbol = 'BTCUSD',
  isActive = false,
  onExit,
  onDateChange,
  onPlayStateChange
}: TradingViewReplayModeProps) {
  const { t } = useTranslation();
  const [playState, setPlayState] = useState<'playing' | 'paused'>('paused');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2023, 11, 15));
  const [dateRange, setDateRange] = useState({
    start: subMonths(new Date(), 6),
    end: new Date()
  });
  const [progress, setProgress] = useState(0);
  const [selectedAction, setSelectedAction] = useState<'buy' | 'sell' | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Start/stop playback when play state changes
  useEffect(() => {
    if (playState === 'playing') {
      // Start playback
      intervalRef.current = setInterval(() => {
        setCurrentDate(prev => {
          const increment = playbackSpeed * 60 * 1000; // Convert to milliseconds
          const newDate = new Date(prev.getTime() + increment);
          
          // If we've reached the end of the range, pause playback
          if (newDate > dateRange.end) {
            setPlayState('paused');
            if (onPlayStateChange) onPlayStateChange(false);
            return dateRange.end;
          }
          
          // Calculate progress percentage
          const totalRange = dateRange.end.getTime() - dateRange.start.getTime();
          const currentPosition = newDate.getTime() - dateRange.start.getTime();
          setProgress((currentPosition / totalRange) * 100);
          
          if (onDateChange) onDateChange(newDate);
          return newDate;
        });
      }, 1000); // Update every second
      
      if (onPlayStateChange) onPlayStateChange(true);
    } else {
      // Stop playback
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (onPlayStateChange) onPlayStateChange(false);
    }
    
    // Clean up on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [playState, playbackSpeed, dateRange, onDateChange, onPlayStateChange]);
  
  // Toggle play/pause
  const togglePlayState = () => {
    setPlayState(prev => prev === 'playing' ? 'paused' : 'playing');
  };
  
  // Step backward one bar
  const stepBackward = () => {
    setPlayState('paused');
    setCurrentDate(prev => {
      const newDate = new Date(prev.getTime() - (15 * 60 * 1000)); // 15 minutes back
      if (newDate < dateRange.start) return dateRange.start;
      
      // Update progress
      const totalRange = dateRange.end.getTime() - dateRange.start.getTime();
      const currentPosition = newDate.getTime() - dateRange.start.getTime();
      setProgress((currentPosition / totalRange) * 100);
      
      if (onDateChange) onDateChange(newDate);
      return newDate;
    });
  };
  
  // Step forward one bar
  const stepForward = () => {
    setPlayState('paused');
    setCurrentDate(prev => {
      const newDate = new Date(prev.getTime() + (15 * 60 * 1000)); // 15 minutes forward
      if (newDate > dateRange.end) return dateRange.end;
      
      // Update progress
      const totalRange = dateRange.end.getTime() - dateRange.start.getTime();
      const currentPosition = newDate.getTime() - dateRange.start.getTime();
      setProgress((currentPosition / totalRange) * 100);
      
      if (onDateChange) onDateChange(newDate);
      return newDate;
    });
  };
  
  // Go to start of range
  const goToStart = () => {
    setPlayState('paused');
    setCurrentDate(dateRange.start);
    setProgress(0);
    
    if (onDateChange) onDateChange(dateRange.start);
  };
  
  // Handle exit
  const handleExit = () => {
    setPlayState('paused');
    if (onExit) onExit();
  };

  // Only render if active
  if (!isActive) return null;
  
  return (
    <div className="trading-view-replay-mode">
      {/* Replay Navigation Bar */}
      <div className="replay-navbar fixed bottom-0 left-0 right-0 h-12 bg-[#131722] border-t border-[#2A2E39] flex items-center px-3 z-50">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Date Display */}
            <div className="bg-[#1E222D] text-[#B2B5BE] px-3 py-1 rounded text-sm font-medium">
              {format(currentDate, 'MMM dd yyyy HH:mm')}
            </div>
            
            {/* Playback Controls */}
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-sm text-[#B2B5BE] hover:bg-[#2A2E39]"
                onClick={goToStart}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 4V10M12 4L7 7L12 10V4Z" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-sm text-[#B2B5BE] hover:bg-[#2A2E39]"
                onClick={stepBackward}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 4L5 7L8 10" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-sm text-[#B2B5BE] hover:bg-[#2A2E39]"
                onClick={togglePlayState}
              >
                {playState === 'playing' ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 4V10M9 4V10" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 4L10 7L5 10V4Z" fill="currentColor"/>
                  </svg>
                )}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-sm text-[#B2B5BE] hover:bg-[#2A2E39]"
                onClick={stepForward}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 4L9 7L6 10" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
              </Button>
            </div>
            
            {/* Playback Speed */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#B2B5BE]">{t('Speed')}:</span>
              <div className="bg-[#1E222D] text-[#B2B5BE] px-2 py-0.5 rounded text-xs font-medium">
                {playbackSpeed}x
              </div>
              <div className="w-24">
                <Slider
                  value={[playbackSpeed]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(values) => setPlaybackSpeed(values[0])}
                  className="h-1"
                />
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="relative w-32 h-1 bg-[#2A2E39] rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-[#2962FF] rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          
          {/* Order Buttons and Exit */}
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              className={`h-8 px-4 rounded-sm ${selectedAction === 'sell' ? 'bg-[#F23645]' : 'bg-[#131722] border border-[#F23645] text-[#F23645]'} hover:bg-[#F23645] hover:text-white`}
              onClick={() => setSelectedAction('sell')}
            >
              {t('Sell')}
            </Button>
            
            <Button
              size="sm"
              className={`h-8 px-4 rounded-sm ${selectedAction === 'buy' ? 'bg-[#089981]' : 'bg-[#131722] border border-[#089981] text-[#089981]'} hover:bg-[#089981] hover:text-white`}
              onClick={() => setSelectedAction('buy')}
            >
              {t('Buy')}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 rounded-sm bg-transparent border-[#2A2E39] text-white hover:bg-[#2A2E39]"
              onClick={handleExit}
            >
              {t('Exit Replay')}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Background Overlay - Shows the replay mode is active */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#2962FF] z-40"></div>
      
      {/* Replay Mode Indicator */}
      <div className="fixed top-1 left-1/2 transform -translate-x-1/2 bg-[#2962FF] text-white text-xs font-bold px-2 py-0.5 rounded z-40">
        REPLAY MODE
      </div>
    </div>
  );
}

export default TradingViewReplayMode;