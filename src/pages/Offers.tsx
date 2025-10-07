import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import { Search, TrendingUp, Euro, Eye, Clock, Instagram, Youtube, Filter } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Mock data - with reward claiming information
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
  },
  {
    id: 5,
    title: "Gaming Headset Review",
    business: "AudioGear Pro",
    reward: "3 Free Products",
    rewardType: "product",
    requiredViews: "50,000",
    targetViews: 50000,
    platform: "YouTube",
    timeframe: "14 days",
    category: "Technology",
    escrowFunded: true,
    applications: 9,
    totalRewardCents: 3, // 3 products total
    claimedRewardCents: 1, // 1 product claimed
  },
];

const Offers = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [mockOffers, setMockOffers] = useState(initialMockOffers);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [rewardFilter, setRewardFilter] = useState("all");

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

  // Filter offers based on search, category, and reward
  const filteredOffers = mockOffers.filter((offer) => {
    // Search filter
    const matchesSearch =
      offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.business.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory =
      categoryFilter === "all" || offer.category === categoryFilter;

    // Reward filter
    let matchesReward = true;
    const rewardAmount = parseInt(offer.reward.replace(/[^0-9]/g, ""));
    if (rewardFilter === "under-100") {
      matchesReward = rewardAmount < 100;
    } else if (rewardFilter === "100-150") {
      matchesReward = rewardAmount >= 100 && rewardAmount <= 150;
    } else if (rewardFilter === "150-200") {
      matchesReward = rewardAmount >= 150 && rewardAmount <= 200;
    } else if (rewardFilter === "over-200") {
      matchesReward = rewardAmount > 200;
    }

    return matchesSearch && matchesCategory && matchesReward;
  });

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
        <div className="mb-8 space-y-4">
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
          
          {/* Filter Options */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Fashion">Fashion</SelectItem>
                <SelectItem value="Fitness">Fitness</SelectItem>
                <SelectItem value="Lifestyle">Lifestyle</SelectItem>
              </SelectContent>
            </Select>

            {/* Reward Filter */}
            <Select value={rewardFilter} onValueChange={setRewardFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Reward Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rewards</SelectItem>
                <SelectItem value="under-100">Under €100</SelectItem>
                <SelectItem value="100-150">€100 - €150</SelectItem>
                <SelectItem value="150-200">€150 - €200</SelectItem>
                <SelectItem value="over-200">Over €200</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(categoryFilter !== "all" || rewardFilter !== "all" || searchQuery !== "") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCategoryFilter("all");
                  setRewardFilter("all");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Offers Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => (
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

                {/* Reward Claiming Progress */}
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
        {filteredOffers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{t("noOffersFound")}</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
                setRewardFilter("all");
              }}
            >
              {t("clearSearch")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Offers;
