# PickMe — Prototipo Inicial (POC)

Este directorio contiene el código del primer prototipo visual (*Proof of Concept*) desarrollado en Octubre 2026.

## Propósito de este archivo
* **Preservación de activos**: Conserva los componentes visuales (`StudentCard`, `BoardHeader`, `QRPanel`, `StudentModal`), los tokens de estilos CSS (`globals.css`), el sistema de avatares (`avatars.ts` con 20 animales y 10 colores) y los experimentos de UI.
* **Consulta y ahorro de tokens**: Servirá como referencia estética y de microanimaciones para la construcción de los componentes definitivos del sistema de diseño en la nueva arquitectura.

## Por qué se archivó como POC
El prototipo inicial mezcló responsabilidades del **display público de portón** (Layer 0, 100% anónimo y pasivo) con **controles interactivos de prueba y datos privados** (modales de custodia, datos de apoderados y chat simulado).

La nueva arquitectura separa limpiamente:
1. **El Producto Real**: Display pasivo de Smart TV, flujo web del Picker (`/retirar`) y consola de entrega del Staff (`/staff`).
2. **El Dashboard de Sofía (Admin)**: Gestión escolar y entorno privado de simulación y validación de sesiones.

