-- Update existing completed topup_intents that are missing completed_at timestamp
UPDATE public.topup_intents
SET completed_at = now()
WHERE status = 'completed' AND completed_at IS NULL;