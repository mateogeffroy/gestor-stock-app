-- Facturación electrónica ARCA + medio de pago.
-- Correr una vez en Supabase → SQL Editor. Es idempotente: se puede volver a correr sin romper nada.

-- 1. Datos fiscales de cada comercio (uno por usuario)
create table if not exists public.comercio_fiscal (
  user_id            uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  cuit               text not null check (cuit ~ '^\d{11}$'),
  razon_social       text not null,
  condicion_iva      text not null check (condicion_iva in ('RI', 'MT', 'EX')),
  punto_venta        int  not null check (punto_venta between 1 and 99998),
  domicilio          text,
  ingresos_brutos    text,
  inicio_actividades date,
  alicuota_iva       numeric not null default 21 check (alicuota_iva in (0, 2.5, 5, 10.5, 21, 27)),
  produccion         boolean not null default false, -- false = homologación (pruebas de ARCA)
  updated_at         timestamptz not null default now()
);

alter table public.comercio_fiscal enable row level security;

drop policy if exists "comercio_fiscal propio" on public.comercio_fiscal;
create policy "comercio_fiscal propio" on public.comercio_fiscal
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 2. Datos fiscales de cada venta
alter table public.venta
  -- no_aplica = venta sin factura · pendiente = falta pedir CAE · procesando = pidiendo CAE
  add column if not exists estado_fiscal          text not null default 'no_aplica'
    check (estado_fiscal in ('no_aplica', 'pendiente', 'procesando', 'autorizada', 'error')),
  add column if not exists error_fiscal           text,
  add column if not exists cbte_tipo              int,
  add column if not exists pto_vta                int,
  add column if not exists cbte_nro               bigint,
  add column if not exists doc_tipo               int,
  add column if not exists doc_nro                bigint,
  add column if not exists condicion_iva_receptor int,
  add column if not exists imp_neto               numeric(14, 2),
  add column if not exists imp_iva                numeric(14, 2),
  add column if not exists emisor_cuit            text,
  add column if not exists medio_pago             text
    check (medio_pago in ('efectivo', 'debito', 'credito', 'transferencia', 'qr', 'otro'));

-- Un mismo número de comprobante no puede existir dos veces para el mismo emisor
create unique index if not exists venta_comprobante_unico
  on public.venta (emisor_cuit, pto_vta, cbte_tipo, cbte_nro)
  where cbte_nro is not null;

-- 3. Ticket de acceso de ARCA (WSAA). Dura ~12 h y lo comparten todos los comercios,
--    porque es del certificado del sistema. Solo lo lee el servidor (service role):
--    RLS activado y SIN políticas = ningún usuario puede leerlo ni escribirlo.
create table if not exists public.arca_ticket (
  servicio   text    not null,
  produccion boolean not null,
  datos      jsonb   not null,
  vence      timestamptz not null,
  primary key (servicio, produccion)
);
alter table public.arca_ticket enable row level security;
