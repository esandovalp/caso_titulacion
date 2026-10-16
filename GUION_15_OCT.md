# Notas del guion — revisión de avance, 15 de octubre de 2026

> **El texto hablado vive en `GUION_15_OCT.txt`**, en formato Textream: prosa corrida, un párrafo por idea y todo lo que no se dice entre corchetes (`[pausa]`, `[slide 4: la idea]`, `[señalar el recuadro…]`). Ese archivo es la única copia del guion; este documento son las notas alrededor. Si cambia una cifra, se cambia allá.
> Deck: `Revisión de avance — 15 oct 2026` (8 slides + 12 de respaldo).

## Minutaje

**1,198 palabras habladas**: 8:52 a 135 palabras por minuto, 9:35 a 125. Con las 15 pausas marcadas, **entre 9:05 y 9:50**. Caben en los 10 minutos, pero sin margen para improvisar.

| Slide | Lo que tiene que lograr | Min |
|---|---|---|
| 1 `pregunta` | El gancho, sin cifras. La pregunta al final | 0:30 |
| 2 `importa` | El decisor concreto y la paradoja Benito Juárez / Iztapalapa | 1:00 |
| 3 `cambio` | El encuadre anterior no se sostiene, con evidencia propia | 1:00 |
| 4 `idea` | Hecho → llamada → carpeta. Qué mide la brecha y qué no | 1:15 |
| 5 `fuentes` | Qué aporta cada fuente y su límite duro | 1:00 |
| 6 `mapa` | La frase, el acercamiento, una cifra y los tres límites | 1:45 |
| 7 `pruebas` | Tres preguntas con su veredicto | 1:30 |
| 8 `supuestos` | Lo que no puedo afirmar y qué sigue | 1:15 |

**Si vas largo a la mitad**, el lugar donde recortar es el párrafo de las encuestas y el Censo en la slide 5. **No** recortes los tres límites del mapa ni la tercera pregunta: son lo que la rúbrica premia.

## Dos frases que conviene decir tal cual

> No se puede saber. Y ese es precisamente el problema, no un límite de mi trabajo.

> Esto no prueba que la brecha mida subregistro. Prueba que no es ruido.

## Notas de dicción para el reconocimiento de voz

- El guion no trae ningún símbolo (`ρ`, `=`, `×`, `→`): todo está escrito como se dice, porque el reconocimiento compara palabras.
- Los acrónimos que quedan son **AGEB**, **INEGI**, **C5** y **911**. Si el resaltado se traba en alguno, cámbialo en el `.txt` por su forma deletreada; es el único ajuste que puede necesitar.
- Las cifras van en dígitos (`96.5 por ciento`, `4.8 veces`) porque así las transcribe el reconocimiento. Si una se traba, escríbela con letra.
- "ENVIPE" y "ENDIREH" se evitaron a propósito: en el guion dicen "la encuesta" y "la encuesta de dinámica de las relaciones en los hogares". Los nombres completos están en el deck y en las respuestas de abajo.

---

# Respuestas de bolsillo

> Para los 5 minutos de preguntas. Una frase cada una; entre paréntesis, la slide de respaldo que la ilustra.

- **"¿Con qué fuente sostienes que la prevención se reparte con el conteo de carpetas?"** Con la Ley del Sistema de Seguridad Ciudadana de la CDMX, artículo 13 fracción II: el Sistema tiene por objeto "dar seguimiento a la incidencia delictiva y tomar decisiones respecto de las acciones correctivas y preventivas"; y la incidencia delictiva del fuero común, según el SESNSP, son las carpetas de investigación iniciadas. El ejemplo operativo son los 126 cuadrantes prioritarios de la SSC, escogidos de 847 por concentrar ~40% de la incidencia delictiva. *(Tabla de las 16 alcaldías.)*
- **"Pero la FGJ sí registra dónde ocurrió el hecho."** Correcto, y la uso así: `alcaldia_hecho` y las coordenadas del hecho. Lo que depende de la denuncia no es el lugar, es que el registro exista; por eso el conteo mezcla dónde ocurre con dónde se llega a denunciar.
- **"¿Por qué abandonaste el encuadre por alcaldía?"** No lo abandoné por gusto: 12 de 16 alcaldías con precisión baja y p = 0.84 tras corregir por el efecto de diseño, que es ≈ 2.6.
- **"¿Por qué el CV se calcula sobre la tasa de carpeta?"** Porque sobre la cifra negra, que es ~93%, sale engañosamente pequeño. Sobre la tasa de carpeta (~6.5%) es honesto.
- **"¿Por qué esos dos delitos?"** Ninguno del catálogo cumple los cuatro criterios —canal 911 limpio, cifra negra medible, denominador por AGEB y coordenadas—. Elegí la pareja donde cada caso cubre lo que al otro le falta. *(Matriz de decisión.)*
- **"¿Cómo sabes que la llamada y la carpeta son el mismo hecho?"** No lo son, y por eso el indicador es una razón entre poblaciones de eventos, no un pareo uno a uno. *(Tabla de equivalencias.)*
- **"¿Y si el patrón viene de una sola ventana?"** Está en las dos. Lo que no es parejo es el peso de la alcaldía: ICC 0.057 en 2019 y 0.241 en 2021–22. *(Mapa por ventana.)*
- **"¿Y si todo es ruido de conteo?"** Con solo los 698 AGEB de conteo alto la razón de varianzas sube a 5.01. *(Mapa de conteo alto.)*
- **"¿Por qué no un modelo mixto o un GLMM?"** Las dos nulas exigen del orden de 48 mil reajustes, y con 2,400 niveles de una o dos observaciones es donde menos sirven esas aproximaciones. Con la varianza binomial conocida, la corrección por momentos es exacta en esperanza. *(Método de H1.)*
- **"¿Por qué no validas contra el SESNSP?"** En la CDMX lo reporta la misma fiscalía: sería comparar la fuente consigo misma.
- **"¿Y las aseguradoras?"** AMIS solo publica a nivel entidad y un top-15 nacional de municipios. Verificado el 26 de septiembre: no sirve a grano AGEB.
- **"¿Datos más recientes del 911?"** El C5 no publica nada después de abril de 2022. Para la final se pueden pedir 2023–2024 por transparencia, con 20 días hábiles de plazo.
- **"¿La concordancia con la ENSU?"** No concluye: ρ = 0.10 con n = 16. Era previsible, porque la señal es sub-alcaldía y agregarla a 16 unidades la destruye. *(Lo que no validó.)*
- **"¿El 96.5% es robusto?"** El intervalo mide 2.7 puntos, pero la definición del periodo mueve el nivel entre 92.0 y 98.3. Las cinco variantes dicen lo mismo: más de nueve de cada diez no llegan a la autoridad. *(ENDIREH.)*
- **"¿Y la app?"** Es este mapa, ejecutable, con el rayado y los supuestos a la vista.
