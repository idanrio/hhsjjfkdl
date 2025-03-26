import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface AuthModalProps {
  initialView?: 'login' | 'signup';
}

const AuthModals: React.FC<AuthModalProps> = ({ initialView = 'login' }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'login' | 'signup' | 'thankYou'>(initialView);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setError('');
    setAgreeToTerms(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      resetForm();
      setView(initialView);
    }, 300);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('auth.errorAllFields'));
      return;
    }
    
    // For demo purposes, just log the credentials and show success
    console.log('Login attempt with:', email, password);
    handleClose();
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setError(t('auth.errorAllFields'));
      return;
    }
    
    if (!agreeToTerms) {
      setError(t('auth.errorTerms'));
      return;
    }
    
    // For demo purposes, just log the registration and show thank you page
    console.log('Signup with:', { email, password, fullName });
    setView('thankYou');
  };

  const handleTriggerClick = () => {
    resetForm();
    setIsOpen(true);
  };

  const renderTriggerButton = () => {
    if (initialView === 'login') {
      return (
        <button 
          onClick={handleTriggerClick}
          className="text-sm font-medium px-4 py-2 rounded bg-primary text-white hover:bg-primary-light transition-colors"
        >
          {t('navigation.login')}
        </button>
      );
    } else {
      return (
        <button 
          onClick={handleTriggerClick}
          className="text-sm font-medium px-4 py-2 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          {t('navigation.signup')}
        </button>
      );
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        {renderTriggerButton()}
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-black border border-white/10 rounded-xl p-6 z-50">
          {view === 'login' && (
            <>
              <Dialog.Title className="text-2xl font-bold mb-6">
                {t('auth.loginTitle')}
              </Dialog.Title>
              
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-900/30 border border-red-500 text-red-200 p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium">
                    {t('auth.emailLabel')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/30 p-3 rounded-md border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('auth.emailPlaceholder')}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium">
                    {t('auth.passwordLabel')}
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/30 p-3 rounded-md border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('auth.passwordPlaceholder')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      type="checkbox"
                      className="h-4 w-4 rounded border-white/10 bg-black/30 text-primary focus:ring-primary"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-white/70">
                      {t('auth.rememberMe')}
                    </label>
                  </div>
                  
                  <div className="text-sm">
                    <a href="#" className="text-primary hover:underline">
                      {t('auth.forgotPassword')}
                    </a>
                  </div>
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-primary p-3 rounded-md font-semibold hover:bg-primary-light transition-all duration-300"
                  >
                    {t('auth.loginButton')}
                  </button>
                </div>
                
                <div className="text-center text-sm text-white/70 mt-4">
                  {t('auth.noAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => { setView('signup'); setError(''); }}
                    className="text-primary hover:underline"
                  >
                    {t('auth.createAccount')}
                  </button>
                </div>
              </form>
            </>
          )}
          
          {view === 'signup' && (
            <>
              <Dialog.Title className="text-2xl font-bold mb-6">
                {t('auth.signupTitle')}
              </Dialog.Title>
              
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-900/30 border border-red-500 text-red-200 p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label htmlFor="fullName" className="block text-sm font-medium">
                    {t('auth.nameLabel')}
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-black/30 p-3 rounded-md border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('auth.namePlaceholder')}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email-signup" className="block text-sm font-medium">
                    {t('auth.emailLabel')}
                  </label>
                  <input
                    id="email-signup"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/30 p-3 rounded-md border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('auth.emailPlaceholder')}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password-signup" className="block text-sm font-medium">
                    {t('auth.passwordLabel')}
                  </label>
                  <input
                    id="password-signup"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/30 p-3 rounded-md border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('auth.passwordPlaceholder')}
                  />
                </div>
                
                <div className="flex items-start mt-4">
                  <div className="flex h-5 items-center">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      className="h-4 w-4 rounded border-white/10 bg-black/30 text-primary focus:ring-primary"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="text-white/70">
                      {t('auth.termsPrefix')}{' '}
                      <a href="#" className="text-primary hover:underline">
                        {t('auth.termsLink')}
                      </a>{' '}
                      {t('auth.and')}{' '}
                      <a href="#" className="text-primary hover:underline">
                        {t('auth.privacyLink')}
                      </a>
                    </label>
                  </div>
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-primary p-3 rounded-md font-semibold hover:bg-primary-light transition-all duration-300"
                  >
                    {t('auth.signupButton')}
                  </button>
                </div>
                
                <div className="text-center text-sm text-white/70 mt-4">
                  {t('auth.haveAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => { setView('login'); setError(''); }}
                    className="text-primary hover:underline"
                  >
                    {t('auth.loginInstead')}
                  </button>
                </div>
              </form>
            </>
          )}
          
          {view === 'thankYou' && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-8 w-8 text-green-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-3">{t('auth.thankYouTitle')}</h2>
              <p className="text-white/70 mb-6">{t('auth.thankYouMessage')}</p>
              <button
                onClick={handleClose}
                className="bg-primary px-6 py-2 rounded font-semibold hover:bg-primary-light transition-all duration-300"
              >
                {t('auth.continueBrowsing')}
              </button>
            </div>
          )}
          
          <Dialog.Close asChild className="absolute top-4 right-4">
            <button
              type="button"
              className="text-white/70 hover:text-white rounded-full p-1"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AuthModals;