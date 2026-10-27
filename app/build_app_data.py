"""Tarea 4.1 — pipeline de datos de la app (D5).

Reorganiza en JSON lo que ya está en `resultados/` y simplifica la geometría del
shapefile de AGEB. **No calcula nada nuevo**: no corre ninguna especificación, no
re-deriva la brecha, ni los conteos, ni las clasificaciones, ni los coeficientes.
Las cifras quedaron congeladas el 18 de oct (`PLAN_31_OCT.md` §3.9) y toda cifra
que sale de aquí se rastrea a una columna de `11_`, `12_`, `13_`, `16_` o `14_`.

Lo único que se *transforma* es la cantidad que el mapa pinta, `m`, que es la misma
receta de `build_eda2.py` §10 —un cambio de escala de `llamadas` y `carpetas` de
`11_`— y se verifica contra las cifras impresas en el notebook congelado
(σ_AGEB = 0.319, Var(m) = 0.361, 589 AGEB saturados de 2,294, 99 de 698).

Salida (exactamente dos archivos):
    app/data/ageb.topo.json   2,431 AGEB + 16 alcaldías, TopoJSON en EPSG:6372
    app/data/brecha.json      un registro por AGEB (2,433) + bloque `meta`

Uso:   uv run python app/build_app_data.py
"""

from __future__ import annotations

import hashlib
import json
import tempfile
import unicodedata
import warnings
import zipfile
from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
import topojson as tp

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

# ---------------------------------------------------------------------------
# 0. Regla de simplificación, DECLARADA ANTES DE MIRAR EL TAMAÑO DEL ARCHIVO
# ---------------------------------------------------------------------------
# Se elige la tolerancia **más agresiva** de una rejilla fija de candidatas que
# cumpla las tres condiciones a la vez. El tamaño del archivo no entra en la
# regla: es una consecuencia, no un criterio (R4 del plan dice explícitamente
# que si rompe geometrías se sube la tolerancia y se aceptan 3–4 MB).
TOLERANCIAS = [0, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100]   # metros, EPSG:6372
#   (1) sobreviven los 2,431 polígonos con geometría (ninguno colapsa a vacío);
#   (2) toda geometría resultante es válida (sin auto-intersecciones) y no vacía;
#   (3) desviación relativa de área por AGEB |A'/A − 1|: p95 ≤ 2% y máx ≤ 10%.
DEV_P95_MAX, DEV_MAX_MAX = 0.02, 0.10
# Cuantización: paso de rejilla ≤ 1 m en las dos direcciones, de modo que la
# cuantización no aporte error por encima de la tolerancia elegida. La ciudad
# mide ~42 × 52 km, así que 1e5 da un paso de 0.42 × 0.52 m.
PREQUANTIZE = int(1e5)

# ---------------------------------------------------------------------------
# 1. Rutas, constantes compartidas y helpers
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent
RES = ROOT / "resultados"
SHP_ZIP = ROOT / "AGEB" / "593c12fd-4ff0-47b4-ab98-f5e930afd0e9.zip"
DATA = Path(__file__).resolve().parent / "data"
DATA.mkdir(parents=True, exist_ok=True)

VENT = ["2019", "2021-22"]
UMBRAL = 12                      # carpetas por ventana: frontera de conteo bajo/alto (2.1)
V_PRIN = "principal: todas las llamadas, >= 1 carpeta por ventana"
V_S1 = "sensibilidad: 19% de robo descontado (S1)"
SIN_POLIGONO = {"0901101101107", "0901201351227"}
ALC_FIX = {"CUAJIMALPA": "CUAJIMALPA DE MORELOS", "MAGDALENA CONTRERAS": "LA MAGDALENA CONTRERAS"}

# Paleta del 2.6 (`build_eda2.py` §10) — la app no inventa colores
PALETA_DIV = ["#0d366b", "#256abf", "#86b6ef", "#cde2fb", "#f0efec",
              "#fbd6d3", "#f0a39f", "#e34948", "#8f2322"]
TOKENS = {"azul": "#0d366b", "rojo": "#8f2322", "neutro": "#f0efec",
          "tinta": "#1a1a19", "tinta2": "#56544f", "gris": "#d9d7d2", "fondo": "#ffffff"}


def norm_alc(s):
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode()
    s = " ".join(s.upper().split())
    return ALC_FIX.get(s, s)


def r4(x):
    """Decimal a 4 cifras, igual que `resultados/*.csv`; NaN -> None (null en JSON)."""
    if x is None:
        return None
    f = float(x)
    return None if not np.isfinite(f) else round(f, 4)


def md5(p: Path) -> str:
    return hashlib.md5(p.read_bytes()).hexdigest()


def esperado(obtenido, ref, etiqueta, tol=0):
    """Assert ruidoso contra una cifra publicada en una tabla o notebook congelado."""
    ok = abs(float(obtenido) - float(ref)) <= tol
    print(f"   {'OK ' if ok else 'FALLA'}  {etiqueta}: {obtenido} (esperado {ref})")
    assert ok, f"ASSERT FALLIDO — {etiqueta}: obtenido {obtenido}, esperado {ref} (tol {tol})"


print("=" * 78)
print("Tarea 4.1 — pipeline de datos de la app (D5).  Cifras congeladas: no se calcula nada.")
print("=" * 78)
print(f"ROOT: {ROOT}")

# ---------------------------------------------------------------------------
# 2. Insumos congelados
# ---------------------------------------------------------------------------
FUENTES = {
    "11_": RES / "11_ageb_brecha_por_delito.csv",
    "12_": RES / "12_ageb_covariables_resageburb.csv",
    "13_": RES / "13_variacion_brecha_ageb_vs_alcaldia.csv",
    "14_": RES / "14_validacion_caso_calibracion.csv",
    "16_": RES / "16_h2_regresion_brecha_covariables.csv",
    "shapefile": SHP_ZIP,
}
print("\n[1] Insumos (md5 del archivo leído, para que el JSON sea rastreable)")
MD5_FUENTES = {}
for k, p in FUENTES.items():
    assert p.exists(), f"falta el insumo {k}: {p}"
    MD5_FUENTES[k] = md5(p)
    print(f"   {k:<10} {p.name:<48} {MD5_FUENTES[k]}  {p.stat().st_size / 1e6:.2f} MB")

t11 = pd.read_csv(FUENTES["11_"], dtype={"ageb": str})
t12 = pd.read_csv(FUENTES["12_"], dtype={"ageb": str})
t13 = pd.read_csv(FUENTES["13_"])
t14 = pd.read_csv(FUENTES["14_"])
t16 = pd.read_csv(FUENTES["16_"])

vf = t11[t11.delito == "violencia_familiar"].set_index(["ageb", "ventana"]).sort_index()
AGEBS = vf.index.get_level_values("ageb").unique().sort_values()

print("\n[2] Asserts de forma sobre los insumos")
esperado(len(AGEBS), 2433, "AGEB en 11_ (violencia familiar)")
esperado(len(vf), 2 * 2433, "filas AGEB x ventana en 11_")
esperado(len(t12), 2294, "filas de 12_ (universo primario)")
assert sorted(vf.index.get_level_values("ventana").unique()) == VENT, "ventanas inesperadas en 11_"
assert t12.ageb.isin(AGEBS).all(), "12_ trae AGEB que no están en 11_"

# ---------------------------------------------------------------------------
# 3. La cantidad que pinta el mapa: misma receta de `build_eda2.py` §10
# ---------------------------------------------------------------------------
# m_i = promedio entre ventanas de [ log((llamadas+0.5)/(carpetas+0.5)) − media de
# esa ventana en el universo ]. No es un cálculo nuevo: es el cambio de escala con
# que se dibujaron el mapa hero y el mapa de residuos, y se verifica abajo contra
# las cifras que imprimió el notebook congelado.
W = vf[["llamadas", "carpetas", "llamadas_robo_desc_s1", "brecha_ciudad"]].unstack("ventana")
LL = W["llamadas"][VENT].to_numpy(float)
CAR = W["carpetas"][VENT].to_numpy(float)
DESC = W["llamadas_robo_desc_s1"][VENT].to_numpy(float)
IDX = W.index

UNIV = (CAR >= 1).all(axis=1)              # universo del 2.3: >= 1 carpeta en cada ventana
ALTO = (CAR >= UMBRAL).all(axis=1)
BAJO = vf.conteo_bajo.unstack("ventana")[VENT].reindex(IDX)
SENS1 = vf.cambia_clasif_s1.unstack("ventana")[VENT].reindex(IDX).any(axis=1)


def mapa(llamadas):
    """Centra por ventana en el universo y promedia entre ventanas (receta del 2.6)."""
    y = np.log((llamadas + 0.5) / (CAR + 0.5))
    cen = y[UNIV].mean(axis=0, keepdims=True)
    z = np.where(UNIV[:, None], y - cen, np.nan)
    # el promedio solo se define en el universo; fuera queda NaN sin promediar filas vacías
    prom = np.full(len(y), np.nan)
    prom[UNIV] = z[UNIV].mean(axis=1)
    return z, prom, cen[0]


Z0, M0, CEN0 = mapa(LL)                    # S1 al 0%: el mapa publicado
Z19, M19, CEN19 = mapa(LL - DESC)          # S1 al 19%, repartido donde está el robo (§8.3 de 11_)

# Escala: sigma entre AGEB del modelo de varianza de 13_, no de los cuantiles observados
PRIN = t13[(t13.delito == "violencia_familiar") & (t13.variante == V_PRIN)].set_index("ventana")
S1ROW = t13[(t13.delito == "violencia_familiar") & (t13.variante == V_S1)].set_index("ventana")
SD_AGEB = float(np.sqrt(PRIN.loc["ambas", "var_unidad"]))
LIM = 2 * SD_AGEB
REF_CIUDAD = float((np.log(W["brecha_ciudad"][VENT].iloc[0].to_numpy(float)) - CEN0).mean())

print("\n[3] Asserts de la escala y del mapa, contra el notebook congelado (EDA2 §10)")
esperado(round(SD_AGEB, 3), 0.319, "sigma_AGEB")
esperado(round(float(np.exp(SD_AGEB)), 2), 1.38, "corte +1 sigma (x)")
esperado(round(float(np.exp(-SD_AGEB)), 2), 0.73, "corte -1 sigma (x)")
esperado(round(float(np.exp(LIM)), 2), 1.89, "corte +2 sigma (x)")
esperado(round(float(np.exp(-LIM)), 2), 0.53, "corte -2 sigma (x)")
esperado(round(float(np.exp(REF_CIUDAD)), 2), 1.13, "centro ponderado de la ciudad (x)")
esperado(round(float(np.nanvar(M0[UNIV])), 3), 0.361, "Var(m) del universo")
esperado(int((np.abs(M0[UNIV]) > LIM).sum()), 589, "AGEB saturados (|m| > 2 sigma)")
esperado(int((np.abs(M0[UNIV & ALTO]) > LIM).sum()), 99, "saturados entre los de conteo alto")

print("\n[4] Asserts de los conteos de referencia que la app imprime")
CONTEOS = {
    "ageb_total": int(len(AGEBS)),
    "con_poligono": 2431,                                   # se verifica contra el shapefile en [6]
    "universo_primario": int(UNIV.sum()),
    "sin_dato": int((~UNIV).sum()),
    "universo_estimacion_h2": int(t12.universo_estimacion_h2.sum()),
    "conteo_alto": int((UNIV & ALTO).sum()),
    "conteo_alto_h2": int((t12.universo_conteo_alto & t12.universo_estimacion_h2).sum()),
    "conteo_bajo": int((pd.Series(UNIV, index=IDX) & BAJO.any(axis=1)).sum()),
    "sensibles_s1": int(SENS1.sum()),
    "sensibles_s1_no_bajo": int((pd.Series(UNIV, index=IDX) & SENS1 & ~BAJO.any(axis=1)).sum()),
    "saturados_2sigma": int((np.abs(M0[UNIV]) > LIM).sum()),
}
for k, ref in [("ageb_total", 2433), ("universo_primario", 2294), ("sin_dato", 139),
               ("universo_estimacion_h2", 2250), ("conteo_alto", 698), ("conteo_alto_h2", 696),
               ("conteo_bajo", 1596), ("sensibles_s1", 601), ("sensibles_s1_no_bajo", 154)]:
    esperado(CONTEOS[k], ref, k)
esperado(CONTEOS["universo_primario"] + CONTEOS["sin_dato"], CONTEOS["ageb_total"],
         "universo + sin dato = total")
esperado(CONTEOS["conteo_bajo"] + CONTEOS["conteo_alto"], CONTEOS["universo_primario"],
         "conteo bajo + conteo alto = universo")

# ---------------------------------------------------------------------------
# 4. Geometría: simplificación con la regla declarada en §0
# ---------------------------------------------------------------------------
print("\n[5] Geometría: shapefile -> EPSG:6372")
with tempfile.TemporaryDirectory() as td:
    zipfile.ZipFile(SHP_ZIP).extractall(td)
    shp = gpd.read_file(str(next(Path(td).rglob("total.shp"))))

assert set(shp.loc[shp.geometry.isna(), "ageb"]) == SIN_POLIGONO, \
    "los AGEB sin polígono no son los dos conocidos"
geo = shp.dropna(subset=["geometry"])[["ageb", "alc", "geometry"]].to_crs(6372).reset_index(drop=True)
geo["alcaldia"] = geo.alc.map(norm_alc)
geo = geo.drop(columns="alc").sort_values("ageb").reset_index(drop=True)
A0 = geo.area.to_numpy()
esperado(len(geo), CONTEOS["con_poligono"], "AGEB con polígono")
assert geo.geometry.is_valid.all(), "el shapefile de origen ya trae geometrías inválidas"

# La alcaldía del shapefile tiene que coincidir con la de 11_ (todo join pasa por norm_alc)
alc11 = vf.alcaldia.groupby("ageb").first().map(norm_alc)
dif = geo.set_index("ageb").alcaldia.compare(alc11.reindex(geo.ageb).rename("alcaldia"))
assert dif.empty, f"la alcaldía del shapefile no cuadra con 11_ en {len(dif)} AGEB"
print(f"   OK   alcaldía del shapefile == alcaldía de 11_ en los {len(geo):,} AGEB con polígono")

# Las fronteras de alcaldía como objeto aparte, disolviendo por alc
alc_poly = geo.dissolve("alcaldia")[["geometry"]].reset_index()
esperado(len(alc_poly), 16, "alcaldías disueltas")

# Las dos capas van en UNA topología: así los arcos se comparten y la frontera de
# alcaldía no vuelve a escribir las coordenadas que ya están en los AGEB.
capas = gpd.GeoDataFrame(
    pd.concat([geo[["ageb", "geometry"]].assign(capa="ageb"),
               alc_poly.rename(columns={"alcaldia": "ageb"}).assign(capa="alcaldia")],
              ignore_index=True),
    crs=geo.crs)

print("\n[6] Rejilla de tolerancias (la regla de §0 se aplica en orden; gana la última que pasa)")
elegida = None
for tol in TOLERANCIAS:
    kw = dict(prequantize=PREQUANTIZE, topoquantize=False)
    if tol:
        kw.update(toposimplify=tol, simplify_algorithm="dp", simplify_with="shapely")
    topo = tp.Topology(capas, **kw)
    out = topo.to_gdf(crs=6372).iloc[:len(geo)]
    n_poly = int((out.geometry.notna() & ~out.geometry.is_empty).sum())
    valida = bool(out.geometry.is_valid.all())
    dev = np.abs(out.area.to_numpy() / A0 - 1)
    p50, p95, mx = np.median(dev), np.percentile(dev, 95), dev.max()
    pasa = (n_poly == len(geo)) and valida and (p95 <= DEV_P95_MAX) and (mx <= DEV_MAX_MAX)
    print(f"   tol={tol:>4} m | polígonos={n_poly:>5} | válidas={valida!s:<5} | "
          f"área dev p50={p50:.5f} p95={p95:.5f} máx={mx:.5f} | {'PASA' if pasa else 'no pasa'}")
    if pasa:
        elegida = dict(tol=tol, topo=topo, out=out, dev=dev, p50=p50, p95=p95, max=mx, arcos=len(topo.output["arcs"]))

assert elegida is not None, "ninguna tolerancia de la rejilla cumple la regla declarada en §0"
TOL = elegida["tol"]
print(f"\n   Tolerancia elegida por la regla: {TOL} m  "
      f"(área dev p50 {elegida['p50']:.5f} · p95 {elegida['p95']:.5f} · máx {elegida['max']:.5f})")

# Sin huecos ni solapes: con arcos compartidos la suma de áreas tiene que ser la
# del union. Un hueco la haría menor; un solape, mayor.
union = elegida["out"].geometry.union_all()
dif_rel = abs(elegida["out"].area.sum() - union.area) / union.area
print(f"   Suma de áreas {elegida['out'].area.sum():,.0f} m2 vs unión {union.area:,.0f} m2 "
      f"-> diferencia relativa {dif_rel:.2e}")
assert dif_rel < 1e-6, f"la simplificación dejó huecos o solapes (dif rel {dif_rel:.2e})"

# ---------------------------------------------------------------------------
# 5. ageb.topo.json
# ---------------------------------------------------------------------------
d = elegida["topo"].to_dict(options=False)
assert len(d["objects"]) == 1, "la topología salió con más de un objeto de entrada"
geoms = d["objects"][list(d["objects"])[0]]["geometries"]
assert len(geoms) == len(capas), "el número de geometrías no cuadra con la entrada"
assert [g["properties"]["capa"] for g in geoms] == list(capas.capa), \
    "la topología reordenó las geometrías: el corte entre capas sería incorrecto"


def limpia(g, clave):
    """Deja id + arcos; las propiedades viven en brecha.json, no duplicadas aquí."""
    g = {k: v for k, v in g.items() if k in ("type", "arcs")}
    g["id"] = clave
    return g


topo_out = {
    "type": "Topology",
    "transform": d["transform"],
    "bbox": d.get("bbox"),
    "objects": {
        "ageb": {"type": "GeometryCollection",
                 "geometries": [limpia(g, c) for g, c in zip(geoms[:len(geo)], geo.ageb)]},
        "alcaldia": {"type": "GeometryCollection",
                     "geometries": [limpia(g, c) for g, c in zip(geoms[len(geo):], alc_poly.alcaldia)]},
    },
    "arcs": d["arcs"],
}
P_TOPO = DATA / "ageb.topo.json"
P_TOPO.write_text(json.dumps(topo_out, separators=(",", ":")), encoding="utf-8")

print("\n[7] ageb.topo.json")
print(f"   objetos: ageb ({len(topo_out['objects']['ageb']['geometries']):,}) + "
      f"alcaldia ({len(topo_out['objects']['alcaldia']['geometries'])}) | "
      f"arcos compartidos: {len(topo_out['arcs']):,}")
print(f"   CRS pre-proyectado EPSG:6372 · cuantización {PREQUANTIZE:,} "
      f"(paso {(topo_out['transform']['scale'][0]):.3f} x {(topo_out['transform']['scale'][1]):.3f} m)")
print(f"   tamaño: {P_TOPO.stat().st_size / 1e6:.3f} MB  (objetivo < 1.5 MB)")

# La clave `ageb` tiene que unir al 100% con 11_
ids_topo = [g["id"] for g in topo_out["objects"]["ageb"]["geometries"]]
assert len(set(ids_topo)) == len(ids_topo), "ids de AGEB repetidos en el TopoJSON"
faltan = set(AGEBS) - set(ids_topo)
sobran = set(ids_topo) - set(AGEBS)
print(f"   unión por clave `ageb` con 11_: {len(set(ids_topo) & set(AGEBS)):,} de {len(ids_topo):,} "
      f"({len(set(ids_topo) & set(AGEBS)) / len(ids_topo):.1%}) | "
      f"en 11_ y sin polígono: {sorted(faltan)} | en el TopoJSON y no en 11_: {sorted(sobran)}")
assert not sobran, "el TopoJSON trae AGEB que no están en 11_"
assert faltan == SIN_POLIGONO, "los AGEB de 11_ sin polígono no son los dos conocidos"

# ---------------------------------------------------------------------------
# 6. brecha.json — un registro por AGEB, con las dos variantes de S1 resueltas
# ---------------------------------------------------------------------------
cov = t12.set_index("ageb")
VIV11 = vf.viviendas.groupby("ageb").first()
pos = {a: i for i, a in enumerate(IDX)}
con_poligono = set(geo.ageb)

registros = []
for a in AGEBS:
    i = pos[a]
    fila = {
        "ageb": a,
        "alc": norm_alc(alc11.loc[a]),
        "poligono": a in con_poligono,
        "universo": {                                  # cada flag con su conteo declarado en meta
            "primario": bool(UNIV[i]),                 # 2,294 — los que el mapa colorea
            "estimacion_h2": bool(cov.universo_estimacion_h2.get(a, False)),   # 2,250
            "conteo_alto": bool(UNIV[i] and ALTO[i]),  # 698
            "conteo_alto_h2": bool(cov.universo_conteo_alto.get(a, False)
                                   and cov.universo_estimacion_h2.get(a, False)),  # 696
        },
        "sensible_s1": bool(SENS1.get(a, False)),
        # viviendas sale de 11_, que cubre los 2,433 (12_ solo trae el universo primario);
        # donde las dos tablas se traslapan son el mismo número (assert en [8])
        "viviendas": None if pd.isna(VIV11.get(a)) else int(VIV11[a]),
        "viv_protegido": bool(vf.loc[(a, VENT[0]), "viv_protegido"]),
        "viv_cero": bool(vf.loc[(a, VENT[0]), "viv_cero"]),
        "cov": {c: (r4(cov[c].get(a)) if a in cov.index else None)
                for c in ("GRAPROES", "pct_der_ss", "PRO_OCUP_C")},
        "excluido_h2": bool(cov.excluido.get(a, False)) if a in cov.index else None,
        "ventanas": {},
        # valor del mapa bajo cada variante de S1, ya resuelto: el slider no calcula
        "m": {
            "s0": {**{w: r4(Z0[i, j]) for j, w in enumerate(VENT)}, "prom": r4(M0[i])},
            "s19": {**{w: r4(Z19[i, j]) for j, w in enumerate(VENT)}, "prom": r4(M19[i])},
        },
    }
    for w in VENT:
        r = vf.loc[(a, w)]
        fila["ventanas"][w] = {
            "llamadas": int(r.llamadas),
            "llamadas_afirmativas": int(r.llamadas_afirmativas),
            "carpetas": int(r.carpetas),
            "conteo_bajo": bool(r.conteo_bajo),
            "cambia_clasif_s1": bool(r.cambia_clasif_s1),
            "robo_ch_fgj": int(r.robo_ch_fgj),
            # s0 no repite `llamadas`: son las mismas de arriba. s19 sí, porque cambian.
            "s0": {"brecha": r4(r.brecha),
                   "ic95": [r4(r.brecha_ic95_inf), r4(r.brecha_ic95_sup)],
                   "clasificacion": None if pd.isna(r.clasificacion) else str(r.clasificacion)},
            "s19": {"llamadas": r4(r.llamadas - r.llamadas_robo_desc_s1), "brecha": r4(r.brecha_s1_19),
                    "ic95": [r4(r.brecha_s1_19_ic95_inf), r4(r.brecha_s1_19_ic95_sup)],
                    "clasificacion": None if pd.isna(r.clasificacion_s1_19) else str(r.clasificacion_s1_19)},
        }
    # brecha promedio entre ventanas, en la escala en que se promedió el mapa (e^m centrado)
    for v, (z, cen) in (("s0", (Z0, CEN0)), ("s19", (Z19, CEN19))):
        fila["m"][v]["brecha_prom"] = (None if not UNIV[i]
                                       else r4(float(np.exp((z[i] + cen).mean()))))
    registros.append(fila)

print("\n[8] Asserts de brecha.json contra las tablas de origen")
esperado(len(registros), 2433, "registros")
esperado(sum(r["universo"]["primario"] for r in registros), CONTEOS["universo_primario"], "primario")
esperado(sum(r["universo"]["estimacion_h2"] for r in registros), CONTEOS["universo_estimacion_h2"], "estimacion_h2")
esperado(sum(r["universo"]["conteo_alto"] for r in registros), CONTEOS["conteo_alto"], "conteo_alto")
esperado(sum(r["universo"]["conteo_alto_h2"] for r in registros), CONTEOS["conteo_alto_h2"], "conteo_alto_h2")
esperado(sum(r["sensible_s1"] for r in registros), CONTEOS["sensibles_s1"], "sensible_s1")
esperado(sum(r["poligono"] for r in registros), CONTEOS["con_poligono"], "con polígono")
# agregados que tienen que reproducir 11_ exactamente
for w in VENT:
    for col, key in (("llamadas", "llamadas"), ("carpetas", "carpetas")):
        esperado(sum(r["ventanas"][w][key] for r in registros),
                 int(vf.xs(w, level="ventana")[col].sum()), f"suma de {col} en {w}")
    esperado(sum(r["ventanas"][w]["conteo_bajo"] for r in registros),
             int(vf.xs(w, level="ventana").conteo_bajo.sum()), f"conteo_bajo en {w}")
    # la brecha de la ciudad de 11_ sale de los conteos que van en el JSON
    ciudad = (sum(r["ventanas"][w]["llamadas"] for r in registros)
              / sum(r["ventanas"][w]["carpetas"] for r in registros))
    esperado(round(ciudad, 4), float(vf.xs(w, level="ventana").brecha_ciudad.iloc[0]),
             f"brecha de la ciudad en {w} reconstruida de los conteos", tol=5e-4)
    # descuento efectivo de S1 (§8.3 de build_eda2: 17.7% y 17.9%)
    ef = 1 - sum(r["ventanas"][w]["s19"]["llamadas"] for r in registros) / \
        sum(r["ventanas"][w]["llamadas"] for r in registros)
    esperado(round(ef, 4),
             round(float(vf.xs(w, level="ventana").llamadas_robo_desc_s1.sum()
                         / vf.xs(w, level="ventana").llamadas.sum()), 4),
             f"descuento efectivo de S1 en {w}", tol=1e-4)
# las clasificaciones se copian, no se recalculan
for v, col in (("s0", "clasificacion"), ("s19", "clasificacion_s1_19")):
    for w in VENT:
        for cl, n in vf.xs(w, level="ventana")[col].value_counts().items():
            esperado(sum(r["ventanas"][w][v]["clasificacion"] == cl for r in registros), int(n),
                     f"clasificación {v} '{cl}' en {w}")
# covariables: media del universo de estimación, contra 12_
for c in ("GRAPROES", "pct_der_ss", "PRO_OCUP_C"):
    sel = [r["cov"][c] for r in registros if r["universo"]["estimacion_h2"] and r["cov"][c] is not None]
    esperado(round(float(np.mean(sel)), 4),
             round(float(cov.loc[cov.universo_estimacion_h2, c].mean()), 4),
             f"media de {c} en el universo de estimación", tol=5e-5)
esperado(sum(r["viviendas"] for r in registros if r["universo"]["estimacion_h2"] and r["viviendas"]),
         int(cov.loc[cov.universo_estimacion_h2, "VIVPAR_HAB"].sum()),
         "suma de VIVPAR_HAB en el universo de estimación")

# --- lo que el 4.4 agrega a este pipeline -----------------------------------
# La dispersión ligada necesita dibujar la recta de H2 en las unidades de la
# covariable, y β de 16_ está en unidades de z. Las dos constantes que faltan
# —media y DE del universo de estimación— NO se re-estiman: son función de una
# columna de 12_, que está congelada, y se verifican contra las cifras que el
# notebook del 3.1 imprimió en su sección 7 (`EDA4_h2_covariables.ipynb`, celda
# del panel). Ponerlas aquí es lo que evita que la app las derive en el
# navegador, que es justo lo que la regla del 4.1 prohíbe.
EST_NOTEBOOK = {"GRAPROES": (11.6882, 1.7423),      # media, DE impresas en el notebook §7
                "pct_der_ss": (0.7302, 0.0674),
                "PRO_OCUP_C": (0.8143, 0.1891)}
EST, N_DISP = {}, {}
for c, (mu_nb, sd_nb) in EST_NOTEBOOK.items():
    col = cov.loc[cov.universo_estimacion_h2, c].astype(float)
    EST[c] = {"media": r4(col.mean()), "de": r4(col.std(ddof=0))}   # ddof=0, igual que el notebook
    esperado(EST[c]["media"], mu_nb, f"media de {c} con que el 3.1 estandarizó (notebook §7)", tol=5e-5)
    esperado(EST[c]["de"], sd_nb, f"DE de {c} con que el 3.1 estandarizó (notebook §7)", tol=5e-5)
    # Cuántas filas del universo del mapa puede dibujar la dispersión de esa
    # covariable, y cuántas de ellas están fuera de la estimación por S5. Son
    # conteos de filas que ya traen su bandera: filtrar no es estimar.
    con = [r for r in registros if r["universo"]["primario"] and r["cov"][c] is not None]
    N_DISP[c] = {"dibujables": len(con),
                 "sin_covariable": CONTEOS["universo_primario"] - len(con),
                 "fuera_h2": sum(bool(r["excluido_h2"]) for r in con)}
    esperado(N_DISP[c]["dibujables"] - N_DISP[c]["fuera_h2"],
             int((cov.universo_estimacion_h2 & cov[c].notna()).sum()),
             f"dibujables de {c} que sí entran a la estimación de H2")
    print(f"   OK   {c}: dibujables {N_DISP[c]['dibujables']} · sin covariable "
          f"{N_DISP[c]['sin_covariable']} · fuera de H2 {N_DISP[c]['fuera_h2']}")
_j = pd.concat([VIV11.rename("a"), cov.VIVPAR_HAB.rename("b")], axis=1).dropna()
assert (_j.a == _j.b).all(), "viviendas de 11_ y VIVPAR_HAB de 12_ no coinciden"
print(f"   OK   viviendas: 11_ y 12_ coinciden en los {len(_j):,} AGEB donde las dos tablas la traen")
esperado(sum(r["viviendas"] or 0 for r in registros), int(VIV11.sum()), "suma de viviendas en los 2,433")

# ---------------------------------------------------------------------------
# 7. meta — las constantes de forma que la app NO debe re-derivar
# ---------------------------------------------------------------------------
h2 = t16[t16.especificacion == "VEREDICTO"].set_index("covariable")
pla = t16[t16.especificacion == "P placebo espacial"].set_index("covariable")
pri = t16[t16.especificacion == "primaria simple"].set_index("covariable")
cal = t14[(t14.parte == "(c) calibrador ENDIREH")
          & t14.descripcion.str.startswith("principal")].iloc[0]
esperado(round(float(cal.valor), 4), 0.9655, "calibrador ENDIREH (14_)")

META = {
    "tarea": "4.1 — pipeline de datos de la app (PLAN_31_OCT.md §4.4)",
    "congelamiento": "2026-10-18: ninguna cifra de este archivo se recalcula; todas se leen de resultados/",
    "fuentes_md5": MD5_FUENTES,
    "delito": "violencia_familiar",
    "ventanas": VENT,
    "ventanas_etiqueta": {"2019": "ene–dic 2019", "2021-22": "jul 2021 – abr 2022"},
    "crs": {"epsg": 6372, "nombre": "Lambert cónica conforme para México",
            "nota": "el TopoJSON ya viene proyectado: la app no carga proj4 ni reproyecta"},
    "geometria": {
        "regla_tolerancia": ("la tolerancia más agresiva de la rejilla "
                             f"{TOLERANCIAS} m que conserva los {CONTEOS['con_poligono']} polígonos, "
                             f"deja todas las geometrías válidas y mantiene la desviación de área por "
                             f"AGEB en p95 <= {DEV_P95_MAX} y máx <= {DEV_MAX_MAX}; declarada antes de "
                             "medir el tamaño del archivo"),
        "tolerancia_m": TOL,
        "prequantize": PREQUANTIZE,
        "desviacion_area": {"p50": r4(elegida["p50"]), "p95": r4(elegida["p95"]), "max": r4(elegida["max"])},
        "arcos": len(topo_out["arcs"]),
        "ageb_sin_poligono": sorted(SIN_POLIGONO),
    },
    "escala": {
        "cantidad": ("m = promedio entre ventanas de [ log((llamadas+0.5)/(carpetas+0.5)) − media de "
                     "esa ventana en el universo ], igual que el mapa hero del 2.6"),
        "sigma_ageb": r4(SD_AGEB),
        "lim_2sigma_log": r4(LIM),
        "fuente_sigma": "13_, var_unidad, variante principal, ventana 'ambas' (no de los cuantiles observados)",
        "cortes_razon": {"menos2sigma": r4(np.exp(-LIM)), "menos1sigma": r4(np.exp(-SD_AGEB)),
                         "centro": 1.0, "mas1sigma": r4(np.exp(SD_AGEB)), "mas2sigma": r4(np.exp(LIM))},
        "cortes_razon_redondeados": {"menos2sigma": 0.53, "menos1sigma": 0.73,
                                     "mas1sigma": 1.38, "mas2sigma": 1.89},
        "centro_ciudad_log": r4(REF_CIUDAD),
        "centro_ciudad_razon": r4(np.exp(REF_CIUDAD)),
        "centro_ciudad_nota": ("el centro de la escala es el AGEB promedio de cada ventana, con peso igual "
                              f"por territorio; la brecha de la ciudad está ponderada por volumen y queda "
                              f"x{np.exp(REF_CIUDAD):.2f} por encima — va con línea punteada, no recentra la escala"),
        "escala_fija_bajo_s1": ("la escala no se reajusta al mover el slider de S1: el punto es la comparación. "
                                "Si se reajustara, un mapa idéntico se vería igual de intenso aunque la "
                                "varianza hubiera cambiado"),
        "sigma_ageb_s1_referencia": r4(np.sqrt(float(S1ROW.loc["ambas", "var_unidad"]))),
        "var_m_observada": r4(float(np.nanvar(M0[UNIV]))),
        "saturados_2sigma": CONTEOS["saturados_2sigma"],
    },
    "paleta": {"divergente": PALETA_DIV, "tokens": TOKENS,
               "lectura": {"alto": "más llamadas al 911 por carpeta (rojo)",
                           "bajo": "más carpetas que llamadas (azul)",
                           "sin_dato": f"gris · {CONTEOS['sin_dato']} AGEB sin carpetas en una de las dos ventanas"}},
    "estilo": {
        "referencia": "Nate Silver / FiveThirtyEight, igual que las figuras del 2.6 y el 3.2",
        "reglas": [
            "el titular es la conclusión, no la descripción del eje",
            "el subtítulo lleva universo y unidad",
            "la cifra clave se anota sobre la marca, no en una leyenda",
            "la incertidumbre se dibuja, no se cita",
            "retícula mínima y gris; sin bordes de panel",
            "el pie dice qué NO se puede concluir",
            "ninguna vista principal con más de tres cifras impresas",
        ],
    },
    "h1": {
        "icc_alcaldia": r4(PRIN.loc["ambas", "icc_alcaldia"]),
        "icc_alcaldia_ic95": [r4(PRIN.loc["ambas", "icc_alcaldia_ic95_inf"]),
                              r4(PRIN.loc["ambas", "icc_alcaldia_ic95_sup"])],
        "icc_por_ventana": {w: r4(PRIN.loc[w, "icc_alcaldia"]) for w in VENT},
        "razon_unidad_alcaldia": r4(PRIN.loc["ambas", "razon_unidad_alcaldia"]),
        "razon_ic95": [r4(PRIN.loc["ambas", "razon_ic95_inf"]), r4(PRIN.loc["ambas", "razon_ic95_sup"])],
        "var_alcaldia": r4(PRIN.loc["ambas", "var_alcaldia"]),
        "var_unidad": r4(PRIN.loc["ambas", "var_unidad"]),
        "veredicto": str(PRIN.loc["ambas", "veredicto_h1"]),
        "lectura": ("la brecha varía 4.8 veces más entre AGEB que entre alcaldías; "
                    "solo el 11% de la varianza es de alcaldía"),
        "fuente": "13_, variante principal, ventana 'ambas'",
    },
    "h2": {
        "especificacion": ("log(brecha) ~ z(covariable) + efecto fijo de ventana, MCP con "
                           "w = 1/(σ²_AGEB + varianza binomial), errores tipo Conley "
                           "(Bartlett, 2 km) + agrupados por AGEB"),
        "regla": "PLAN_31_OCT.md §3.4, fijada el 16 de oct de 2026 antes de calcular cualquier coeficiente",
        "lectura_conjunta": ("el veredicto se lee en las tres regresiones de una sola covariable: "
                             "GRAPROES y PRO_OCUP_C correlacionan r = −0.93 (VIF 7.5 y 7.8) y son el "
                             "mismo eje medido al revés"),
        "coeficientes": [
            {
                "covariable": c,
                "etiqueta": et,
                "signo_predicho": int(h2.loc[c, "signo_predicho"]),
                "beta": r4(h2.loc[c, "beta"]),
                "se_espacial": r4(pri.loc[c, "se_espacial"]),
                "ic95_beta": [r4(h2.loc[c, "ic95_inf"]), r4(h2.loc[c, "ic95_sup"])],
                "razon_multiplicativa": r4(h2.loc[c, "razon_multiplicativa"]),
                "ic95_razon": [r4(np.exp(float(h2.loc[c, "ic95_inf"]))),
                               r4(np.exp(float(h2.loc[c, "ic95_sup"])))],
                "r2_parcial": r4(h2.loc[c, "r2_parcial"]),
                "t": r4(pri.loc[c, "t"]),
                "veredicto": str(h2.loc[c, "veredicto"]),
                "motivo": str(h2.loc[c, "motivo"]),
                "signos_sensibilidades": str(h2.loc[c, "signos_sensibilidades"]),
                "placebo": {"t_abs_observado": r4(pla.loc[c, "t_abs_observado"]),
                            "p95_nula_t_abs": r4(pla.loc[c, "p95_nula_t_abs"]),
                            "p": r4(pla.loc[c, "p_perm"]),
                            "supera_p95": bool(pla.loc[c, "supera_p95_nula"])},
                # ancho que permite la nula espacial: beta +- t*95 * EE (igual que la figura 3.2)
                "ic_nula_beta": [r4(float(h2.loc[c, "beta"]) - float(pla.loc[c, "p95_nula_t_abs"]) * float(pri.loc[c, "se_espacial"])),
                                 r4(float(h2.loc[c, "beta"]) + float(pla.loc[c, "p95_nula_t_abs"]) * float(pri.loc[c, "se_espacial"]))],
                # las dos constantes con que el 3.1 estandarizó, para que la
                # dispersión del 4.4 dibuje la recta sin convertir nada
                "estandarizacion": EST[c],
                "n_dispersion": N_DISP[c],
            }
            for c, et in (("GRAPROES", "escolaridad (grados promedio)"),
                          ("pct_der_ss", "derechohabiencia (% de la población)"),
                          ("PRO_OCUP_C", "hacinamiento (ocupantes por cuarto)"))
        ],
        "n_obs": int(pri.n_obs.iloc[0]),
        "n_ageb": int(pri.n_ageb.iloc[0]),
        "recta_app": ("la dispersión del 4.4 dibuja y = beta · (x − media) / DE con las tres cifras "
                      "de `estandarizacion` y `beta`: la pendiente es la que publicó 16_ y no se "
                      "re-estima. El anclaje en (media, 0) usa que el eje y ya está centrado en el "
                      "AGEB promedio de cada ventana; la recta de 16_ está residualizada contra el "
                      "efecto fijo de ventana con los pesos de la primaria, así que el anclaje es "
                      "forma, no estimación"),
        "fuente": "16_, filas VEREDICTO / primaria simple / P placebo espacial",
    },
    "s1": {
        "supuesto": ("S1: hasta 19% de las llamadas de 'Agresión – Casa habitación' podría ser robo a casa. "
                     "El descuento se reparte donde está el robo, proporcional a las carpetas de robo a casa "
                     "habitación del AGEB, con tope en sus propias llamadas"),
        "variantes": [
            {"id": "s0", "pct": 0.0, "etiqueta": "0% de robo descontado (publicado)"},
            {"id": "s19", "pct": 0.19, "etiqueta": "19% de robo descontado (cota superior de S1)"},
        ],
        "descuento_efectivo": {w: r4(float(vf.xs(w, level="ventana").llamadas_robo_desc_s1.sum()
                                           / vf.xs(w, level="ventana").llamadas.sum())) for w in VENT},
        "brecha_ciudad": {v: {w: r4(float(vf.xs(w, level="ventana").llamadas.sum()
                                          - (vf.xs(w, level="ventana").llamadas_robo_desc_s1.sum() if v == "s19" else 0))
                                   / float(vf.xs(w, level="ventana").carpetas.sum())) for w in VENT}
                          for v in ("s0", "s19")},
        "cambian_clasificacion": {
            "total": CONTEOS["sensibles_s1"],
            "en_universo": int((pd.Series(UNIV, index=IDX) & SENS1).sum()),
            "no_conteo_bajo": CONTEOS["sensibles_s1_no_bajo"],
            "por_ventana": {w: int(vf.xs(w, level="ventana").cambia_clasif_s1.sum()) for w in VENT},
            "lectura": "ninguno se invierte: todos los cambios son entre una clase definida e 'indistinguible'",
        },
    },
    "campos": {
        "ageb": "clave de 13 dígitos ENTIDAD+MUN+LOC+AGEB; une 100% con el id del TopoJSON",
        "alc": "alcaldía normalizada (sin acentos, mayúsculas), la misma de 11_",
        "poligono": "false en los 2 AGEB sin polígono: quedan fuera del mapa, no de la tabla",
        "universo.*": "los cuatro filtros; cada uno con su conteo en `conteos`",
        "sensible_s1": "la clasificación cambia entre las dos variantes en alguna ventana",
        "viviendas": "VIVPAR_HAB del Censo 2020; null donde INEGI la protegió por confidencialidad",
        "cov": "las tres covariables de H2 en nivel (no estandarizadas); null fuera del universo primario",
        "h2.coeficientes[].estandarizacion": ("media y DE (ddof=0) del universo de estimación con que "
                                              "el 3.1 construyó z(covariable); recuperadas de 12_ y "
                                              "verificadas contra el notebook §7"),
        "h2.coeficientes[].n_dispersion": ("filas del universo del mapa que la dispersión puede dibujar "
                                           "de esa covariable, las que INEGI protegió y las que están "
                                           "fuera de la estimación de H2 por S5"),
        "excluido_h2": "excluido del universo de estimación por S5; null fuera del universo primario",
        "ventanas.<w>.llamadas": "llamadas al 911 en la ventana; es también el valor de la variante s0",
        "ventanas.<w>.s19.llamadas": "llamadas tras descontar el robo donde está el robo (tope: sus propias llamadas)",
        "ventanas.<w>.<v>.brecha": "llamadas / carpetas, copiada de 11_; null sin carpetas",
        "ventanas.<w>.<v>.ic95": "IC 95% exacto de la razón de dos Poisson (Clopper-Pearson condicional)",
        "ventanas.<w>.<v>.clasificacion": "alta / baja / indistinguible / sin carpetas, contra la brecha de la ciudad de esa variante",
        "m.<v>.<w>": "valor que pinta el mapa en esa ventana: log((ll+0.5)/(car+0.5)) menos la media de la ventana",
        "m.<v>.prom": "promedio de las dos ventanas: lo que pinta el mapa por omisión, igual que el mapa hero",
        "m.<v>.brecha_prom": "exp del promedio sin centrar = media geométrica de la brecha entre ventanas, para el panel de detalle",
    },
    "conteos": CONTEOS,
    "conteos_glosa": {
        "ageb_total": "AGEB urbanos de la CDMX en el Censo 2020",
        "con_poligono": "AGEB con polígono en el shapefile; 2 no lo tienen y quedan fuera del mapa",
        "universo_primario": "AGEB con al menos 1 carpeta de violencia familiar en cada ventana: los que el mapa colorea",
        "sin_dato": "AGEB sin carpetas en una de las dos ventanas: van en gris",
        "universo_estimacion_h2": "universo de la regresión de H2 (2,294 menos 44 exclusiones de S5)",
        "conteo_alto": "AGEB con >= 12 carpetas en cada ventana, dentro del universo primario",
        "conteo_alto_h2": "los de conteo alto que además están en el universo de estimación: el universo de V1",
        "conteo_bajo": "AGEB del universo primario con < 12 carpetas en alguna ventana",
        "sensibles_s1": "AGEB cuya clasificación cambia entre 0% y 19% de robo descontado",
        "sensibles_s1_no_bajo": "los sensibles a S1 que no son ya de conteo bajo (los que llevan marca propia)",
        "saturados_2sigma": "AGEB del universo con |m| > 2 sigma: saturan los extremos de la escala",
    },
    "limites": [
        {"clave": "S6", "texto": "la brecha no es el subregistro: mezcla la propensión a llamar al 911 con la propensión a denunciar"},
        {"clave": "S5", "texto": "es asociación territorial, no individual: nada de esto dice algo sobre hogares (falacia ecológica)"},
        {"clave": "nivel", "texto": f"el nivel de ciudad lo acota la ENDIREH 2021 en {float(cal.valor):.1%} sin denuncia (IC 95% {float(cal.ic95_inf):.1%}–{float(cal.ic95_sup):.1%}; n = {int(float(cal.n_muestral))}, {int(float(cal.numerador))} casos en el numerador), no el mapa"},
        {"clave": "tiempo", "texto": "los datos son 2019 y jul 2021 – abr 2022, no el presente: el C5 no publica llamadas después de abr-2022"},
    ],
    "calibrador_endireh": {
        "valor": r4(cal.valor), "ic95": [r4(cal.ic95_inf), r4(cal.ic95_sup)],
        "n_muestral": int(float(cal.n_muestral)), "numerador": int(float(cal.numerador)),
        "cv": r4(cal.cv), "banda": [0.92, 0.9832],
        "descripcion": str(cal.descripcion), "fuente": "14_, parte (c) calibrador ENDIREH, fila principal",
    },
}

P_BRECHA = DATA / "brecha.json"
P_BRECHA.write_text(json.dumps({"meta": META, "agebs": registros}, separators=(",", ":"),
                               ensure_ascii=False), encoding="utf-8")

print("\n[9] brecha.json")
print(f"   {len(registros):,} registros + bloque meta | tamaño: {P_BRECHA.stat().st_size / 1e6:.3f} MB")
print(f"   meta: {len(META)} bloques -> {', '.join(META)}")

# ---------------------------------------------------------------------------
# 8. Los archivos congelados no se tocaron
# ---------------------------------------------------------------------------
# Hashes del congelamiento del 18 de oct (PLAN_31_OCT.md §3.9). Si alguno cambia,
# algo de esta tarea escribió donde no debía.
CONGELADOS = {
    "resultados/11_ageb_brecha_por_delito.csv": "c18a62fa2d765b172444e5fda5ace297",
    "resultados/12_ageb_covariables_resageburb.csv": "ec6675f367e366f7c628446cf8799c4a",
    "resultados/13_variacion_brecha_ageb_vs_alcaldia.csv": "dc4901ca30ddae281d877eaa8313d02f",
    "resultados/14_validacion_caso_calibracion.csv": "58a3ce388c0d37506527a76e02273034",
    "resultados/15_diagnostico_ageb.csv": "9c505f28677595947722117756f65d4c",
    "resultados/16_h2_regresion_brecha_covariables.csv": "bd9df4c0f4d51d84bbf29a53270f8cd5",
    "resultados/figuras/2.5_diagnostico_ageb.png": "150a04e23f05487179d7ea52bd3c34f4",
    "resultados/figuras/2.6_mapa_brecha_conteo_alto.png": "09849fd218b9e9fd49740a4c253d365f",
    "resultados/figuras/2.6_mapa_brecha_por_ventana.png": "f47681cb84caff071337285458267421",
    "resultados/figuras/2.6_mapa_brecha_violencia_familiar_ageb.png": "13c822c8321322c069070ce9cd4895d7",
    "resultados/figuras/2.6_mapa_hero_violencia_familiar.png": "cfc7f8eddde82e890ef9225078108693",
    "resultados/figuras/2.6_zoom_mosaico_1km.png": "2c778d6157e5458c3481c8e39b3c3d72",
    # R8 (27 oct): regenerada con la glosa de unidades derivada de la DE del universo de
    # estimacion (1.74 / 6.7 / 0.19), que es la que uso el 3.1. Ningun beta, IC ni veredicto cambio.
    "resultados/figuras/3.2_coeficientes_h2.png": "98c73a43de1852a683ec2945c782bae2",
    "resultados/figuras/3.2_dispersion_parcial_escolaridad.png": "a63d21e4935a2a928a2f890c43f91176",
    "resultados/figuras/3.2_mapa_residuos_h2.png": "1a3b7c7daf07bf815b92b765af6fe7a1",
}
print("\n[10] Congelamiento del 18 de oct: 6 tablas + 9 figuras, byte a byte")
malos = [r for r, h in CONGELADOS.items() if md5(ROOT / r) != h]
for r in CONGELADOS:
    print(f"   {'OK ' if r not in malos else 'CAMBIÓ'}  {r}")
assert not malos, f"ARCHIVOS CONGELADOS MODIFICADOS: {malos}"
print(f"   los {len(CONGELADOS)} siguen idénticos · ningún CSV nuevo en resultados/")

print("\n" + "=" * 78)
print(f"4.1 listo · ageb.topo.json {P_TOPO.stat().st_size / 1e6:.3f} MB (tol {TOL} m) · "
      f"brecha.json {P_BRECHA.stat().st_size / 1e6:.3f} MB · "
      f"total {(P_TOPO.stat().st_size + P_BRECHA.stat().st_size) / 1e6:.3f} MB")
print("=" * 78)
