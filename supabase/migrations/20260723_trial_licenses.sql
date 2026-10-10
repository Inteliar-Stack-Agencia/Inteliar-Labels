-- Permite el plan 'trial' en licenses: una licencia de prueba gratis
-- (con vencimiento) que se crea sola para cada usuario, así el agente de
-- impresión puede activarse con un código durante la prueba.
-- El constraint original solo aceptaba monthly/lifetime ('pro' ya se usa
-- en el código), por eso se recrea con la lista completa.
alter table public.licenses drop constraint if exists licenses_plan_check;
alter table public.licenses
  add constraint licenses_plan_check
  check (plan in ('monthly', 'pro', 'lifetime', 'trial'));
