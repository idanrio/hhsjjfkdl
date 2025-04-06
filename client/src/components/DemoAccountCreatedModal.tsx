import React from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CapitulreLogo } from "@/assets/logo";
import { useTranslation } from "react-i18next";

interface DemoAccountCreatedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoAccountCreatedModal({
  open,
  onOpenChange,
}: DemoAccountCreatedModalProps) {
  const [_, setLocation] = useLocation();
  const { t } = useTranslation();

  const handleContinueToTrading = () => {
    onOpenChange(false);
    setLocation("/backtest/paper-trading");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="absolute w-full h-full -z-10 opacity-10 bg-[url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80')] bg-cover bg-center rounded-md"></div>
        <DialogHeader className="text-center">
          <div className="mx-auto mb-2">
            <CapitulreLogo className="h-12 mx-auto" />
          </div>
          <DialogTitle className="text-xl font-bold text-[#1c3d86]">
            {t("Congratulations!")}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 text-center">
          <div className="mb-6">
            <div className="text-2xl font-bold text-[#22a1e2] mb-2">
              {t("You've received")}
            </div>
            <div className="text-4xl font-bold text-[#1c3d86]">$150,000</div>
            <div className="text-xl font-semibold text-[#1c3d86] mb-4">
              {t("FREE DEMO TRADING ACCOUNT")}
            </div>
            <p className="text-gray-600 mt-2">
              {t("Start practicing with professional tools and real-time market data without any financial risk.")}
            </p>
          </div>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button 
            onClick={handleContinueToTrading} 
            className="w-full bg-gradient-to-r from-[#1c3d86] to-[#22a1e2] hover:from-[#22a1e2] hover:to-[#1c3d86] text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            {t("Continue To Trading")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}