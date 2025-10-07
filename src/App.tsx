import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
