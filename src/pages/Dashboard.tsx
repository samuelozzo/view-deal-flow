import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import { DollarSign, Eye, TrendingUp, MessageSquare } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Application {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  offers: {
    id: string;
    title: string;
    total_reward_cents: number;
    required_views: number;
    profiles?: {
      display_name: string | null;
    };
  };
}

const Dashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    accepted: 0,
    pending: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          offers (
            id,
            title,
            total_reward_cents,
            required_views,
            profiles:business_id (
              display_name
            )
          )
        `)
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setApplications(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const accepted = data?.filter(app => app.status === 'accepted').length || 0;
      const pending = data?.filter(app => app.status === 'pending').length || 0;
      
      setStats({
        total,
        accepted,
        pending,
        totalEarnings: 0, // Would be calculated from submissions
      });
    } catch (error: any) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      accepted: { variant: "success", label: t("accepted") },
      pending: { variant: "warning", label: t("pendingReview") },
      rejected: { variant: "destructive", label: t("rejected") },
    };
    const config = variants[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("dashboard")}</h1>
          <p className="text-muted-foreground">{t("manageApplications")}</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("totalApplications")}</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("accepted")}</p>
                  <p className="text-2xl font-bold">{stats.accepted}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("pending")}</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("totalEarnings")}</p>
                  <p className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>{t("myApplications")}</CardTitle>
            <CardDescription>{t("trackYourApplications")}</CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">{t("noApplicationsYet")}</p>
                <Button asChild>
                  <Link to="/offers">{t("browseOffers")}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <Card key={app.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{app.offers.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {t("by")} {app.offers.profiles?.display_name || "Unknown Business"}
                          </p>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">{t("reward")}</p>
                          <p className="font-semibold">
                            ${(app.offers.total_reward_cents / 100).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t("requiredViews")}</p>
                          <p className="font-semibold">
                            {app.offers.required_views.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t("appliedOn")}</p>
                          <p className="font-semibold">
                            {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t("status")}</p>
                          <p className="font-semibold capitalize">{app.status}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/offers/${app.offers.id}`}>{t("viewOffer")}</Link>
                        </Button>
                        {app.status === 'accepted' && (
                          <Button variant="hero" size="sm" asChild>
                            <Link to={`/chat/${app.id}`}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              {t("openChat")}
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
