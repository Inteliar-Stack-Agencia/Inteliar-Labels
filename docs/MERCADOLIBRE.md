# Integración con Mercado Libre

Permite a un vendedor conectar su cuenta de Mercado Libre y traer sus
órdenes pagas recientes para imprimir etiquetas (de envío o de producto)
sin cargar un Excel a mano.

El backend ya está armado. Falta cargar las credenciales para que se
active — hasta entonces, la sección se muestra como "Próximamente" en
`/upload`.

---

## 1. Crear la aplicación en Mercado Libre Developers

1. Entrá a https://developers.mercadolibre.com.ar/devcenter con tu cuenta
   de Mercado Libre.
2. **Crear aplicación** → completá nombre y descripción.
3. En **Redirect URI** poné exactamente (tiene que matchear carácter por
   carácter con lo que arma el código):

   ```
   https://<tu-dominio>/api/integrations/mercadolibre/callback
   ```

4. Scopes: marcá **read** y **offline_access** (offline_access es
   necesario para que se emita un refresh token — sin eso, el vendedor
   tendría que reconectar cada 6hs).
5. Guardá y copiá el **Client ID (App ID)** y el **Client Secret**.

## 2. Variables de entorno en Vercel

```
MERCADOLIBRE_CLIENT_ID=xxxxxxxxxxxxxxxx
MERCADOLIBRE_CLIENT_SECRET=xxxxxxxxxxxxxxxx
```

`NEXT_PUBLIC_APP_URL` ya debería estar configurada (se reutiliza para
armar el redirect URI — tiene que ser la misma URL que pusiste en el
paso 1).

## 3. Base de datos

Corré la migración en Supabase (SQL Editor):

```sql
-- supabase/migrations/20260710_mercadolibre_connections.sql
create table if not exists public.mercadolibre_connections (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  ml_user_id    text not null,
  access_token  text not null,
  refresh_token text not null,
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists mercadolibre_connections_updated_at on public.mercadolibre_connections;
create trigger mercadolibre_connections_updated_at
  before update on public.mercadolibre_connections
  for each row execute function public.set_updated_at();

alter table public.mercadolibre_connections enable row level security;
create policy "No public access" on public.mercadolibre_connections
  for all using (false);
```

(Requiere que `public.set_updated_at()` ya exista — se crea en la
migración de licencias, `20260626_licenses.sql`.)

## 4. Cómo funciona

- `GET /api/integrations/mercadolibre/authorize` — redirige al vendedor a
  la pantalla de autorización de ML. Usa una cookie httpOnly de corta
  vida (`ml_oauth_state`) para verificar en el callback que la respuesta
  viene del mismo navegador que inició el flujo (protección CSRF).
- `GET /api/integrations/mercadolibre/callback` — intercambia el `code`
  por access/refresh token y los guarda en `mercadolibre_connections`.
- `GET /api/integrations/mercadolibre/status` — `{ configured, connected }`
  para que el frontend sepa qué mostrar.
- `POST /api/integrations/mercadolibre/orders` — body `{ mode: "shipping"
  | "product" }`, devuelve `{ columns, rows, total }` con las órdenes
  pagas recientes (máx 50), listas para cargar en el flujo de impresión
  (mismo formato que la importación de Tiendanube). Rate limit: 10
  sincronizaciones cada 5 minutos por usuario.
- `POST /api/integrations/mercadolibre/disconnect` — borra la conexión.

El access token se refresca solo (5 minutos antes de vencer) usando el
refresh token — el vendedor no tiene que reconectar manualmente.

## 5. Activar la UI

Una vez cargadas las credenciales y corrida la migración, hay que
reemplazar la card "Próximamente" en `app/upload/page.tsx` (buscá el
comentario "Mercado Libre import") por el flujo real: botón que llame a
`/api/integrations/mercadolibre/authorize`, y al volver con
`?ml_connected=1` en la URL, mostrar el selector de modo (envío/producto)
y el botón "Sincronizar ahora" que llama a `/orders` y carga el resultado
en `setData(...)`, igual que ya hace la importación de Tiendanube.
