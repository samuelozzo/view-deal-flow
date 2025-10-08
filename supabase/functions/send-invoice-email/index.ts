import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { wallet_id, amount_cents, transaction_date } = await req.json();

    if (!wallet_id || !amount_cents) {
      throw new Error('Missing required parameters: wallet_id, amount_cents');
    }

    // Get wallet info
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('user_id')
      .eq('id', wallet_id)
      .single();

    if (walletError || !walletData) {
      throw new Error('Failed to fetch wallet data');
    }

    // Get user profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', walletData.user_id)
      .single();

    // Get user email from auth.users
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(
      walletData.user_id
    );

    if (userError || !user?.email) {
      throw new Error('Failed to fetch user email');
    }

    const amountEuro = (amount_cents / 100).toFixed(2);
    const invoiceDate = transaction_date 
      ? new Date(transaction_date).toLocaleDateString('it-IT') 
      : new Date().toLocaleDateString('it-IT');
    const displayName = profileData?.display_name || user.email;

    // Send invoice email
    const { error: emailError } = await resend.emails.send({
      from: 'Fattura <onboarding@resend.dev>',
      to: [user.email],
      subject: `Fattura Ricarica Wallet - €${amountEuro}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
              .content { background-color: #f9fafb; padding: 30px; margin-top: 20px; border-radius: 8px; }
              .invoice-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .total { font-size: 1.2em; font-weight: bold; color: #4F46E5; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.9em; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Fattura Ricarica Wallet</h1>
              </div>
              <div class="content">
                <p>Gentile <strong>${displayName}</strong>,</p>
                <p>Ti confermiamo l'avvenuta ricarica del tuo wallet. Di seguito i dettagli della transazione:</p>
                
                <div class="invoice-details">
                  <div class="row">
                    <span>Data:</span>
                    <span>${invoiceDate}</span>
                  </div>
                  <div class="row">
                    <span>Descrizione:</span>
                    <span>Ricarica Wallet</span>
                  </div>
                  <div class="row">
                    <span>Metodo di Pagamento:</span>
                    <span>Carta di Credito</span>
                  </div>
                  <div class="row total">
                    <span>Importo Totale:</span>
                    <span>€${amountEuro}</span>
                  </div>
                </div>

                <p>L'importo è stato accreditato sul tuo wallet e puoi utilizzarlo per le tue collaborazioni.</p>
                <p>Per visualizzare il tuo saldo e le transazioni, visita la sezione Wallet del tuo account.</p>
              </div>
              <div class="footer">
                <p>Questa è una email automatica, per favore non rispondere.</p>
                <p>Per assistenza, contatta il nostro supporto.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (emailError) {
      throw emailError;
    }

    console.log(`Invoice email sent to ${user.email} for €${amountEuro}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Invoice email sent' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in send-invoice-email function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
