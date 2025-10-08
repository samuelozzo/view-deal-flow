import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Wallet as WalletIcon, ArrowUpCircle, ArrowDownCircle, Loader2, CreditCard, Building2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { StripePaymentForm } from "@/components/StripePaymentForm";
import { DevStripeWebhookTester } from "@/components/DevStripeWebhookTester";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

interface WalletData {
  id: string;
  available_cents: number;
  reserved_cents: number;
}

interface Transaction {
  id: string;
  type: string;
  direction: string;
  amount_cents: number;
  status: string;
  created_at: string;
  metadata: any;
}

const Wallet = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  
  // Payout dialog
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutIban, setPayoutIban] = useState("");
  const [payoutProcessing, setPayoutProcessing] = useState(false);

  // Topup dialog
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupMethod, setTopupMethod] = useState<"card" | "bank_transfer">("card");
  const [topupProcessing, setTopupProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [reconcileProcessing, setReconcileProcessing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchWalletData();

    // Set up realtime subscription for wallet updates
    const channel = supabase
      .channel('wallet-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Wallet updated:', payload);
          // Update wallet state with new data
          if (payload.new) {
            setWallet((prev) => prev ? {
              ...prev,
              available_cents: payload.new.available_cents,
              reserved_cents: payload.new.reserved_cents,
            } : null);
            
            toast({
              title: "Saldo Aggiornato",
              description: "Il saldo del tuo wallet è stato aggiornato",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const fetchWalletData = async () => {
    try {
      // Get user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .single();

      if (roleData) {
        setUserRole(roleData.role);
      }

      // Get wallet
      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (walletError) throw walletError;
      setWallet(walletData);

      // Get transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", walletData.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati del wallet.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayout = async () => {
    if (!wallet || !payoutAmount || !payoutIban) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi.",
        variant: "destructive",
      });
      return;
    }

    const amountCents = Math.floor(parseFloat(payoutAmount) * 100);
    
    if (amountCents > wallet.available_cents) {
      toast({
        title: "Saldo insufficiente",
        description: "Non hai abbastanza fondi disponibili.",
        variant: "destructive",
      });
      return;
    }

    if (amountCents < 1000) {
      toast({
        title: "Importo minimo",
        description: "L'importo minimo per il prelievo è €10.",
        variant: "destructive",
      });
      return;
    }

    setPayoutProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("request-payout", {
        body: {
          amount_cents: amountCents,
          iban: payoutIban,
        },
      });

      if (error) throw error;

      toast({
        title: "Richiesta Payout Inviata",
        description: `La tua richiesta di payout di €${(amountCents / 100).toFixed(2)} è in elaborazione.`,
      });

      setPayoutOpen(false);
      setPayoutAmount("");
      setPayoutIban("");
      await fetchWalletData();
    } catch (error: any) {
      console.error("Error requesting payout:", error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile processare la richiesta.",
        variant: "destructive",
      });
    } finally {
      setPayoutProcessing(false);
    }
  };

  const handleTopup = async () => {
    if (!topupAmount) {
      toast({
        title: "Errore",
        description: "Inserisci un importo.",
        variant: "destructive",
      });
      return;
    }

    const amountCents = Math.floor(parseFloat(topupAmount) * 100);
    
    if (amountCents < 50) {
      toast({
        title: "Importo minimo",
        description: "L'importo minimo per la ricarica è €0.50.",
        variant: "destructive",
      });
      return;
    }

    // If card payment, use Stripe
    if (topupMethod === "card") {
      setTopupProcessing(true);
      try {
        const { data, error } = await supabase.functions.invoke("create-payment-intent", {
          body: {
            amount_cents: amountCents,
            metadata: {
              type: "wallet_topup",
            },
          },
        });

        if (error) {
          console.error("Payment intent error:", error);
          toast({
            title: "Errore",
            description: "Impossibile creare il pagamento",
            variant: "destructive",
          });
          setTopupProcessing(false);
          return;
        }

        setClientSecret(data.clientSecret);
        setTopupProcessing(false);
      } catch (error) {
        console.error("Topup error:", error);
        toast({
          title: "Errore",
          description: "Si è verificato un errore imprevisto",
          variant: "destructive",
        });
        setTopupProcessing(false);
      }
      return;
    }

    // Bank transfer flow (existing)
    setTopupProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("wallet-topup", {
        body: {
          method: topupMethod,
          amount_cents: amountCents,
        },
      });

      if (error) throw error;

      toast({
        title: "Ricarica iniziata",
        description: data.intent.instructions,
        duration: 10000,
      });

      setTopupOpen(false);
      setTopupAmount("");
      await fetchWalletData();
    } catch (error: any) {
      console.error("Error creating topup:", error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile processare la richiesta.",
        variant: "destructive",
      });
    } finally {
      setTopupProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    setTopupOpen(false);
    setTopupAmount("");
    setClientSecret(null);
    // Refetch wallet data to update balance
    fetchWalletData();
  };

  const handlePaymentCancel = () => {
    setClientSecret(null);
  };

  const handleReconcileNow = async () => {
    setReconcileProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("reconcile-pending-topups-now");

      if (error) throw error;

      const report = data.report || [];
      const completed = report.filter((r: any) => r.action === 'completed_and_credited').length;

      if (completed > 0) {
        toast({
          title: "Saldo Aggiornato",
          description: `${completed} ricarica${completed > 1 ? 'he' : ''} completata${completed > 1 ? 'e' : ''} con successo!`,
        });
        await fetchWalletData();
      } else {
        toast({
          title: "Nessuna ricarica da processare",
          description: "Tutte le ricariche recenti sono già state elaborate.",
        });
      }
    } catch (error: any) {
      console.error("Error reconciling topups:", error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare il saldo.",
        variant: "destructive",
      });
    } finally {
      setReconcileProcessing(false);
    }
  };

  const getTransactionIcon = (type: string, direction: string) => {
    if (direction === "in") {
      return <ArrowDownCircle className="h-4 w-4 text-green-500" />;
    }
    return <ArrowUpCircle className="h-4 w-4 text-red-500" />;
  };

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      escrow_reserve: "Riserva Escrow",
      escrow_release: "Rilascio Escrow",
      payout: "Prelievo",
      topup: "Ricarica",
      refund: "Rimborso",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Wallet non trovato</CardTitle>
              <CardDescription>
                Non è stato possibile trovare il tuo wallet.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletIcon className="h-6 w-6" />
              Il Mio Wallet
            </CardTitle>
            <CardDescription>
              Gestisci il tuo saldo e le transazioni
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Disponibile</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    €{(wallet.available_cents / 100).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">In Escrow</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-muted-foreground">
                    €{(wallet.reserved_cents / 100).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2 flex-wrap">
              {userRole === "business" && (
                <Button 
                  variant="outline" 
                  onClick={handleReconcileNow}
                  disabled={reconcileProcessing}
                >
                  {reconcileProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Aggiorna saldo ora
                </Button>
              )}
              
              {userRole === "creator" && (
                <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default">
                      <ArrowUpCircle className="h-4 w-4 mr-2" />
                      Preleva Fondi
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Richiedi Prelievo</DialogTitle>
                      <DialogDescription>
                        Importo minimo: €10. I fondi verranno trasferiti sul tuo conto entro 3-5 giorni lavorativi.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Importo (€)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="10"
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          placeholder="10.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>IBAN</Label>
                        <Input
                          value={payoutIban}
                          onChange={(e) => setPayoutIban(e.target.value)}
                          placeholder="IT00X0000000000000000000000"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Saldo disponibile: €{(wallet.available_cents / 100).toFixed(2)}
                      </p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setPayoutOpen(false)}>
                        Annulla
                      </Button>
                      <Button onClick={handlePayout} disabled={payoutProcessing}>
                        {payoutProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Richiedi Prelievo
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {userRole === "business" && (
                <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default">
                      <ArrowDownCircle className="h-4 w-4 mr-2" />
                      Ricarica Wallet
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ricarica Wallet</DialogTitle>
                      <DialogDescription>
                        {clientSecret ? "Completa il pagamento con carta" : "Importo minimo: €0.50. Scegli il metodo di pagamento preferito."}
                      </DialogDescription>
                    </DialogHeader>
                    {!clientSecret ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Importo (€)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.50"
                            value={topupAmount}
                            onChange={(e) => setTopupAmount(e.target.value)}
                            placeholder="10.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Metodo di Pagamento</Label>
                          <Select value={topupMethod} onValueChange={(v) => setTopupMethod(v as "card" | "bank_transfer")}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="card">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4" />
                                  Carta di Credito/Debito
                                </div>
                              </SelectItem>
                              <SelectItem value="bank_transfer">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4" />
                                  Bonifico Bancario
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setTopupOpen(false)}>
                            Annulla
                          </Button>
                          <Button onClick={handleTopup} disabled={topupProcessing}>
                            {topupProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {topupMethod === "card" ? "Procedi al Pagamento" : "Conferma"}
                          </Button>
                        </DialogFooter>
                      </div>
                    ) : (
                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret,
                          appearance: {
                            theme: 'stripe',
                          },
                        }}
                      >
                        <StripePaymentForm
                          onSuccess={handlePaymentSuccess}
                          onCancel={handlePaymentCancel}
                        />
                      </Elements>
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>

        {import.meta.env.DEV && (
          <DevStripeWebhookTester />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Transazioni Recenti</CardTitle>
            <CardDescription>
              Storico delle tue transazioni
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {new Date(tx.created_at).toLocaleString("it-IT")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(tx.type, tx.direction)}
                        {getTransactionLabel(tx.type)}
                      </div>
                    </TableCell>
                    <TableCell className={tx.direction === "in" ? "text-green-600" : "text-red-600"}>
                      {tx.direction === "in" ? "+" : "-"}€{(tx.amount_cents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tx.status === "completed" ? "default" : tx.status === "pending" ? "secondary" : "destructive"}>
                        {tx.status === "completed" ? "Completato" : tx.status === "pending" ? "In Attesa" : "Fallito"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nessuna transazione trovata
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Wallet;