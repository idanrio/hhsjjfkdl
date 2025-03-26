import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import BacktestLogin from './BacktestLogin';

interface AuthModalProps {
  initialView?: 'login' | 'signup';
}

const AuthModals: React.FC<AuthModalProps> = ({ initialView = 'login' }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'login' | 'signup' | 'thankyou' | 'backtest'>(initialView);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();

  const handleLogin = async () => {
    // Check if all fields are filled
    if (!username || !password) {
      toast({
        title: t('auth.errorTitle'),
        description: t('auth.errorAllFields'),
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: t('auth.loginSuccess'),
        description: t('auth.welcomeBack', { name: response.username }),
      });
      
      setOpen(false);
      
      // Redirect to appropriate dashboard based on admin status
      if (response.isAdmin) {
        setLocation('/backtest/admin');
      } else {
        setLocation('/backtest/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: t('auth.loginFailed'),
        description: t('auth.invalidCredentials'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    // Check if all fields are filled
    if (!username || !email || !password) {
      toast({
        title: t('auth.errorTitle'),
        description: t('auth.errorAllFields'),
        variant: 'destructive',
      });
      return;
    }
    
    // Check if terms are accepted
    if (!acceptTerms) {
      toast({
        title: t('auth.errorTitle'),
        description: t('auth.errorTerms'),
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, email }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Show thank you screen
      setView('thankyou');
      
      // Auto login after successful registration
      await handleLogin();
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: t('auth.signupFailed'),
        description: t('auth.usernameExists'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBacktestLogin = (username: string, password: string) => {
    // Close the modal
    setOpen(false);
  };
  
  // Quick login buttons for demo accounts
  const loginAsDemo = () => {
    setUsername('demo');
    setPassword('demo123');
  };

  const loginAsAdmin = () => {
    setUsername('admin');
    setPassword('admin123');
  };

  return (
    <>
      <Button
        onClick={() => {
          setView(initialView);
          setUsername('');
          setPassword('');
          setEmail('');
          setAcceptTerms(false);
          setOpen(true);
        }}
        variant={initialView === 'login' ? 'outline' : 'default'}
        className={initialView === 'login' ? 'border-primary text-primary hover:text-white hover:bg-primary' : ''}
      >
        {initialView === 'login' ? t('navigation.login') : t('navigation.signup')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          {view === 'login' && (
            <>
              <DialogTitle>{t('auth.loginTitle')}</DialogTitle>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">{t('auth.usernameLabel')}</Label>
                  <Input
                    id="username"
                    placeholder={t('auth.usernamePlaceholder')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">{t('auth.passwordLabel')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                      {t('auth.rememberMe')}
                    </Label>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loginAsDemo}
                    className="text-xs"
                  >
                    {t('backtest.loginAsDemo')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loginAsAdmin}
                    className="text-xs"
                  >
                    {t('backtest.loginAsAdmin')}
                  </Button>
                </div>
              </div>
              <DialogFooter className="flex flex-col space-y-4">
                <Button 
                  onClick={handleLogin} 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
                </Button>
                <div className="text-center text-sm">
                  {t('auth.noAccount')}{' '}
                  <Button variant="link" className="p-0 h-auto" onClick={() => setView('signup')}>
                    {t('auth.createAccount')}
                  </Button>
                </div>
                <div className="text-center text-sm">
                  <Button variant="link" className="p-0 h-auto" onClick={() => setView('backtest')}>
                    {t('backtest.launchSystem')}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}

          {view === 'signup' && (
            <>
              <DialogTitle>{t('auth.signupTitle')}</DialogTitle>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">{t('auth.usernameLabel')}</Label>
                  <Input
                    id="username"
                    placeholder={t('auth.usernamePlaceholder')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">{t('auth.emailLabel')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">{t('auth.passwordLabel')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                    {t('auth.termsPrefix')}{' '}
                    <Button variant="link" className="p-0 h-auto">
                      {t('auth.termsLink')}
                    </Button>{' '}
                    {t('auth.and')}{' '}
                    <Button variant="link" className="p-0 h-auto">
                      {t('auth.privacyLink')}
                    </Button>
                  </Label>
                </div>
              </div>
              <DialogFooter className="flex flex-col space-y-4">
                <Button 
                  onClick={handleSignup} 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? t('auth.signingUp') : t('auth.signupButton')}
                </Button>
                <div className="text-center text-sm">
                  {t('auth.haveAccount')}{' '}
                  <Button variant="link" className="p-0 h-auto" onClick={() => setView('login')}>
                    {t('auth.loginInstead')}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}

          {view === 'thankyou' && (
            <>
              <DialogTitle>{t('auth.thankYouTitle')}</DialogTitle>
              <DialogDescription>
                {t('auth.thankYouMessage')}
              </DialogDescription>
              <DialogFooter>
                <Button onClick={() => setOpen(false)} className="w-full">
                  {t('auth.continueBrowsing')}
                </Button>
              </DialogFooter>
            </>
          )}

          {view === 'backtest' && (
            <>
              <DialogTitle>{t('backtest.loginTitle')}</DialogTitle>
              <BacktestLogin onLogin={handleBacktestLogin} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuthModals;