import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import EscrowList from "@/components/EscrowList";
import { DollarSign, Eye, TrendingUp, MessageSquare, Upload, Video, Wallet as WalletIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Application {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  creator_id?: string;
  offers: {
    id: string;
    title: string;
    total_reward_cents: number;
    required_views: number;
    profiles?: {
      display_name: string | null;
    };
  };
  profiles?: {
    display_name: string | null;
  };
  submissions?: Array<{
    id: string;
    content_url: string;
    status: string;
    actual_views: number;
  }>;
}

const Dashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoViews, setVideoViews] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    accepted: 0,
    pending: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    const type = await fetchAccountType();
    if (type) {
      await fetchApplications(type);
    }
  };

  const fetchAccountType = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', user?.id)
        .single();
      
      const type = data?.account_type || null;
      setAccountType(type);
      return type;
    } catch (error) {
      console.error("Error fetching account type:", error);
      return null;
    }
  };

  const fetchApplications = async (type?: string | null) => {
    try {
      let query;
      const userType = type || accountType;
      
      if (userType === 'business') {
        // Business users see applications to their offers
        query = supabase
          .from('applications')
          .select(`
            *,
            profiles:creator_id (
              display_name
            ),
            offers!inner (
              id,
              title,
              total_reward_cents,
              required_views,
              business_id,
              status,
              reward_type,
              discount_percentage
            ),
            submissions (
              id,
              content_url,
              status,
              actual_views
            )
          `)
          .eq('offers.business_id', user?.id)
          .order('created_at', { ascending: false });
      } else {
        // Creator users see their own applications
        query = supabase
          .from('applications')
          .select(`
            *,
            offers!inner (
              id,
              title,
              total_reward_cents,
              required_views,
              status,
              reward_type,
              discount_percentage,
              profiles:business_id (
                display_name
              )
            ),
            submissions (
              id,
              content_url,
              status,
              actual_views
            )
          `)
          .eq('creator_id', user?.id)
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('=== DEBUG APPLICATIONS ===');
      console.log('User type:', userType);
      console.log('Total applications fetched:', data?.length);
      data?.forEach((app, index) => {
        console.log(`App ${index}:`, {
          id: app.id,
          status: app.status,
          submissions: app.submissions,
          submissionsIsArray: Array.isArray(app.submissions),
          submissionsLength: app.submissions?.length
        });
      });

      // Filter out applications with approved submissions
      let filteredData = data || [];
      
      if (userType === 'business') {
        filteredData = filteredData.filter(app => {
          // Check if submissions is an array or a single object
          if (!app.submissions) return true;
          
          if (Array.isArray(app.submissions)) {
            const hasApprovedSubmission = app.submissions.some(sub => sub.status === 'verified');
            return !hasApprovedSubmission;
          } else {
            // submissions is a single object
            return app.submissions.status !== 'verified';
          }
        });
      } else if (userType === 'creator') {
        filteredData = filteredData.filter(app => {
          // Check if submissions is an array or a single object
          if (!app.submissions) return true;
          
          if (Array.isArray(app.submissions)) {
            const hasApprovedSubmission = app.submissions.some(sub => sub.status === 'verified');
            return !hasApprovedSubmission;
          } else {
            // submissions is a single object
            return app.submissions.status !== 'verified';
          }
        });
      }

      console.log('Filtered applications:', filteredData.length);
      console.log('=== END DEBUG ===');

      setApplications(filteredData);

      // Calculate stats based on filtered data
      const total = filteredData?.length || 0;
      const accepted = filteredData?.filter(app => app.status === 'accepted').length || 0;
      const pending = filteredData?.filter(app => app.status === 'pending').length || 0;
      
      setStats({
        total,
        accepted,
        pending,
        totalEarnings: 0,
      });
    } catch (error: any) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };


  const handleSubmitVideo = async () => {
    if (!selectedApplication || !videoUrl) {
      toast.error("Please provide a video URL");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('submissions')
        .insert({
          application_id: selectedApplication,
          content_url: videoUrl,
          actual_views: parseInt(videoViews) || 0,
          status: 'pending_verification',
        });

      if (error) throw error;

      toast.success("Video inviato e in attesa di revisione dall'admin");
      setSubmissionDialogOpen(false);
      setVideoUrl("");
      setVideoViews("");
      setSelectedApplication(null);
      fetchApplications();
    } catch (error: any) {
      console.error("Error submitting video:", error);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (app: Application) => {
    // Check if there's an approved submission - if so, show "Accettata in escrow"
    if (app.submissions && app.submissions.length > 0 && app.submissions[0].status === 'approved') {
      return <Badge variant="success">Accettata in escrow</Badge>;
    }
    
    // Otherwise, show normal application status
    const variants: Record<string, { variant: any; label: string }> = {
      accepted: { variant: "success", label: t("accepted") },
      pending: { variant: "warning", label: t("pendingReview") },
      rejected: { variant: "destructive", label: t("rejected") },
    };
    const config = variants[app.status] || { variant: "default", label: app.status };
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("dashboard")}</h1>
            <p className="text-muted-foreground">{t("manageApplications")}</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/wallet">
              <WalletIcon className="h-4 w-4 mr-2" />
              Wallet
            </Link>
          </Button>
        </div>

        {/* Escrow List for Creators */}
        {accountType === 'creator' && (
          <div className="mb-8">
            <EscrowList />
          </div>
        )}

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
                  <p className="text-2xl font-bold">€{stats.totalEarnings.toFixed(2)}</p>
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
            <CardTitle>
              {accountType === 'business' ? 'Received Applications' : t("myApplications")}
            </CardTitle>
            <CardDescription>
              {accountType === 'business' 
                ? 'Manage applications from creators'
                : t("trackYourApplications")
              }
            </CardDescription>
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
                {applications.map((app) => {
                  console.log('Application data:', {
                    id: app.id,
                    status: app.status,
                    accountType,
                    hasSubmissions: !!app.submissions?.length,
                    submissionsCount: app.submissions?.length || 0
                  });
                  
                  return (
                    <Card key={app.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                         <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{app.offers.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {accountType === 'business' 
                                ? `Creator: ${app.profiles?.display_name || "Unknown Creator"}`
                                : `${t("by")} ${app.offers.profiles?.display_name || "Unknown Business"}`
                              }
                            </p>
                          </div>
                          {getStatusBadge(app)}
                        </div>

                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-muted-foreground">{t("reward")}</p>
                            <p className="font-semibold">
                              {(app.offers as any).reward_type === "discount" 
                                ? `${(app.offers as any).discount_percentage || 0}% OFF`
                                : `€${(app.offers.total_reward_cents / 100).toFixed(2)}`
                              }
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

                         <div className="flex gap-2 flex-wrap">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/offers/${app.offers.id}`}>{t("viewOffer")}</Link>
                          </Button>

                          {accountType === 'creator' && (app.status === 'accepted' || app.status === 'pending') && !app.submissions?.length && (
                            <Dialog open={submissionDialogOpen && selectedApplication === app.id} 
                                    onOpenChange={(open) => {
                                      setSubmissionDialogOpen(open);
                                      if (open) setSelectedApplication(app.id);
                                    }}>
                              <DialogTrigger asChild>
                                <Button variant="hero" size="sm">
                                  <Video className="mr-2 h-4 w-4" />
                                  Carica Video
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Carica il Tuo Video</DialogTitle>
                                  <DialogDescription>
                                    Inserisci il link al tuo contenuto per la verifica da parte dell'admin
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="videoUrl">URL Video *</Label>
                                    <Input
                                      id="videoUrl"
                                      placeholder="https://tiktok.com/@user/video/123..."
                                      value={videoUrl}
                                      onChange={(e) => setVideoUrl(e.target.value)}
                                    />
                                  </div>
                                  <Button 
                                    onClick={handleSubmitVideo} 
                                    className="w-full"
                                    disabled={submitting || !videoUrl}
                                  >
                                    {submitting ? "Invio in corso..." : "Invia Video"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}

                          {accountType === 'creator' && app.submissions && app.submissions.length > 0 && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Upload className="h-3 w-3" />
                              {app.submissions[0].status === 'pending_verification' && 'In Revisione'}
                              {app.submissions[0].status === 'verified' && 'Approvato'}
                              {app.submissions[0].status === 'rejected' && 'Rifiutato'}
                            </Badge>
                          )}
                          
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
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
