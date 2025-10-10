-- Add fields for discount code offers
ALTER TABLE public.offers
ADD COLUMN discount_percentage integer,
ADD COLUMN discount_code text,
ADD COLUMN max_participants integer DEFAULT 1;

-- Add constraint for discount_percentage (1-100)
ALTER TABLE public.offers
ADD CONSTRAINT discount_percentage_range 
CHECK (discount_percentage IS NULL OR (discount_percentage >= 1 AND discount_percentage <= 100));

-- Add comment
COMMENT ON COLUMN public.offers.discount_percentage IS 'Percentage discount for discount code offers (1-100)';
COMMENT ON COLUMN public.offers.discount_code IS 'Discount code to be revealed to accepted creators';
COMMENT ON COLUMN public.offers.max_participants IS 'Maximum number of participants allowed (default 1 for discount offers)';