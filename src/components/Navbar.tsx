import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, LogOut, User, Wallet as WalletIcon, Settings } from "lucide-react";
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
import { NotificationBell } from "@/components/NotificationBell";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  
  const isActive = (path: string) => location.pathname === path;

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', session.user.id)
          .single();
        
        setUserRole(profileData?.account_type || null);

        // Check if user is admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .single();
        
        setIsAdmin(!!roleData);
      }
    };
    
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      
      if (session?.user) {
        setTimeout(async () => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('account_type')
            .eq('id', session.user.id)
            .single();
          
          setUserRole(profileData?.account_type || null);

          // Check if user is admin
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .eq('role', 'admin')
            .single();
          
          setIsAdmin(!!roleData);
        }, 0);
      } else {
        setUserRole(null);
        setIsAdmin(false);
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
              WeasyDeal
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
            {isBusiness ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive("/offers") || isActive("/create-offer") || isActive("/manage-offers") 
                        ? "text-primary" 
                        : "text-muted-foreground"
                    }`}
                  >
                    Offerte
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-background z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/offers" className="cursor-pointer">
                      {t("browseOffers")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/create-offer" className="cursor-pointer">
                      {t("postOffer")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/manage-offers" className="cursor-pointer">
                      Gestione Offerte
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/archived-offers" className="cursor-pointer">
                      Storico Offerte
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link
                  to="/offers"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive("/offers") ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {t("browseOffers")}
                </Link>
                <Link
                  to="/completed-offers"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive("/completed-offers") ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Offerte Concluse
                </Link>
              </>
            )}
            <Link
              to="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/dashboard") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Pannello
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/admin") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Admin Dashboard
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
            
            {isLoggedIn && <NotificationBell />}
            
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/wallet" className="cursor-pointer">
                      <WalletIcon className="h-4 w-4 mr-2" />
                      Wallet
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account-settings" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Impostazioni
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            {isBusiness ? (
              <>
                <div className="py-2">
                  <p className="text-xs font-semibold text-muted-foreground px-2 mb-2">Offerte</p>
                  <Link
                    to="/offers"
                    className="block py-2 px-4 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("browseOffers")}
                  </Link>
                  <Link
                    to="/create-offer"
                    className="block py-2 px-4 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("postOffer")}
                  </Link>
                  <Link
                    to="/manage-offers"
                    className="block py-2 px-4 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Gestione Offerte
                  </Link>
                  <Link
                    to="/archived-offers"
                    className="block py-2 px-4 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Storico Offerte
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/offers"
                  className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("browseOffers")}
                </Link>
                <Link
                  to="/completed-offers"
                  className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Offerte Concluse
                </Link>
              </>
            )}
            <Link
              to="/dashboard"
              className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pannello
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Dashboard
              </Link>
            )}
            {isLoggedIn && (
              <>
                <Link
                  to="/wallet"
                  className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <WalletIcon className="h-4 w-4 inline mr-2" />
                  Wallet
                </Link>
                <Link
                  to="/account-settings"
                  className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 inline mr-2" />
                  Impostazioni
                </Link>
              </>
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
