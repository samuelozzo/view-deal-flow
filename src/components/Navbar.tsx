import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { language, setLanguage, t } = useLanguage();
  
  const isActive = (path: string) => location.pathname === path;

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', session.user.id)
          .single();
        
        setUserRole(data?.account_type || null);
      }
    };
    
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      
      if (session?.user) {
        setTimeout(async () => {
          const { data } = await supabase
            .from('profiles')
            .select('account_type')
            .eq('id', session.user.id)
            .single();
          
          setUserRole(data?.account_type || null);
        }, 0);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error logging out");
    } else {
      toast.success("Logged out successfully");
      navigate("/");
    }
  };

  const isBusiness = userRole === "business";

  const languageLabels = {
    en: "English",
    it: "Italiano",
    es: "Español",
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              ViewDeal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/how-it-works"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/how-it-works") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {t("howItWorks")}
            </Link>
            <Link
              to="/offers"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/offers") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {t("browseOffers")}
            </Link>
            <Link
              to="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/dashboard") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {t("dashboard")}
            </Link>
            {isBusiness && (
              <Link
                to="/create-offer"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/create-offer") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {t("postOffer")}
              </Link>
            )}
            <Link
              to="/support"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/support") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {t("support")}
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Globe className="h-4 w-4" />
                  {languageLabels[language]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background z-50">
                <DropdownMenuItem onClick={() => setLanguage("en")}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("it")}>
                  Italiano
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("es")}>
                  Español
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isLoggedIn ? (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">{t("signIn")}</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/onboarding">{t("getStarted")}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-border">
            <Link
              to="/how-it-works"
              className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("howItWorks")}
            </Link>
            <Link
              to="/offers"
              className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("browseOffers")}
            </Link>
            <Link
              to="/dashboard"
              className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("dashboard")}
            </Link>
            {isBusiness && (
              <Link
                to="/create-offer"
                className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("postOffer")}
              </Link>
            )}
            <Link
              to="/support"
              className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("support")}
            </Link>
            
            <div className="pt-4 border-t border-border">
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium px-2">Language</p>
                <button
                  onClick={() => setLanguage("en")}
                  className={`block w-full text-left px-2 py-2 text-sm rounded ${
                    language === "en" ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage("it")}
                  className={`block w-full text-left px-2 py-2 text-sm rounded ${
                    language === "it" ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                >
                  Italiano
                </button>
                <button
                  onClick={() => setLanguage("es")}
                  className={`block w-full text-left px-2 py-2 text-sm rounded ${
                    language === "es" ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                >
                  Español
                </button>
              </div>
            </div>

            <div className="pt-4 space-y-2 border-t border-border">
              {isLoggedIn ? (
                <Button variant="ghost" className="w-full" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              ) : (
                <>
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/auth">{t("signIn")}</Link>
                  </Button>
                  <Button variant="hero" className="w-full" asChild>
                    <Link to="/onboarding">{t("getStarted")}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
