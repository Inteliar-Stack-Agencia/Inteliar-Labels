# Pricing — por qué está armado así

Contexto: comparamos contra BarTender (líder del rubro). Conclusiones que
llevaron a este esquema:

- BarTender **no vende licencia perpetua indefinida** — solo suscripción o
  contratos de 1/3/5 años. Incluso su modelo "Workstation" (perpetuo) tiene
  un programa para migrar a suscripción, porque les conviene más a ellos.
- BarTender **no tiene plan mensual** (solo contratos anuales) — nuestro
  plan mensual es un diferencial real para el mercado argentino, se
  mantiene.
- BarTender cobra **por impresora/estación**, no por volumen de impresión.
  Nuestro costo técnico de imprimir es casi cero (el trabajo de impresión
  ni siquiera pasa por nuestros servidores — el agente en la PC del
  cliente habla directo con la impresora; solo se guarda un JSON chico de
  metadata por trabajo en Supabase). El límite de 2.000 impresiones/mes
  del plan Mensual es una palanca comercial (empuja al Pro), no un control
  de costo.
- El viejo plan "De por vida" (US$300 / ARS $449.999, sin vencimiento
  nunca) estaba mal pensado: alguien que lo usa 5 años paga ~US$60/año,
  muy por debajo de lo que cuesta dar soporte + mantener el producto a
  largo plazo, y ni el líder del mercado se anima a vender algo así.

## Esquema actual

| Plan | Precio | Vencimiento | Para quién |
|---|---|---|---|
| Mensual | US$12/mes · ARS $17.999/mes | Mientras esté activo | Arrancar, sin compromiso |
| Pro | US$25/mes · ARS $39.999/mes | Mientras esté activo | Volumen medio, varias sucursales |
| Pro · 1 año | US$250 · ARS $379.999 | 1 año desde la compra | Prepago con descuento |
| Pro · 3 años | US$600 · ARS $899.999 | 3 años desde la compra | Prepago con descuento |
| Pro · 5 años | US$800 · ARS $1.199.999 | 5 años desde la compra | Reemplaza al viejo "de por vida" |
| Empresa | A cotizar (WhatsApp) | Según acuerdo | Logística, alto volumen, necesita SLA |

Los planes "Pro · N años" son **pagos únicos** que le dan a la cuenta el
plan `"pro"` con `expires_at` puesto N años en el futuro — no crean un
plan nuevo en la base (no se tocó el enum `licenses.plan`, sigue siendo
`monthly | pro | lifetime`). El límite de dispositivos (3) es el mismo
que el Pro mensual.

## Cómo funciona técnicamente

- `app/api/checkout/create/route.ts`: nuevos plan keys `pro1y`/`pro3y`/`pro5y`.
  - MercadoPago: pago único (`createMPPreference`), con
    `external_reference: "pro:<months>"`.
  - Stripe: sesión de pago único (`mode: "payment"`), con
    `metadata: { plan: "pro", months: "<N>" }`.
- Los webhooks (`app/api/webhooks/mercadopago`, `.../stripe`) parsean ese
  término y lo pasan como `termMonths` a `createLicense()`.
- `lib/create-license.ts`: `termMonths` (default 1) determina cuántos días
  se le suman a `expires_at`, tanto en la creación de una licencia nueva
  como en la renovación de una existente con el mismo email.

## Qué quedó igual (compatibilidad hacia atrás)

- Las licencias `plan = "lifetime"` que ya existen en producción **siguen
  funcionando exactamente igual** (nunca vencen) — no se tocó nada de la
  lógica que las lee (`use-plan-limits.ts`, `license-utils.ts`). Solo se
  sacó la opción de **comprar una nueva** desde la landing.
- El admin panel (`/admin`) todavía puede crear una licencia `lifetime` a
  mano si hace falta un caso especial — no se restringió ahí.

## Plan "Empresa"

No tiene checkout automático — es un botón que abre WhatsApp con un
mensaje prearmado. La idea es cotizar a medida (sucursales, nivel de
soporte/SLA) en vez de venderlo a precio fijo, siguiendo el mismo patrón
que el "Enterprise" de BarTender ("Solicitar presupuesto").
