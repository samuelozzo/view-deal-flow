import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { 
  ArrowRight, 
  Shield, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Euro,
  Eye,
  Rocket,
  Target,
  Zap,
  Lock,
  Clock,
  BarChart3
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const HowItWorks = () => {
  const { t } = useLanguage();

  const creatorSteps = [
    {
      number: 1,
      icon: Users,
      title: t("creatorStep1Title"),
      description: t("creatorStep1Desc"),
      color: "text-primary"
    },
    {
      number: 2,
      icon: Target,
      title: t("creatorStep2Title"),
      description: t("creatorStep2Desc"),
      color: "text-accent"
    },
    {
      number: 3,
      icon: CheckCircle,
      title: t("creatorStep3Title"),
      description: t("creatorStep3Desc"),
      color: "text-success"
    },
    {
      number: 4,
      icon: Rocket,
      title: t("creatorStep4Title"),
      description: t("creatorStep4Desc"),
      color: "text-warning"
    },
    {
      number: 5,
      icon: Euro,
      title: t("creatorStep5Title"),
      description: t("creatorStep5Desc"),
      color: "text-success"
    }
  ];

  const businessSteps = [
    {
      number: 1,
      icon: Target,
      title: t("businessStep1Title"),
      description: t("businessStep1Desc"),
      color: "text-primary"
    },
    {
      number: 2,
      icon: Users,
      title: t("businessStep2Title"),
      description: t("businessStep2Desc"),
      color: "text-accent"
    },
    {
      number: 3,
      icon: CheckCircle,
      title: t("businessStep3Title"),
      description: t("businessStep3Desc"),
      color: "text-success"
    },
    {
      number: 4,
      icon: Eye,
      title: t("businessStep4Title"),
      description: t("businessStep4Desc"),
      color: "text-warning"
    },
    {
      number: 5,
      icon: BarChart3,
      title: t("businessStep5Title"),
      description: t("businessStep5Desc"),
      color: "text-success"
    }
  ];

  const features = [
    {
      icon: Shield,
      title: t("secureEscrowTitle"),
      description: t("secureEscrowFeature"),
      gradient: "from-primary/10 to-primary-glow/10"
    },
    {
      icon: TrendingUp,
      title: t("percentageBasedTitle"),
      description: t("percentageBasedFeature"),
      gradient: "from-success/10 to-success/5"
    },
    {
      icon: Zap,
      title: t("instantMatchingTitle"),
      description: t("instantMatchingFeature"),
      gradient: "from-accent/10 to-accent/5"
    },
    {
      icon: Lock,
      title: t("verifiedPaymentsTitle"),
      description: t("verifiedPaymentsFeature"),
      gradient: "from-warning/10 to-warning/5"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-4">
              {t("transparentMarketplace")}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t("howItWorksHero")}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {t("howItWorksSubtitle")}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="hero" size="lg" asChild>
                <Link to="/auth">
                  {t("getStarted")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/offers">{t("browseOffers")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t("whyViewDealWorks")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("whyViewDealWorksDesc")}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className={`p-6 bg-gradient-to-br ${feature.gradient} border-none`}>
                <feature.icon className="h-12 w-12 mb-4 text-primary" />
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* For Creators */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="accent" className="mb-4">{t("forCreators")}</Badge>
            <h2 className="text-3xl font-bold mb-4">{t("creatorJourneyTitle")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("creatorJourneyDesc")}
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {creatorSteps.map((step, idx) => (
              <div key={idx} className="flex gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center ${step.color}`}>
                    <step.icon className="h-8 w-8" />
                  </div>
                </div>
                <Card className="flex-1 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="outline">{t("step")} {step.number}</Badge>
                    <h3 className="font-bold text-xl">{step.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{step.description}</p>
                </Card>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="hero" size="lg" asChild>
              <Link to="/auth">
                {t("startAsCreator")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* For Businesses */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="success" className="mb-4">{t("forBrands")}</Badge>
            <h2 className="text-3xl font-bold mb-4">{t("businessJourneyTitle")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("businessJourneyDesc")}
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {businessSteps.map((step, idx) => (
              <div key={idx} className="flex gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center ${step.color}`}>
                    <step.icon className="h-8 w-8" />
                  </div>
                </div>
                <Card className="flex-1 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="outline">{t("step")} {step.number}</Badge>
                    <h3 className="font-bold text-xl">{step.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{step.description}</p>
                </Card>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="hero" size="lg" asChild>
              <Link to="/auth">
                {t("startAsBusiness")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/10 via-primary-glow/5 to-transparent">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <Shield className="h-16 w-16 text-primary mb-6" />
                  <h2 className="text-3xl font-bold mb-4">{t("trustSecurityTitle")}</h2>
                  <p className="text-muted-foreground mb-6">
                    {t("trustSecurityDesc")}
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span>{t("escrowProtection")}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span>{t("verifiedMetrics")}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span>{t("disputeResolution")}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span>{t("transparentPayments")}</span>
                    </li>
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-6 text-center">
                    <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold mb-1">14</p>
                    <p className="text-sm text-muted-foreground">{t("daysVerification")}</p>
                  </Card>
                  <Card className="p-6 text-center">
                    <Shield className="h-8 w-8 text-success mx-auto mb-2" />
                    <p className="text-2xl font-bold mb-1">100%</p>
                    <p className="text-sm text-muted-foreground">{t("escrowProtected")}</p>
                  </Card>
                  <Card className="p-6 text-center">
                    <Users className="h-8 w-8 text-accent mx-auto mb-2" />
                    <p className="text-2xl font-bold mb-1">1000+</p>
                    <p className="text-sm text-muted-foreground">{t("activeUsers")}</p>
                  </Card>
                  <Card className="p-6 text-center">
                    <TrendingUp className="h-8 w-8 text-warning mx-auto mb-2" />
                    <p className="text-2xl font-bold mb-1">€500K+</p>
                    <p className="text-sm text-muted-foreground">{t("paidOut")}</p>
                  </Card>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("readyToTransform")}
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("readyToTransformDesc")}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/auth">
                {t("joinNow")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/support">{t("contactUs")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;
