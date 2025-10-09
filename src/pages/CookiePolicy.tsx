import Navbar from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";

const CookiePolicy = () => {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Cookie Policy",
      lastUpdated: "Last updated: January 2025",
      intro: "This Cookie Policy explains how WeasyDeal uses cookies and similar technologies to recognize you when you visit our platform. It explains what these technologies are and why we use them, as well as your rights to control our use of them.",
      sections: [
        {
          title: "What Are Cookies?",
          content: "Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.\n\nCookies can be 'persistent' (remain on your device) or 'session' (deleted when you close your browser)."
        },
        {
          title: "Types of Cookies We Use",
          content: "**1. Essential Cookies (Required)**\n\nThese cookies are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you, such as logging in or filling in forms.\n\n• Authentication cookies\n• Security cookies\n• Session management\n\n**2. Functional Cookies (Optional)**\n\nThese cookies enable enhanced functionality and personalization:\n\n• Language preferences\n• User interface settings\n• Remember me functionality\n\n**3. Analytics Cookies (Optional)**\n\nThese cookies help us understand how visitors interact with our platform:\n\n• Page views and navigation paths\n• Time spent on pages\n• Error messages encountered\n\nWe use anonymized data that cannot identify you personally."
        },
        {
          title: "Third-Party Cookies",
          content: "We use the following third-party services that may set cookies:\n\n• **Stripe**: For payment processing (essential)\n• **Supabase**: For authentication and data storage (essential)\n\nThese services have their own privacy policies governing cookie use."
        },
        {
          title: "Cookie Duration",
          content: "• **Session cookies**: Deleted when you close your browser\n• **Persistent cookies**: Remain for up to 12 months\n• **Authentication cookies**: Remain until you log out or 30 days of inactivity"
        },
        {
          title: "How to Control Cookies",
          content: "You can control and manage cookies in several ways:\n\n**1. Cookie Consent Banner**\nWhen you first visit our site, you can accept or reject optional cookies through our consent banner.\n\n**2. Browser Settings**\nMost web browsers allow you to control cookies through their settings:\n\n• Chrome: Settings > Privacy and security > Cookies\n• Firefox: Settings > Privacy & Security > Cookies\n• Safari: Preferences > Privacy > Cookies\n• Edge: Settings > Cookies and site permissions\n\n**3. Opt-Out Links**\nYou can opt out of analytics cookies by adjusting your preferences in our cookie banner.\n\n**Note**: Blocking essential cookies may prevent you from using certain features of our platform."
        },
        {
          title: "Updates to This Policy",
          content: "We may update this Cookie Policy from time to time. We will notify you of any significant changes by posting a notice on our platform or sending you an email."
        },
        {
          title: "Contact Us",
          content: "If you have questions about our use of cookies, please contact:\n\nEmail: privacy@weasydeal.eu"
        }
      ]
    },
    it: {
      title: "Politica Cookie",
      lastUpdated: "Ultimo aggiornamento: Gennaio 2025",
      intro: "Questa Politica Cookie spiega come WeasyDeal utilizza cookie e tecnologie simili per riconoscerti quando visiti la nostra piattaforma. Spiega cosa sono queste tecnologie e perché le usiamo, oltre ai tuoi diritti di controllarne l'uso.",
      sections: [
        {
          title: "Cosa Sono i Cookie?",
          content: "I cookie sono piccoli file di testo che vengono inseriti sul tuo computer o dispositivo mobile quando visiti un sito web. Sono ampiamente utilizzati per far funzionare i siti web in modo più efficiente e fornire informazioni ai proprietari del sito.\n\nI cookie possono essere 'persistenti' (rimangono sul dispositivo) o 'di sessione' (eliminati alla chiusura del browser)."
        },
        {
          title: "Tipi di Cookie che Utilizziamo",
          content: "**1. Cookie Essenziali (Obbligatori)**\n\nQuesti cookie sono necessari per il funzionamento del sito e non possono essere disattivati. Vengono solitamente impostati solo in risposta ad azioni da te compiute, come login o compilazione moduli.\n\n• Cookie autenticazione\n• Cookie sicurezza\n• Gestione sessione\n\n**2. Cookie Funzionali (Opzionali)**\n\nQuesti cookie abilitano funzionalità avanzate e personalizzazione:\n\n• Preferenze lingua\n• Impostazioni interfaccia utente\n• Funzionalità ricordami\n\n**3. Cookie Analitici (Opzionali)**\n\nQuesti cookie ci aiutano a capire come i visitatori interagiscono con la piattaforma:\n\n• Visualizzazioni pagine e percorsi navigazione\n• Tempo trascorso sulle pagine\n• Messaggi errore riscontrati\n\nUtilizziamo dati anonimizzati che non possono identificarti personalmente."
        },
        {
          title: "Cookie di Terze Parti",
          content: "Utilizziamo i seguenti servizi di terze parti che possono impostare cookie:\n\n• **Stripe**: Per elaborazione pagamenti (essenziale)\n• **Supabase**: Per autenticazione e archiviazione dati (essenziale)\n\nQuesti servizi hanno proprie politiche privacy che regolano l'uso dei cookie."
        },
        {
          title: "Durata Cookie",
          content: "• **Cookie di sessione**: Eliminati alla chiusura browser\n• **Cookie persistenti**: Rimangono fino a 12 mesi\n• **Cookie autenticazione**: Rimangono fino al logout o 30 giorni inattività"
        },
        {
          title: "Come Controllare i Cookie",
          content: "Puoi controllare e gestire i cookie in diversi modi:\n\n**1. Banner Consenso Cookie**\nQuando visiti il nostro sito per la prima volta, puoi accettare o rifiutare i cookie opzionali tramite il banner di consenso.\n\n**2. Impostazioni Browser**\nLa maggior parte dei browser web consente di controllare i cookie tramite le impostazioni:\n\n• Chrome: Impostazioni > Privacy e sicurezza > Cookie\n• Firefox: Impostazioni > Privacy e sicurezza > Cookie\n• Safari: Preferenze > Privacy > Cookie\n• Edge: Impostazioni > Cookie e autorizzazioni sito\n\n**3. Link Opt-Out**\nPuoi disattivare i cookie analitici regolando le preferenze nel banner cookie.\n\n**Nota**: Bloccare i cookie essenziali potrebbe impedirti di utilizzare alcune funzionalità della piattaforma."
        },
        {
          title: "Aggiornamenti a Questa Politica",
          content: "Potremmo aggiornare questa Politica Cookie periodicamente. Ti informeremo di eventuali modifiche significative pubblicando un avviso sulla piattaforma o inviandoti un'email."
        },
        {
          title: "Contattaci",
          content: "Se hai domande sull'uso dei cookie, contatta:\n\nEmail: privacy@weasydeal.eu"
        }
      ]
    },
    es: {
      title: "Política de Cookies",
      lastUpdated: "Última actualización: Enero 2025",
      intro: "Esta Política de Cookies explica cómo WeasyDeal utiliza cookies y tecnologías similares para reconocerte cuando visitas nuestra plataforma. Explica qué son estas tecnologías y por qué las usamos, así como tus derechos para controlar su uso.",
      sections: [
        {
          title: "¿Qué Son las Cookies?",
          content: "Las cookies son pequeños archivos de texto que se colocan en tu ordenador o dispositivo móvil cuando visitas un sitio web. Se utilizan ampliamente para hacer que los sitios funcionen de manera más eficiente y proporcionar información a los propietarios del sitio.\n\nLas cookies pueden ser 'persistentes' (permanecen en tu dispositivo) o 'de sesión' (se eliminan al cerrar el navegador)."
        },
        {
          title: "Tipos de Cookies que Usamos",
          content: "**1. Cookies Esenciales (Requeridas)**\n\nEstas cookies son necesarias para que el sitio funcione y no pueden desactivarse. Generalmente se configuran solo en respuesta a acciones realizadas por ti, como iniciar sesión o completar formularios.\n\n• Cookies autenticación\n• Cookies seguridad\n• Gestión sesión\n\n**2. Cookies Funcionales (Opcionales)**\n\nEstas cookies habilitan funcionalidad mejorada y personalización:\n\n• Preferencias idioma\n• Configuración interfaz usuario\n• Funcionalidad recordarme\n\n**3. Cookies Analíticas (Opcionales)**\n\nEstas cookies nos ayudan a entender cómo los visitantes interactúan con la plataforma:\n\n• Visualizaciones páginas y rutas navegación\n• Tiempo en páginas\n• Mensajes error encontrados\n\nUsamos datos anonimizados que no pueden identificarte personalmente."
        },
        {
          title: "Cookies de Terceros",
          content: "Usamos los siguientes servicios de terceros que pueden configurar cookies:\n\n• **Stripe**: Para procesamiento pagos (esencial)\n• **Supabase**: Para autenticación y almacenamiento datos (esencial)\n\nEstos servicios tienen sus propias políticas de privacidad que rigen el uso de cookies."
        },
        {
          title: "Duración Cookies",
          content: "• **Cookies de sesión**: Eliminadas al cerrar navegador\n• **Cookies persistentes**: Permanecen hasta 12 meses\n• **Cookies autenticación**: Permanecen hasta logout o 30 días inactividad"
        },
        {
          title: "Cómo Controlar las Cookies",
          content: "Puedes controlar y gestionar las cookies de varias formas:\n\n**1. Banner Consentimiento Cookies**\nCuando visitas nuestro sitio por primera vez, puedes aceptar o rechazar cookies opcionales a través de nuestro banner de consentimiento.\n\n**2. Configuración Navegador**\nLa mayoría de navegadores web permiten controlar cookies mediante configuración:\n\n• Chrome: Configuración > Privacidad y seguridad > Cookies\n• Firefox: Configuración > Privacidad y seguridad > Cookies\n• Safari: Preferencias > Privacidad > Cookies\n• Edge: Configuración > Cookies y permisos sitio\n\n**3. Enlaces Opt-Out**\nPuedes desactivar cookies analíticas ajustando preferencias en nuestro banner de cookies.\n\n**Nota**: Bloquear cookies esenciales puede impedirte usar ciertas funciones de nuestra plataforma."
        },
        {
          title: "Actualizaciones a Esta Política",
          content: "Podemos actualizar esta Política de Cookies periódicamente. Te notificaremos cambios significativos publicando un aviso en nuestra plataforma o enviándote un email."
        },
        {
          title: "Contáctanos",
          content: "Si tienes preguntas sobre nuestro uso de cookies, contacta:\n\nEmail: privacy@weasydeal.eu"
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
      </div>
    </div>
  );
};

export default CookiePolicy;
