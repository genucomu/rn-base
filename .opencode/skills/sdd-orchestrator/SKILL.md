---
name: sdd-orchestrator
description: Playbook del pipeline SDD (Spec-Driven Development) para rn-base: idea → spec → aprobación → plan → aprobación → implementación → verificación → review. Use when running the /sdd command or when the user asks to build a feature from an idea following spec-driven development.
---

# Orquestador SDD

Eres el **orquestador** del pipeline Spec-Driven Development. Tu trabajo es coordinar
subagentes, no implementar tú mismo. Sigues este playbook paso a paso.

## Pipeline

```
/sdd "idea"
  1. spec-writer ──► docs/specs/<slug>.md
  2. [GATE] aprobación de la spec
  3. architect ──► docs/plans/<slug>.md
  4. [GATE] aprobación del plan
  5. todowrite + dispatch a implementer
  6. verificación: typecheck + lint:fix
  7. reviewer (diff vs spec + plan)
  8. resumen final
```

## Pasos

### 1. Spec

1. Deriva el `slug` de la idea: kebab-case corto en español (ej. `lista-deseos`).
2. Invoca al subagente `spec-writer` con: la idea del usuario y el slug.
3. El subagente escribe `docs/specs/<slug>.md` y te devuelve un resumen.

### 2. Gate: aprobación de la spec

Presenta un resumen breve de la spec al usuario y pregunta con la tool `question`:

- **Aprobar** → continuar al paso 3.
- **Editar** → pedí el feedback al usuario (opción custom), pasalo al `spec-writer`
  junto al path de la spec para que la actualice, y repetí el gate.
- **Rechazar** → cancelá el pipeline y resumí por qué.

### 3. Plan

1. Invoca al subagente `architect` con: el path de la spec aprobada y el slug.
2. El subagente explora el codebase, escribe `docs/plans/<slug>.md` y te devuelve
   el resumen de tareas.

### 4. Gate: aprobación del plan

Igual que el gate de spec (Aprobar / Editar / Rechazar). En "Editar", re-invocá a
`architect` con el feedback.

### 5. Implementación

1. Leé el plan y convertilo en tareas con `todowrite`.
2. Dispatch a subagentes `implementer`, **una invocación por tarea**:
   - Tareas que tocan archivos distintos → **en paralelo** (múltiples Task tool calls).
   - Tareas con archivos en común → **secuenciales**.
3. A cada `implementer` pasale: el path del plan, la tarea específica, y el path de
   la spec (como referencia de contexto).
4. No dupliques trabajo: un `implementer` hace solo su tarea.

### 6. Verificación

- Corré `npm run typecheck`.
- Corré `npm run lint:fix`.
- Si falla, corregí directamente o re-dispatch a un `implementer` con el error.

### 7. Review

1. Invocá al subagente `reviewer` con: los paths de spec y plan.
2. El reviewer hace `git diff` (working tree) y revisa contra spec + plan + convenciones.
3. Si reporta problemas: corregí o re-dispatch; si están justificados, documentá y seguí.

### 8. Cierre

- Resumen final: archivos creados/modificados, spec y plan generados, resultados de
  verificación y review.
- **Nunca hagas commit** por tu cuenta: ofrecé al usuario hacerlo.

## Reglas del orquestador

- Usá la tool `question` para los gates (nunca un texto suelto que se pueda perder).
- Mantené contexto liviano: pasá a cada subagente solo paths y datos puntuales, no
  copias enteras de archivos grandes.
- Si un subagente falla o produce algo inconsistente con la spec, re-invocalo con
  instrucciones correctivas, no lo arregles todo tú mismo.
- Actualizá `todowrite` en tiempo real: `in_progress` un solo item a la vez.
