import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SupportEmailRequest {
  offer_id: string;
  offer_title: string;
  message: string;
  user_email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { offer_id, offer_title, message, user_email }: SupportEmailRequest = await req.json();

    console.log("Sending support email for offer:", offer_id);

    // Send email to support team
    const emailResponse = await resend.emails.send({
      from: "Support <onboarding@resend.dev>",
      to: ["support@yourdomain.com"], // Replace with actual support email
      subject: `Richiesta Assistenza - Offerta: ${offer_title}`,
      html: `
        <h2>Nuova Richiesta di Assistenza</h2>
        <p><strong>Utente:</strong> ${user_email}</p>
        <p><strong>Offerta ID:</strong> ${offer_id}</p>
        <p><strong>Titolo Offerta:</strong> ${offer_title}</p>
        <hr>
        <h3>Messaggio:</h3>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    console.log("Support email sent successfully:", emailResponse);

    // Send confirmation email to user
    await resend.emails.send({
      from: "Support <onboarding@resend.dev>",
      to: [user_email],
      subject: "Richiesta di assistenza ricevuta",
      html: `
        <h2>Richiesta Ricevuta</h2>
        <p>Ciao,</p>
        <p>Abbiamo ricevuto la tua richiesta di assistenza relativa all'offerta "<strong>${offer_title}</strong>".</p>
        <p>Il nostro team ti risponderà il prima possibile.</p>
        <hr>
        <p><strong>Il tuo messaggio:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <br>
        <p>Cordiali saluti,<br>Il Team di Assistenza</p>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-support-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
