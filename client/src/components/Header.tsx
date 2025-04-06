import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import AuthModals from './AuthModals';
import LanguageSwitcher from './LanguageSwitcher';
import CapitulreLogo from '../assets/logo';
import { getQueryFn } from '@/lib/queryClient';
import { ChevronDown, BarChart4, TrendingUp, LineChart } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const isRtl = currentLanguage === 'he';
  const [location] = useLocation();

  // Fetch user data to determine if the user is logged in and admin status
  const { data: userData } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const isLoggedIn = !!userData;
  const isAdmin = userData?.isAdmin;

  useEffect(() => {
    // Set the document direction based on the language
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [isRtl]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="fixed w-full z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex justify-between items-center">
        <div className="flex items-center">
          <CapitulreLogo className="h-20 w-auto font-bold" />
        </div>

        <nav className="hidden md:block">
          <ul className={`flex ${isRtl ? 'space-x-reverse space-x-10' : 'space-x-10'}`}>
            <li>
              <Link href="/" className={`font-medium relative nav-link hover:text-primary transition-colors ${location === "/" ? "text-brand-primary" : ""}`}>
                {t('navigation.home')}
              </Link>
            </li>
            <li>
              <a href="#features" className="font-medium relative nav-link hover:text-primary transition-colors">
                {t('navigation.features')}
              </a>
            </li>
            <li>
              <a href="#markets" className="font-medium relative nav-link hover:text-primary transition-colors">
                {t('navigation.markets')}
              </a>
            </li>
            {isLoggedIn && (
              <li>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className={`font-medium relative nav-link hover:text-primary transition-colors flex items-center ${location.includes("/backtest") ? "text-primary" : ""}`}>
                      {t('navigation.backtest')} <ChevronDown className="h-4 w-4 ml-1" />
                    </button>
                  </DropdownMenu.Trigger>
                  
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="min-w-[220px] bg-black/95 border border-white/10 p-2 rounded-md shadow-lg"
                      sideOffset={5}
                    >
                      <DropdownMenu.Item className="outline-none">
                        <Link 
                          href="/backtest/dashboard"
                          className="flex items-center px-2 py-2 text-sm hover:bg-white/5 rounded transition-colors"
                        >
                          <BarChart4 className="h-4 w-4 mr-2" />
                          {t('Dashboard')}
                        </Link>
                      </DropdownMenu.Item>
                      
                      <DropdownMenu.Item className="outline-none">
                        <Link 
                          href="/backtest/trading"
                          className="flex items-center px-2 py-2 text-sm hover:bg-white/5 rounded transition-colors"
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          {t('Trading Environment')}
                        </Link>
                      </DropdownMenu.Item>
                      
                      <DropdownMenu.Item className="outline-none">
                        <Link 
                          href="/backtest/paper-trading"
                          className="flex items-center px-2 py-2 text-sm hover:bg-white/5 rounded transition-colors"
                        >
                          <LineChart className="h-4 w-4 mr-2" />
                          {t('Paper Trading Pro')}
                        </Link>
                      </DropdownMenu.Item>
                      
                      <DropdownMenu.Item className="outline-none">
                        <Link 
                          href="/backtest/new-trade"
                          className="flex items-center px-2 py-2 text-sm hover:bg-white/5 rounded transition-colors"
                        >
                          <BarChart4 className="h-4 w-4 mr-2" />
                          {t('Add New Trade')}
                        </Link>
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </li>
            )}
            {isAdmin && (
              <li>
                <Link href="/backtest/admin" className={`font-medium relative nav-link hover:text-primary transition-colors ${location === "/backtest/admin" ? "text-brand-primary" : ""}`}>
                  {t('navigation.admin')}
                </Link>
              </li>
            )}
            <li>
              <a href="#contact" className="font-medium relative nav-link hover:text-primary transition-colors">
                {t('navigation.contact')}
              </a>
            </li>
          </ul>
        </nav>

        <div className={`flex ${isRtl ? 'space-x-reverse space-x-4' : 'space-x-4'} items-center`}>
          <LanguageSwitcher />
          
          <div className="hidden sm:flex items-center space-x-2">
            <AuthModals initialView="login" />
            <AuthModals initialView="signup" />
          </div>

          <button 
            className="md:hidden text-xl"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>

      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} bg-black/95 w-full absolute top-full left-0 border-b border-white/10`}>
        <nav className="px-4 py-5">
          <ul className="space-y-4">
            <li>
              <Link
                href="/"
                className={`block py-2 font-medium hover:text-primary transition-colors ${location === "/" ? "text-brand-primary" : ""}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.home')}
              </Link>
            </li>
            <li>
              <a 
                href="#features" 
                className="block py-2 font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.features')}
              </a>
            </li>
            <li>
              <a 
                href="#markets" 
                className="block py-2 font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.markets')}
              </a>
            </li>
            {isLoggedIn && (
              <>
                <li>
                  <div className="block py-2 font-medium hover:text-primary transition-colors">
                    {t('navigation.backtest')}
                  </div>
                </li>
                <li className="pl-4">
                  <Link
                    href="/backtest/dashboard"
                    className="block py-1 text-sm hover:text-primary transition-colors flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BarChart4 className="h-4 w-4 mr-2" />
                    {t('Dashboard')}
                  </Link>
                </li>
                <li className="pl-4">
                  <Link
                    href="/backtest/trading"
                    className="block py-1 text-sm hover:text-primary transition-colors flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    {t('Trading Environment')}
                  </Link>
                </li>
                <li className="pl-4">
                  <Link
                    href="/backtest/paper-trading"
                    className="block py-1 text-sm hover:text-primary transition-colors flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LineChart className="h-4 w-4 mr-2" />
                    {t('Paper Trading Pro')}
                  </Link>
                </li>
                <li className="pl-4">
                  <Link
                    href="/backtest/new-trade"
                    className="block py-1 text-sm hover:text-primary transition-colors flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BarChart4 className="h-4 w-4 mr-2" />
                    {t('Add New Trade')}
                  </Link>
                </li>
              </>
            )}
            {isAdmin && (
              <li>
                <Link
                  href="/backtest/admin"
                  className={`block py-2 font-medium hover:text-primary transition-colors ${location === "/backtest/admin" ? "text-brand-primary" : ""}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('navigation.admin')}
                </Link>
              </li>
            )}
            <li>
              <a 
                href="#contact" 
                className="block py-2 font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.contact')}
              </a>
            </li>
            <li className="flex flex-col gap-2 pt-4 border-t border-white/10">
              {!isLoggedIn ? (
                <>
                  <AuthModals initialView="login" />
                  <AuthModals initialView="signup" />
                </>
              ) : (
                <div className="py-2 text-sm text-brand-primary">
                  {t('logged_in_as')}: {userData?.username}
                </div>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
