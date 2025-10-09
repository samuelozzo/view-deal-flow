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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, ExternalLink, Loader2, Clock, Zap } from "lucide-react";

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
      required_views: number;
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
  const [actualViews, setActualViews] = useState("");
  const [processing, setProcessing] = useState(false);
  const [testingEscrow, setTestingEscrow] = useState(false);
  const [forcingEscrow, setForcingEscrow] = useState<string | null>(null);

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
              total_reward_cents,
              required_views
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
    setActualViews("");
  };

  const closeDialog = () => {
    setSelectedSubmission(null);
    setActionType(null);
    setAdminNote("");
    setActualViews("");
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
    try {
      // Validate actual views input
      const views = parseInt(actualViews);
      if (!actualViews || isNaN(views) || views <= 0) {
        toast({
          title: "Errore",
          description: "Inserisci un numero valido di visualizzazioni",
          variant: "destructive",
        });
        throw new Error("Invalid views");
      }

      // Get current offer data to check remaining budget
      const { data: currentOffer, error: offerFetchError } = await supabase
        .from("offers")
        .select("total_reward_cents, claimed_reward_cents")
        .eq("id", submission.application.offer.id)
        .single();

      if (offerFetchError || !currentOffer) {
        throw new Error("Impossibile recuperare i dati dell'offerta");
      }

      // Calculate remaining budget
      const remainingCents = currentOffer.total_reward_cents - (currentOffer.claimed_reward_cents || 0);

      if (remainingCents <= 0) {
        toast({
          title: "Errore",
          description: "Budget dell'offerta esaurito. Non è possibile approvare altre submission.",
          variant: "destructive",
        });
        throw new Error("Budget esaurito");
      }

      // Calculate earnings based on views and offer reward
      // Formula: (actual_views / required_views) * total_reward_cents
      // Cap at total_reward_cents if views exceed required
      const ratio = Math.min(views / submission.application.offer.required_views, 1);
      let earningsCents = Math.round(submission.application.offer.total_reward_cents * ratio);
      
      // Cap earnings to remaining budget
      const originalEarnings = earningsCents;
      earningsCents = Math.min(earningsCents, remainingCents);

      // Warn admin if earnings were capped
      if (earningsCents < originalEarnings) {
        toast({
          title: "Attenzione",
          description: `La ricompensa è stata limitata a €${(earningsCents / 100).toFixed(2)} (budget residuo dell'offerta). Ricompensa calcolata era €${(originalEarnings / 100).toFixed(2)}.`,
          variant: "default",
        });
      }
      
      // Calculate release date (14 days from now)
      const releaseDate = new Date();
      releaseDate.setDate(releaseDate.getDate() + 14);

      // Get business wallet
      const { data: businessWallet, error: walletError } = await supabase
        .from("wallets")
        .select("id, available_cents, reserved_cents")
        .eq("user_id", submission.application.offer.business_id)
        .single();

      if (walletError || !businessWallet) {
        throw new Error("Business wallet non trovato");
      }

      // Check if there are sufficient reserved funds (funds are already in escrow from offer creation)
      if (businessWallet.reserved_cents < earningsCents) {
        throw new Error(`Fondi in escrow insufficienti. Riservati: €${(businessWallet.reserved_cents / 100).toFixed(2)}, Richiesti: €${(earningsCents / 100).toFixed(2)}`);
      }

      // NO NEED TO UPDATE WALLET - funds are already reserved in escrow from offer creation
      // The escrow_transactions table will track the allocation to the specific creator
      
      console.log(`✅ Using existing escrow funds: €${(earningsCents / 100).toFixed(2)} from reserved: €${(businessWallet.reserved_cents / 100).toFixed(2)}`);

      // Update submission status with actual views
      const { error: submissionError } = await supabase
        .from("submissions")
        .update({
          status: "verified",
          actual_views: views,
          calculated_earnings_cents: earningsCents,
          verified_at: new Date().toISOString(),
          admin_note: adminNote || null,
        })
        .eq("id", submission.id);

      if (submissionError) throw submissionError;

      // Create escrow transaction
      const { error: escrowError } = await supabase
        .from("escrow_transactions")
        .insert({
          offer_id: submission.application.offer.id,
          amount_cents: earningsCents,
          status: "funded",
          creator_id: submission.application.creator_id,
          submission_id: submission.id,
          duration_days: 14,
          scheduled_release_at: releaseDate.toISOString(),
          funded_at: new Date().toISOString(),
        });

      if (escrowError) throw escrowError;

      // Update creator wallet (add to reserved)
      const { data: creatorWallet, error: creatorWalletFetchError } = await supabase
        .from("wallets")
        .select("id, reserved_cents")
        .eq("user_id", submission.application.creator_id)
        .single();

      if (creatorWalletFetchError || !creatorWallet) {
        throw new Error("Creator wallet non trovato");
      }

      const { error: creatorReserveError } = await supabase
        .from("wallets")
        .update({
          reserved_cents: creatorWallet.reserved_cents + earningsCents,
        })
        .eq("id", creatorWallet.id);

      if (creatorReserveError) throw creatorReserveError;

      // Create wallet transaction for creator (escrow reserve)
      await supabase.from("wallet_transactions").insert({
        wallet_id: creatorWallet.id,
        type: "escrow_reserve",
        direction: "in",
        amount_cents: earningsCents,
        status: "completed",
        reference_type: "submission",
        reference_id: submission.id,
        metadata: {
          offer_id: submission.application.offer.id,
          escrow_release_date: releaseDate.toISOString(),
        },
      });

      // Update offer claimed_reward_cents (no need to fetch again, we already have currentOffer)
      const newClaimedAmount = (currentOffer.claimed_reward_cents || 0) + earningsCents;
      const isOfferCompleted = newClaimedAmount >= currentOffer.total_reward_cents;

      const { error: offerUpdateError } = await supabase
        .from("offers")
        .update({
          claimed_reward_cents: newClaimedAmount,
          ...(isOfferCompleted && { status: 'completed' }),
        })
        .eq("id", submission.application.offer.id);

      if (offerUpdateError) throw offerUpdateError;

      // If offer is completed, send notifications to all involved parties
      if (isOfferCompleted) {
        // Get business_id from offer
        const { data: offerData, error: offerError } = await supabase
          .from("offers")
          .select("business_id, title")
          .eq("id", submission.application.offer.id)
          .single();

        if (!offerError && offerData) {
          // Get all creators who have accepted applications for this offer
          const { data: acceptedApps, error: appsError } = await supabase
            .from("applications")
            .select("creator_id")
            .eq("offer_id", submission.application.offer.id)
            .eq("status", "accepted");

          if (!appsError && acceptedApps) {
            // Send notification to business
            await supabase.from("notifications").insert({
              user_id: offerData.business_id,
              type: "offer_completed",
              title: "Offerta Completata! 🎉",
              message: `La tua offerta "${offerData.title}" è stata completata con successo! Pronti per la prossima?`,
              link: `/manage-offers`,
            });

            // Send notifications to all creators
            const creatorNotifications = acceptedApps.map((app) => ({
              user_id: app.creator_id,
              type: "offer_completed",
              title: "Offerta Completata! 🎉",
              message: `L'offerta "${offerData.title}" è stata completata con successo! Pronti per la prossima?`,
              link: `/dashboard`,
            }));

            await supabase.from("notifications").insert(creatorNotifications);
          }
        }
      }

      // Send notification to creator
      await supabase.from("notifications").insert({
        user_id: submission.application.creator_id,
        type: "escrow_started",
        title: "Escrow Iniziato",
        message: `Il tuo video è stato approvato! Hai guadagnato €${(earningsCents / 100).toFixed(2)}. L'importo verrà sbloccato entro 14 giorni (${releaseDate.toLocaleDateString("it-IT")}).`,
        link: `/dashboard`,
      });

      // Send notification to business
      await supabase.from("notifications").insert({
        user_id: submission.application.offer.business_id,
        type: "escrow_started",
        title: "Task Completata",
        message: `Il video per "${submission.application.offer.title}" è stato verificato. Escrow di €${(earningsCents / 100).toFixed(2)} avviato per 14 giorni.`,
        link: `/offers/${submission.application.offer.id}`,
      });

      toast({
        title: "Video approvato",
        description: "Escrow avviato con successo. Il pagamento verrà rilasciato automaticamente tra 14 giorni.",
      });
    } catch (error: any) {
      console.error("Error in handleApprove:", error);
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'approvazione del video.",
        variant: "destructive",
      });
      throw error;
    }
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

  const testEscrowRelease = async () => {
    setTestingEscrow(true);
    try {
      const { data, error } = await supabase.functions.invoke('release-escrows', {
        body: {}
      });

      if (error) {
        console.error('Errore nel rilascio escrow:', error);
        toast({
          title: "Errore",
          description: "Impossibile eseguire il rilascio escrow",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Test completato",
        description: `Processati ${data.processed || 0} escrow. Controlla la console per i dettagli.`,
      });

      console.log('Risultato test escrow:', data);
      
      // Ricarica le submissions per vedere gli aggiornamenti
      await fetchSubmissions();
    } catch (error) {
      console.error('Errore nella chiamata:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il test",
        variant: "destructive",
      });
    } finally {
      setTestingEscrow(false);
    }
  };

  const forceReleaseEscrow = async (submissionId: string) => {
    setForcingEscrow(submissionId);
    try {
      // Find the escrow for this submission
      const { data: escrow, error: escrowError } = await supabase
        .from("escrow_transactions")
        .select("id, scheduled_release_at")
        .eq("submission_id", submissionId)
        .eq("status", "funded")
        .maybeSingle();

      if (escrowError) {
        console.error("Errore nel recupero escrow:", escrowError);
        toast({
          title: "Errore",
          description: "Impossibile trovare l'escrow per questa submission",
          variant: "destructive",
        });
        return;
      }

      if (!escrow) {
        toast({
          title: "Nessun escrow",
          description: "Non esiste un escrow attivo per questa submission",
          variant: "destructive",
        });
        return;
      }

      // Update scheduled_release_at to now to make it eligible for release
      const { error: updateError } = await supabase
        .from("escrow_transactions")
        .update({ scheduled_release_at: new Date().toISOString() })
        .eq("id", escrow.id);

      if (updateError) {
        console.error("Errore nell'aggiornamento escrow:", updateError);
        toast({
          title: "Errore",
          description: "Impossibile aggiornare l'escrow",
          variant: "destructive",
        });
        return;
      }

      // Call release-escrows function to process it
      const { data, error } = await supabase.functions.invoke('release-escrows', {
        body: {}
      });

      if (error) {
        console.error("Errore nel rilascio escrow:", error);
        toast({
          title: "Errore",
          description: "Impossibile eseguire il rilascio escrow",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Rilascio forzato completato",
        description: "L'escrow è stato rilasciato con successo",
      });

      console.log("Risultato rilascio forzato:", data);
      
      // Reload submissions
      await fetchSubmissions();
    } catch (error) {
      console.error("Errore nella chiamata:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il rilascio forzato",
        variant: "destructive",
      });
    } finally {
      setForcingEscrow(null);
    }
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
            <div className="mb-4 flex justify-end">
              <Button 
                onClick={testEscrowRelease} 
                disabled={testingEscrow}
                variant="default"
                size="sm"
              >
                {testingEscrow ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rilascio in corso...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Rilascio Escrow
                  </>
                )}
              </Button>
            </div>
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
                        <div className="flex gap-2 items-center">
                          <span className="text-sm text-muted-foreground">Già approvato</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => forceReleaseEscrow(submission.id)}
                            disabled={forcingEscrow === submission.id}
                            title="Forza rilascio escrow"
                          >
                            {forcingEscrow === submission.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Zap className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
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
                <p><strong>Reward Totale:</strong> €{(selectedSubmission.application.offer.total_reward_cents / 100).toFixed(2)}</p>
                <p><strong>Views Richieste:</strong> {selectedSubmission.application.offer.required_views.toLocaleString()}</p>
              </div>
            )}
            
            {actionType === 'approve' && selectedSubmission && (
              <div className="space-y-2">
                <Label htmlFor="actual-views">Visualizzazioni Effettive *</Label>
                <Input
                  id="actual-views"
                  type="number"
                  min="0"
                  value={actualViews}
                  onChange={(e) => setActualViews(e.target.value)}
                  placeholder="Inserisci il numero di visualizzazioni..."
                />
                {actualViews && !isNaN(parseInt(actualViews)) && parseInt(actualViews) > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Reward calcolata: €{(Math.round(
                      selectedSubmission.application.offer.total_reward_cents * 
                      Math.min(parseInt(actualViews) / selectedSubmission.application.offer.required_views, 1)
                    ) / 100).toFixed(2)}
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="admin-note">
                Nota {actionType === 'reject' && '(Obbligatoria)'}
              </Label>
              <Textarea
                id="admin-note"
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
