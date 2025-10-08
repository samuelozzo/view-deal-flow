# Stripe Payment Integration - Setup Guide

## 🎯 Overview

Il sistema di pagamenti Stripe è stato integrato con successo nella webapp. Include:

- ✅ **Pagamenti diretti** con Stripe Payments per ricariche wallet
- ✅ **Gestione escrow** tramite il sistema wallet esistente
- ✅ **Webhook automatici** per gestire successo/fallimento pagamenti e rimborsi
- ✅ **Payout ai creator** (pronto per integrazione con Stripe Connect)
- ✅ **Frontend con Stripe Elements** per un'esperienza di pagamento sicura

## 📋 Configurazione Necessaria

### 1. Aggiungi la Chiave Publishable di Stripe

**IMPORTANTE**: Devi aggiungere la chiave publishable di Stripe al file `.env`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Questa chiave è necessaria per caricare Stripe Elements nel frontend.

### 2. Configura il Webhook Stripe

Per ricevere gli eventi da Stripe (pagamenti riusciti, falliti, rimborsi), devi configurare un webhook:

1. Vai su [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click su "Add endpoint"
3. Inserisci l'URL del webhook:
   ```
   https://ikztbocitxqpajnckxlu.supabase.co/functions/v1/stripe-webhook
   ```
4. Seleziona gli eventi da ascoltare:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copia il **Signing secret** (inizia con `whsec_...`)
6. Il secret è già stato configurato come `STRIPE_WEBHOOK_SECRET`

### 3. Test del Sistema

#### Test Ricarica Wallet:
1. Accedi come utente business
2. Vai su `/wallet`
3. Click su "Ricarica Wallet"
4. Seleziona "Carta di Credito/Debito"
5. Inserisci importo (minimo €0.50)
6. Usa carte di test Stripe:
   - Successo: `4242 4242 4242 4242`
   - Fallimento: `4000 0000 0000 0002`
   - CVV: qualsiasi 3 cifre
   - Data: qualsiasi data futura

## 🏗️ Architettura del Sistema

### Edge Functions Create

#### 1. `create-payment-intent`
- **Scopo**: Crea un PaymentIntent Stripe per la ricarica wallet
- **Autenticazione**: Richiesta (JWT)
- **Input**: `{ amount_cents: number, metadata?: object }`
- **Output**: `{ clientSecret: string, paymentIntentId: string, topupIntentId: string }`
- **Funzionalità**:
  - Valida importo minimo (50 centesimi)
  - Recupera wallet dell'utente
  - Crea PaymentIntent su Stripe
  - Crea record `topup_intent` con stato "pending"

#### 2. `stripe-webhook`
- **Scopo**: Gestisce eventi webhook da Stripe
- **Autenticazione**: Non richiesta (pubblica)
- **Eventi gestiti**:
  - **payment_intent.succeeded**:
    - Aggiorna topup_intent a "completed"
    - Incrementa saldo wallet (`available_cents`)
    - Crea transaction record
    - Invia notifica all'utente
  - **payment_intent.payment_failed**:
    - Aggiorna topup_intent a "failed"
    - Invia notifica di errore
  - **charge.refunded**:
    - Decrementa saldo wallet
    - Crea transaction di rimborso
    - Invia notifica

#### 3. `process-creator-payout`
- **Scopo**: Processa richieste di payout ai creator
- **Autenticazione**: Richiesta (solo admin)
- **Input**: `{ payout_request_id: string }`
- **Funzionalità**:
  - Verifica che l'utente sia admin
  - Aggiorna payout_request a "completed"
  - Crea notifica al creator
  - **TODO**: Integrare con Stripe Payouts o Connect

### Frontend Components

#### `StripePaymentForm`
- Componente React con Stripe Elements
- Gestisce il form di pagamento
- Callbacks per successo/cancellazione

#### `Wallet.tsx` (modificato)
- Dialog per ricarica con scelta metodo pagamento:
  - **Carta**: Mostra Stripe Elements
  - **Bonifico**: Usa flow esistente
- Importo minimo ridotto a €0.50 per carte
- Auto-refresh dopo pagamento completato

## 🔒 Sicurezza

### Best Practices Implementate:
1. ✅ **JWT Verification** su endpoint sensibili
2. ✅ **Validazione importi** lato server
3. ✅ **Webhook signature verification** (configurabile)
4. ✅ **Nessuna chiave segreta nel frontend**
5. ✅ **RLS policies** su tutte le tabelle
6. ✅ **CORS headers** configurati correttamente

### Note di Sicurezza:
- Le chiavi Stripe sono gestite come secrets
- I webhook devono validare la signature in produzione
- Il `clientSecret` non espone dati sensibili (è progettato per essere usato nel frontend)

## 🚀 Prossimi Passi per Produzione

### 1. Stripe Connect per Payout
Per gestire payout reali ai creator, dovresti:
1. Abilitare Stripe Connect nel tuo account
2. Implementare onboarding per connected accounts
3. Modificare `process-creator-payout` per usare Transfer API

### 2. Gestione Errori Avanzata
- Retry logic per webhook falliti
- Logging strutturato per debugging
- Alert per transazioni anomale

### 3. Compliance e Legale
- Terms of Service per i pagamenti
- Privacy policy aggiornata
- Gestione dati secondo PCI-DSS (già gestita da Stripe)

### 4. Testing
- Test end-to-end del flusso completo
- Test webhook con Stripe CLI
- Load testing per verificare scalabilità

## 📊 Monitoraggio

### Dashboard Stripe
- Monitora pagamenti in tempo reale
- Analizza tassi di successo/fallimento
- Gestisci dispute e rimborsi

### Database
Tabelle coinvolte:
- `topup_intents`: Richieste di ricarica
- `wallet_transactions`: Storico transazioni
- `wallets`: Saldi utenti
- `payout_requests`: Richieste di prelievo
- `notifications`: Notifiche agli utenti

## 🆘 Troubleshooting

### Problema: Pagamento non completa
- Verifica che il webhook sia configurato
- Controlla i log dell'edge function `stripe-webhook`
- Verifica che `STRIPE_WEBHOOK_SECRET` sia corretto

### Problema: "Stripe not configured"
- Verifica che `STRIPE_SECRET_KEY` sia configurato nei secrets

### Problema: Frontend non carica Stripe Elements
- Verifica che `VITE_STRIPE_PUBLISHABLE_KEY` sia nel file `.env`
- Rebuild del frontend dopo aver aggiunto la chiave

## 📚 Risorse

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [Stripe Webhook Events](https://stripe.com/docs/api/events/types)
- [Stripe Connect Guide](https://stripe.com/docs/connect)
