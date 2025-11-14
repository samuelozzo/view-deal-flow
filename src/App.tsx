import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { PasswordProvider } from "@/contexts/PasswordContext";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PasswordProtectedRoute } from "@/components/PasswordProtectedRoute";
import Index from "./pages/Index";
import HowItWorks from "./pages/HowItWorks";
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
          <PasswordProvider>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/how-it-works" element={<PasswordProtectedRoute><HowItWorks /></PasswordProtectedRoute>} />
              <Route path="/onboarding" element={<PasswordProtectedRoute><Onboarding /></PasswordProtectedRoute>} />
              <Route path="/auth" element={<PasswordProtectedRoute><Auth /></PasswordProtectedRoute>} />
              <Route path="/offers" element={<PasswordProtectedRoute><ProtectedRoute><Offers /></ProtectedRoute></PasswordProtectedRoute>} />
              <Route path="/offers/:id" element={<PasswordProtectedRoute><ProtectedRoute><OfferDetail /></ProtectedRoute></PasswordProtectedRoute>} />
              <Route path="/dashboard" element={<PasswordProtectedRoute><ProtectedRoute><Dashboard /></ProtectedRoute></PasswordProtectedRoute>} />
              <Route path="/chat/:id" element={<PasswordProtectedRoute><ProtectedRoute><Chat /></ProtectedRoute></PasswordProtectedRoute>} />
              <Route path="/support" element={<PasswordProtectedRoute><Support /></PasswordProtectedRoute>} />
              <Route path="/create-offer" element={<PasswordProtectedRoute><ProtectedRoute><CreateOffer /></ProtectedRoute></PasswordProtectedRoute>} />
              <Route path="/admin" element={<PasswordProtectedRoute><ProtectedRoute><AdminDashboard /></ProtectedRoute></PasswordProtectedRoute>} />
              <Route path="/account-settings" element={<PasswordProtectedRoute><ProtectedRoute><AccountSettings /></ProtectedRoute></PasswordProtectedRoute>} />
              <Route path="/wallet" element={<PasswordProtectedRoute><ProtectedRoute><Wallet /></ProtectedRoute></PasswordProtectedRoute>} />
              <Route path="/manage-offers" element={<PasswordProtectedRoute><ProtectedRoute><ManageOffers /></ProtectedRoute></PasswordProtectedRoute>} />
              <Route path="/edit-offer/:id" element={<PasswordProtectedRoute><ProtectedRoute><EditOffer /></ProtectedRoute></PasswordProtectedRoute>} />
              <Route path="/archived-offers" element={<PasswordProtectedRoute><ProtectedRoute><ArchivedOffers /></ProtectedRoute></PasswordProtectedRoute>} />
              <Route path="/completed-offers" element={<PasswordProtectedRoute><ProtectedRoute><CompletedOffers /></ProtectedRoute></PasswordProtectedRoute>} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/dev/responsive-check" element={<ResponsiveCheck />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
           </BrowserRouter>
            </AuthProvider>
          </PasswordProvider>
        </LanguageProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
