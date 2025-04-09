import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Mail, Clock } from 'lucide-react';

interface EmailVerificationPopupProps {
  isOpen: boolean;
  onVerified: () => void;
}

export function EmailVerificationPopup({ 
  isOpen, 
  onVerified 
}: EmailVerificationPopupProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [verificationCode, setVerificationCode] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Generate 6-digit code
  useEffect(() => {
    if (isOpen && user && !user.isEmailVerified) {
      sendVerificationEmail();
    }
  }, [isOpen, user]);
  
  // Handle countdown for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [resendCountdown]);
  
  // Send verification email
  const sendVerificationEmail = async () => {
    if (!user || !user.email) return;
    
    setIsResending(true);
    setErrorMessage('');
    
    try {
      const response = await apiRequest('POST', '/api/auth/send-verification', {
        email: user.email
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Set the verification code automatically if provided from the backend
        if (data.verificationCode) {
          setVerificationCode(data.verificationCode);
        }
        
        toast({
          title: t('Verification Code Generated'),
          description: t('Please enter the verification code to verify your email.'),
        });
        
        // Start countdown for resend button (using the countdown from server or default to 180s/3min)
        setResendDisabled(true);
        setResendCountdown(data.countdown || 180);
      } else if (response.status === 429) {
        // Rate limited - show countdown
        setResendDisabled(true);
        setResendCountdown(data.retryAfter || 180);
        
        setErrorMessage(data.error || t('Too many requests. Please wait before requesting a new code.'));
        toast({
          title: t('Too Many Requests'),
          description: data.error || t('Please wait before requesting a new verification code.'),
          variant: 'destructive',
        });
      } else {
        setErrorMessage(data.error || t('Failed to generate verification code. Please try again.'));
        toast({
          title: t('Error'),
          description: data.error || t('Failed to generate verification code. Please try again.'),
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      setErrorMessage(error.message || t('Failed to generate verification code. Please try again.'));
      toast({
        title: t('Error'),
        description: error.message || t('Failed to generate verification code. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };
  
  // Verify email code
  const verifyEmailCode = async () => {
    if (!user || !verificationCode) return;
    
    setIsVerifying(true);
    setErrorMessage('');
    
    try {
      const response = await apiRequest('POST', '/api/auth/verify-code', {
        code: verificationCode
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: t('Email Verified'),
          description: t('Your email has been successfully verified.'),
        });
        
        onVerified();
      } else {
        setErrorMessage(data.message || t('Invalid verification code. Please try again.'));
        toast({
          title: t('Error'),
          description: data.message || t('Invalid verification code. Please try again.'),
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      setErrorMessage(error.message || t('Failed to verify email. Please try again.'));
      toast({
        title: t('Error'),
        description: error.message || t('Failed to verify email. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-[#131722] border-[#2A2E39]">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 bg-[#1c3d86]/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-[#22a1e2]" />
          </div>
          
          <DialogTitle className="text-center text-[#1c3d86] text-xl font-bold">
            {t('Verify Your Email')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t('A verification code has been sent to')} {user?.email || ''}
          </DialogDescription>
        </DialogHeader>
        
        {errorMessage && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('Error')}</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="verification-code" className="text-[#1c3d86] font-medium">
              {t('Verification Code')}
            </Label>
            <Input
              id="verification-code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="border-[#2A2E39]"
            />
          </div>
          
          <div className="flex items-center">
            <Button
              variant="link"
              disabled={resendDisabled}
              onClick={sendVerificationEmail}
              className="text-[#22a1e2] p-0 h-auto"
            >
              {resendDisabled ? (
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {t('Resend code in')} {resendCountdown}s
                </span>
              ) : (
                t('Resend verification code')
              )}
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="submit"
            onClick={verifyEmailCode}
            disabled={!verificationCode || isVerifying}
            className="w-full bg-[#1c3d86] hover:bg-[#1c3d86]/90 text-white"
          >
            {isVerifying ? t('Verifying...') : t('Verify Email')}
          </Button>
        </DialogFooter>
        
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center">
            <a href="https://capitulre.com" target="_blank" rel="noopener noreferrer">
              <img 
                src="/logo.png" 
                alt="Capitulre" 
                className="h-6 opacity-70 hover:opacity-100 transition-opacity"
              />
            </a>
          </div>
          <p className="mt-2 text-[#9598A1]">
            © {new Date().getFullYear()} Capitulre. {t('All rights reserved.')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EmailVerificationPopup;