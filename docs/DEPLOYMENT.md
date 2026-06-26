# Deployment & configuración

## Variables de entorno (Vercel)

| Variable | Requerida | Dónde se usa | Notas |
|----------|-----------|--------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | Cliente y servidor | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Cliente y servidor | Clave pública (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | Opcional | `POST /api/account/delete` | **Solo server-side.** Ver abajo |
| `ANTHROPIC_API_KEY` | Opcional | `POST /api/ai/generate-template` | Necesaria para el editor IA de plantillas. Ver abajo |

### `SUPABASE_SERVICE_ROLE_KEY` — eliminación de cuenta

La baja de cuenta (`/settings → Cuenta → Eliminar cuenta`) siempre borra los
**datos** del usuario (impresoras, plantillas, trabajos). Para eliminar además
el **usuario de autenticación** (el login en Supabase Auth) hace falta la
*service-role key*, porque borrar un usuario de Auth requiere permisos admin.

- **Con** `SUPABASE_SERVICE_ROLE_KEY` cargada → la cuenta se elimina por completo
  (datos + login) en un solo paso.
- **Sin** la key → se borran los datos y se cierra la sesión, pero el usuario de
  Auth queda y hay que eliminarlo manualmente desde
  *Supabase → Authentication → Users*.

#### Cómo cargarla

1. En Supabase: **Project Settings → API → `service_role` secret** → copiar.
2. En Vercel: **Project → Settings → Environment Variables**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: *(la key copiada)*
   - Environments: Production (y Preview si querés probar antes)
   - **Sin** el prefijo `NEXT_PUBLIC_` → así nunca se expone al navegador.
3. Redeploy.

> ⚠️ La service-role key saltea las políticas RLS. Nunca la pongas en código
> cliente ni en variables `NEXT_PUBLIC_*`. Solo se lee dentro de
> `app/api/account/delete/route.ts`, que corre en el servidor.

---

### `ANTHROPIC_API_KEY` — editor IA de plantillas

El botón ✨ en el editor de plantillas llama a `POST /api/ai/generate-template`,
que usa el SDK de Anthropic para generar elementos posicionados automáticamente.
Sin esta key el endpoint devuelve error 500 y el modal no genera nada.

#### Cómo cargarla

1. En [console.anthropic.com](https://console.anthropic.com) → **API Keys** → crear una clave (`sk-ant-...`).
2. En Vercel: **Project → Settings → Environment Variables**
   - Name: `ANTHROPIC_API_KEY`
   - Value: *(la key copiada)*
   - Environments: Production (y Preview si querés probar antes)
   - **Sin** el prefijo `NEXT_PUBLIC_` → nunca se expone al navegador.
3. Redeploy.

> El modelo usado es `claude-haiku-4-5` (rápido y económico para generación de layouts).
> Si la key tiene saldo suficiente, la generación tarda ~2-3 segundos.

---

## Agente de impresión (printer-agent)

El agente es un proceso Node que corre en la máquina del cliente y hace de
puente entre el navegador y las impresoras (TCP/IP, USB, Serie). Escucha en
`http://localhost:9638`.

### Ejecutar desde código
```bash
cd printer-agent
npm install
npm start
```

### Empaquetar el .exe de Windows (sin Node)

Usamos [`@yao-pkg/pkg`](https://github.com/yao-pkg/pkg) (fork de `pkg` que
soporta ESM + Node 20).

**Local:**
```bash
cd printer-agent
npm install
npm run build:win        # genera dist/InteliarPrinterAgent.exe
```

**CI (recomendado):** el workflow `.github/workflows/build-agent.yml`:
- Corre en cada push que toque `printer-agent/**` (en `main` o ramas `claude/**`)
  y también manualmente (*Actions → Build Printer Agent → Run workflow*).
- Sube el `.exe` como **artifact** descargable.
- En `main`, además crea un **Release** (`agent-vN`) con el `.exe` adjunto.

> El build omite la dependencia nativa `serialport` (`npm install --omit=optional`).
> El soporte serie se carga dinámicamente en runtime solo si el cliente instala
> `serialport` aparte; no es necesario para TCP/IP ni USB.

### Distribución al cliente
1. Bajar `InteliarPrinterAgent.exe` desde el Release (o el artifact del workflow).
2. Ejecutarlo (doble clic). No requiere instalación.
3. En la web → **Configuración → Impresoras** → agregar la impresora.
   La configuración persiste en `printers.json`, junto al `.exe`.
