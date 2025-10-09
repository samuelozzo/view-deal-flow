import Navbar from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";

const PrivacyPolicy = () => {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: January 2025",
      sections: [
        {
          title: "1. Introduction",
          content: "WeasyDeal ('we', 'us', 'our') respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and protect your information when you use our platform."
        },
        {
          title: "2. Data We Collect",
          content: "We collect the following types of personal data:\n\n• Account Information: Email, display name, account type (creator/business)\n• Profile Data: Portfolio, audience demographics, engagement rates (for creators)\n• Transaction Data: Payment information, wallet balance, transaction history\n• Content Data: Submitted content URLs, screenshots, view counts\n• Communication Data: Messages between users, support tickets\n• Usage Data: IP address, browser type, device information, cookies"
        },
        {
          title: "3. Legal Basis for Processing",
          content: "We process your data based on:\n\n• Contract Performance: To provide our marketplace services\n• Legitimate Interest: Platform security, fraud prevention, service improvement\n• Legal Obligation: Compliance with EU regulations, tax laws\n• Consent: Marketing communications (where applicable)"
        },
        {
          title: "4. How We Use Your Data",
          content: "Your data is used to:\n\n• Provide and maintain our services\n• Process payments and escrow transactions\n• Verify view counts and content performance\n• Facilitate communication between creators and businesses\n• Prevent fraud and ensure platform security\n• Comply with legal obligations\n• Improve our services (with anonymized data)"
        },
        {
          title: "5. Data Sharing",
          content: "We share your data with:\n\n• Stripe: For payment processing (covered by their privacy policy)\n• Supabase: For data hosting (EU servers, GDPR compliant)\n• Other Platform Users: Profile information visible to matched users\n• Legal Authorities: When required by law\n\nWe do NOT sell your personal data to third parties."
        },
        {
          title: "6. Data Retention",
          content: "We retain your data:\n\n• Account Data: Until account deletion\n• Transaction Records: 10 years (legal requirement for accounting)\n• Marketing Data: Until you withdraw consent\n• Deleted Accounts: 30-day grace period, then permanent deletion"
        },
        {
          title: "7. Your Rights (GDPR)",
          content: "Under GDPR, you have the right to:\n\n• Access: Request a copy of your personal data\n• Rectification: Correct inaccurate data\n• Erasure: Request deletion of your data ('right to be forgotten')\n• Portability: Receive your data in a machine-readable format\n• Restriction: Limit how we use your data\n• Objection: Object to data processing\n• Withdraw Consent: For marketing communications\n\nTo exercise these rights, contact: privacy@weasydeal.eu"
        },
        {
          title: "8. Data Security",
          content: "We implement industry-standard security measures:\n\n• SSL/TLS encryption for data transmission\n• Encrypted database storage\n• Regular security audits\n• Access controls and authentication\n• Secure escrow payment system via Stripe"
        },
        {
          title: "9. International Data Transfers",
          content: "Your data is primarily stored within the EU. Any transfers outside the EU are protected by:\n\n• Standard Contractual Clauses (SCCs)\n• Adequacy decisions by the European Commission\n• Appropriate safeguards as required by GDPR"
        },
        {
          title: "10. Cookies",
          content: "We use cookies for:\n\n• Essential: Authentication, security\n• Functional: Language preferences, user settings\n• Analytics: Usage statistics (anonymized)\n\nSee our Cookie Policy for detailed information."
        },
        {
          title: "11. Children's Privacy",
          content: "Our service is not intended for users under 18. We do not knowingly collect data from minors. If you believe we have collected data from a minor, contact us immediately."
        },
        {
          title: "12. Changes to This Policy",
          content: "We may update this policy. Significant changes will be communicated via email or platform notification. Continued use after changes constitutes acceptance."
        },
        {
          title: "13. Contact & Data Protection Officer",
          content: "For privacy questions or to exercise your rights:\n\nEmail: privacy@weasydeal.eu\nDPO: dpo@weasydeal.eu\n\nSupervisory Authority: You may lodge a complaint with your national data protection authority."
        }
      ]
    },
    it: {
      title: "Informativa sulla Privacy",
      lastUpdated: "Ultimo aggiornamento: Gennaio 2025",
      sections: [
        {
          title: "1. Introduzione",
          content: "WeasyDeal ('noi', 'nostro') rispetta la tua privacy e si impegna a proteggere i tuoi dati personali. Questa informativa spiega come raccogliamo, utilizziamo e proteggiamo le tue informazioni quando utilizzi la nostra piattaforma."
        },
        {
          title: "2. Dati che Raccogliamo",
          content: "Raccogliamo i seguenti tipi di dati personali:\n\n• Informazioni Account: Email, nome visualizzato, tipo account (creator/business)\n• Dati Profilo: Portfolio, dati demografici audience, tassi di coinvolgimento (per creator)\n• Dati Transazioni: Informazioni pagamento, saldo wallet, storico transazioni\n• Dati Contenuti: URL contenuti inviati, screenshot, conteggi visualizzazioni\n• Dati Comunicazione: Messaggi tra utenti, ticket supporto\n• Dati Utilizzo: Indirizzo IP, tipo browser, informazioni dispositivo, cookie"
        },
        {
          title: "3. Base Giuridica del Trattamento",
          content: "Trattiamo i tuoi dati in base a:\n\n• Esecuzione Contratto: Per fornire i nostri servizi marketplace\n• Interesse Legittimo: Sicurezza piattaforma, prevenzione frodi, miglioramento servizio\n• Obbligo Legale: Conformità normative UE, leggi fiscali\n• Consenso: Comunicazioni marketing (ove applicabile)"
        },
        {
          title: "4. Come Utilizziamo i Tuoi Dati",
          content: "I tuoi dati sono utilizzati per:\n\n• Fornire e mantenere i nostri servizi\n• Processare pagamenti e transazioni escrow\n• Verificare conteggi visualizzazioni e performance contenuti\n• Facilitare comunicazione tra creator e business\n• Prevenire frodi e garantire sicurezza piattaforma\n• Rispettare obblighi legali\n• Migliorare i nostri servizi (con dati anonimizzati)"
        },
        {
          title: "5. Condivisione Dati",
          content: "Condividiamo i tuoi dati con:\n\n• Stripe: Per elaborazione pagamenti (coperto dalla loro privacy policy)\n• Supabase: Per hosting dati (server EU, conforme GDPR)\n• Altri Utenti Piattaforma: Informazioni profilo visibili agli utenti abbinati\n• Autorità Legali: Quando richiesto dalla legge\n\nNON vendiamo i tuoi dati personali a terze parti."
        },
        {
          title: "6. Conservazione Dati",
          content: "Conserviamo i tuoi dati:\n\n• Dati Account: Fino alla cancellazione account\n• Registri Transazioni: 10 anni (requisito legale contabilità)\n• Dati Marketing: Fino a revoca consenso\n• Account Cancellati: Periodo di grazia 30 giorni, poi cancellazione permanente"
        },
        {
          title: "7. I Tuoi Diritti (GDPR)",
          content: "Ai sensi del GDPR, hai diritto a:\n\n• Accesso: Richiedere copia dei tuoi dati personali\n• Rettifica: Correggere dati inesatti\n• Cancellazione: Richiedere eliminazione dati ('diritto all'oblio')\n• Portabilità: Ricevere dati in formato leggibile da macchina\n• Limitazione: Limitare come utilizziamo i tuoi dati\n• Opposizione: Opporsi al trattamento dati\n• Revoca Consenso: Per comunicazioni marketing\n\nPer esercitare questi diritti, contatta: privacy@weasydeal.eu"
        },
        {
          title: "8. Sicurezza Dati",
          content: "Implementiamo misure di sicurezza standard del settore:\n\n• Crittografia SSL/TLS per trasmissione dati\n• Archiviazione database crittografata\n• Audit sicurezza regolari\n• Controlli accesso e autenticazione\n• Sistema pagamento escrow sicuro via Stripe"
        },
        {
          title: "9. Trasferimenti Dati Internazionali",
          content: "I tuoi dati sono principalmente archiviati nell'UE. Eventuali trasferimenti fuori UE sono protetti da:\n\n• Clausole Contrattuali Standard (SCC)\n• Decisioni di adeguatezza della Commissione Europea\n• Garanzie appropriate come richiesto dal GDPR"
        },
        {
          title: "10. Cookie",
          content: "Utilizziamo cookie per:\n\n• Essenziali: Autenticazione, sicurezza\n• Funzionali: Preferenze lingua, impostazioni utente\n• Analitici: Statistiche utilizzo (anonimizzate)\n\nVedi la nostra Cookie Policy per informazioni dettagliate."
        },
        {
          title: "11. Privacy Minori",
          content: "Il nostro servizio non è destinato a utenti sotto i 18 anni. Non raccogliamo consapevolmente dati da minori. Se ritieni che abbiamo raccolto dati da un minore, contattaci immediatamente."
        },
        {
          title: "12. Modifiche a Questa Policy",
          content: "Potremmo aggiornare questa policy. Modifiche significative saranno comunicate via email o notifica piattaforma. L'uso continuato dopo le modifiche costituisce accettazione."
        },
        {
          title: "13. Contatti & Responsabile Protezione Dati",
          content: "Per domande sulla privacy o per esercitare i tuoi diritti:\n\nEmail: privacy@weasydeal.eu\nDPO: dpo@weasydeal.eu\n\nAutorità di Controllo: Puoi presentare reclamo all'autorità nazionale di protezione dati."
        }
      ]
    },
    es: {
      title: "Política de Privacidad",
      lastUpdated: "Última actualización: Enero 2025",
      sections: [
        {
          title: "1. Introducción",
          content: "WeasyDeal ('nosotros', 'nuestro') respeta tu privacidad y se compromete a proteger tus datos personales. Esta política de privacidad explica cómo recopilamos, usamos y protegemos tu información cuando usas nuestra plataforma."
        },
        {
          title: "2. Datos que Recopilamos",
          content: "Recopilamos los siguientes tipos de datos personales:\n\n• Información de Cuenta: Email, nombre mostrado, tipo cuenta (creator/business)\n• Datos de Perfil: Portfolio, demografía audiencia, tasas de engagement (para creators)\n• Datos de Transacciones: Información de pago, saldo wallet, historial transacciones\n• Datos de Contenido: URLs contenido enviado, capturas pantalla, conteos vistas\n• Datos de Comunicación: Mensajes entre usuarios, tickets soporte\n• Datos de Uso: Dirección IP, tipo navegador, información dispositivo, cookies"
        },
        {
          title: "3. Base Legal para el Tratamiento",
          content: "Procesamos tus datos basándonos en:\n\n• Ejecución de Contrato: Para proporcionar nuestros servicios marketplace\n• Interés Legítimo: Seguridad plataforma, prevención fraude, mejora servicio\n• Obligación Legal: Cumplimiento regulaciones UE, leyes fiscales\n• Consentimiento: Comunicaciones marketing (cuando aplique)"
        },
        {
          title: "4. Cómo Usamos tus Datos",
          content: "Tus datos se usan para:\n\n• Proporcionar y mantener nuestros servicios\n• Procesar pagos y transacciones escrow\n• Verificar conteos de vistas y rendimiento contenido\n• Facilitar comunicación entre creators y negocios\n• Prevenir fraude y garantizar seguridad plataforma\n• Cumplir obligaciones legales\n• Mejorar nuestros servicios (con datos anonimizados)"
        },
        {
          title: "5. Compartir Datos",
          content: "Compartimos tus datos con:\n\n• Stripe: Para procesamiento de pagos (cubierto por su política privacidad)\n• Supabase: Para alojamiento datos (servidores UE, conforme GDPR)\n• Otros Usuarios Plataforma: Información perfil visible a usuarios emparejados\n• Autoridades Legales: Cuando lo requiera la ley\n\nNO vendemos tus datos personales a terceros."
        },
        {
          title: "6. Retención de Datos",
          content: "Retenemos tus datos:\n\n• Datos Cuenta: Hasta eliminación cuenta\n• Registros Transacciones: 10 años (requisito legal contabilidad)\n• Datos Marketing: Hasta que retires consentimiento\n• Cuentas Eliminadas: Período gracia 30 días, luego eliminación permanente"
        },
        {
          title: "7. Tus Derechos (GDPR)",
          content: "Bajo GDPR, tienes derecho a:\n\n• Acceso: Solicitar copia de tus datos personales\n• Rectificación: Corregir datos inexactos\n• Supresión: Solicitar eliminación datos ('derecho al olvido')\n• Portabilidad: Recibir datos en formato legible por máquina\n• Restricción: Limitar cómo usamos tus datos\n• Oposición: Oponerte al procesamiento datos\n• Retirar Consentimiento: Para comunicaciones marketing\n\nPara ejercer estos derechos, contacta: privacy@weasydeal.eu"
        },
        {
          title: "8. Seguridad de Datos",
          content: "Implementamos medidas de seguridad estándar industria:\n\n• Cifrado SSL/TLS para transmisión datos\n• Almacenamiento base datos cifrada\n• Auditorías seguridad regulares\n• Controles acceso y autenticación\n• Sistema pago escrow seguro vía Stripe"
        },
        {
          title: "9. Transferencias Datos Internacionales",
          content: "Tus datos se almacenan principalmente en la UE. Cualquier transferencia fuera UE está protegida por:\n\n• Cláusulas Contractuales Estándar (SCC)\n• Decisiones adecuación Comisión Europea\n• Salvaguardas apropiadas según requiere GDPR"
        },
        {
          title: "10. Cookies",
          content: "Usamos cookies para:\n\n• Esenciales: Autenticación, seguridad\n• Funcionales: Preferencias idioma, configuración usuario\n• Analíticas: Estadísticas uso (anonimizadas)\n\nVer nuestra Política de Cookies para información detallada."
        },
        {
          title: "11. Privacidad Menores",
          content: "Nuestro servicio no está destinado a usuarios menores de 18 años. No recopilamos conscientemente datos de menores. Si crees que hemos recopilado datos de un menor, contáctanos inmediatamente."
        },
        {
          title: "12. Cambios a Esta Política",
          content: "Podemos actualizar esta política. Cambios significativos serán comunicados por email o notificación plataforma. El uso continuado después cambios constituye aceptación."
        },
        {
          title: "13. Contacto & Delegado Protección Datos",
          content: "Para preguntas privacidad o ejercer tus derechos:\n\nEmail: privacy@weasydeal.eu\nDPO: dpo@weasydeal.eu\n\nAutoridad Supervisora: Puedes presentar queja ante tu autoridad nacional protección datos."
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
        <p className="text-sm text-muted-foreground mb-8">{currentContent.lastUpdated}</p>
        
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
          <p className="text-sm text-muted-foreground">
            {language === 'it' 
              ? "Per domande o preoccupazioni sulla privacy, contatta privacy@weasydeal.eu"
              : language === 'es'
              ? "Para preguntas o inquietudes sobre privacidad, contacta privacy@weasydeal.eu"
              : "For privacy questions or concerns, contact privacy@weasydeal.eu"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
