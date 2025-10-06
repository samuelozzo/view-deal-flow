import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import { Search, TrendingUp, Euro, Eye, Clock, Instagram, Youtube } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Mock data
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
  },
];

const Offers = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{t("browseOffers")}</h1>
          <p className="text-muted-foreground">
            {t("findPerfectDealsDesc")}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("searchOffers")}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Offers Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockOffers.map((offer) => (
            <Card
              key={offer.id}
              className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group"
            >
              <div className="space-y-4">
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="accent" className="mb-2">
                      {offer.category}
                    </Badge>
                    {offer.escrowFunded && (
                      <Badge variant="success" className="text-xs">
                        {t("funded")}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    {offer.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{offer.business}</p>
                </div>

                {/* Reward */}
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                  <Euro className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("reward")}</p>
                    <p className="font-bold text-primary">{offer.reward}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {t("requiredViews")}
                    </span>
                    <span className="font-semibold">{offer.requiredViews}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {t("timeframe")}
                    </span>
                    <span className="font-semibold">{offer.timeframe}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("platform")}</span>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {offer.platform === "Instagram" && <Instagram className="h-3 w-3" />}
                      {offer.platform === "YouTube" && <Youtube className="h-3 w-3" />}
                      {offer.platform}
                    </Badge>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">
                      {offer.applications} {t("applications")}
                    </span>
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                  <Button variant="hero" className="w-full" asChild>
                    <Link to={`/offers/${offer.id}`}>{t("viewDetailsApply")}</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {mockOffers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{t("noOffersFound")}</p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              {t("clearSearch")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Offers;
