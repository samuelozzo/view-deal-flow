-- Add 'completed' value to offer_status enum
ALTER TYPE offer_status ADD VALUE IF NOT EXISTS 'completed';