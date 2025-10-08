# Piano di Test - Sistema Pagamenti + Escrow

## Configurazione Test
- **Ambiente**: Sandbox Stripe
- **Carta Test Successo**: 4242 4242 4242 4242
- **Carta Test Fallimento**: 4000 0000 0000 0002
- **Scadenza**: Qualsiasi data futura (es. 12/34)
- **CVC**: Qualsiasi 3 cifre (es. 123)

## Prerequisiti
1. Variabile ambiente `VITE_STRIPE_PUBLISHABLE_KEY` configurata
2. Webhook Stripe configurato per `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
3. Utente Business con wallet creato
4. Utente Creator con wallet creato
5. Admin configurato nel sistema

---

## Test 1: Top-Up Wallet Business con Successo
**Obiettivo**: Verificare che il pagamento con carta valida aggiorni correttamente il saldo wallet.

### Passi:
1. Login come utente **Business**
2. Navigare alla pagina **Wallet** (`/wallet`)
3. Verificare il saldo iniziale (es. €0.00)
4. Cliccare su **"Ricarica Wallet"**
5. Inserire importo: **€50.00**
6. Selezionare metodo: **"Carta di Credito"**
7. Cliccare **"Procedi"**
8. Compilare form Stripe con carta **4242 4242 4242 4242**
9. Cliccare **"Conferma Pagamento"**

### Risultati Attesi:
- ✅ Popup/Toast: **"Pagamento Completato"** con messaggio di successo
- ✅ Saldo wallet aggiornato a **€50.00** (visibile immediatamente)
- ✅ Transazione visibile nella tabella "Transazioni Recenti"
- ✅ Notifica in-app ricevuta: "Ricarica Completata"
- ✅ Log webhook: evento `payment_intent.succeeded` processato

### Screenshot da Catturare:
- Saldo prima del top-up
- Form pagamento Stripe
- Popup successo
- Saldo dopo top-up (€50.00)
- Dettaglio transazione

---

## Test 2: Top-Up Wallet con Pagamento Fallito
**Obiettivo**: Verificare gestione errore con carta che fallisce.

### Passi:
1. Login come utente **Business**
2. Navigare a **Wallet**
3. Cliccare **"Ricarica Wallet"**
4. Inserire importo: **€20.00**
5. Selezionare **"Carta di Credito"**
6. Compilare form con carta fallimento: **4000 0000 0000 0002**
7. Cliccare **"Conferma Pagamento"**

### Risultati Attesi:
- ✅ Popup/Toast: **"Pagamento Fallito"** con motivo (es. "Your card was declined")
- ✅ Saldo wallet **NON modificato** (rimane €50.00 dal test precedente)
- ✅ Nessuna transazione completata nel database
- ✅ Notifica: "Ricarica Fallita" ricevuta
- ✅ Log webhook: evento `payment_intent.payment_failed` processato

### Screenshot da Catturare:
- Popup/Toast errore
- Saldo wallet invariato
- Notifica fallimento

---

## Test 3: Creazione Offerta con Vincolo Saldo
**Obiettivo**: Verificare che business non possa creare offerte con reward > saldo disponibile.

### Passi (Test Negativo):
1. Login come **Business** (saldo attuale: €50.00)
2. Navigare a **"Crea Offerta"** (`/create-offer`)
3. Compilare form:
   - Titolo: "Test Offerta Alta"
   - Reward Type: **"Cash"**
   - Total Reward: **€100.00** (superiore a saldo)
   - Required Views: 1000
4. Cliccare **"Pubblica Offerta"**

### Risultati Attesi:
- ✅ Toast errore: **"Fondi Insufficienti"**
- ✅ Messaggio dettaglio: "Il tuo saldo disponibile (€50.00) non è sufficiente..."
- ✅ Offerta **NON creata** nel database
- ✅ Redirect o blocco del form

### Passi (Test Positivo):
5. Modificare Total Reward a **€30.00** (inferiore a saldo)
6. Cliccare **"Pubblica Offerta"**

### Risultati Attesi:
- ✅ Offerta creata con successo
- ✅ Toast: "Offerta pubblicata"
- ✅ Offerta visibile in lista

### Screenshot da Catturare:
- Toast errore fondi insufficienti (€100)
- Toast successo creazione offerta (€30)

---

## Test 4: Flusso Escrow Completo (14 Giorni Simulati)
**Obiettivo**: Verificare che l'escrow trattenga correttamente i fondi per 14 giorni e li rilasci automaticamente.

### Setup Iniziale:
1. **Business** ha saldo: €50.00
2. **Creator** applica e viene accettato per l'offerta da €30
3. **Creator** invia video con views >= required

### Passi - Fase 1: Approvazione Admin
1. Login come **Admin**
2. Navigare a **Dashboard Admin** (`/admin`)
3. Trovare submission del creator
4. Cliccare **"Approva"**
5. Confermare approvazione

### Risultati Attesi - Fase 1:
- ✅ Submission status: **"verified"**
- ✅ **Business Wallet**:
  - `available_cents`: €50.00 → **€20.00** (-€30)
  - `reserved_cents`: €0.00 → **€30.00** (+€30)
- ✅ **Creator Wallet**:
  - `available_cents`: rimane **€0.00** (non ancora disponibile)
  - Escrow visibile in UI: **€30.00 in Escrow**
- ✅ Escrow transaction creata:
  - `status`: **"funded"**
  - `scheduled_release_at`: data odierna **+ 14 giorni**
- ✅ Notifica creator: "Escrow Iniziato - disponibile tra 14 giorni"
- ✅ Notifica business: "Task Completata - Escrow avviato"

### Screenshot da Catturare - Fase 1:
- Wallet business prima approvazione
- Wallet business dopo approvazione (saldo e reserved)
- Wallet creator con escrow visibile
- Dettaglio escrow transaction

### Passi - Fase 2: Simulazione Passaggio 14 Giorni
**Nota**: Per simulare, modificare manualmente `scheduled_release_at` nel database o attendere 14 giorni reali.

**Metodo Simulazione Rapida**:
6. Accedere al backend Lovable Cloud
7. Aprire tabella `escrow_transactions`
8. Modificare `scheduled_release_at` della riga escrow a **data passata** (es. ieri)
9. Invocare manualmente edge function `release-escrows` tramite:
   ```bash
   curl -X POST https://ikztbocitxqpajnckxlu.supabase.co/functions/v1/release-escrows \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```
   O attendere che il cron job lo esegua automaticamente (ogni ora)

### Risultati Attesi - Fase 2 (Dopo Rilascio):
- ✅ Escrow transaction status: **"released"**
- ✅ **Business Wallet**:
  - `reserved_cents`: €30.00 → **€0.00** (-€30 deallocati)
- ✅ **Creator Wallet**:
  - `available_cents`: €0.00 → **€30.00** (+€30 disponibili)
- ✅ Submission status: **"paid"**
- ✅ Transazione wallet creator: tipo `escrow_release`, direzione `in`, €30
- ✅ Notifica creator: "Payout Rilasciato - €30.00 accreditati"
- ✅ Notifica business: "Escrow Completato"

### Screenshot da Catturare - Fase 2:
- Wallet creator dopo rilascio (€30 disponibili)
- Wallet business reserved_cents a zero
- Transazione `escrow_release` nel creator
- Notifiche ricevute

---

## Test 5: Payout Creator
**Obiettivo**: Verificare che il creator possa richiedere payout del saldo disponibile.

### Prerequisiti:
- Creator ha **€30.00** disponibili (da Test 4)

### Passi:
1. Login come **Creator**
2. Navigare a **Wallet**
3. Verificare saldo disponibile: **€30.00**
4. Cliccare **"Richiedi Payout"**
5. Inserire:
   - Importo: **€25.00**
   - IBAN: **IT60X0542811101000000123456** (test IBAN)
6. Cliccare **"Conferma Payout"**

### Risultati Attesi:
- ✅ Toast: **"Richiesta Payout Inviata"**
- ✅ **Creator Wallet**:
  - `available_cents`: €30.00 → **€5.00** (-€25)
- ✅ Payout request creata:
  - `status`: **"pending"**
  - `amount_cents`: 2500
- ✅ Transazione wallet: tipo `payout_request`, direzione `out`, €25
- ✅ Notifica: "Richiesta Payout in elaborazione"
- ✅ Payout visibile in lista "Richieste Payout" (se implementata)

### Test Negativo - Importo Superiore a Disponibile:
7. Tentare payout di **€20.00** (> €5.00 disponibili)

### Risultati Attesi Test Negativo:
- ✅ Toast errore: **"Fondi Insufficienti"**
- ✅ Nessuna modifica al wallet
- ✅ Payout request **non creata**

### Screenshot da Catturare:
- Form payout
- Saldo prima e dopo payout
- Toast successo
- Dettaglio payout request
- Toast errore payout insufficiente

---

## Test 6: Idempotency Webhook
**Obiettivo**: Verificare che lo stesso evento webhook non venga processato due volte.

### Passi:
1. Effettuare un top-up da €10 con carta 4242
2. Attendere evento `payment_intent.succeeded`
3. **Ritrasmettere manualmente** lo stesso evento webhook tramite Stripe Dashboard
4. Verificare log edge function `stripe-webhook`

### Risultati Attesi:
- ✅ Log mostra: **"Payment already processed"**
- ✅ Saldo wallet **NON incrementato** nuovamente
- ✅ Nessuna transazione duplicata nel database

---

## Test 7: Refund Stripe
**Obiettivo**: Verificare che un rimborso Stripe scalì correttamente il wallet.

### Passi:
1. Effettuare top-up da €15 (carta 4242)
2. Verificare wallet incrementato a €15
3. Accedere a **Stripe Dashboard** (sandbox)
4. Trovare il PaymentIntent e cliccare **"Refund"**
5. Rimborsare l'intero importo

### Risultati Attesi:
- ✅ Evento `charge.refunded` processato
- ✅ Wallet scalato: saldo - €15
- ✅ Transazione tipo `refund`, direzione `out`, €15
- ✅ Notifica: "Rimborso Elaborato"

### Screenshot da Catturare:
- Stripe refund confirmation
- Wallet dopo refund
- Transazione refund

---

## Riepilogo Test

| # | Test | Stato | Note |
|---|------|-------|------|
| 1 | Top-up successo | ⬜ | Carta 4242 |
| 2 | Top-up fallimento | ⬜ | Carta 0002 |
| 3 | Vincolo saldo offerta | ⬜ | €100 vs €50 |
| 4 | Escrow 14 giorni | ⬜ | Simulare data |
| 5 | Payout creator | ⬜ | IBAN test |
| 6 | Idempotency webhook | ⬜ | Ritrasmissione |
| 7 | Refund Stripe | ⬜ | Dashboard Stripe |

---

## Configurazione Cron Job (Produzione)
Per il rilascio automatico escrow ogni ora:

```sql
-- Eseguire nel backend Lovable Cloud (SQL Editor)
SELECT cron.schedule(
  'release-escrows-hourly',
  '0 * * * *', -- Ogni ora al minuto 0
  $$
  SELECT net.http_post(
    url := 'https://ikztbocitxqpajnckxlu.supabase.co/functions/v1/release-escrows',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

---

## Checklist Finale

### Pre-Test:
- [ ] VITE_STRIPE_PUBLISHABLE_KEY configurata
- [ ] STRIPE_WEBHOOK_SECRET configurata
- [ ] Webhook Stripe attivo e puntato a `/functions/v1/stripe-webhook`
- [ ] Utenti test creati (business, creator, admin)
- [ ] Cron job schedulato (se test produzione)

### Post-Test:
- [ ] Tutti i test passati ✅
- [ ] Screenshot raccolti
- [ ] Log webhook verificati
- [ ] Database coerente (nessun saldo negativo)
- [ ] Notifiche inviate correttamente

---

## Note di Sicurezza
- ⚠️ Webhook idempotency implementata
- ⚠️ Transazioni DB atomiche (no partial updates)
- ⚠️ Validazione importi lato server
- ⚠️ RLS policies verificate su tutte le tabelle
- ⚠️ IBAN mascherato nei metadata transazioni
