import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import BacktestLogin from './BacktestLogin';

interface AuthModalProps {
  initialView?: 'login' | 'signup';
}

const AuthModals: React.FC<AuthModalProps> = ({ initialView = 'login' }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'login' | 'signup' | 'thankyou' | 'backtest'>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleSubmit = () => {
    if (view === 'login') {
      // Check if all fields are filled
      if (!email || !password) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }
      
      // Login logic would go here
      console.log('Login attempt:', { email, password, rememberMe });
      
      // For demo purposes, just close the modal
      setOpen(false);
    } else if (view === 'signup') {
      // Check if all fields are filled
      if (!name || !email || !password) {
        toast({
          title: 'Error',
          description: t('auth.errorAllFields'),
          variant: 'destructive',
        });
        return;
      }
      
      // Check if terms are accepted
      if (!acceptTerms) {
        toast({
          title: 'Error',
          description: t('auth.errorTerms'),
          variant: 'destructive',
        });
        return;
      }
      
      // Signup logic would go here
      console.log('Signup attempt:', { name, email, password, acceptTerms });
      
      // Show thank you screen
      setView('thankyou');
    }
  };

  const handleBacktestLogin = (email: string, password: string) => {
    // Handle backtesting system login
    console.log('Backtest login:', { email, password });
    
    // For demo purposes, just close the modal
    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => {
          setView(initialView);
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
                  <Button variant="link" className="p-0 h-auto">
                    {t('auth.forgotPassword')}
                  </Button>
                </div>
              </div>
              <DialogFooter className="flex flex-col space-y-4">
                <Button onClick={handleSubmit} className="w-full">
                  {t('auth.loginButton')}
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
                  <Label htmlFor="name">{t('auth.nameLabel')}</Label>
                  <Input
                    id="name"
                    placeholder={t('auth.namePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                <Button onClick={handleSubmit} className="w-full">
                  {t('auth.signupButton')}
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