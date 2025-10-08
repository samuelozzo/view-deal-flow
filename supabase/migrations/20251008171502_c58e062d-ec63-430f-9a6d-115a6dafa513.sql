-- Create unique index on wallet_transactions for payment intent idempotency
CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_stripe_payment_intent 
ON public.wallet_transactions ((metadata->>'stripe_payment_intent'))
WHERE metadata->>'stripe_payment_intent' IS NOT NULL;

-- Function to credit wallet when topup is completed
CREATE OR REPLACE FUNCTION public.fn_credit_wallet_on_topup_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id uuid;
  v_amount_cents integer;
  v_stripe_pi text;
  v_tx_exists boolean;
BEGIN
  -- Only process if status changed from pending to completed
  IF OLD.status = 'pending' AND NEW.status = 'completed' THEN
    v_wallet_id := NEW.wallet_id;
    v_amount_cents := NEW.amount_cents;
    v_stripe_pi := NEW.reference;
    
    RAISE NOTICE 'Trigger: Processing completed topup_intent %, wallet %, amount %', 
      NEW.id, v_wallet_id, v_amount_cents;
    
    -- Check if transaction already exists (idempotency)
    SELECT EXISTS(
      SELECT 1 FROM public.wallet_transactions
      WHERE metadata->>'stripe_payment_intent' = v_stripe_pi
    ) INTO v_tx_exists;
    
    IF v_tx_exists THEN
      RAISE NOTICE 'Trigger: Transaction already exists for payment_intent %', v_stripe_pi;
      RETURN NEW;
    END IF;
    
    -- Insert transaction record
    INSERT INTO public.wallet_transactions (
      wallet_id,
      type,
      direction,
      amount_cents,
      status,
      reference_type,
      reference_id,
      metadata
    ) VALUES (
      v_wallet_id,
      'topup',
      'in',
      v_amount_cents,
      'completed',
      'topup_intent',
      NEW.id,
      jsonb_build_object(
        'stripe_payment_intent', v_stripe_pi,
        'method', 'stripe',
        'triggered_by', 'database_trigger'
      )
    );
    
    RAISE NOTICE 'Trigger: Created transaction for topup_intent %', NEW.id;
    
    -- Update wallet balance
    UPDATE public.wallets
    SET 
      available_cents = available_cents + v_amount_cents,
      updated_at = now()
    WHERE id = v_wallet_id;
    
    RAISE NOTICE 'Trigger: Updated wallet % balance by %', v_wallet_id, v_amount_cents;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on topup_intents
DROP TRIGGER IF EXISTS trg_credit_wallet_on_topup_completed ON public.topup_intents;
CREATE TRIGGER trg_credit_wallet_on_topup_completed
  AFTER UPDATE ON public.topup_intents
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_credit_wallet_on_topup_completed();

-- Backfill: Process all completed topup_intents that don't have transactions
DO $$
DECLARE
  v_topup RECORD;
  v_tx_exists boolean;
BEGIN
  FOR v_topup IN 
    SELECT ti.id, ti.wallet_id, ti.amount_cents, ti.reference
    FROM public.topup_intents ti
    WHERE ti.status = 'completed'
    AND ti.completed_at IS NOT NULL
  LOOP
    -- Check if transaction already exists
    SELECT EXISTS(
      SELECT 1 FROM public.wallet_transactions
      WHERE metadata->>'stripe_payment_intent' = v_topup.reference
    ) INTO v_tx_exists;
    
    IF NOT v_tx_exists THEN
      RAISE NOTICE 'Backfill: Processing topup_intent %, wallet %, amount %',
        v_topup.id, v_topup.wallet_id, v_topup.amount_cents;
      
      -- Insert transaction
      INSERT INTO public.wallet_transactions (
        wallet_id,
        type,
        direction,
        amount_cents,
        status,
        reference_type,
        reference_id,
        metadata
      ) VALUES (
        v_topup.wallet_id,
        'topup',
        'in',
        v_topup.amount_cents,
        'completed',
        'topup_intent',
        v_topup.id,
        jsonb_build_object(
          'stripe_payment_intent', v_topup.reference,
          'method', 'stripe',
          'triggered_by', 'backfill'
        )
      );
      
      -- Update wallet balance
      UPDATE public.wallets
      SET 
        available_cents = available_cents + v_topup.amount_cents,
        updated_at = now()
      WHERE id = v_topup.wallet_id;
      
      RAISE NOTICE 'Backfill: Credited wallet % with %', v_topup.wallet_id, v_topup.amount_cents;
    ELSE
      RAISE NOTICE 'Backfill: Skipping topup_intent % (transaction exists)', v_topup.id;
    END IF;
  END LOOP;
END;
$$;