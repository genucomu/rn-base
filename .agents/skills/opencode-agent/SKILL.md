---
name: opencode-agent
description: Carga y ejecuta instrucciones de un agente opencode específico (spec-writer, architect, implementer, reviewer). Use when a subagent needs to follow opencode agent instructions.
allowed-tools:
  - read
  - write
  - edit
  - exec
  - grep
  - find_file_by_name
triggers:
  - model
---

# Adaptador Opencode Agent

Este skill carga las instrucciones de un agente específico del sistema opencode
y las ejecuta en el contexto de Devin.

## Uso

Cuando te indiquen que actúes como un agente opencode específico (spec-writer,
architect, implementer, reviewer), seguí estos pasos:

1. Leé el archivo correspondiente en `.opencode/agents/<agent-name>.md`
2. Cargá el skill `stack-overview` desde `.opencode/skills/stack-overview/SKILL.md`
3. Si tu tarea lo requiere, cargá skills adicionales de `.opencode/skills/`
4. Ejecutá las instrucciones del agente según las especificaciones

## Agentes disponibles

- **spec-writer**: `.opencode/agents/spec-writer.md` - Escribe specs en `docs/specs/`
- **architect**: `.opencode/agents/architect.md` - Crea planes en `docs/plans/`
- **implementer**: `.opencode/agents/implementer.md` - Implementa tareas del plan
- **reviewer**: `.opencode/agents/reviewer.md` - Revisa implementación vs spec/plan

## Skills de soporte

- **stack-overview**: `.opencode/skills/stack-overview/SKILL.md` - Información del stack
- **new-screen**: `.opencode/skills/new-screen/SKILL.md` - Helper para nuevas pantallas
- **component-generator**: `.opencode/skills/component-generator/SKILL.md` - Generador de componentes

## Notas

- Este skill actúa como puente entre el sistema opencode y Devin
- Las instrucciones específicas de cada agente están en sus archivos .md correspondientes
- Siempre seguí las convenciones del proyecto rn-base (Biome, TanStack Query, Zustand, etc.)
