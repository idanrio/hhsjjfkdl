import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { 
  Play, 
  Pause, 
  Rewind, 
  FastForward, 
  Clock, 
  SkipBack, 
  SkipForward, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from 'date-fns';

interface TimeControllerProps {
  onTimeChange: (date: Date) => void;
  onSpeedChange: (speed: number) => void;
  onPlayingChange: (isPlaying: boolean) => void;
  initialDate?: Date;
  symbol?: string;
}

const TimeController: React.FC<TimeControllerProps> = ({
  onTimeChange,
  onSpeedChange,
  onPlayingChange,
  initialDate = new Date(),
  symbol = 'BTC/USD'
}) => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [timeStep, setTimeStep] = useState<string>("hour");
  
  // Replay mode state
  const [replayMode, setReplayMode] = useState<boolean>(false);
  const [replayDialogOpen, setReplayDialogOpen] = useState<boolean>(false);
  const [replayRange, setReplayRange] = useState<{ start: Date, end: Date }>({
    start: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    end: new Date()
  });
  
  // Reference to store interval ID for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update all time states and call parent callbacks
  const updateTime = (newDate: Date, newPlaying = isPlaying, newSpeed = playbackSpeed) => {
    setCurrentDate(newDate);
    setIsPlaying(newPlaying);
    setPlaybackSpeed(newSpeed);
    
    onTimeChange(newDate);
    onPlayingChange(newPlaying);
    onSpeedChange(newSpeed);
  };

  // Play/Pause control
  const togglePlay = () => {
    updateTime(currentDate, !isPlaying);
  };

  // Rewind time
  const rewindTime = () => {
    const newDate = new Date(currentDate);
    
    if (timeStep === "minute") {
      newDate.setMinutes(newDate.getMinutes() - 5);
    } else if (timeStep === "hour") {
      newDate.setHours(newDate.getHours() - 1);
    } else if (timeStep === "day") {
      newDate.setDate(newDate.getDate() - 1);
    } else if (timeStep === "week") {
      newDate.setDate(newDate.getDate() - 7);
    }
    
    updateTime(newDate, false);
  };

  // Fast forward time
  const fastForwardTime = () => {
    const newDate = new Date(currentDate);
    
    if (timeStep === "minute") {
      newDate.setMinutes(newDate.getMinutes() + 5);
    } else if (timeStep === "hour") {
      newDate.setHours(newDate.getHours() + 1);
    } else if (timeStep === "day") {
      newDate.setDate(newDate.getDate() + 1);
    } else if (timeStep === "week") {
      newDate.setDate(newDate.getDate() + 7);
    }
    
    // Don't let us go beyond current time
    const now = new Date();
    if (newDate > now) {
      newDate.setTime(now.getTime());
    }
    
    updateTime(newDate, false);
  };

  // Change speed
  const handleSpeedChange = (values: number[]) => {
    const newSpeed = values[0];
    updateTime(currentDate, isPlaying, newSpeed);
  };
  
  // Replay mode functions
  
  // Start replay mode
  const startReplay = () => {
    setReplayMode(true);
    updateTime(replayRange.start, false);
    setReplayDialogOpen(false);
  };
  
  // Exit replay mode
  const exitReplay = () => {
    setReplayMode(false);
    updateTime(new Date(), false);
  };
  
  // TradingView-style replay controls
  const stepBackward = () => {
    // Move back one bar (1 minute in our implementation)
    const newDate = new Date(currentDate);
    newDate.setMinutes(newDate.getMinutes() - 1);
    if (newDate < replayRange.start) {
      newDate.setTime(replayRange.start.getTime());
    }
    updateTime(newDate, false);
  };
  
  const stepForward = () => {
    // Move forward one bar (1 minute)
    const newDate = new Date(currentDate);
    newDate.setMinutes(newDate.getMinutes() + 1);
    if (newDate > replayRange.end) {
      newDate.setTime(replayRange.end.getTime());
    }
    updateTime(newDate, false);
  };
  
  const skipBackward = () => {
    // Skip back 10 bars
    const newDate = new Date(currentDate);
    newDate.setMinutes(newDate.getMinutes() - 10);
    if (newDate < replayRange.start) {
      newDate.setTime(replayRange.start.getTime());
    }
    updateTime(newDate, false);
  };
  
  const skipForward = () => {
    // Skip forward 10 bars
    const newDate = new Date(currentDate);
    newDate.setMinutes(newDate.getMinutes() + 10);
    if (newDate > replayRange.end) {
      newDate.setTime(replayRange.end.getTime());
    }
    updateTime(newDate, false);
  };
  
  const goToStart = () => {
    // Go to the start of the replay range
    updateTime(replayRange.start, false);
  };
  
  // Update time automatically when playing in replay mode
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (isPlaying && replayMode) {
      intervalRef.current = setInterval(() => {
        // Calculate time increment based on speed
        let increment = 1;
        switch (Math.floor(playbackSpeed)) {
          case 0: increment = 1; break; // 0.5x -> 1 min
          case 1: increment = 1; break; // 1x -> 1 min
          case 2: increment = 2; break; // 2x -> 2 min
          case 3: increment = 5; break; // 3x -> 5 min
          case 4: increment = 10; break; // 4x -> 10 min
          case 5: increment = 15; break; // 5x -> 15 min
          default: increment = 1;
        }
        
        // Move forward in time for replay
        const newDate = new Date(currentDate);
        newDate.setMinutes(newDate.getMinutes() + increment);
        
        // Stop if we reach the end
        if (newDate > replayRange.end) {
          setIsPlaying(false);
          onPlayingChange(false);
          updateTime(replayRange.end, false);
          return;
        }
        
        updateTime(newDate, true);
      }, 1000); // Update each second
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, currentDate, playbackSpeed, replayMode, replayRange]);

  if (replayMode) {
    // Render TradingView-style replay controller
    return (
      <div className="bg-card p-4 rounded-lg shadow-md border border-border">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-blue-500" />
              <h3 className="font-medium text-blue-500">{t("Replay")} - {symbol}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-500 border-blue-500">
                {format(currentDate, 'PPP HH:mm')}
              </Badge>
              <Button variant="outline" size="sm" onClick={exitReplay}>
                {t("Exit Replay")}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" onClick={goToStart} title={t("Go to Start")}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={skipBackward} title={t("Skip Back 10 Bars")}>
                <Rewind className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={stepBackward} title={t("Previous Bar")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant={isPlaying ? "default" : "outline"} 
                size="sm" 
                onClick={togglePlay} 
                className="flex items-center px-4"
              >
                {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isPlaying ? t("Pause") : t("Play")}
              </Button>
              <Button variant="ghost" size="icon" onClick={stepForward} title={t("Next Bar")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={skipForward} title={t("Skip Forward 10 Bars")}>
                <FastForward className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">{t("Speed")}</span>
              <Slider 
                className="w-24"
                defaultValue={[1]} 
                min={0.5} 
                max={5} 
                step={0.5} 
                value={[playbackSpeed]}
                onValueChange={handleSpeedChange}
              />
              <Badge variant="outline">{playbackSpeed}x</Badge>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular time controller with Replay button
  return (
    <div className="bg-card p-4 rounded-lg shadow-md border border-border">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">{t("Time Controller")}</h3>
          </div>
          <Badge variant={isPlaying ? "default" : "outline"}>
            {currentDate.toLocaleString()}
          </Badge>
        </div>
        
        <Tabs value={timeStep} onValueChange={setTimeStep} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="minute">{t("5m")}</TabsTrigger>
            <TabsTrigger value="hour">{t("1h")}</TabsTrigger>
            <TabsTrigger value="day">{t("1d")}</TabsTrigger>
            <TabsTrigger value="week">{t("1w")}</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center justify-between space-x-2">
          <Button 
            variant="default" 
            size="sm" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            onClick={() => setReplayDialogOpen(true)}
          >
            <Play className="h-4 w-4 mr-2" />
            {t("Replay")}
          </Button>
          
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm" onClick={rewindTime}>
              <Rewind className="h-4 w-4" />
            </Button>
            <Button 
              variant={isPlaying ? "destructive" : "default"} 
              size="sm" 
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isPlaying ? t("Pause") : t("Play")}
            </Button>
            <Button variant="outline" size="sm" onClick={fastForwardTime}>
              <FastForward className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t("Speed")}</span>
            <Badge variant="outline">{playbackSpeed}x</Badge>
          </div>
          <Slider 
            defaultValue={[1]} 
            min={0.5} 
            max={5} 
            step={0.5} 
            value={[playbackSpeed]}
            onValueChange={handleSpeedChange}
          />
        </div>
      </div>
      
      {/* Replay Setup Dialog */}
      <Dialog open={replayDialogOpen} onOpenChange={setReplayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Start Replay Session")}</DialogTitle>
            <DialogDescription>
              {t("Choose a time range to replay market data for")} {symbol}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="preset" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preset">{t("Preset Ranges")}</TabsTrigger>
              <TabsTrigger value="custom">{t("Custom Range")}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preset" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 7);
                    setReplayRange({ start, end });
                  }}
                >
                  {t("Last 7 Days")}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 30);
                    setReplayRange({ start, end });
                  }}
                >
                  {t("Last 30 Days")}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setMonth(end.getMonth() - 3);
                    setReplayRange({ start, end });
                  }}
                >
                  {t("Last 3 Months")}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setFullYear(end.getFullYear() - 1);
                    setReplayRange({ start, end });
                  }}
                >
                  {t("Last Year")}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="custom" className="py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="mb-2 text-sm font-medium">{t("Start Date")}</h4>
                  <CalendarComponent
                    mode="single"
                    selected={replayRange.start}
                    onSelect={(date) => date && setReplayRange({ ...replayRange, start: date })}
                    disabled={(date) => date > replayRange.end || date > new Date()}
                  />
                </div>
                
                <div>
                  <h4 className="mb-2 text-sm font-medium">{t("End Date")}</h4>
                  <CalendarComponent
                    mode="single"
                    selected={replayRange.end}
                    onSelect={(date) => date && setReplayRange({ ...replayRange, end: date })}
                    disabled={(date) => date < replayRange.start || date > new Date()}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setReplayDialogOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button 
              onClick={startReplay} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              <Play className="h-4 w-4 mr-2" />
              {t("Start Replay")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimeController;