import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useParams, useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Trade, TradingPair, StrategyType, insertTradeSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ChevronLeft, ArrowRight, AlertTriangle } from "lucide-react";

// Extend the insert schema with additional validations
const tradeFormSchema = insertTradeSchema.extend({
  entryPrice: z.string().min(1, { message: "Entry price is required" }),
  amount: z.string().min(1, { message: "Amount is required" }),
  exitPrice: z.string().optional(),
  notes: z.string().optional(),
});

type TradeFormValues = z.infer<typeof tradeFormSchema>;

export default function TradeForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const params = useParams();
  const tradeId = params?.id ? parseInt(params.id) : null;
  const isEditMode = !!tradeId;
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Fetch trade data if editing
  const { data: tradeData, isLoading: tradeLoading } = useQuery({
    queryKey: ["/api/trades", tradeId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!tradeId && !!userData,
  });

  // Fetch trading pairs
  const { data: tradingPairs, isLoading: tradingPairsLoading } = useQuery({
    queryKey: ["/api/trading-pairs"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!userData,
  });

  // Fetch strategy types
  const { data: strategyTypes, isLoading: strategyTypesLoading } = useQuery({
    queryKey: ["/api/strategy-types"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!userData,
  });

  // Setup form
  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: {
      userId: 0,
      pair: "",
      tradeType: "long",
      strategy: "",
      entryPrice: "",
      exitPrice: "",
      amount: "",
      date: new Date().toISOString(),
      status: "active",
      notes: "",
    },
  });

  // Populate form with trade data when editing
  useEffect(() => {
    if (tradeData && !form.formState.isDirty) {
      form.reset({
        userId: tradeData.userId,
        pair: tradeData.pair,
        tradeType: tradeData.tradeType,
        strategy: tradeData.strategy,
        entryPrice: tradeData.entryPrice,
        exitPrice: tradeData.exitPrice || "",
        amount: tradeData.amount,
        date: tradeData.date,
        status: tradeData.status,
        notes: tradeData.notes || "",
      });
    }
  }, [tradeData, form]);

  // Set user ID when user data is available
  useEffect(() => {
    if (userData && !isEditMode) {
      form.setValue("userId", userData.id);
    }
  }, [userData, form, isEditMode]);

  // Create or update trade mutation
  const tradeMutation = useMutation({
    mutationFn: (data: TradeFormValues) => {
      const endpoint = isEditMode ? `/api/trades/${tradeId}` : '/api/trades';
      const method = isEditMode ? "PATCH" : "POST";
      return apiRequest(endpoint, { method, data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/metrics/trades'] });
      
      toast({
        title: isEditMode ? t("Trade updated") : t("Trade created"),
        description: isEditMode 
          ? t("Your trade has been updated successfully") 
          : t("Your trade has been added successfully"),
      });
      
      navigate("/backtest/dashboard");
    },
    onError: (error) => {
      toast({
        title: t("Error"),
        description: t("There was a problem saving your trade. Please try again."),
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: TradeFormValues) => {
    // If status is completed, ensure exit price is provided
    if (data.status === "completed" && !data.exitPrice) {
      form.setError("exitPrice", { 
        type: "manual", 
        message: t("Exit price is required for completed trades") 
      });
      return;
    }

    // Convert string inputs to the correct format
    const formattedData = {
      ...data,
      entryPrice: data.entryPrice,
      amount: data.amount,
      exitPrice: data.exitPrice || null,
    };

    tradeMutation.mutate(formattedData);
  };

  // If user is not logged in, show login page
  if (!userLoading && !userData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md bg-card">
            <CardHeader>
              <CardTitle className="text-center text-brand-primary">{t("Please log in")}</CardTitle>
              <CardDescription className="text-center">
                {t("You need to log in to add or edit trades")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <Link href="/" className="w-full">
                  <Button className="w-full">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t("Back to Home")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show loading state while fetching data
  if ((isEditMode && tradeLoading) || tradingPairsLoading || strategyTypesLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="w-full max-w-3xl mx-auto bg-card">
          <CardHeader>
            <CardTitle>{t("Loading...")}</CardTitle>
            <CardDescription>{t("Please wait while we load the form data")}</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px] flex items-center justify-center">
            <p>{t("Loading form data...")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Link href="/backtest/dashboard">
          <Button variant="ghost" className="p-0">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("Back to Dashboard")}
          </Button>
        </Link>
      </div>

      <Card className="w-full max-w-3xl mx-auto bg-card">
        <CardHeader>
          <CardTitle className="text-brand-primary">
            {isEditMode ? t("Edit Trade") : t("Add New Trade")}
          </CardTitle>
          <CardDescription>
            {isEditMode 
              ? t("Update your trade information") 
              : t("Add a new trade to your backtesting portfolio")}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Trade Pair & Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="pair">{t("Trading Pair")}</Label>
                <Select
                  onValueChange={(value) => form.setValue("pair", value)} 
                  defaultValue={form.getValues("pair")}
                >
                  <SelectTrigger id="pair" className={form.formState.errors.pair ? "border-danger" : ""}>
                    <SelectValue placeholder={t("Select a trading pair")} />
                  </SelectTrigger>
                  <SelectContent>
                    {tradingPairs?.map((pair: TradingPair) => (
                      <SelectItem key={pair.id} value={pair.pair}>{pair.pair}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.pair && (
                  <p className="text-xs text-danger">{form.formState.errors.pair.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>{t("Trade Type")}</Label>
                <RadioGroup 
                  defaultValue="long"
                  value={form.getValues("tradeType")}
                  onValueChange={(value) => form.setValue("tradeType", value as "long" | "short")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="long" id="long" />
                    <Label htmlFor="long" className="text-success">{t("Long")}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="short" id="short" />
                    <Label htmlFor="short" className="text-danger">{t("Short")}</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            {/* Strategy & Entry Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="strategy">{t("Strategy")}</Label>
                <Select
                  onValueChange={(value) => form.setValue("strategy", value)}
                  defaultValue={form.getValues("strategy")}
                >
                  <SelectTrigger id="strategy" className={form.formState.errors.strategy ? "border-danger" : ""}>
                    <SelectValue placeholder={t("Select a strategy")} />
                  </SelectTrigger>
                  <SelectContent>
                    {strategyTypes?.map((strategy: StrategyType) => (
                      <SelectItem key={strategy.id} value={strategy.name}>{strategy.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.strategy && (
                  <p className="text-xs text-danger">{form.formState.errors.strategy.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="entryPrice">{t("Entry Price")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5">$</span>
                  <Input
                    id="entryPrice"
                    type="number"
                    step="0.0001"
                    placeholder="0.00"
                    className={`pl-7 ${form.formState.errors.entryPrice ? "border-danger" : ""}`}
                    {...form.register("entryPrice")}
                  />
                </div>
                {form.formState.errors.entryPrice && (
                  <p className="text-xs text-danger">{form.formState.errors.entryPrice.message}</p>
                )}
              </div>
            </div>
            
            {/* Amount & Exit Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="amount">{t("Amount")}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.001"
                  placeholder="0.00"
                  className={form.formState.errors.amount ? "border-danger" : ""}
                  {...form.register("amount")}
                />
                {form.formState.errors.amount && (
                  <p className="text-xs text-danger">{form.formState.errors.amount.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="exitPrice">{t("Exit Price")}</Label>
                  <span className="text-xs text-muted-foreground">{t("Optional for active trades")}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5">$</span>
                  <Input
                    id="exitPrice"
                    type="number"
                    step="0.0001"
                    placeholder="0.00"
                    className={`pl-7 ${form.formState.errors.exitPrice ? "border-danger" : ""}`}
                    {...form.register("exitPrice")}
                  />
                </div>
                {form.formState.errors.exitPrice && (
                  <p className="text-xs text-danger">{form.formState.errors.exitPrice.message}</p>
                )}
              </div>
            </div>
            
            {/* Trade Status */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="trade-status">{t("Trade Status")}</Label>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="trade-status"
                    checked={form.getValues("status") === "completed"}
                    onCheckedChange={(checked) => form.setValue("status", checked ? "completed" : "active")}
                  />
                  <Label htmlFor="trade-status">
                    {form.getValues("status") === "completed" ? t("Completed") : t("Active")}
                  </Label>
                </div>
              </div>
              {form.getValues("status") === "completed" && !form.getValues("exitPrice") && (
                <div className="flex items-center space-x-2 text-warning mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-xs">{t("Completed trades require an exit price")}</p>
                </div>
              )}
            </div>
            
            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t("Notes")}</Label>
              <Textarea
                id="notes"
                placeholder={t("Add any additional information about this trade")}
                rows={4}
                {...form.register("notes")}
              />
            </div>
            
            {/* Form error message if any */}
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="bg-danger/10 text-danger p-3 rounded-md text-sm">
                {t("Please fix the errors in the form before submitting")}
              </div>
            )}

            <input type="hidden" {...form.register("userId")} />
            <input type="hidden" {...form.register("date")} />
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setShowCancelConfirm(true)}
          >
            {t("Cancel")}
          </Button>
          <Button 
            className="bg-brand-primary hover-glow-primary"
            onClick={form.handleSubmit(onSubmit)}
            disabled={tradeMutation.isPending}
          >
            {tradeMutation.isPending ? (
              t("Saving...")
            ) : (
              <>
                {isEditMode ? t("Update Trade") : t("Add Trade")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Discard Changes")}</DialogTitle>
            <DialogDescription>
              {t("Are you sure you want to discard your changes? Any unsaved data will be lost.")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
              {t("Continue Editing")}
            </Button>
            <Button 
              variant="destructive"
              onClick={() => navigate("/backtest/dashboard")}
            >
              {t("Discard Changes")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}