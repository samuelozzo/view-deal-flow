-- ============================================================
-- Setup Automatico Rilascio Escrow (Cron Job)
-- ============================================================

-- Abilita estensione pg_cron se non già abilitata
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Abilita estensione pg_net per permettere chiamate HTTP
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Rimuovi job esistente se presente (per evitare duplicati)
DO $$
BEGIN
  PERFORM cron.unschedule('release-escrows-hourly');
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignora errore se il job non esiste
END $$;

-- Crea il cron job per eseguire release-escrows ogni ora
SELECT cron.schedule(
  'release-escrows-hourly',           -- Nome del job
  '0 * * * *',                        -- Cron expression: ogni ora al minuto 0
  $$
  SELECT net.http_post(
    url := 'https://ikztbocitxqpajnckxlu.supabase.co/functions/v1/release-escrows',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrenRib2NpdHhxcGFqbmNreGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MTk0ODEsImV4cCI6MjA3NTM5NTQ4MX0.v6JzrOiZrz1CLUFOEeqDh7IO7zFSnOYgYt_HARdMfNc'
    )
  ) as request_id;
  $$
);