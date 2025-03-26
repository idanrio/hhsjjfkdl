import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Play, Pause, Rewind, FastForward, Clock } from "lucide-react";

interface TimeControllerProps {
  onTimeChange: (date: Date) => void;
  onSpeedChange: (speed: number) => void;
  onPlayingChange: (isPlaying: boolean) => void;
  initialDate?: Date;
}

const TimeController: React.FC<TimeControllerProps> = ({
  onTimeChange,
  onSpeedChange,
  onPlayingChange,
  initialDate = new Date()
}) => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [timeStep, setTimeStep] = useState<string>("hour");

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
          <Button variant="outline" size="sm" onClick={rewindTime}>
            <Rewind className="h-4 w-4" />
          </Button>
          <Button 
            variant={isPlaying ? "destructive" : "default"} 
            size="sm" 
            onClick={togglePlay} 
            className="flex-grow"
          >
            {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isPlaying ? t("Pause") : t("Play")}
          </Button>
          <Button variant="outline" size="sm" onClick={fastForwardTime}>
            <FastForward className="h-4 w-4" />
          </Button>
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
    </div>
  );
};

export default TimeController;