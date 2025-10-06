import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Euro, Eye, Clock, Instagram, Youtube, Users, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

// Mock data - matches Offers.tsx
const mockOffers = [
  {
    id: 1,
    title: "Fitness Brand Product Review",
    business: "FitLife Pro",
    reward: "150",
    rewardType: "cash",
    requiredViews: "100,000",
    platform: "Instagram",
    timeframe: "14 days",
    category: "Fitness",
    escrowFunded: true,
    applications: 12,
    description: "We're looking for fitness creators to review our new protein shake line. Create authentic content showing the product in your daily routine.",
    requirements: [
      "Minimum 50K followers on Instagram",
      "Active engagement rate above 3%",
      "Previous fitness/nutrition content",
      "Must be based in EU",
    ],
  },
  {
    id: 2,
    title: "Tech Gadget Unboxing",
    business: "TechGear EU",
    reward: "200 + Free Product",
    rewardType: "cash",
    requiredViews: "150,000",
    platform: "YouTube",
    timeframe: "14 days",
    category: "Technology",
    escrowFunded: true,
    applications: 8,
    description: "Unbox and review our latest wireless earbuds. Show features, sound quality test, and honest opinion.",
    requirements: [
      "YouTube channel with 100K+ subscribers",
      "Tech review experience",
      "Professional video production",
      "EU based",
    ],
  },
  {
    id: 3,
    title: "Fashion Collection Showcase",
    business: "StyleHub",
    reward: "100",
    rewardType: "cash",
    requiredViews: "80,000",
    platform: "TikTok",
    timeframe: "14 days",
    category: "Fashion",
    escrowFunded: true,
    applications: 15,
    description: "Showcase our new summer collection with 3-5 TikTok videos. Style the pieces your way and tag our brand.",
    requirements: [
      "Fashion/lifestyle content creator",
      "30K+ TikTok followers",
      "EU location",
      "Creative styling skills",
    ],
  },
  {
    id: 4,
    title: "Sustainable Living Challenge",
    business: "EcoLife",
    reward: "120",
    rewardType: "cash",
    requiredViews: "90,000",
    platform: "Instagram",
    timeframe: "14 days",
    category: "Lifestyle",
    escrowFunded: true,
    applications: 6,
    description: "Create content around our eco-friendly products. Show how they fit into a sustainable lifestyle.",
    requirements: [
      "Sustainability/lifestyle focus",
      "40K+ followers",
      "Authentic voice",
      "EU based",
    ],
  },
];

const OfferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const offer = mockOffers.find((o) => o.id === Number(id));

  if (!offer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">{t("offerNotFound")}</h1>
          <Button onClick={() => navigate("/offers")}>{t("backToOffers")}</Button>
        </div>
      </div>
    );
  }

  const handleApply = () => {
    toast({
      title: t("applicationSubmitted"),
      description: t("businessWillReview"),
    });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link to="/offers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToOffers")}
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8">
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="accent">{offer.category}</Badge>
                    {offer.escrowFunded && (
                      <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {t("escrowFunded")}
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold mb-2">{offer.title}</h1>
                  <p className="text-lg text-muted-foreground">{offer.business}</p>
                </div>

                {/* Description */}
                <div>
                  <h2 className="text-xl font-bold mb-3">{t("aboutThisOffer")}</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {offer.description}
                  </p>
                </div>

                {/* Requirements */}
                <div>
                  <h2 className="text-xl font-bold mb-3">{t("requirements")}</h2>
                  <ul className="space-y-2">
                    {offer.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reward Card */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("reward")}</p>
                  <div className="flex items-center gap-2">
                    <Euro className="h-6 w-6 text-primary" />
                    <p className="text-3xl font-bold text-primary">{offer.reward}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {t("requiredViews")}
                    </span>
                    <span className="font-semibold">{offer.requiredViews}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {t("timeframe")}
                    </span>
                    <span className="font-semibold">{offer.timeframe}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("platform")}</span>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {offer.platform === "Instagram" && <Instagram className="h-3 w-3" />}
                      {offer.platform === "YouTube" && <Youtube className="h-3 w-3" />}
                      {offer.platform}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {t("applications")}
                    </span>
                    <span className="font-semibold">{offer.applications}</span>
                  </div>
                </div>

                <Button variant="hero" className="w-full" size="lg" onClick={handleApply}>
                  {t("applyNow")}
                </Button>
              </div>
            </Card>

            {/* Info Card */}
            <Card className="p-6">
              <h3 className="font-bold mb-3">{t("howItWorksTitle")}</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    1
                  </span>
                  <span className="text-muted-foreground">{t("applyToOffer")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    2
                  </span>
                  <span className="text-muted-foreground">{t("waitForApproval")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    3
                  </span>
                  <span className="text-muted-foreground">{t("createAndPost")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    4
                  </span>
                  <span className="text-muted-foreground">{t("submitProofAfter")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    5
                  </span>
                  <span className="text-muted-foreground">{t("getPaidFromEscrow")}</span>
                </li>
              </ol>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferDetail;
