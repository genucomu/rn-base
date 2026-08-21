---
name: opencode-skill
description: Carga y ejecuta un skill específico del sistema opencode (stack-overview, new-screen, component-generator, etc.). Use when a subagent needs to follow opencode skill instructions.
allowed-tools:
  - read
  - grep
  - find_file_by_name
triggers:
  - model
---

# Adaptador Opencode Skill

Este skill carga las instrucciones de un skill específico del sistema opencode
y las ejecuta en el contexto de Devin.

## Uso

Cuando te indiquen que cargues un skill opencode específico (stack-overview,
new-screen, component-generator, etc.), seguí estos pasos:

1. Leé el archivo correspondiente en `.opencode/skills/<skill-name>/SKILL.md`
2. Ejecutá las instrucciones del skill según las especificaciones
3. Aplicá las guías y convenciones que el skill proporciona

## Skills disponibles

- **stack-overview**: `.opencode/skills/stack-overview/SKILL.md` - Información del stack y comandos
- **new-screen**: `.opencode/skills/new-screen/SKILL.md` - Helper para crear nuevas pantallas
- **component-generator**: `.opencode/skills/component-generator/SKILL.md` - Generador de componentes NativeWind
- **sdd-orchestrator**: `.opencode/skills/sdd-orchestrator/SKILL.md` - Orquestador SDD (versión opencode)

## Notas

- Este skill actúa como puente entre los skills opencode y Devin
- Las instrucciones específicas de cada skill están en sus archivos SKILL.md
- Los skills de opencode contienen conocimiento específico del proyecto rn-base
- Siempre seguí las convenciones del proyecto (Biome, TanStack Query, Zustand, etc.)
