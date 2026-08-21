---
name: sdd
description: Comando SDD (Spec-Driven Development) para Devin. Idea → spec → plan → código con gates de aprobación. Equivalente al comando /sdd de opencode.
allowed-tools:
  - read
  - write
  - edit
  - run_subagent
  - ask_user_question
  - todo_write
  - exec
  - grep
  - find_file_by_name
triggers:
  - user
---

# Comando SDD

Comando directo para ejecutar el pipeline Spec-Driven Development en Devin.

## Uso

Cuando el usuario quiera construir una feature nueva usando SDD, este skill
orquesta el proceso completo.

## Instrucciones

1. Cargá el skill `sdd-orchestrator` (`.devin/skills/sdd-orchestrator/SKILL.md`).
2. El skill `sdd-orchestrator` contiene el playbook completo del pipeline SDD.
3. Seguí las instrucciones del orquestador paso a paso.
4. Usá `ask_user_question` para los gates de aprobación.
5. Usá `run_subagent` para coordinar los subagentes (spec-writer, architect, etc.).
6. Usá `todowrite` para seguimiento de tareas.

## Parámetros

El usuario debe proporcionar:
- **idea**: Descripción de la feature a construir (ej. "quiero una lista de deseos")

## Flujo

```
idea → spec (docs/specs/<slug>.md) → [gate: aprobación?]
     → plan (docs/plans/<slug>.md) → [gate: aprobación?]
     → implementación (paralela cuando posible)
     → verificación (typecheck + lint:fix)
     → review (diff vs spec/plan)
     → resumen final
```

## Notas

- Este skill es equivalente al comando `/sdd` de opencode.
- Usa la configuración centralizada en `.opencode/agents/` y `.opencode/skills/`.
- Los adaptadores en `.devin/skills/opencode-agent/` y `.devin/skills/opencode-skill/`
  permiten que los subagentes de Devin sigan las instrucciones de opencode.
