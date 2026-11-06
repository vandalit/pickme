# PickMe — Documento de Requisitos de Producto (PRD)

**Versión**: 2.0 — Especificación de Producto y Gobernanza Escolar  
**Fecha**: Noviembre 2026  
**Estado**: Especificación Aprobada para Desarrollo  
**Público Objetivo**: Directores de Colegio, Auxiliares de Portón, Familias y Evaluadores de Certificación UX  

---

## 1. Contexto, Problema y Oportunidad

### 1.1 Contexto de Mercado
Sofía es coordinadora de una escuela primaria de 300 alumnos. Todos los días a las 14:30 hrs se genera un colapso en el portón de salida: autos en doble fila, cientos de padres, abuelos, tíos y transportistas escolares agolpados, maestras con listas de papel intentando identificar quién puede llevarse a qué niño, y alumnos esperando en el patio.

La escuela intentó en el pasado implementar una aplicación móvil escolar nativa (Play Store / App Store), pero fracasó rotundamente: **menos del 25% de los apoderados la instaló o mantuvo activa**. El canal universal y no negociable de las familias es el **navegador web móvil y WhatsApp**.

### 1.2 Matriz de Problemas Operativos

| # | Problema Operativo | Impacto en la Escuela | Solución en PickMe |
|---|---|---|---|
| **P1** | **Personas no registradas en portón** | La maestra no sabe si entregar al menor ante alguien desconocido | Registro anticipado de Pickers con confirmación legal del apoderado. |
| **P2** | **Exposición de identidad de menores** | Anotar nombres o vocear niños vulnera la privacidad y seguridad infantil | Display público anónimo en Smart TV con sistema visual *Animal + Color* (Capa 0). |
| **P3** | **Quiebre de la cadena de custodia** | No existe comprobante verificable de a quién se le entregó el niño ni a qué hora | Traspaso físico sellado con *Handover Code* de 6 dígitos y registro inmutable en DB. |
| **P4** | **Pérdida de autorizaciones en papel** | Permisos firmados en cuadernos quedan olvidados en mochilas | Autorización digital legal con timestamps e IP del apoderado titular. |
| **P5** | **Adopción nula por fricción de instalación** | Padres rechazan crear cuentas y descargar apps pesadas | 100% web móvil mediante escaneo de QR directo. Cero descargas. |
| **P6** | **Falta de gobernanza para la dirección** | La directora no tiene trazabilidad ni forma de despachar las pantallas | Consola ejecutiva con Launchpad de jornada, nómina y auditoría forense. |

---

## 2. Restricciones No Negociables del Producto
1. ❌ **Cero descargas de apps para padres y pickers**: Todo opera desde el navegador web móvil del teléfono.
2. ❌ **Cero datos privados en pantallas públicas**: El Smart TV del patio jamás exhibe nombres, apellidos, fotos ni iniciales.
3. ❌ **Cero atajos ficticios en el login**: Autenticación formal con credenciales institucionales o Google Workspace OAuth; sin botones de "Modo Demo" en el formulario de acceso.
4. ✅ **Validez legal en el Apoderado**: La autorización y la confirmación de entrega corresponden jurídicamente al apoderado (tutor legal), no al picker.
5. ✅ **Launchpad de Jornada**: La dirección escolar debe poder abrir la jornada y despachar las URLs de Smart TV y Portón con un solo clic.

---

## 3. Personas y Actores del Servicio

### 3.1 Sofía Valenzuela — Directora / Administradora (Consola `/admin`)
* **Objetivo**: Garantizar una salida escolar ordenada, rápida y jurídicamente blindada.
* **Dolores**: Miedo a entregar un niño a la persona equivocada, falta de métricas de tiempos de espera, caos de apoderados en portería.
* **Necesidades en la plataforma**:
  * Abrir y cerrar la jornada de salida escolar (`SAN-1024`).
  * Despachar con 1 clic el enlace a la Smart TV del patio y a la tablet del portón.
  * Consultar la nómina completa de alumnos (Capa 2: nombres reales y sus apoderados).
  * Auditar en tiempo real el embudo de salida: Esperando ➔ En Portón ➔ Retirados.

### 3.2 Carlos Mendoza — Personal Escolar en Portón (Consola `/staff`)
* **Objetivo**: Despachar a los niños con rapidez sin cometer errores de entrega.
* **Dolores**: Pantallas pequeñas con letras ilegibles bajo el sol, distracciones de padres gritando.
* **Necesidades en la plataforma**:
  * Cola en vivo de alumnos llamados por orden de llegada.
  * Tarjeta clara con iniciales del niño y nombre del retirador autorizado.
  * Teclado numérico táctil de mínimo 64px para validar el Handover Code de 6 dígitos.

### 3.3 Ignacio Herrera — Retirador / Picker Móvil (`/retirar`)
* **Objetivo**: Retirar a Mateo de forma ágil sin demorarse ni hacer filas interminables.
* **Dolores**: No quiere descargar una aplicación más ni recordar contraseñas complejas.
* **Necesidades en la plataforma**:
  * Escanear el QR pegado en el portón o hacer clic en el enlace.
  * Ingresar su teléfono y seleccionar el alumno autorizado.
  * Mostrar en pantalla su código de 6 dígitos al auxiliar Carlos.

---

## 4. Épicas de Producto y Requerimientos Funcionales

### Épica 1: Pantalla Mural Pasiva de Patio (CA-1 — Capa 0)
* **RF-1.1**: Proyección en alta resolución (1080p) con diseño de alto contraste adaptado para visualización a 15 metros de distancia.
* **RF-1.2**: Mapeo visual estricto: el alumno es identificado únicamente por su par `Animal + Color` asignado (ej: *Zorro Naranja*).
* **RF-1.3**: Actualización reactiva de estados (`WAITING` ➔ `IN_PROCESS` ➔ `PICKED_UP`) en tiempo real.

### Épica 2: Flujo Web Móvil del Retirador (CA-2 — Capa 1)
* **RF-2.1**: Acceso sin login ni descarga de app mediante escaneo de QR o URL con parámetro `?session=CODE`.
* **RF-2.2**: Búsqueda por número de teléfono del picker con verificación de autorizaciones activas.
* **RF-2.3**: Selección de alumnos vinculados y generación del Handover Code de 6 dígitos con cuenta regresiva visible (TTL: 10 min).

### Épica 3: Validación y Sellado de Traspaso en Portón (CA-3 — Capa 1)
* **RF-3.1**: Cola viva ordenada cronológicamente de alumnos requeridos en portería.
* **RF-3.2**: Modal de validación táctil con teclado de 64px protegido contra ingresos erróneos repetidos.
* **RF-3.3**: Cierre atómico de custodia: cambio a estado `IN_TRANSIT` registrando el timestamp y el auxiliar responsable.

### Épica 4: Cadena de Custodia Inmutable (CA-4 — Capa 2)
* **RF-4.1**: Registro persistente en PostgreSQL de cada transición de custodia con timestamps UTC.
* **RF-4.2**: Trazabilidad completa de incidentes (retrasos severos, intentos de retiro no autorizados).

### Épica 5: Consola Administrativa y Launchpad Escolar (CA-5 — Capa 2)
* **RF-5.1**: Tablero de Control de Jornada: apertura y cierre formal de sesión de salida escolar.
* **RF-5.2**: Launchpad de Despacho: generación directa y copia de enlaces para Smart TV (`/board/[id]`), Portón (`/staff`) y Afiche QR para apoderados (`/retirar?session=[id]`).
* **RF-5.3**: Gestión de Nómina y Cursos: visualización de la jerarquía Colegio ➔ Salones ➔ Alumnos con sus apoderados y asignación de Animal+Color.
* **RF-5.4**: Libro de Auditoría Forense: bitácora completa de entregas con exportación de actas legales.
* **RF-5.5**: Sandbox Guiado: simulador de pruebas para evaluar el ciclo escolar en < 3 minutos.
