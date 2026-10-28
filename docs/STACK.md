# PickMe — Stack Técnico

**Principios que guían el stack**:
- Todo el flujo del picker/apoderado debe funcionar en el navegador (cero instalaciones)
- El board del Smart TV debe ser robusto y auto-refrescante
- Real-time es crítico para el board y las notificaciones de staff
- La base de datos necesita soporte para relaciones complejas y auditoría

---

## Stack Principal

### Frontend — Next.js 15 (App Router)

**Por qué Next.js:**
- Múltiples vistas con comportamientos radicalmente distintos en una sola codebase:
  - `/board` — display público, sin auth, websocket activo, full-screen
  - `/staff` — autenticado, notificaciones en tiempo real
  - `/admin` — dashboard completo
  - `/retirar` — flujo público del picker, sin auth
  - `/apoderado` — portal personal, magic link
- SSR para SEO y carga rápida en dispositivos móviles (importante para pickers con datos limitados)
- API Routes integradas — no necesitamos un servidor separado para el MVP
- App Router facilita layouts anidados (board layout vs. dashboard layout)

### Estilos — CSS Custom con Design Tokens

- Vanilla CSS con variables CSS para design tokens (colores, tipografía, espaciado)
- Sin frameworks de UI — control total sobre las animaciones y micro-interacciones del Board
- El Board necesita animaciones específicas (estados cambiando, QR pulsando) que son más fáciles de hacer con CSS puro
- Fuente: **Inter** (Google Fonts) — legible en Smart TV y en móvil

### Backend — Next.js API Routes

- Para el MVP, las API Routes de Next.js son suficientes
- Evita overhead de un servidor separado
- Migración a microservicios o servidor dedicado es posible sin cambiar el frontend

### Base de Datos — PostgreSQL + Prisma ORM

**Por qué PostgreSQL:**
- Relaciones complejas (Student ↔ Guardian ↔ Picker ↔ Authorization ↔ PickupEvent)
- Soporte nativo para UUID, JSONB (GPS tracks), timestamps con timezone
- Auditoría confiable: filas inmutables con triggers o soft deletes

**Por qué Prisma:**
- Type-safety end-to-end con TypeScript
- Migraciones declarativas
- Studio para que Sofía pueda eventualmente inspeccionar datos sin SQL

### Autenticación — NextAuth.js

- **Apoderado y Picker**: Magic Link (link con token de un solo uso enviado por WhatsApp)
  - Sin contraseña, sin cuenta nueva, solo WhatsApp
  - El link expira en 15 minutos
- **Staff y Admin**: Email + contraseña o magic link (a definir)
- Sesiones en JWT, sin cookies complejas

### WhatsApp — Twilio API for WhatsApp (MVP) → Meta Cloud API (V2)

**MVP con Twilio:**
- Setup más rápido (sandbox de WhatsApp disponible de inmediato para testing)
- SDKs maduros para Node.js
- Pricing por mensaje, viable para escuela de 300 alumnos

**V2 con Meta Cloud API:**
- API oficial de WhatsApp Business, sin intermediario
- Necesita cuenta de Meta Business verificada (proceso de semanas)
- Más barato a escala

**Uso en MVP:**
- Envío de magic links a apoderados
- Notificación de retiro al apoderado
- Confirmación de llegada (botones de respuesta rápida)
- Alertas de incidentes

### Real-time — Pusher Channels

**Por qué Pusher y no WebSockets nativos:**
- El Board del Smart TV necesita actualizarse sin recargar la página
- WebSockets nativos requieren un servidor stateful (no compatible con Vercel serverless)
- Pusher es WebSocket as a Service, compatible con Vercel
- Plan gratuito: 100 conexiones simultáneas / 200k mensajes diarios — suficiente para el MVP
- SDK para Next.js muy maduro

**Alternativa**: Supabase Realtime (si usamos Supabase como DB, viene incluido)

### Generación de QR — qrcode.js

- Generación client-side en el Board
- El QR codifica: `https://pickme.app/retirar?session={sessionToken}&t={timestamp}`
- Se regenera automáticamente cada N minutos (configurable)
- Nativo del browser, cero dependencias del servidor para generarlo

### Hosting

| Servicio | Uso |
|---|---|
| **Vercel** | Frontend + API Routes (serverless) |
| **Supabase** | PostgreSQL managed + Supabase Auth (alternativa a NextAuth) |
| **Pusher** | WebSocket real-time |
| **Twilio** | WhatsApp mensajería |

**Costo estimado MVP** (300 alumnos, 1 escuela):
- Vercel: Free / Pro $20/mes
- Supabase: Free tier suficiente para MVP
- Pusher: Free tier suficiente para MVP
- Twilio: ~$0.005/mensaje → estimado < $10/mes para una escuela

---

## Diagrama de Arquitectura

```
                        ┌─────────────────────────────────┐
                        │           VERCEL                │
                        │                                  │
  Smart TV   ─────────→ │  /board      (SSR + Pusher sub) │
  Picker     ─────────→ │  /retirar    (SSR, no auth)     │
  Staff      ─────────→ │  /staff      (SSR + auth)       │
  Admin      ─────────→ │  /admin      (SSR + auth)       │
  Apoderado  ─────────→ │  /apoderado  (magic link)       │
                        │                                  │
                        │  /api/...    (API Routes)        │
                        └────────────┬────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
        ┌──────────┐          ┌──────────┐          ┌──────────┐
        │ Supabase │          │  Pusher  │          │  Twilio  │
        │ PostgreSQL│         │ Channels │          │ WhatsApp │
        └──────────┘          └──────────┘          └──────────┘
                                    │
                         Smart TV recibe eventos
                         Staff recibe alertas
```

---

## Variables de Entorno Requeridas

```env
# Database
DATABASE_URL=

# Auth
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Pusher
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=

# Twilio / WhatsApp
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=

# App
NEXT_PUBLIC_APP_URL=
QR_REFRESH_INTERVAL_MS=300000   # 5 minutos default
HANDOVER_CODE_EXPIRY_MS=600000  # 10 minutos
GPS_CONFIRMATION_TIMEOUT_MS=1800000  # 30 minutos
```

---

## Estructura del Proyecto

```
pickme/
├── README.md
├── docs/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   └── avatars/
│       ├── animals/        # SVGs de animales para los publicCodes
│       └── human/          # SVGs de avatares humanizados
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── (board)/
│   │   │   └── board/
│   │   │       └── [sessionId]/
│   │   │           └── page.tsx
│   │   ├── (picker)/
│   │   │   └── retirar/
│   │   │       └── page.tsx
│   │   ├── (staff)/
│   │   │   └── staff/
│   │   │       ├── layout.tsx
│   │   │       └── page.tsx
│   │   ├── (admin)/
│   │   │   └── admin/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx
│   │   │       ├── alumnos/
│   │   │       └── sesiones/
│   │   ├── (apoderado)/
│   │   │   └── apoderado/
│   │   │       ├── page.tsx
│   │   │       └── pickers/
│   │   └── api/
│   │       ├── auth/
│   │       ├── sessions/
│   │       ├── pickup/
│   │       ├── pusher/
│   │       └── webhooks/
│   │           └── whatsapp/
│   ├── components/
│   │   ├── board/
│   │   ├── staff/
│   │   ├── admin/
│   │   └── shared/
│   ├── lib/
│   │   ├── db.ts           # Prisma client
│   │   ├── pusher.ts
│   │   ├── whatsapp.ts
│   │   ├── qr.ts
│   │   └── auth.ts
│   └── styles/
│       ├── globals.css
│       └── tokens.css
└── package.json
```
