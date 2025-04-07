import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "../lib/queryClient";

export function EmailVerification() {
  const { user, refetchUser } = useAuth();
  const [code, setCode] = useState<string>("");
  const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const { toast } = useToast();

  // Initialize the component state
  useEffect(() => {
    if (user && !user.isEmailVerified) {
      // User might have already requested a code before this component mounted
      checkExistingCode();
    }
  }, [user]);

  // Countdown timer for code resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  // Format the countdown as MM:SS
  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Check if a verification code is already sent and active
  const checkExistingCode = async () => {
    try {
      const res = await fetch("/api/auth/verification-status", {
        method: "GET",
        credentials: "include"
      });
      
      if (res.ok) {
        const data = await res.json();
        const { codeSent, remainingTime, email } = data;
        
        if (codeSent && remainingTime > 0) {
          setIsCodeSent(true);
          setCountdown(remainingTime);
        }
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
    }
  };

  // Send verification code
  const sendVerificationCode = async () => {
    if (isSending || countdown > 0) return;
    
    setIsSending(true);
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      
      const data = await res.json();
      const { success, message, countdown: newCountdown } = data;
      
      if (success) {
        setIsCodeSent(true);
        setCountdown(newCountdown || 180); // Default to 3 minutes if not provided
        toast({
          title: "Verification Code Sent",
          description: message || "Please check your email for the verification code.",
        });
      } else {
        toast({
          title: "Could Not Send Code",
          description: message || "An error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Verify the code
  const verifyCode = async () => {
    if (!code || code.length !== 6 || isVerifying) return;
    
    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        credentials: "include"
      });
      
      const data = await res.json();
      const { success, message } = data;
      
      if (success) {
        // Update the user data to reflect verification
        await refetchUser();
        
        toast({
          title: "Success",
          description: message || "Your email has been verified successfully.",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: message || "Invalid or expired code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!user) {
    return <div>You must be logged in to verify your email.</div>;
  }

  if (user.isEmailVerified) {
    return <div className="text-center py-4 text-green-600">Your email is already verified!</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="text-sm text-muted-foreground mb-4">
        We've sent a verification code to your email address. 
        Please enter the 6-digit code below to verify your account.
      </div>
      
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Enter 6-digit code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className="text-center text-lg tracking-widest"
        />
        
        <div className="flex gap-2">
          <Button 
            onClick={verifyCode} 
            disabled={!code || code.length !== 6 || isVerifying}
            className="w-full"
          >
            {isVerifying ? "Verifying..." : "Verify Email"}
          </Button>
        </div>
        
        <div className="text-sm text-center mt-4">
          {countdown > 0 ? (
            <span>Resend code in {formatCountdown()}</span>
          ) : (
            <Button 
              variant="link" 
              onClick={sendVerificationCode}
              disabled={isSending}
              className="p-0 h-auto"
            >
              {isSending ? "Sending..." : "Resend verification code"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}