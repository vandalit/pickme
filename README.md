# 🏫 PickMe — Digital School Pickup & Custody

> Sistema digital de gestión de salida escolar con anonimato público y cadena de custodia verificada.  
> **Cero descargas de apps para padres · Layer 0 en Smart TV · Handover Code de 6 dígitos**.

---

## 🎯 ¿Qué es PickMe?

PickMe digitaliza y asegura el horario de retiro escolar en escuelas primarias. Reemplaza las listas de papel y el caos en el portón exterior mediante:
1. **Anonimato en Pantalla Pública (Layer 0)**: Un Smart TV en el portón exhibe a los alumnos esperando utilizando una identidad visual única por curso (*Animal + Color*), sin exponer nombres ni fotos a la vía pública.
2. **Cero Instalaciones para Familias**: Los apoderados y pickers (familiares, choferes) operan 100% desde el navegador web móvil mediante enlaces mágicos y códigos QR.
3. **Traspaso Físico Verificado**: El personal de portón (Staff) solo autoriza la salida física al ingresar un *Handover Code* de 6 dígitos generado en el celular del picker.
4. **Cadena de Custodia Inmutable**: Cada entrega queda sellada con timestamps, IDs de los actores intervinientes y confirmación digital del apoderado.

---

## 🏛️ Estructura del Repositorio

```
pickme/
├── docs/                       # Especificaciones maestras de ingeniería y producto
│   ├── PRD.md                  # Requerimientos de producto y reglas de negocio
│   ├── SDD.md                  # System Design Document y arquitectura técnica
│   └── ROADMAP.md              # Hoja de ruta por fases e hitos
├── POC/                        # Prototipo visual inicial (Archivado para consulta y reuso)
│   ├── README.md
│   └── src/                    # Componentes visuales y tokens del spike inicial
├── prisma/                     # Modelo relacional y migraciones PostgreSQL
│   └── schema.prisma
├── src/                        # Nueva arquitectura modular (Next.js 16 App Router)
├── docker-compose.yml          # Entorno multicontenedor local (App + PostgreSQL)
├── Dockerfile                  # Imagen standalone optimizada de producción
└── README.md
```

---

## 🚀 Puesta en Marcha Rápida (Docker)

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd pickme

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Levantar la aplicación y la base de datos PostgreSQL
docker compose up --build
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📚 Documentación de Referencia

* Para entender la lógica de negocio y el caso de Sofía: [`docs/PRD.md`](docs/PRD.md).
* Para especificaciones de API, contratos, criptografía y base de datos: [`docs/SDD.md`](docs/SDD.md).
* Para arquitectura de información y UX: [`docs/INFORMATION_ARCHITECTURE.md`](docs/INFORMATION_ARCHITECTURE.md).
* Para el avance por hitos: [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## 🤖 Ecosistema de Agentes

* **Agente AI de Desarrollo**: [Antigravity](https://deepmind.google/technologies/gemini/) (Google DeepMind)
* **Entorno de Memoria y Traza Contextual**: `~/.gemini/antigravity/brain/`
* **Directrices y Reglas de Agente**: [`AGENTS.md`](AGENTS.md)

