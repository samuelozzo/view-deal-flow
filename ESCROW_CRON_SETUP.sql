-- ============================================================
-- Setup Automatico Rilascio Escrow (Cron Job)
-- ============================================================
-- Questo script configura un cron job che esegue automaticamente
-- la funzione release-escrows ogni ora per rilasciare gli escrow
-- che hanno superato il periodo di 14 giorni.
--
-- ISTRUZIONI:
-- 1. Accedere al backend Lovable Cloud
-- 2. Aprire SQL Editor
-- 3. Eseguire questo script
-- 4. Verificare che il cron job sia stato creato correttamente
-- ============================================================

-- Abilita estensione pg_cron se non già abilitata
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Rimuovi job esistente se presente (per evitare duplicati)
SELECT cron.unschedule('release-escrows-hourly');

-- Crea il cron job per eseguire release-escrows ogni ora
SELECT cron.schedule(
  'release-escrows-hourly',           -- Nome del job
  '0 * * * *',                        -- Cron expression: ogni ora al minuto 0
  $$
  SELECT net.http_post(
    url := 'https://ikztbocitxqpajnckxlu.supabase.co/functions/v1/release-escrows',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.anon_key', true)
    )
  ) as request_id;
  $$
);

-- Verifica che il job sia stato creato
SELECT * FROM cron.job WHERE jobname = 'release-escrows-hourly';

-- ============================================================
-- OPZIONALE: Test Manuale
-- ============================================================
-- Per testare immediatamente la funzione release-escrows
-- senza attendere il cron job, eseguire:
--
-- SELECT net.http_post(
--   url := 'https://ikztbocitxqpajnckxlu.supabase.co/functions/v1/release-escrows',
--   headers := '{"Content-Type": "application/json"}'::jsonb
-- );
-- ============================================================

-- ============================================================
-- Monitoraggio Cron Job
-- ============================================================
-- Per vedere l'ultima esecuzione e lo stato del job:
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'release-escrows-hourly')
-- ORDER BY start_time DESC 
-- LIMIT 10;
-- ============================================================

-- ============================================================
-- NOTA IMPORTANTE:
-- Assicurarsi che l'estensione pg_net sia abilitata per
-- permettere chiamate HTTP dalla funzione cron.
-- Se non abilitata, eseguire:
-- CREATE EXTENSION IF NOT EXISTS pg_net;
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_net;
