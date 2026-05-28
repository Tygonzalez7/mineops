-- Compliance View PIN.
-- Mines store a SHA-256 hash of `{mine_id}:{pin}` (4-digit PIN salted by
-- the mine UUID). This is a casual lock to prevent an inspector — handed
-- the device in compliance mode — from navigating into Setup / People /
-- production data. It is NOT protecting secrets; the records themselves
-- remain visible inside Compliance View.

alter table public.mines
  add column if not exists compliance_pin_hash text;
