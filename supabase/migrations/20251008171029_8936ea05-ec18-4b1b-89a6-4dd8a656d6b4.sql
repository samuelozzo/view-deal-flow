update topup_intents
set status = 'completed',
    completed_at = now()
where id = (
  select id from topup_intents
  where status = 'pending'
  order by created_at desc
  limit 1
);