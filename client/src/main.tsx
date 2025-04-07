import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import "./i18n"; // Import i18n configuration
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import { EmailVerificationSection } from "@/components/EmailVerificationSection";

// Ensure the document direction is set based on stored language preference
const storedLanguage = localStorage.getItem('i18nextLng');
if (storedLanguage === 'he') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'he';
} else {
  document.documentElement.dir = 'ltr';
  document.documentElement.lang = 'en';
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <App />
      <EmailVerificationSection />
      <Toaster />
    </AuthProvider>
  </QueryClientProvider>
);
