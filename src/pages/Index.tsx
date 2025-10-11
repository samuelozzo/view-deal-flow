import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { TrendingUp, Shield, Zap, Euro, Eye, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo.png";

const Index = () => {
  const { t } = useLanguage();
  
  const features = [
    {
      icon: Euro,
      title: t("fairPricing"),
      description: t("fairPricingDesc"),
    },
    {
      icon: Shield,
      title: t("secureEscrowTitle"),
      description: t("secureEscrowDesc"),
    },
    {
      icon: Eye,
      title: t("viewVerification"),
      description: t("viewVerificationDesc"),
    },
    {
      icon: Zap,
      title: t("quickMatching"),
      description: t("quickMatchingDesc"),
    },
  ];

  const steps = [
    { number: "1", title: t("step1Title"), desc: t("step1Desc") },
    { number: "2", title: t("step2Title"), desc: t("step2Desc") },
    { number: "3", title: t("step3Title"), desc: t("step3Desc") },
    { number: "4", title: t("step4Title"), desc: t("step4Desc") },
    { number: "5", title: t("step5Title"), desc: t("step5Desc") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container mx-auto px-4 py-12 sm:py-16 md:py-24 lg:py-32 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4 md:space-y-6 text-center md:text-left">
              <h1 className="text-fluid-2xl font-bold leading-tight">
                {t("heroTitle")}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {" "}{t("heroTitleHighlight")}
                </span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto md:mx-0">
                {t("heroDescription")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
                <Button variant="hero" size="lg" asChild className="touch-target w-full sm:w-auto">
                  <Link to="/how-it-works">{t("learnHowItWorks")}</Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="touch-target w-full sm:w-auto">
                  <Link to="/onboarding">{t("startCreatingDeals")}</Link>
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 sm:gap-6 text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>{t("secureEscrow")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>{t("dayVerification")}</span>
                </div>
              </div>
            </div>
            <div className="relative order-first md:order-last">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl md:rounded-3xl blur-3xl" />
              <img
                src={heroImage}
                alt={t("heroTitle")}
                className="relative rounded-2xl md:rounded-3xl shadow-2xl w-full h-auto"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-fluid-xl font-bold mb-3 md:mb-4">
              {t("whyChoose")}
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              {t("whyChooseDescription")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-4 md:p-6 hover:shadow-xl transition-all duration-300 bg-card">
                <feature.icon className="h-8 w-8 md:h-10 md:w-10 text-primary mb-3 md:mb-4" />
                <h3 className="font-semibold mb-2 text-base md:text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Preview */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-fluid-xl font-bold mb-3 md:mb-4">
              {t("howItWorks")}
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto mb-6 md:mb-8 px-4">
              {t("howItWorksDescription")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8 mb-8 md:mb-12">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-xl md:text-2xl font-bold text-primary-foreground shadow-lg">
                    {step.number}
                  </div>
                  <h3 className="font-semibold mb-2 text-sm md:text-base">{step.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground px-2">{step.desc}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-7 md:top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-transparent" />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <Button variant="hero" size="lg" asChild className="touch-target w-full sm:w-auto">
              <Link to="/how-it-works">{t("seeFullProcess")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-primary via-primary-glow to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-fluid-xl font-bold text-primary-foreground mb-3 md:mb-4 px-4">
            {t("readyToStart")}
          </h2>
          <p className="text-sm md:text-base text-primary-foreground/90 mb-6 md:mb-8 max-w-2xl mx-auto px-4">
            {t("readyToStartDesc")}
          </p>
          <Button variant="secondary" size="lg" asChild className="touch-target w-full sm:w-auto max-w-xs mx-auto">
            <Link to="/onboarding">{t("createYourAccount")}</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/50 py-8 md:py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-2 mb-3 md:mb-4">
                <img src={logo} alt="WeasyDeal" className="w-7 h-7 md:w-8 md:h-8" />
                <span className="text-lg md:text-xl font-bold">WeasyDeal</span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                {t("heroDescription")}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">{t("forCreators")}</h4>
              <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                <li><Link to="/offers" className="hover:text-primary transition-colors">{t("browseOffers")}</Link></li>
                <li><Link to="/dashboard" className="hover:text-primary transition-colors">{t("dashboard")}</Link></li>
              </ul>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">{t("forBrands")}</h4>
              <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                <li><Link to="/onboarding" className="hover:text-primary transition-colors">{t("postAnOffer")}</Link></li>
                <li><Link to="/dashboard" className="hover:text-primary transition-colors">{t("manageCampaigns")}</Link></li>
              </ul>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">{t("support")}</h4>
              <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                <li><Link to="/support" className="hover:text-primary transition-colors">{t("helpCenter")}</Link></li>
                <li><Link to="/support" className="hover:text-primary transition-colors">{t("contactUs")}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs md:text-sm text-muted-foreground text-center md:text-left">{t("footerText")}</p>
              <div className="flex flex-wrap justify-center gap-3 md:gap-4 text-xs text-muted-foreground">
                <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                <Link to="/cookie-policy" className="hover:text-primary transition-colors">Cookie Policy</Link>
                <Link to="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
