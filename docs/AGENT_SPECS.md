# Especificaciones Técnicas y Traza del Ecosistema de Agentes

> Documento interno de ingeniería para orquestación y persistencia de memoria contextual.

---

## 1. Identidad del Agente
- **Agente**: Antigravity (Google DeepMind)
- **Modelo**: Advanced Agentic Coding Assistant
- **Entorno de Ejecución**: Linux (WSL2), Sandbox seguro con bypass autorizado para servicios de red/Docker.
- **Rutas de Memoria y Contexto Persistente**:
  - `~/.gemini/antigravity/brain/<conversation-id>/`
  - Transcripciones estructuradas: `.system_generated/logs/transcript.jsonl`
  - Tareas en segundo plano: `.system_generated/tasks/`
  - Artefactos dinámicos: `estado-pickme.md`

---

## 2. Jerarquía de Lectura de Contexto
Para garantizar coherencia de arquitectura y diseño sin pérdida de memoria entre sesiones:
1. `docs/SDD.md` (System Design Document & Contratos de Datos)
2. `docs/PRD.md` (Product Requirements Document & Caso Sofía)
3. `docs/INFORMATION_ARCHITECTURE.md` (Taxonomía, Rutas y Componentes UX)
4. `docs/ROADMAP.md` (Fases e Hitos de Ejecución)
5. `README.md` (Visión General y Documentación del Caso de Estudio)

---

## 3. Reglas de Operación Git del Agente
- **Commits Locales Únicamente**: Realizar commits frecuentes siguiendo *Conventional Commits* (`feat:`, `chore:`, `style:`, `docs:`) tras cada hito validado.
- **Prohibición Estricta de Push**: Jamás ejecutar `git push` hacia repositorios remotos salvo indicación manual explícita del usuario.
- **Verificación Pre-Commit**: Todo commit debe estar respaldado por `tsc --noEmit` con 0 errores y compilación `npm run build` exitosa.

