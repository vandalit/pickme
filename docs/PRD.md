# PickMe — Product Requirements Document (PRD)

**Versión**: 1.0 — MVP Funcional  
**Fecha**: Noviembre 2026  
**Estado**: Especificación Aprobada para Desarrollo  

---

## 1. Contexto y Definición del Problema

### 1.1 Contexto de Mercado
Sofía es coordinadora de una escuela primaria de 300 alumnos. Todos los días a las 14:30 hs se genera un colapso en el portón de salida: autos en doble fila, cientos de padres, abuelos, tíos y transportistas escolares agolpados, maestras con listas de papel intentando identificar quién puede llevarse a qué niño, y alumnos esperando en el patio.

La escuela intentó en el pasado implementar una aplicación móvil escolar nativa (Play Store / App Store), pero fracasó rotundamente: **menos del 25% de los apoderados la instaló o mantuvo activa**. El canal universal y no negociable de las familias es el **navegador web y WhatsApp**.

### 1.2 Problemas Críticos a Resolver

| # | Problema Operativo | Impacto en la Escuela | Solución en PickMe |
|---|---|---|---|
| **P1** | **Personas no registradas en portón** | La maestra no sabe si entregar al menor ante alguien desconocido | Registro anticipado de Pickers con confirmación legal del apoderado. |
| **P2** | **Exposición de identidad de menores** | Anotar nombres o vocear niños vulnera la privacidad y seguridad infantil | Display público anónimo en Smart TV con sistema visual *Animal + Color* (Layer 0). |
| **P3** | **Quiebre de la cadena de custodia** | No existe comprobante verificable de a quién se le entregó el niño ni a qué hora | Traspaso físico sellado con *Handover Code* de 6 dígitos y registro inmutable en DB. |
| **P4** | **Pérdida de autorizaciones en papel** | Permisos firmados en cuadernos quedan olvidados en mochilas | Autorización digital legal con timestamps, IP y opción de micro-video. |
| **P5** | **Adopción nula por fricción de instalación** | Padres rechazan crear cuentas y descargar apps pesadas | 100% web móvil mediante enlaces mágicos y QR directo. Cero descargas. |

---

## 2. Restricciones No Negociables del Producto
1. ❌ **Cero descargas de apps para padres y pickers**: Todo funciona en el navegador del teléfono móvil.
2. ❌ **Cero datos privados en pantallas públicas**: El Smart TV del portón jamás exhibe nombres, apellidos, fotos ni iniciales.
3. ✅ **Validez legal en el Apoderado**: La autorización y la confirmación de entrega corresponden jurídicamente al apoderado (tutor legal), no al picker.
4. ✅ **Arquitectura Freemium / Product-Led**: Sofía puede registrarse con su cuenta de Google, configurar su colegio y probar una sesión simulada en menos de 3 minutos antes de cargar alumnos reales.

---

## 3. Taxonomía del Dominio Escolar

La estructura organizativa del colegio se define con la siguiente jerarquía:

```
[Escuela / Institución] (Ej. Escuela San Martín)
  │
  ├── [Sede / Campus] (Opcional, default: Sede Central)
  │
  ├── [Salón / Aula / Curso] (Ej. 1° Básico "A", 2° Básico "B")
  │     │
  │     └── [Alumnos] (Identificados internamente por UUID y públicamente por Animal + Color)
  │
  └── [Sesión de Retiro / Pickup Session]
        ├── Horario / Turno (Ej. "Salida Turno Tarde 14:30")
        ├── Cursos incluidos (Uno, varios o toda la escuela)
        ├── Token QR dinámico firmado (rotación automática)
        └── Eventos de Custodia (Timeline de cada entrega)
```

---

## 4. Usuarios, Roles y Canales de Acceso

### 4.1 Administradora (Sofía)
* **Perfil**: Directora o coordinadora general del establecimiento.
* **Acceso**: Web Desktop / Tablet con **Google OAuth** (cuenta escolar o personal).
* **Capacidades**:
  * Configurar salones, turnos y cargar nómina de alumnos (manual o CSV).
  * Monitorear dashboard de sesiones en tiempo real.
  * **Entorno de Simulación / Sandbox Privado**: Probar dinámicas de retiro con datos mock para validar la conexión de pantallas, códigos y flujo antes de operar en vivo.
  * Gestión de incidentes y auditoría histórica inmutable.

### 4.2 Staff de Entrega (Maestra / Auxiliar de Portón)
* **Perfil**: Docente o funcionario responsable de la entrega física del alumno en el portón.
* **Acceso**: Web Mobile / Tablet en `/staff`, autenticada mediante credenciales asignadas por Sofía.
* **Capacidades**:
  * Visualizar solicitudes de retiro en tiempo real (Layer 1: Avatar + Iniciales del menor + Nombre del Picker).
  * Verificar coincidencia visual del picker autorizado.
  * Tipear en teclado táctil el *Handover Code* de 6 dígitos que presenta el picker para autorizar la salida física.

### 4.3 Picker (Persona que retira)
* **Perfil**: Familiar, transporte escolar, nana o vecino autorizado para recoger al alumno.
* **Acceso**: Web móvil en `/retirar` tras escanear el QR del Smart TV (o tipear el código alfanumérico). **Sin contraseña ni registro en tiendas de apps**.
* **Capacidades**:
  * Indicar a qué alumno viene a buscar e ingresar su número de WhatsApp.
  * Ver el estado de su solicitud ("En preparación por staff").
  * Exhibir el *Handover Code* de 6 dígitos al aproximarse al portón de entrega.

### 4.4 Apoderado (Padre, Madre o Tutor Legal)
* **Perfil**: Responsable legal del alumno ante la institución.
* **Acceso**: Enlace mágico (*Magic Link*) temporal enviado por WhatsApp / SMS. Sin contraseñas.
* **Capacidades**:
  * Registrar y revocar pickers (permanentes, por fecha o emergencia).
  * Recibir notificación inmediata cuando su hijo es entregado al picker.
  * Confirmar llegada segura al hogar (*Llegó bien ✓* o *Reportar incidente ⚠️*).

### 4.5 Smart TV Board (Pantalla Pública del Portón)
* **Perfil**: Pantalla grande (55"+) montada en el portón exterior orientada a la calle.
* **Acceso**: URL `/board/[sessionId]` abierta en navegador de Smart TV.
* **Comportamiento**:
  * **100% Pasivo y Anónimo (Layer 0)**: Cuadrícula de alumnos identificados únicamente por emoji de Animal + Color y estado (*Esperando*, *En proceso*, *Retirado*).
  * Muestra código QR grande firmado con rotación periódica y código alfanumérico de contingencia.
  * Cero botones, filtros o modales que expongan información privada a la vía pública.

---

## 5. Arquitectura de Privacidad (Las 3 Capas de Identidad)

```
┌────────────────────────────────────────────────────────────────────────┐
│ Layer 0 — Portón Público (Smart TV en la calle)                        │
│   • Animal + Color único por salón (Ej: "Cocodrilo Amarillo")          │
│   • Cero nombres, fotos ni iniciales visibles al transeúnte            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Layer 1 — Dispositivo Staff (Tablet autenticada en portón)             │
│   • Avatar visual + Iniciales (Ej: "S.M.")                             │
│   • Nombre del Picker y quién lo autorizó (Visto solo por personal)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Layer 2 — Consola Admin / Apoderado Autenticado                        │
│   • Nombre completo, RUN/DNI hasheado, teléfono y auditoría completa   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Flujo Operativo de Retiro Escolar (The Core Journey)

```
PASO 1 — Llegada y Escaneo
  Picker llega al portón ➔ Escanea el QR del Smart TV con la cámara nativa de su celular.
  Se abre automáticamente https://pickme.app/retirar?session=... (sin descargas).

PASO 2 — Solicitud del Alumno
  Picker ingresa su número de WhatsApp y busca al alumno.
  Backend valida: ¿Existe autorización activa del apoderado para este picker y este alumno?
  • Si NO ➔ Bloqueo inmediato con mensaje: "No autorizado. Contacta al apoderado".
  • Si SÍ ➔ Se encola la entrega. El alumno pasa a "En proceso 🔄" en el Smart TV (Layer 0).

PASO 3 — Alerta al Staff
  La tablet de la maestra en `/staff` recibe la alerta en tiempo real (Pusher):
  "Juan Pérez (Chofer) está en puerta para retirar a S.M. (Cocodrilo Amarillo)".
  La maestra localiza físicamente al alumno en el patio y lo acompaña al portón.

PASO 4 — Generación y Cierre de Handover Code
  El sistema genera un código numérico efímero de 6 dígitos visible en la pantalla del Picker.
  La maestra verifica visualmente a la persona y tipea el código en su tablet.
  Al coincidir:
  • El alumno pasa a "Retirado ✓" en el Smart TV.
  • Se sella el evento físico con staffId, pickerId y timestamp exacto.

PASO 5 — Notificación y Cierre de Custodia
  El apoderado recibe notificación de entrega:
  "[Nombre Alumno] fue retirado por [Picker] a las 14:32. ¿Confirmas que llegó bien?"
  • Al confirmar ➔ Evento pasa a ARRIVED (Cadena de custodia sellada).
  • Si pasan 30 min sin respuesta o apoderado reporta alerta ➔ Alerta en panel de Sofía.
```

---

## 7. Criterios de Aceptación del MVP (Product Gate)
1. **CA-1 (Anonimato Estricto)**: Tablero `/board` 100% pasivo y anónimo sin fugas de datos privados.
2. **CA-2 (Operación Web sin Apps)**: Picker solicita y recibe código desde cualquier navegador móvil.
3. **CA-3 (Validación de Traspaso)**: Entrega sellada mediante Handover Code de 6 dígitos.
4. **CA-4 (Cadena de Custodia Inmutable)**: Trazabilidad completa en PostgreSQL de cada retiro.
5. **CA-5 (Onboarding con Google Auth y Simulador)**: Sofía puede registrarse con Google y validar la dinámica completa con datos simulados desde su panel en menos de 3 minutos.
