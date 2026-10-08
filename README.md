# Subregistro delictivo en la Ciudad de México

Análisis exploratorio para el caso de titulación de Ciencia de Datos Aplicada (ITAM). El proyecto estudia, con indicadores indirectos, la distribución territorial de la brecha entre llamadas al 911 y carpetas de investigación de la FGJ por violencia familiar; el robo a conductor se usa como contraste para poner a prueba el método.

**El análisis aproxima y acota la brecha; no estima el subregistro real.** La interpretación depende de la cobertura y los universos de cada fuente, y los resultados por AGEB no deben interpretarse como relaciones causales.

## Contenido

- `notebooks/build_eda.py` genera `notebooks/EDA_encuadre1.ipynb`.
- `notebooks/build_eda2.py` genera `notebooks/EDA2_equivalencias_911_fgj.ipynb`, incluida la tabla de equivalencias 911 ↔ FGJ y el experimento 2.1.
- `resultados/` contiene los resultados tabulares exportados por los notebooks.
- `CONTEXTO_CONVERSACION.md` reúne el inventario, los hallazgos, los supuestos y las decisiones del análisis.
- `PLAN_15_OCT.md` describe el alcance y el trabajo pendiente para la revisión de avance.

Los notebooks generados son artefactos: modifica los `build_*.py`, no los `.ipynb` directamente, porque se regeneran.

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

Ejecuta desde la raíz del repositorio:

```bash
uv run python notebooks/build_eda.py
uv run jupyter nbconvert --to notebook --execute --inplace notebooks/EDA_encuadre1.ipynb
uv run python notebooks/build_eda2.py
uv run jupyter nbconvert --to notebook --execute --inplace notebooks/EDA2_equivalencias_911_fgj.ipynb
```

Los notebooks guardan sus salidas en `resultados/`. Se requiere haber colocado previamente los datos en las rutas indicadas. La ejecución puede tardar varios minutos, especialmente por el bootstrap y las operaciones geoespaciales.

## Alcance y estado

El análisis es exploratorio y sus cifras deben leerse junto con la incertidumbre, los supuestos y las diferencias de universo entre fuentes. El plan actualizado y las tareas todavía pendientes para la revisión del 15 de octubre están en `PLAN_15_OCT.md`; publicar el código no implica que esos experimentos o entregables estén terminados.

## Licencia y datos

Este repositorio no concede derechos sobre los microdatos, documentos de terceros o materiales del curso que se descarguen para reproducir el análisis. Obtén cada fuente de su publicador y revisa sus condiciones antes de usarla o redistribuirla.
