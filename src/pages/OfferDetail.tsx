import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Euro, Eye, Clock, Instagram, Youtube, Users, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

// Mock data - matches Offers.tsx with reward claiming information
const initialMockOffers = [
  {
    id: 1,
    title: "Fitness Brand Product Review",
    business: "FitLife Pro",
    reward: "150",
    rewardType: "cash",
    requiredViews: "100,000",
    targetViews: 100000,
    platform: "Instagram",
    timeframe: "14 days",
    category: "Fitness",
    escrowFunded: true,
    applications: 12,
    totalRewardCents: 15000, // €150
    claimedRewardCents: 6750, // €67.50 (45% claimed)
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
    targetViews: 150000,
    platform: "YouTube",
    timeframe: "14 days",
    category: "Technology",
    escrowFunded: true,
    applications: 8,
    totalRewardCents: 20000, // €200
    claimedRewardCents: 12400, // €124.00 (62% claimed)
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
    targetViews: 80000,
    platform: "TikTok",
    timeframe: "14 days",
    category: "Fashion",
    escrowFunded: true,
    applications: 15,
    totalRewardCents: 10000, // €100
    claimedRewardCents: 2800, // €28.00 (28% claimed)
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
    targetViews: 90000,
    platform: "Instagram",
    timeframe: "14 days",
    category: "Lifestyle",
    escrowFunded: true,
    applications: 6,
    totalRewardCents: 12000, // €120
    claimedRewardCents: 8520, // €85.20 (71% claimed)
    description: "Create content around our eco-friendly products. Show how they fit into a sustainable lifestyle.",
    requirements: [
      "Sustainability/lifestyle focus",
      "40K+ followers",
      "Authentic voice",
      "EU based",
    ],
  },
  {
    id: 5,
    title: "Gaming Headset Review",
    business: "AudioGear Pro",
    reward: "3 Free Products",
    rewardType: "product",
    requiredViews: "50,000",
    targetViews: 50000,
    viewsPerProduct: 5000, // 5,000 views required per product
    platform: "YouTube",
    timeframe: "14 days",
    category: "Technology",
    escrowFunded: true,
    applications: 9,
    totalRewardCents: 3, // 3 products total
    claimedRewardCents: 1, // 1 product claimed
    description: "Review our premium gaming headset and share your honest opinion. We'll send you a free unit to keep, and you can earn additional units based on your video's performance.",
    requirements: [
      "Gaming or tech content creator",
      "20K+ YouTube subscribers",
      "High-quality video production",
      "EU based",
    ],
  },
];

const OfferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [mockOffers, setMockOffers] = useState(initialMockOffers);
  
  const offer = mockOffers.find((o) => o.id === Number(id));

  // Auto-refresh data every 5 seconds (simulated)
  useEffect(() => {
    const interval = setInterval(() => {
      setMockOffers((prevOffers) =>
        prevOffers.map((offer) => {
          // Simulate small incremental claims
          if (offer.rewardType === "product") {
            // For products, occasionally claim one more product
            const shouldClaim = Math.random() > 0.7; // 30% chance to claim
            const newClaimed = shouldClaim 
              ? Math.min(offer.claimedRewardCents + 1, offer.totalRewardCents)
              : offer.claimedRewardCents;
            return {
              ...offer,
              claimedRewardCents: newClaimed,
            };
          } else {
            // For cash, small incremental claims (random small increase)
            const increment = Math.random() * 100; // Random increment up to €1
            const newClaimed = Math.min(
              offer.claimedRewardCents + increment,
              offer.totalRewardCents
            );
            return {
              ...offer,
              claimedRewardCents: newClaimed,
            };
          }
        })
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

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
                      <Badge 
                        variant={offer.claimedRewardCents >= offer.totalRewardCents ? "default" : "success"} 
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="h-3 w-3" />
                        {offer.claimedRewardCents >= offer.totalRewardCents ? "Completed" : "Open"}
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

                {/* Reward Pool Progress */}
                <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Reward Pool</span>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round((offer.claimedRewardCents / offer.totalRewardCents) * 100)}% claimed
                    </Badge>
                  </div>
                  <Progress 
                    value={(offer.claimedRewardCents / offer.totalRewardCents) * 100} 
                    className="h-2"
                  />
                  {offer.rewardType === "product" ? (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {offer.claimedRewardCents} / {offer.totalRewardCents} products claimed
                        </span>
                        <span className="font-semibold text-success">
                          {offer.totalRewardCents - offer.claimedRewardCents} left
                        </span>
                      </div>
                      {offer.viewsPerProduct && (
                        <div className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                          Earn 1 product per {offer.viewsPerProduct.toLocaleString()} views
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          €{(offer.claimedRewardCents / 100).toFixed(2)} / €{(offer.totalRewardCents / 100).toFixed(2)}
                        </span>
                        <span className="font-semibold text-success">
                          €{((offer.totalRewardCents - offer.claimedRewardCents) / 100).toFixed(2)} left
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                        Rate: €{((offer.totalRewardCents / 100) / (offer.targetViews / 1000)).toFixed(2)} per 1,000 views
                      </div>
                    </>
                  )}
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
