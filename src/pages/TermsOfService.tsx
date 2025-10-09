import Navbar from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";

const TermsOfService = () => {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Terms of Service",
      lastUpdated: "Last updated: January 2025",
      intro: "Welcome to WeasyDeal. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.",
      sections: [
        {
          title: "1. Acceptance of Terms",
          content: "By creating an account and using WeasyDeal, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, you may not use our services."
        },
        {
          title: "2. Eligibility",
          content: "To use WeasyDeal, you must:\n\n• Be at least 18 years old\n• Have the legal capacity to enter into binding contracts\n• Not be prohibited from using our services under EU or applicable local laws\n• Provide accurate and complete registration information\n\nBy using our platform, you represent and warrant that you meet these requirements."
        },
        {
          title: "3. Account Types and Responsibilities",
          content: "**Creator Accounts**\n\n• Creators must provide accurate portfolio and audience information\n• Creators are responsible for delivering content as agreed\n• Creators must submit truthful proof of views\n• Earnings are based on verified view counts\n\n**Business Accounts**\n\n• Businesses must provide accurate offer information\n• Businesses must fund escrow for approved collaborations\n• Businesses have 14 days to verify submitted proofs\n• Payment decisions must be made within the verification period"
        },
        {
          title: "4. Escrow System",
          content: "**How It Works**\n\n1. Business creates an offer with required views and total reward\n2. Business approves creator applications\n3. Funds are held in secure escrow via Stripe\n4. Creator posts content and submits proof after 14 days\n5. Business verifies and approves/rejects within verification period\n6. Payment is released based on achieved views (proportional up to 100%)\n\n**Escrow Rules**\n\n• Funds are held securely until verification is complete\n• Creators earn proportionally based on achieved views (e.g., 50% views = 50% reward)\n• Maximum payout is 100% of total reward, even if views exceed target\n• Disputes are handled according to our dispute resolution process"
        },
        {
          title: "5. Fees and Payments",
          content: "**Platform Fees**\n\n• WeasyDeal charges a service fee on transactions (details visible during transaction)\n• Payment processing fees apply (handled by Stripe)\n• All fees are clearly disclosed before transaction completion\n\n**Payment Terms**\n\n• Payments are processed via Stripe\n• Payouts occur after successful verification\n• Minimum payout thresholds may apply\n• Tax obligations are the user's responsibility"
        },
        {
          title: "6. Content Guidelines",
          content: "Users agree NOT to create or promote content that:\n\n• Violates laws or regulations\n• Infringes intellectual property rights\n• Contains hate speech, harassment, or discrimination\n• Promotes violence or illegal activities\n• Contains explicit adult content (unless clearly marked and compliant)\n• Spreads misinformation or fraud\n• Violates platform terms of TikTok, Instagram, or YouTube\n\nWeasyDeal reserves the right to remove content and suspend accounts that violate these guidelines."
        },
        {
          title: "7. Verification and Proof",
          content: "**Creator Obligations**\n\n• Submit accurate proof of views (screenshot + URL)\n• Proof must be submitted 14 days after content posting\n• Screenshots must clearly show view count and date\n• Content must remain publicly accessible during verification\n\n**Business Obligations**\n\n• Review submitted proofs within verification period\n• Approve or reject proofs with valid reasoning\n• Respond to creator submissions in a timely manner"
        },
        {
          title: "8. Cancellations and Refunds",
          content: "**Before Creator Approval**\n\n• Businesses can cancel offers and receive full refund\n\n**After Creator Approval**\n\n• Cancellations require mutual agreement or valid dispute\n• Escrow funds are released according to cancellation terms\n• Partial payments may apply for partially completed work\n\n**Refund Policy**\n\n• Verified under-performance results in proportional payment\n• Fraudulent activity results in full refund and account suspension\n• Disputes are resolved according to our dispute resolution process"
        },
        {
          title: "9. Intellectual Property",
          content: "**Platform Ownership**\n\n• WeasyDeal owns all rights to the platform, logo, and branding\n• Users may not copy, modify, or distribute our platform code or design\n\n**User Content**\n\n• Creators retain ownership of their content\n• By using our platform, you grant us a license to display and promote your content within the platform\n• Businesses obtain usage rights as specified in individual collaboration agreements"
        },
        {
          title: "10. Limitation of Liability",
          content: "To the maximum extent permitted by law:\n\n• WeasyDeal is not liable for indirect, incidental, or consequential damages\n• Our total liability is limited to fees paid in the past 12 months\n• We do not guarantee specific results or earnings\n• We are not responsible for user conduct or content\n• We do not guarantee platform availability or bug-free operation\n\nThis does not affect your statutory rights as a consumer under EU law."
        },
        {
          title: "11. Dispute Resolution",
          content: "**Internal Process**\n\n1. Users must first attempt to resolve disputes directly\n2. If unresolved, submit a dispute ticket to support@weasydeal.eu\n3. We will mediate and make a binding decision based on evidence\n\n**Legal Disputes**\n\n• Governed by the laws of [EU Country where registered]\n• EU Online Dispute Resolution platform available\n• Mandatory arbitration does not apply to EU consumers"
        },
        {
          title: "12. Account Suspension and Termination",
          content: "We may suspend or terminate accounts for:\n\n• Violation of these Terms\n• Fraudulent activity or misrepresentation\n• Abusive behavior toward other users\n• Non-payment or payment disputes\n• Legal requirements\n\n**User-Initiated Termination**\n\n• Users may close accounts at any time\n• Outstanding transactions must be completed first\n• Data retention follows our Privacy Policy"
        },
        {
          title: "13. Changes to Terms",
          content: "We may update these Terms from time to time. Significant changes will be communicated via:\n\n• Email notification\n• Platform announcement\n• 30-day notice period for material changes\n\nContinued use after changes constitutes acceptance."
        },
        {
          title: "14. Governing Law",
          content: "These Terms are governed by the laws of the European Union and [specific EU country]. Any disputes shall be subject to the exclusive jurisdiction of the courts in [location].\n\nEU consumers retain rights under local consumer protection laws."
        },
        {
          title: "15. Contact Information",
          content: "For questions about these Terms:\n\nEmail: legal@weasydeal.eu\nSupport: support@weasydeal.eu\n\nWeasyDeal\n[Legal Address]\nVAT: [VAT Number]"
        }
      ]
    },
    it: {
      title: "Termini di Servizio",
      lastUpdated: "Ultimo aggiornamento: Gennaio 2025",
      intro: "Benvenuto su WeasyDeal. Accedendo o utilizzando la nostra piattaforma, accetti di essere vincolato da questi Termini di Servizio. Leggili attentamente.",
      sections: [
        {
          title: "1. Accettazione dei Termini",
          content: "Creando un account e utilizzando WeasyDeal, riconosci di aver letto, compreso e accettato di essere vincolato da questi Termini di Servizio e dalla nostra Informativa sulla Privacy. Se non accetti, non puoi utilizzare i nostri servizi."
        },
        {
          title: "2. Requisiti",
          content: "Per utilizzare WeasyDeal, devi:\n\n• Avere almeno 18 anni\n• Avere la capacità legale di stipulare contratti vincolanti\n• Non essere proibito dall'utilizzo dei nostri servizi secondo le leggi UE o locali applicabili\n• Fornire informazioni di registrazione accurate e complete\n\nUtilizzando la piattaforma, dichiari e garantisci di soddisfare questi requisiti."
        },
        {
          title: "3. Tipi di Account e Responsabilità",
          content: "**Account Creator**\n\n• I creator devono fornire informazioni accurate su portfolio e audience\n• I creator sono responsabili della consegna dei contenuti come concordato\n• I creator devono inviare prove veritiere delle visualizzazioni\n• I guadagni si basano sui conteggi di visualizzazioni verificati\n\n**Account Business**\n\n• Le aziende devono fornire informazioni accurate sulle offerte\n• Le aziende devono finanziare l'escrow per le collaborazioni approvate\n• Le aziende hanno 14 giorni per verificare le prove inviate\n• Le decisioni di pagamento devono essere prese entro il periodo di verifica"
        },
        {
          title: "4. Sistema Escrow",
          content: "**Come Funziona**\n\n1. L'azienda crea un'offerta con visualizzazioni richieste e ricompensa totale\n2. L'azienda approva le candidature dei creator\n3. I fondi vengono trattenuti in escrow sicuro tramite Stripe\n4. Il creator pubblica il contenuto e invia la prova dopo 14 giorni\n5. L'azienda verifica e approva/rifiuta entro il periodo di verifica\n6. Il pagamento viene rilasciato in base alle visualizzazioni raggiunte (proporzionale fino al 100%)\n\n**Regole Escrow**\n\n• I fondi sono trattenuti in sicurezza fino al completamento della verifica\n• I creator guadagnano proporzionalmente in base alle visualizzazioni raggiunte (es. 50% views = 50% ricompensa)\n• Il pagamento massimo è il 100% della ricompensa totale, anche se le visualizzazioni superano l'obiettivo\n• Le dispute vengono gestite secondo il nostro processo di risoluzione dispute"
        },
        {
          title: "5. Commissioni e Pagamenti",
          content: "**Commissioni Piattaforma**\n\n• WeasyDeal applica una commissione di servizio sulle transazioni (dettagli visibili durante la transazione)\n• Si applicano commissioni di elaborazione pagamenti (gestite da Stripe)\n• Tutte le commissioni sono chiaramente divulgate prima del completamento della transazione\n\n**Termini di Pagamento**\n\n• I pagamenti vengono elaborati tramite Stripe\n• I prelievi avvengono dopo verifica riuscita\n• Possono applicarsi soglie minime di prelievo\n• Gli obblighi fiscali sono responsabilità dell'utente"
        },
        {
          title: "6. Linee Guida Contenuti",
          content: "Gli utenti accettano di NON creare o promuovere contenuti che:\n\n• Violano leggi o regolamenti\n• Violano diritti di proprietà intellettuale\n• Contengono incitamento all'odio, molestie o discriminazione\n• Promuovono violenza o attività illegali\n• Contengono contenuti espliciti per adulti (a meno che chiaramente contrassegnati e conformi)\n• Diffondono disinformazione o frode\n• Violano i termini della piattaforma di TikTok, Instagram o YouTube\n\nWeasyDeal si riserva il diritto di rimuovere contenuti e sospendere account che violano queste linee guida."
        },
        {
          title: "7. Verifica e Prova",
          content: "**Obblighi Creator**\n\n• Inviare prove accurate delle visualizzazioni (screenshot + URL)\n• La prova deve essere inviata 14 giorni dopo la pubblicazione del contenuto\n• Gli screenshot devono mostrare chiaramente il conteggio visualizzazioni e la data\n• Il contenuto deve rimanere accessibile pubblicamente durante la verifica\n\n**Obblighi Business**\n\n• Rivedere le prove inviate entro il periodo di verifica\n• Approvare o rifiutare le prove con ragionamento valido\n• Rispondere alle submission dei creator in modo tempestivo"
        },
        {
          title: "8. Cancellazioni e Rimborsi",
          content: "**Prima dell'Approvazione Creator**\n\n• Le aziende possono cancellare le offerte e ricevere un rimborso completo\n\n**Dopo l'Approvazione Creator**\n\n• Le cancellazioni richiedono accordo reciproco o disputa valida\n• I fondi escrow vengono rilasciati secondo i termini di cancellazione\n• Possono applicarsi pagamenti parziali per lavoro parzialmente completato\n\n**Politica Rimborsi**\n\n• Le prestazioni insufficienti verificate risultano in pagamento proporzionale\n• L'attività fraudolenta risulta in rimborso completo e sospensione account\n• Le dispute vengono risolte secondo il nostro processo di risoluzione dispute"
        },
        {
          title: "9. Proprietà Intellettuale",
          content: "**Proprietà Piattaforma**\n\n• WeasyDeal possiede tutti i diritti sulla piattaforma, logo e branding\n• Gli utenti non possono copiare, modificare o distribuire il codice o il design della piattaforma\n\n**Contenuto Utente**\n\n• I creator mantengono la proprietà dei loro contenuti\n• Utilizzando la piattaforma, ci concedi una licenza per visualizzare e promuovere il tuo contenuto all'interno della piattaforma\n• Le aziende ottengono diritti d'uso come specificato negli accordi di collaborazione individuali"
        },
        {
          title: "10. Limitazione di Responsabilità",
          content: "Nella massima misura consentita dalla legge:\n\n• WeasyDeal non è responsabile per danni indiretti, incidentali o consequenziali\n• La nostra responsabilità totale è limitata alle commissioni pagate negli ultimi 12 mesi\n• Non garantiamo risultati o guadagni specifici\n• Non siamo responsabili per la condotta o i contenuti degli utenti\n• Non garantiamo la disponibilità della piattaforma o il funzionamento senza bug\n\nQuesto non pregiudica i tuoi diritti statutari come consumatore secondo la legge UE."
        },
        {
          title: "11. Risoluzione Dispute",
          content: "**Processo Interno**\n\n1. Gli utenti devono prima tentare di risolvere le dispute direttamente\n2. Se non risolto, invia un ticket di disputa a support@weasydeal.eu\n3. Medieremo e prenderemo una decisione vincolante basata sulle prove\n\n**Dispute Legali**\n\n• Regolate dalle leggi di [Paese UE dove registrato]\n• Piattaforma di risoluzione dispute online UE disponibile\n• L'arbitrato obbligatorio non si applica ai consumatori UE"
        },
        {
          title: "12. Sospensione e Chiusura Account",
          content: "Possiamo sospendere o chiudere account per:\n\n• Violazione di questi Termini\n• Attività fraudolenta o false dichiarazioni\n• Comportamento abusivo verso altri utenti\n• Mancato pagamento o dispute di pagamento\n• Requisiti legali\n\n**Chiusura Avviata dall'Utente**\n\n• Gli utenti possono chiudere gli account in qualsiasi momento\n• Le transazioni in sospeso devono essere completate prima\n• La conservazione dei dati segue la nostra Informativa sulla Privacy"
        },
        {
          title: "13. Modifiche ai Termini",
          content: "Potremmo aggiornare questi Termini periodicamente. Le modifiche significative saranno comunicate tramite:\n\n• Notifica email\n• Annuncio sulla piattaforma\n• Periodo di preavviso di 30 giorni per modifiche materiali\n\nL'uso continuato dopo le modifiche costituisce accettazione."
        },
        {
          title: "14. Legge Applicabile",
          content: "Questi Termini sono regolati dalle leggi dell'Unione Europea e [paese UE specifico]. Eventuali dispute saranno soggette alla giurisdizione esclusiva dei tribunali di [località].\n\nI consumatori UE mantengono i diritti secondo le leggi locali di protezione dei consumatori."
        },
        {
          title: "15. Informazioni di Contatto",
          content: "Per domande su questi Termini:\n\nEmail: legal@weasydeal.eu\nSupporto: support@weasydeal.eu\n\nWeasyDeal\n[Indirizzo Legale]\nP.IVA: [Numero P.IVA]"
        }
      ]
    },
    es: {
      title: "Términos de Servicio",
      lastUpdated: "Última actualización: Enero 2025",
      intro: "Bienvenido a WeasyDeal. Al acceder o usar nuestra plataforma, aceptas estar vinculado por estos Términos de Servicio. Léelos cuidadosamente.",
      sections: [
        {
          title: "1. Aceptación de Términos",
          content: "Al crear una cuenta y usar WeasyDeal, reconoces que has leído, entendido y aceptas estar vinculado por estos Términos de Servicio y nuestra Política de Privacidad. Si no aceptas, no puedes usar nuestros servicios."
        },
        {
          title: "2. Elegibilidad",
          content: "Para usar WeasyDeal, debes:\n\n• Tener al menos 18 años\n• Tener capacidad legal para celebrar contratos vinculantes\n• No estar prohibido de usar nuestros servicios según leyes UE o locales aplicables\n• Proporcionar información de registro precisa y completa\n\nAl usar la plataforma, declaras y garantizas que cumples estos requisitos."
        },
        {
          title: "3. Tipos de Cuenta y Responsabilidades",
          content: "**Cuentas Creator**\n\n• Los creators deben proporcionar información precisa de portfolio y audiencia\n• Los creators son responsables de entregar contenido según lo acordado\n• Los creators deben enviar pruebas veraces de vistas\n• Las ganancias se basan en conteos de vistas verificados\n\n**Cuentas Business**\n\n• Los negocios deben proporcionar información precisa de ofertas\n• Los negocios deben financiar escrow para colaboraciones aprobadas\n• Los negocios tienen 14 días para verificar pruebas enviadas\n• Las decisiones de pago deben tomarse dentro del período de verificación"
        },
        {
          title: "4. Sistema Escrow",
          content: "**Cómo Funciona**\n\n1. El negocio crea oferta con vistas requeridas y recompensa total\n2. El negocio aprueba solicitudes de creators\n3. Los fondos se retienen en escrow seguro vía Stripe\n4. El creator publica contenido y envía prueba después de 14 días\n5. El negocio verifica y aprueba/rechaza dentro del período de verificación\n6. El pago se libera según vistas logradas (proporcional hasta 100%)\n\n**Reglas Escrow**\n\n• Los fondos se retienen seguros hasta completar verificación\n• Los creators ganan proporcionalmente según vistas logradas (ej. 50% vistas = 50% recompensa)\n• El pago máximo es 100% de recompensa total, incluso si vistas exceden objetivo\n• Las disputas se manejan según nuestro proceso de resolución disputas"
        },
        {
          title: "5. Tarifas y Pagos",
          content: "**Tarifas Plataforma**\n\n• WeasyDeal cobra tarifa de servicio en transacciones (detalles visibles durante transacción)\n• Aplican tarifas de procesamiento de pagos (manejadas por Stripe)\n• Todas las tarifas se divulgan claramente antes de completar transacción\n\n**Términos de Pago**\n\n• Los pagos se procesan vía Stripe\n• Los retiros ocurren después de verificación exitosa\n• Pueden aplicar umbrales mínimos de retiro\n• Las obligaciones fiscales son responsabilidad del usuario"
        },
        {
          title: "6. Directrices de Contenido",
          content: "Los usuarios aceptan NO crear o promover contenido que:\n\n• Viole leyes o regulaciones\n• Infrinja derechos de propiedad intelectual\n• Contenga discurso de odio, acoso o discriminación\n• Promueva violencia o actividades ilegales\n• Contenga contenido explícito para adultos (a menos que esté claramente marcado y conforme)\n• Difunda desinformación o fraude\n• Viole términos de plataforma de TikTok, Instagram o YouTube\n\nWeasyDeal se reserva el derecho de eliminar contenido y suspender cuentas que violen estas directrices."
        },
        {
          title: "7. Verificación y Prueba",
          content: "**Obligaciones Creator**\n\n• Enviar prueba precisa de vistas (captura + URL)\n• La prueba debe enviarse 14 días después de publicar contenido\n• Las capturas deben mostrar claramente conteo de vistas y fecha\n• El contenido debe permanecer accesible públicamente durante verificación\n\n**Obligaciones Business**\n\n• Revisar pruebas enviadas dentro del período de verificación\n• Aprobar o rechazar pruebas con razonamiento válido\n• Responder a envíos de creators oportunamente"
        },
        {
          title: "8. Cancelaciones y Reembolsos",
          content: "**Antes de Aprobación Creator**\n\n• Los negocios pueden cancelar ofertas y recibir reembolso completo\n\n**Después de Aprobación Creator**\n\n• Las cancelaciones requieren acuerdo mutuo o disputa válida\n• Los fondos escrow se liberan según términos de cancelación\n• Pueden aplicar pagos parciales por trabajo parcialmente completado\n\n**Política Reembolsos**\n\n• El bajo rendimiento verificado resulta en pago proporcional\n• La actividad fraudulenta resulta en reembolso completo y suspensión cuenta\n• Las disputas se resuelven según nuestro proceso de resolución disputas"
        },
        {
          title: "9. Propiedad Intelectual",
          content: "**Propiedad Plataforma**\n\n• WeasyDeal posee todos los derechos sobre plataforma, logo y marca\n• Los usuarios no pueden copiar, modificar o distribuir nuestro código o diseño de plataforma\n\n**Contenido Usuario**\n\n• Los creators retienen propiedad de su contenido\n• Al usar la plataforma, nos otorgas licencia para mostrar y promover tu contenido dentro de la plataforma\n• Los negocios obtienen derechos de uso según se especifica en acuerdos de colaboración individuales"
        },
        {
          title: "10. Limitación de Responsabilidad",
          content: "En la máxima medida permitida por ley:\n\n• WeasyDeal no es responsable de daños indirectos, incidentales o consecuentes\n• Nuestra responsabilidad total se limita a tarifas pagadas en los últimos 12 meses\n• No garantizamos resultados o ganancias específicas\n• No somos responsables de conducta o contenido de usuarios\n• No garantizamos disponibilidad de plataforma u operación sin errores\n\nEsto no afecta tus derechos estatutarios como consumidor según ley UE."
        },
        {
          title: "11. Resolución de Disputas",
          content: "**Proceso Interno**\n\n1. Los usuarios deben primero intentar resolver disputas directamente\n2. Si no se resuelve, envía ticket de disputa a support@weasydeal.eu\n3. Mediaremos y tomaremos decisión vinculante basada en evidencia\n\n**Disputas Legales**\n\n• Regidas por leyes de [País UE donde registrado]\n• Plataforma de resolución de disputas en línea UE disponible\n• El arbitraje obligatorio no aplica a consumidores UE"
        },
        {
          title: "12. Suspensión y Terminación de Cuenta",
          content: "Podemos suspender o terminar cuentas por:\n\n• Violación de estos Términos\n• Actividad fraudulenta o tergiversación\n• Comportamiento abusivo hacia otros usuarios\n• Falta de pago o disputas de pago\n• Requisitos legales\n\n**Terminación Iniciada por Usuario**\n\n• Los usuarios pueden cerrar cuentas en cualquier momento\n• Las transacciones pendientes deben completarse primero\n• La retención de datos sigue nuestra Política de Privacidad"
        },
        {
          title: "13. Cambios a los Términos",
          content: "Podemos actualizar estos Términos periódicamente. Los cambios significativos se comunicarán mediante:\n\n• Notificación por email\n• Anuncio en plataforma\n• Período de aviso de 30 días para cambios materiales\n\nEl uso continuado después de cambios constituye aceptación."
        },
        {
          title: "14. Ley Aplicable",
          content: "Estos Términos se rigen por las leyes de la Unión Europea y [país UE específico]. Cualquier disputa estará sujeta a jurisdicción exclusiva de tribunales en [ubicación].\n\nLos consumidores UE retienen derechos según leyes locales de protección al consumidor."
        },
        {
          title: "15. Información de Contacto",
          content: "Para preguntas sobre estos Términos:\n\nEmail: legal@weasydeal.eu\nSoporte: support@weasydeal.eu\n\nWeasyDeal\n[Dirección Legal]\nVAT: [Número VAT]"
        }
      ]
    }
  };

  const currentContent = content[language as keyof typeof content] || content.en;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">{currentContent.title}</h1>
        <p className="text-sm text-muted-foreground mb-6">{currentContent.lastUpdated}</p>
        
        <p className="text-muted-foreground mb-8 leading-relaxed">
          {currentContent.intro}
        </p>

        <div className="space-y-8">
          {currentContent.sections.map((section, index) => (
            <div key={index} className="space-y-3">
              <h2 className="text-2xl font-semibold text-primary">{section.title}</h2>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-secondary/30 rounded-lg border border-border">
          <p className="text-sm font-semibold mb-2">
            {language === 'it' 
              ? "Accettazione"
              : language === 'es'
              ? "Aceptación"
              : "Acceptance"}
          </p>
          <p className="text-sm text-muted-foreground">
            {language === 'it' 
              ? "Utilizzando WeasyDeal, accetti questi Termini di Servizio nella loro interezza."
              : language === 'es'
              ? "Al usar WeasyDeal, aceptas estos Términos de Servicio en su totalidad."
              : "By using WeasyDeal, you accept these Terms of Service in their entirety."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
