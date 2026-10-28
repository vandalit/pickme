# 🏫 PickMe

> Sistema digital de gestión de salida escolar con cadena de custodia auditable.

PickMe reemplaza el caos del portón escolar con un flujo verificado y anónimo de entrega de alumnos — sin que los padres instalen ninguna app nueva.

---

## ¿Qué resuelve?

| Problema | Solución PickMe |
|---|---|
| No se sabe quién viene a buscar a los niños | Registro de pickers autorizados por apoderado |
| Las maestras no saben qué hacer con personas desconocidas | Validación en tiempo real con confirmación del apoderado |
| Datos de alumnos expuestos en display público | Sistema de anonymización: Animal + Color en la TV |
| Sin registro de quién retiró a quién | Cadena de custodia auditable con handover code |
| Autorizaciones de papel que se pierden | Autorización digital con confirmación de apoderado (con validez legal) |

---

## Actores del sistema

```
Admin (Sofía)   → gestiona escuela, alumnos, sesiones
Apoderado       → autoriza pickers, confirma llegada, aprobación legal
Picker          → recoge al alumno (chofer, nana, familiar)
Staff           → entrega físicamente al alumno en el portón
Smart TV Board  → display público en el portón de salida
```

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15 (App Router) |
| Estilos | CSS custom con design tokens |
| Backend | Next.js API Routes + tRPC |
| Base de datos | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (magic link) |
| WhatsApp | Twilio / Meta Cloud API |
| Real-time | Pusher (WebSocket managed) |
| QR | qrcode.js |
| Hosting | Vercel + Supabase |

Ver detalles completos → [`docs/STACK.md`](docs/STACK.md)

---

## Documentación

| Documento | Descripción |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Product Requirements Document — qué construimos y por qué |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Hoja de ruta: MVP → V2 → V3 |
| [`docs/STACK.md`](docs/STACK.md) | Stack técnico detallado con justificaciones |
| [`docs/TASKFLOWS.md`](docs/TASKFLOWS.md) | Flujos funcionales de cada actor del sistema |

---

## Estructura del proyecto

```
pickme/
├── README.md
├── docs/
│   ├── PRD.md
│   ├── ROADMAP.md
│   ├── STACK.md
│   └── TASKFLOWS.md
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (board)/            # Vista pública Smart TV
│   │   ├── (staff)/            # Vista staff autenticado
│   │   ├── (admin)/            # Panel de administración
│   │   ├── (picker)/           # Flujo de retiro (sin auth)
│   │   └── api/                # API Routes + webhooks
│   ├── components/
│   ├── lib/
│   └── styles/
├── prisma/
│   └── schema.prisma
└── package.json
```

---

## Cómo correr localmente

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Migrar base de datos
npx prisma migrate dev

# Correr dev server
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## MVP testeable

El MVP cubre el flujo completo de retiro:

1. Admin carga alumnos y abre sesión de salida
2. Board muestra QR + alumnos con código Animal+Color
3. Picker escanea QR, se identifica, indica a quién busca
4. Staff recibe validación en su tablet, confirma la entrega
5. Se genera handover code que el staff ingresa para cerrar el traspaso
6. Apoderado recibe notificación y confirma (o graba micro-video de confirmación)
7. Evento queda registrado y auditado

> GPS tracking y bot conversacional de WhatsApp se integran en V2.
