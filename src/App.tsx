import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import HowItWorks from "./pages/HowItWorks";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Offers from "./pages/Offers";
import OfferDetail from "./pages/OfferDetail";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Support from "./pages/Support";
import Auth from "./pages/Auth";
import CreateOffer from "./pages/CreateOffer";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import AccountSettings from "./pages/AccountSettings";
import Wallet from "./pages/Wallet";
import ManageOffers from "./pages/ManageOffers";
import EditOffer from "./pages/EditOffer";
import ArchivedOffers from "./pages/ArchivedOffers";
import CompletedOffers from "./pages/CompletedOffers";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import TermsOfService from "./pages/TermsOfService";
import ResponsiveCheck from "./pages/ResponsiveCheck";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <LanguageProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/offers" element={<ProtectedRoute><Offers /></ProtectedRoute>} />
              <Route path="/offers/:id" element={<ProtectedRoute><OfferDetail /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/support" element={<Support />} />
              <Route path="/create-offer" element={<ProtectedRoute><CreateOffer /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
              <Route path="/manage-offers" element={<ProtectedRoute><ManageOffers /></ProtectedRoute>} />
              <Route path="/edit-offer/:id" element={<ProtectedRoute><EditOffer /></ProtectedRoute>} />
              <Route path="/archived-offers" element={<ProtectedRoute><ArchivedOffers /></ProtectedRoute>} />
              <Route path="/completed-offers" element={<ProtectedRoute><CompletedOffers /></ProtectedRoute>} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/dev/responsive-check" element={<ResponsiveCheck />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
