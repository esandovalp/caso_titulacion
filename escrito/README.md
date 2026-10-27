# Trabajo escrito (D8)

IEEE doble columna, cinco secciones en el orden que pide la rúbrica: Contexto ·
Definición del problema · Supuestos · Resultados y discusión · Conclusiones.

```bash
typst compile --root . escrito/main.typ escrito/main.pdf   # desde la raíz del repo
typst watch   --root . escrito/main.typ escrito/main.pdf   # recompila al guardar
```

`--root .` es obligatorio: las tres figuras se leen de `resultados/figuras/`, que
está fuera de `escrito/`, y sin esa bandera Typst lo considera fuera del *sandbox*.
**Las figuras no se copian ni se regeneran**: el documento apunta a los PNG
congelados el 18 de oct.

## Qué hay aquí

| Archivo | Qué es |
|---|---|
| `main.typ` | El documento. Toda la prosa y las dos tablas |
| `plantilla-ieee.typ` | Copia local de `@preview/charged-ieee:0.1.4` (MIT) con los rótulos en español (`TABLA`, `Referencias`, `Resumen`, `Términos clave`). Se versiona para que el PDF se reconstruya sin red |
| `referencias.bib` | Fuentes, leyes y los cuatro métodos citados |
| `main.pdf` | Salida |

## Requisitos

- `brew install typst` (0.15.1 probado).
- `brew install --cask font-tex-gyre-termes font-tex-gyre-cursor` — sin ellas
  Typst avisa `unknown font family: tex gyre termes` y cae a otra serif.

## Reglas al editar

- **Aquí no se calcula nada.** Toda cifra sale de `CONTEXTO_CONVERSACION.md` §4 o
  de un CSV de `resultados/`, congelados desde el 18 de oct. Si falta una, va como
  **[verificar]**, nunca redondeada de memoria.
- Máximo **tres figuras** (mapa hero, acercamiento de 1 km, coeficientes de H2) y
  **dos tablas** (equivalencias reducida, veredictos). El límite es de espacio:
  5–8 páginas sin referencias.
- El método no pasa de una oración por hipótesis; el detalle se cita al
  repositorio.
- Lenguaje de incertidumbre: *aproximar*, *acotar*, *brecha relativa*, *rango*.
  Nunca "estimar el subregistro real". El verbo de H2 es *se asocia*.

## Trampas de Typst que ya costaron una corrida

- Un `=` al principio de renglón es un **encabezado**, aunque esté dentro de
  `#strong[...]`. `#strong[ρ\n= 0.46]` imprimió "V. 0.46" como sección.
- Un `1.` al principio de renglón abre una **lista numerada** y parte el párrafo en
  dos bloques. Las recomendaciones usan `1)`, que no la dispara.
- `#sym.dash.en 22` imprime "– 22" con espacio: el espacio posterior al `#sym` es
  texto. Por eso los símbolos van como carácter literal (`–`, `—`, `×`, `±`, `ρ`,
  `β`, `≥`, `≈`, `−`), no como `#sym.*`.
- En el pie de una tabla el tipógrafo de la plantilla aplica versalitas, y una `ρ`
  en versalitas se lee como `p`.
