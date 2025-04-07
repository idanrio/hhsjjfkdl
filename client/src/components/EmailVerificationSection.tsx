import { useEffect, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmailVerification } from "./EmailVerification";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function EmailVerificationSection() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showReminder, setShowReminder] = useState(false);

  // Check if we need to show the verification reminder
  useEffect(() => {
    if (user && !user.isEmailVerified) {
      // Only show reminder after they've been using the site for a moment
      const timer = setTimeout(() => {
        setShowReminder(true);
      }, 30000); // Show reminder after 30 seconds

      return () => clearTimeout(timer);
    }
    
    // User is verified, don't show reminder
    setShowReminder(false);
  }, [user]);

  // If user is not logged in or is already verified, don't show anything
  if (!user || user.isEmailVerified) {
    return null;
  }

  return (
    <>
      {/* Reminder notification that slides in after a delay */}
      {showReminder && (
        <div className="fixed bottom-4 right-4 w-80 z-50 animate-in slide-in-from-right">
          <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-amber-700 dark:text-amber-300">
                Verify Your Email
              </CardTitle>
              <CardDescription className="text-amber-600 dark:text-amber-400">
                Please verify your email address to ensure account security.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                variant="outline" 
                className="w-full border-amber-500 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900"
                onClick={() => setIsDialogOpen(true)}
              >
                Verify Now
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Verification dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Email Verification</DialogTitle>
            <DialogDescription className="text-center">
              Please verify your email to protect your account
            </DialogDescription>
          </DialogHeader>
          <EmailVerification />
        </DialogContent>
      </Dialog>
    </>
  );
}