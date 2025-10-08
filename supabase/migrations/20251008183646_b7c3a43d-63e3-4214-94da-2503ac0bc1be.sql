-- Update pending topup_intents from last 10 minutes to completed
UPDATE public.topup_intents
SET status = 'completed', completed_at = now()
WHERE status = 'pending'
  AND created_at >= now() - interval '10 minutes';