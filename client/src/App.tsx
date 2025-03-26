import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { useTranslation } from "react-i18next";
import { createContext, useState, useContext, ReactNode } from "react";

// Create a language context to manage language state
type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {}
});

export const useLanguage = () => useContext(LanguageContext);

// Create a provider for the language context
type LanguageProviderProps = {
  children: ReactNode;
};

function LanguageProvider({ children }: LanguageProviderProps) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState(i18n.language || "en");

  const setLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguageState(lang);
    // Store language preference
    localStorage.setItem("i18nextLng", lang);
    // Update HTML dir attribute for RTL support (Hebrew)
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
    // Update lang attribute
    document.documentElement.lang = lang;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <LanguageProvider>
      <Router />
      <Toaster />
    </LanguageProvider>
  );
}

export default App;
