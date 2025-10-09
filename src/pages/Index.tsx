import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { TrendingUp, Shield, Zap, Euro, Eye, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

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
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                {t("heroTitle")}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {" "}{t("heroTitleHighlight")}
                </span>
              </h1>
              <p className="text-lg text-muted-foreground">
                {t("heroDescription")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/how-it-works">{t("learnHowItWorks")}</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/onboarding">{t("startCreatingDeals")}</Link>
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>{t("secureEscrow")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>{t("dayVerification")}</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
              <img
                src={heroImage}
                alt={t("heroTitle")}
                className="relative rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("whyChoose")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("whyChooseDescription")}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-xl transition-all duration-300 bg-card">
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Preview */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("howItWorks")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              {t("howItWorksDescription")}
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-6 mb-12">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg">
                    {step.number}
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-transparent" />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/how-it-works">{t("seeFullProcess")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary via-primary-glow to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            {t("readyToStart")}
          </h2>
          <p className="text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            {t("readyToStartDesc")}
          </p>
          <Button variant="secondary" size="lg" asChild>
            <Link to="/onboarding">{t("createYourAccount")}</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/50 py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg" />
                <span className="text-xl font-bold">WeasyDeal</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("heroDescription")}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t("forCreators")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/offers" className="hover:text-primary">{t("browseOffers")}</Link></li>
                <li><Link to="/dashboard" className="hover:text-primary">{t("dashboard")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t("forBrands")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/onboarding" className="hover:text-primary">{t("postAnOffer")}</Link></li>
                <li><Link to="/dashboard" className="hover:text-primary">{t("manageCampaigns")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t("support")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/support" className="hover:text-primary">{t("helpCenter")}</Link></li>
                <li><Link to="/support" className="hover:text-primary">{t("contactUs")}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>{t("footerText")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
