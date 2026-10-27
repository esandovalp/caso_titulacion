# Subregistro delictivo en la Ciudad de México

Análisis exploratorio para el caso de titulación de Ciencia de Datos Aplicada (ITAM). El proyecto estudia, con indicadores indirectos, la distribución territorial de la brecha entre llamadas al 911 y carpetas de investigación de la FGJ por violencia familiar; el robo a conductor se usa como contraste para poner a prueba el método.

**El análisis aproxima y acota la brecha; no estima el subregistro real.** La interpretación depende de la cobertura y los universos de cada fuente, y los resultados por AGEB no deben interpretarse como relaciones causales.

## Contenido

El repositorio tiene tres productos y un expediente de decisiones.

**El análisis.** Cuatro notebooks, cada uno generado por su `build_*.py`:

| Script | Notebook | Qué soporta |
|---|---|---|
| `notebooks/build_eda.py` | `EDA_encuadre1.ipynb` | inventario de fuentes y evaluación del encuadre por alcaldía (`01_`–`08_`) |
| `notebooks/build_eda2.py` | `EDA2_equivalencias_911_fgj.ipynb` | equivalencias 911 ↔ FGJ y la brecha por AGEB (`09_`–`11_`, `13_`, figuras) |
| `notebooks/build_eda3.py` | `EDA3_validacion_calibracion.ipynb` | validación y calibradores con ENDIREH, ENSU y ENVIPE (`14_`) |
| `notebooks/build_eda4.py` | `EDA4_h2_covariables.ipynb` | H2: covariables de RESAGEBURB y regresión con errores espaciales (`12_`, `16_`, figuras) |

Los notebooks generados son artefactos: modifica los `build_*.py`, no los
`.ipynb` directamente, porque se regeneran. `resultados/` guarda las tablas y
las figuras que exportan, y es la única fuente de cifras de todo lo demás.

**La aplicación** (`app/`): un explorador de la brecha por AGEB que abre con
doble clic, sin servidor ni internet, con los supuestos del análisis puestos
como controles. Instrucciones, atajos y cómo regenerar sus datos: `app/README.md`.

**El trabajo escrito** (`escrito/`): IEEE doble columna en Typst, con la
plantilla vendida para reconstruir el PDF sin red. Ver `escrito/README.md`.

**El expediente.** `CONTEXTO_CONVERSACION.md` reúne el inventario, los
hallazgos con sus cifras, los supuestos y las decisiones; `PLAN_31_OCT.md` es
el plan vigente hacia la entrega final y `PLAN_15_OCT.md` queda como registro
de la revisión de avance (su §3 guarda el alcance y los supuestos S1–S7).

## Requisitos

- Python 3.13 (versión indicada en `.python-version`).
- [uv](https://docs.astral.sh/uv/).
- Los datos fuente descritos abajo; no se distribuyen en este repositorio.

Instala el entorno desde la raíz:

```bash
uv sync
```

## Preparar los datos

Los archivos fuente se excluyen intencionalmente del repositorio: ocupan varios GB, algunos superan el límite de tamaño de GitHub y deben obtenerse de sus fuentes oficiales respetando sus términos de uso. Descárgalos y colócalos localmente con estos nombres y rutas:

| Fuente | Archivos/directorios esperados |
|---|---|
| Carpetas FGJ CDMX | `carpetas-datos/carpetasFGJ_acumulado_2025_01.csv` |
| Víctimas FGJ | `carpetas-datos/victimasFGJ_2020.csv` y `carpetas-datos/victimasFGJ_2021.csv` |
| Llamadas 911 C5 | `911_llamadas_datos/llamadas_911_2019_s1.csv`, `llamadas_911_2019_s2.csv`, `llamadas_911_2021_s2.csv` y `llamadas_911_2022_s1.csv` |
| ENVIPE 2025 | `conjunto_de_datos_envipe_2025_csv/` con las tablas y catálogos CSV |
| Censo/RESAGEBURB 2020 | Shapefile AGEB y `AGEB/ageb_mza_urbana_09_cpv2020_csv.zip` |
| ENSU 2026 | Archivos trimestrales ZIP dentro de `ENSU/` |
| ENDIREH 2021 | Microdatos y datos abiertos ZIP dentro de `ENDIREH/` |

Consulta `CONTEXTO_CONVERSACION.md` para los detalles de lectura y las limitaciones conocidas de cada fuente. Los archivos de `informacion-caso/` y los PDF de referencia tampoco se incluyen.

## Regenerar y ejecutar

Todo se ejecuta desde la raíz del repositorio.

```bash
uv run python notebooks/build_eda.py
uv run jupyter nbconvert --to notebook --execute --inplace notebooks/EDA_encuadre1.ipynb
uv run python notebooks/build_eda2.py
uv run jupyter nbconvert --to notebook --execute --inplace notebooks/EDA2_equivalencias_911_fgj.ipynb
uv run python notebooks/build_eda3.py
uv run jupyter nbconvert --to notebook --execute --inplace notebooks/EDA3_validacion_calibracion.ipynb
uv run python notebooks/build_eda4.py
uv run jupyter nbconvert --to notebook --execute --inplace notebooks/EDA4_h2_covariables.ipynb
```

Los notebooks guardan sus salidas en `resultados/`. Se requiere haber colocado previamente los datos en las rutas indicadas. La ejecución puede tardar varios minutos, especialmente por el bootstrap y las operaciones geoespaciales.

La aplicación no necesita ninguno de esos pasos para abrirse —sus datos van
versionados en `app/data/`—, solo para regenerarlos:

```bash
uv run python app/build_app_data.py      # resultados/ + shapefile → app/data/*.json
uv run python app/build_bundle.py        # los dos JSON → app/data/bundle.js
open app/index.html                      # o: python3 -m http.server  desde la raíz
```

El trabajo escrito se compila con [Typst](https://typst.app/) (`brew install typst`
más las fuentes `font-tex-gyre-termes` y `font-tex-gyre-cursor`):

```bash
typst compile --root . escrito/main.typ escrito/main.pdf
```

## Alcance y estado

El análisis es exploratorio y sus cifras deben leerse junto con la incertidumbre, los supuestos y las diferencias de universo entre fuentes. El plan vigente y el estado de cada tarea están en `PLAN_31_OCT.md`; publicar el código no implica que esos experimentos o entregables estén terminados.

## Licencia y datos

Este repositorio no concede derechos sobre los microdatos, documentos de terceros o materiales del curso que se descarguen para reproducir el análisis. Obtén cada fuente de su publicador y revisa sus condiciones antes de usarla o redistribuirla.
