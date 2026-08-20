# `.agents/` — Personas de los agentes

Este directorio define las **personas** (rol, responsabilidades y reglas) de los roles
que participan en el flujo SDD. Cada archivo es la fuente de verdad del rol.

## Relación con `.opencode/agents/`

- `.agents/<rol>.md` → **persona documentada** (rol + reglas). La leen humanos y agentes.
- `.opencode/agents/<rol>.md` → **subagente invocable** en opencode: un stub corto que carga
  la persona desde `.agents/<rol>.md` y actúa conforme a ella.

```
.agents/                       .opencode/agents/
├── README.md                  ├── spec-writer.md       (stub → lee .agents/spec-writer.md)
├── spec-writer.md             ├── architect.md         (stub → lee .agents/architect.md)
├── architect.md               ├── implementer.md       (agente directo, sin persona externa)
└── reviewer.md                └── reviewer.md          (stub → lee .agents/reviewer.md)
```

## Formato de una persona

```markdown
# <Nombre>

## Rol
<una línea: qué hace>

## Responsabilidades
- <responsabilidad 1>
- <responsabilidad 2>

## Reglas de trabajo
- <regla 1>
- <regla 2>

## Herramientas preferidas
- <command / archivo que debe consultar>
```

## Reglas generales

- Una persona **nunca** contradice `AGENTS.md`. Si hay conflicto, gana `AGENTS.md`.
- Los roles de escritura de código deben leer la spec correspondiente en `docs/specs/` antes de implementar.
- Los roles de revisión deben verificar que el código cumpla la spec y el plan.
- Un agente solo usa el contexto y las skills que necesite para su tarea.
