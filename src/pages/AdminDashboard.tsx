import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Import Navbar as default export
import Navbar from "@/components/Navbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, ExternalLink, Loader2 } from "lucide-react";

interface SubmissionWithDetails {
  id: string;
  content_url: string;
  actual_views: number;
  status: string;
  submitted_at: string;
  admin_note?: string;
  application: {
    creator_id: string;
    offer: {
      id: string;
      title: string;
      business_id: string;
      total_reward_cents: number;
    };
  };
  creator_profile?: {
    display_name: string;
  };
  business_profile?: {
    display_name: string;
  };
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAdminRole();
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (error || !data) {
        toast({
          title: "Accesso negato",
          description: "Non hai i permessi per accedere a questa pagina.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      fetchSubmissions();
    } catch (error) {
      console.error("Error checking admin role:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select(`
          *,
          application:applications!inner(
            creator_id,
            offer:offers!inner(
              id,
              title,
              business_id,
              total_reward_cents
            )
          )
        `)
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      // Fetch creator and business profiles
      const submissionsWithProfiles = await Promise.all(
        (data || []).map(async (submission: any) => {
          const [creatorProfile, businessProfile] = await Promise.all([
            supabase
              .from("profiles")
              .select("display_name")
              .eq("id", submission.application.creator_id)
              .single(),
            supabase
              .from("profiles")
              .select("display_name")
              .eq("id", submission.application.offer.business_id)
              .single(),
          ]);

          return {
            ...submission,
            creator_profile: creatorProfile.data,
            business_profile: businessProfile.data,
          };
        })
      );

      setSubmissions(submissionsWithProfiles);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le submission.",
        variant: "destructive",
      });
    }
  };

  const openActionDialog = (submission: SubmissionWithDetails, type: 'approve' | 'reject') => {
    setSelectedSubmission(submission);
    setActionType(type);
    setAdminNote("");
  };

  const closeDialog = () => {
    setSelectedSubmission(null);
    setActionType(null);
    setAdminNote("");
  };

  const handleAction = async () => {
    if (!selectedSubmission || !actionType) return;

    setProcessing(true);

    try {
      if (actionType === 'approve') {
        await handleApprove(selectedSubmission);
      } else {
        await handleReject(selectedSubmission);
      }

      await fetchSubmissions();
      closeDialog();
    } catch (error) {
      console.error("Error processing action:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async (submission: SubmissionWithDetails) => {
    // Update submission status
    const { error: updateError } = await supabase
      .from("submissions")
      .update({
        status: "verified",
        verified_at: new Date().toISOString(),
        admin_note: adminNote || null,
      })
      .eq("id", submission.id);

    if (updateError) throw updateError;

    // Create escrow transaction
    // Calculate earnings based on views and offer reward
    const rewardPerView = submission.application.offer.total_reward_cents / (submission.application.offer as any).required_views;
    const earningsCents = Math.floor(submission.actual_views * rewardPerView);
    
    const { error: escrowError } = await supabase
      .from("escrow_transactions")
      .insert({
        offer_id: submission.application.offer.id,
        amount_cents: earningsCents,
        status: "funded",
        funded_at: new Date().toISOString(),
      });

    if (escrowError) throw escrowError;

    // Send notification to creator
    await supabase.from("notifications").insert({
      user_id: submission.application.creator_id,
      title: "Video Approvato! 🎉",
      message: `Il tuo video per "${submission.application.offer.title}" è stato approvato. Il periodo di escrow è iniziato.`,
      type: "approval",
      link: `/dashboard`,
    });

    // Send notification to business
    await supabase.from("notifications").insert({
      user_id: submission.application.offer.business_id,
      title: "Video Approvato",
      message: `Un video per la tua offerta "${submission.application.offer.title}" è stato approvato. Periodo di escrow iniziato.`,
      type: "escrow_start",
      link: `/offers/${submission.application.offer.id}`,
    });

    toast({
      title: "Video approvato",
      description: "Il video è stato approvato e l'escrow è stato avviato.",
    });
  };

  const handleReject = async (submission: SubmissionWithDetails) => {
    if (!adminNote.trim()) {
      toast({
        title: "Nota richiesta",
        description: "Devi inserire una motivazione per il rifiuto.",
        variant: "destructive",
      });
      return;
    }

    const { error: updateError } = await supabase
      .from("submissions")
      .update({
        status: "rejected",
        rejected_at: new Date().toISOString(),
        admin_note: adminNote,
      })
      .eq("id", submission.id);

    if (updateError) throw updateError;

    // Send notification to creator
    await supabase.from("notifications").insert({
      user_id: submission.application.creator_id,
      title: "Video Rifiutato",
      message: `Il tuo video per "${submission.application.offer.title}" è stato rifiutato. Motivo: ${adminNote}`,
      type: "rejection",
      link: `/dashboard`,
    });

    // Send notification to business
    await supabase.from("notifications").insert({
      user_id: submission.application.offer.business_id,
      title: "Video Rifiutato",
      message: `Un video per la tua offerta "${submission.application.offer.title}" è stato rifiutato.`,
      type: "rejection",
      link: `/offers/${submission.application.offer.id}`,
    });

    toast({
      title: "Video rifiutato",
      description: "Il creator è stato notificato del rifiuto.",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending_verification: { label: "In Attesa", variant: "secondary" },
      verified: { label: "Approvato", variant: "default" },
      rejected: { label: "Rifiutato", variant: "destructive" },
    };

    const config = variants[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Amministratore</CardTitle>
            <CardDescription>
              Gestisci tutte le submission video e controlla la piattaforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Offerta</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Video</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{submission.creator_profile?.display_name || "N/A"}</TableCell>
                    <TableCell>{submission.business_profile?.display_name || "N/A"}</TableCell>
                    <TableCell>{submission.application.offer.title}</TableCell>
                    <TableCell>{submission.actual_views.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell>
                      {new Date(submission.submitted_at).toLocaleDateString("it-IT")}
                    </TableCell>
                    <TableCell>
                      <a
                        href={submission.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Link
                      </a>
                    </TableCell>
                    <TableCell>
                      {submission.status === "pending_verification" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => openActionDialog(submission, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approva
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openActionDialog(submission, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rifiuta
                          </Button>
                        </div>
                      )}
                      {submission.status === "verified" && (
                        <span className="text-sm text-muted-foreground">Già approvato</span>
                      )}
                      {submission.status === "rejected" && (
                        <span className="text-sm text-muted-foreground">Già rifiutato</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {submissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Nessuna submission trovata
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!actionType} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approva Video' : 'Rifiuta Video'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'Approva questo video e avvia il periodo di escrow.'
                : 'Rifiuta questo video e specifica il motivo.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSubmission && (
              <div className="text-sm space-y-2">
                <p><strong>Creator:</strong> {selectedSubmission.creator_profile?.display_name}</p>
                <p><strong>Offerta:</strong> {selectedSubmission.application.offer.title}</p>
                <p><strong>Views:</strong> {selectedSubmission.actual_views.toLocaleString()}</p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Nota {actionType === 'reject' && '(Obbligatoria)'}
              </label>
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={
                  actionType === 'approve'
                    ? 'Aggiungi una nota opzionale...'
                    : 'Spiega il motivo del rifiuto...'
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={processing}>
              Annulla
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              variant={actionType === 'approve' ? 'default' : 'destructive'}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : actionType === 'approve' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {actionType === 'approve' ? 'Approva' : 'Rifiuta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
