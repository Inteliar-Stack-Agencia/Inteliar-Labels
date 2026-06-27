# Configurar cobro automático (MercadoPago + Stripe)

Cuando un cliente paga, el sistema **genera la licencia sola** y le manda la
clave por email. Para que funcione necesitás configurar 3 cosas: el envío de
emails (Resend) y al menos una pasarela de pago (MercadoPago y/o Stripe).

Todas las claves se cargan como **variables de entorno en Vercel**
(Project → Settings → Environment Variables) y después hacés un redeploy.

---

## 1. Base de datos (una sola vez)

Corré esta migración en Supabase (SQL Editor):

```sql
-- supabase/migrations/20260627_license_payment_ref.sql
alter table public.licenses add column if not exists payment_ref text;
create unique index if not exists licenses_payment_ref_idx
  on public.licenses (payment_ref) where payment_ref is not null;
```

---

## 2. Emails con Resend (gratis hasta 3.000/mes)

1. Creá una cuenta en https://resend.com
2. **API Keys → Create API Key**, copiala.
3. (Opcional) Verificá tu dominio para enviar desde `licencias@tudominio.com`.
   Si no, se usa el remitente de prueba `onboarding@resend.dev`.
4. Variables en Vercel:

```
RESEND_API_KEY=re_xxxxxxxxxxxx
LICENSE_EMAIL_FROM=Inteliar Label <licencias@tudominio.com>   # opcional
NEXT_PUBLIC_APP_URL=https://v0-inteliar-labels-ui.vercel.app
```

> Si no configurás `RESEND_API_KEY`, la licencia igual se genera y queda
> visible en `/admin`, pero el email no se envía.

---

## 3. MercadoPago

1. Entrá a https://www.mercadopago.com.ar/developers → tu aplicación.
2. Copiá el **Access Token** (producción).
3. Creá un **link de pago** para cada plan (Mensual / De por vida). En el
   título poné algo que identifique el plan — el sistema detecta "de por vida"
   o "lifetime" en el texto; cualquier otra cosa se toma como mensual.
4. Configurá el **Webhook / Notificaciones IPN** apuntando a:

```
https://<tu-dominio>/api/webhooks/mercadopago
```

5. Variables en Vercel:

```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxx
NEXT_PUBLIC_CHECKOUT_MONTHLY_URL=https://mpago.la/xxxxx
NEXT_PUBLIC_CHECKOUT_LIFETIME_URL=https://mpago.la/yyyyy
```

Las dos últimas URLs son los links de pago que creaste — la página de precios
los usa en los botones "Comprar".

---

## 4. Stripe (opcional, para clientes del exterior)

1. https://dashboard.stripe.com → **Developers → Webhooks → Add endpoint**:

```
https://<tu-dominio>/api/webhooks/stripe
```

   Seleccioná el evento **`checkout.session.completed`**.
2. Copiá el **Signing secret** del webhook (`whsec_...`).
3. Creá un **Payment Link** por plan. En el producto, agregá metadata
   `plan = monthly` o `plan = lifetime` para que la licencia salga con el plan
   correcto.
4. Variable en Vercel:

```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx
```

Si querés usar los links de Stripe en los botones de la web en vez de los de
MercadoPago, poné esas URLs en `NEXT_PUBLIC_CHECKOUT_MONTHLY_URL` /
`NEXT_PUBLIC_CHECKOUT_LIFETIME_URL`.

---

## 5. Probar

- **MercadoPago**: usá una tarjeta de prueba y verificá que aparezca la
  licencia nueva en `/admin` y que llegue el email.
- **Stripe**: desde el dashboard → Webhooks → "Send test webhook" con
  `checkout.session.completed`.

Cualquier error queda logueado en los **Logs de Vercel** (Functions) con el
prefijo `[mp-webhook]` o `[stripe-webhook]`.

---

## Resumen de variables de entorno

| Variable | Para qué | Obligatoria |
|---|---|---|
| `RESEND_API_KEY` | Enviar la clave por email | Recomendada |
| `LICENSE_EMAIL_FROM` | Remitente del email | No |
| `NEXT_PUBLIC_APP_URL` | Link "Ir a la app" en el email | No |
| `MERCADOPAGO_ACCESS_TOKEN` | Validar pagos de MercadoPago | Sí (si usás MP) |
| `STRIPE_WEBHOOK_SECRET` | Validar pagos de Stripe | Sí (si usás Stripe) |
| `NEXT_PUBLIC_CHECKOUT_MONTHLY_URL` | Botón comprar mensual | Recomendada |
| `NEXT_PUBLIC_CHECKOUT_LIFETIME_URL` | Botón comprar de por vida | Recomendada |
| `ADMIN_EMAILS` | Acceso al panel `/admin` | Sí |
