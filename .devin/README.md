# Integración Genérica Multi-IA

Este directorio contiene la configuración para que **Devin** pueda trabajar con el
mismo flujo de trabajo que **opencode**, utilizando la configuración centralizada
en `.opencode/`.

## Filosofía

El objetivo es tener un **sistema genérico** donde todas las IAs puedan trabajar
de la misma forma, usando la misma configuración:

- **Configuración centralizada**: `.opencode/agents/` y `.opencode/skills/`
- **Adaptadores específicos**: `.devin/skills/` para Devin
- **Artefactos compartidos**: `docs/specs/` y `docs/plans/`

## Estructura

```
.devin/skills/
├── sdd/                    # Comando directo SDD (equivalente a /sdd)
├── sdd-orchestrator/       # Orquestador del pipeline SDD
├── opencode-agent/         # Adaptador para agentes opencode
└── opencode-skill/         # Adaptador para skills opencode
```

## Skills

### `/sdd` - Comando SDD

Comando directo para ejecutar el pipeline Spec-Driven Development.

**Uso**: Cuando el usuario quiere construir una feature nueva usando SDD.

**Equivalencia**: Es el equivalente al comando `/sdd` de opencode.

### `sdd-orchestrator` - Orquestador

Contiene el playbook completo del pipeline SDD adaptado para Devin.

**Uso**: Es invocado por el comando `/sdd` o puede invocarse directamente.

**Características**:
- Usa `run_subagent` para coordinar subagentes
- Usa `ask_user_question` para los gates de aprobación
- Usa `todo_write` para seguimiento de tareas
- Lee instrucciones de `.opencode/agents/` y `.opencode/skills/`

### `opencode-agent` - Adaptador de Agentes

Permite que los subagentes de Devin sigan las instrucciones de los agentes opencode.

**Uso**: Es invocado automáticamente por los subagentes cuando necesitan actuar
como spec-writer, architect, implementer, o reviewer.

**Características**:
- Carga instrucciones de `.opencode/agents/<agent-name>.md`
- Carga skills de soporte de `.opencode/skills/`
- Actúa como puente entre ambos sistemas

### `opencode-skill` - Adaptador de Skills

Permite cargar skills del sistema opencode como contexto adicional.

**Uso**: Es invocado cuando un subagent necesita información específica del stack
o helpers (stack-overview, new-screen, component-generator).

**Características**:
- Carga instrucciones de `.opencode/skills/<skill-name>/SKILL.md`
- Proporciona contexto específico del proyecto rn-base

## Flujo de Trabajo

### Con opencode

```bash
/sdd "quiero una lista de deseos"
```

### Con Devin

```bash
/sdd "quiero una lista de deseos"
```

Ambos comandos producen los mismos artefactos:
- `docs/specs/lista-deseos.md` - Spec de la feature
- `docs/plans/lista-deseos.md` - Plan de implementación
- Código implementado según el plan
- Verificación y revisión completadas

## Beneficios

1. **Consistencia**: Todas las IAs siguen el mismo flujo y producen los mismos artefactos
2. **Mantenimiento**: La configuración centralizada se actualiza en un solo lugar
3. **Flexibilidad**: Cada IA usa sus herramientas nativas pero sigue las mismas instrucciones
4. **Compatibilidad**: El sistema es compatible con múltiples IAs y herramientas

## Extensibilidad

Para agregar una nueva IA al sistema genérico:

1. Crear directorio de skills específico (ej. `.claude/skills/`)
2. Crear adaptadores similares a los de Devin
3. Los adaptadores leen de `.opencode/agents/` y `.opencode/skills/`
4. Actualizar documentación en `AGENTS.md`

## Referencias

- Configuración opencode: `.opencode/agents/` y `.opencode/skills/`
- Documentación del proyecto: `AGENTS.md`
- Docs de Devin: https://devin.ai/docs
