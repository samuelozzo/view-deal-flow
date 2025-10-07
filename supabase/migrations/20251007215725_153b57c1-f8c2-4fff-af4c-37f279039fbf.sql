-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the release-escrows function to run every hour
SELECT cron.schedule(
  'release-expired-escrows',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://ikztbocitxqpajnckxlu.supabase.co/functions/v1/release-escrows',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrenRib2NpdHhxcGFqbmNreGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MTk0ODEsImV4cCI6MjA3NTM5NTQ4MX0.v6JzrOiZrz1CLUFOEeqDh7IO7zFSnOYgYt_HARdMfNc"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);