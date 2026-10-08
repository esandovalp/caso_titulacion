---
name: estado-plan
description: Resume el plan vigente del caso de titulación (subregistro delictivo CDMX) y los pasos siguientes, leyendo PLAN_15_OCT.md y CONTEXTO_CONVERSACION.md. Úsala cuando el usuario pida "el plan", "dónde vamos", "qué sigue", "estado del caso", "pasos siguientes" o invoque /estado-plan.
---

# Estado del plan y pasos siguientes

Skill **de solo lectura**: produce un resumen en la terminal. No calcula, no crea archivos y no edita los documentos maestros. Por eso la regla 6 de `CLAUDE.md` (actualizar al cerrar) **no aplica** aquí.

## 1. Leer las fuentes (siempre frescas, nunca de memoria)

Lee completos, en este orden:

1. `PLAN_15_OCT.md`: calendario, tablas de tareas con su columna **Estado**, punto de decisión, riesgos y "Qué no hacer".
2. `CONTEXTO_CONVERSACION.md`: §4 (hallazgos con cifras), §6 (retroalimentación de sinodales) y §8 (próximos pasos pendientes).
3. `CLAUDE.md`, sección **Calendario**: fechas duras (revisión de avance, envío de slides, final).

Si existe otro `PLAN_*.md` más reciente en la raíz (por ejemplo, un plan para la final), léelo también y dale prioridad sobre `PLAN_15_OCT.md` en lo que se contradigan.

## 2. Reglas de síntesis

- **Toda cifra sale literal de esos archivos.** No redondees, no re-derives, no completes de memoria. Si una cifra no aparece, escribe **[verificar]**.
- **Lo más reciente manda.** Los documentos acumulan capas: texto tachado (`~~…~~`), secciones marcadas como "pendiente de revisión" o "borrador, no validada" y notas fechadas que las reemplazan. Reporta solo el estado vigente; si dos pasajes se contradicen, quédate con el de fecha más reciente y señala la contradicción en "Inconsistencias".
- **Fecha de hoy:** usa la fecha del entorno para calcular los días que faltan hasta cada hito y para marcar una tarea como **atrasada** si su semana ya pasó y sigue "Pendiente".
- Distingue **decidido** de **recomendado**: una recomendación no es una decisión hasta que el documento diga "se elige" o "decidido".
- Todo en español, en tono directo y sin relleno.

## 3. Formato de salida

Responde directamente en la terminal (sin artefacto ni archivo), con estas secciones y en este orden:

```
## Estado del caso — <fecha de hoy>
Próximo hito: <hito> en <N> días (<fecha>) · slides a sinodales: <fecha>

### Encuadre vigente
- Pregunta (vigente o en borrador, dilo): …
- Delitos: aplicación = … · calibración = … (decidido / recomendado)
- Hipótesis: H1 … H2 … H3 … (marca las que estén pendientes de reescribir)

### Lo que ya está resuelto
3–6 viñetas con la cifra clave y su incertidumbre (IC / CV / n) tal como aparece.

### Pasos siguientes
Tabla ordenada por fecha límite:
| # | Tarea | Prioridad | Fecha límite | Estado | Bloquea a |
Solo tareas abiertas. Marca ⚠️ las atrasadas y 🔒 el siguiente punto de decisión.

### Decisión inmediata
Qué hay que decidir, cuándo, entre qué opciones y cuál es la recomendación registrada.

### Riesgos vivos
Solo los riesgos no marcados como "Descartado" o "Resuelto", con su mitigación.

### Inconsistencias en los documentos
Pasajes desactualizados o contradictorios que convendría limpiar (sección y archivo). Omite la sección si no hay.
```

Cierra con **una línea**: la acción más importante para los próximos 2–3 días y la dimensión de la rúbrica (D1–D8) que mueve.

## 4. Si el usuario pide algo más

- "Actualiza el plan" o "marca X como hecho": ya no es esta skill. Edita `PLAN_15_OCT.md` y `CONTEXTO_CONVERSACION.md` siguiendo la regla 6 de `CLAUDE.md`.
- "Dámelo para compartir": ofrece publicarlo como artefacto; no lo publiques sin que lo pida.
