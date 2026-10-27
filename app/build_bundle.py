"""Empaqueta los dos JSON de la app en `app/data/bundle.js`.

Por qué existe
--------------
El piso de la rúbrica para D5 es que la app esté *operativa el día de la
presentación*, y el criterio que el plan fijó para eso (`PLAN_31_OCT.md` §4.4)
es que `index.html` abra **con doble clic, sin servidor ni internet**. Los
navegadores bloquean `fetch()` sobre `file://`, así que un `index.html` que
lea los JSON por red local no cumple ese criterio: falla justo en el escenario
que el riesgo R5 quiere cubrir.

Este script no es parte del pipeline de análisis. **No calcula nada y no
reserializa nada**: concatena el texto de los dos JSON tal cual, sin pasarlos
por `json.loads`/`json.dumps`, dentro de una asignación a `window.__DATOS__`.
La única fuente de verdad siguen siendo `app/data/ageb.topo.json` y
`app/data/brecha.json`, que produce `app/build_app_data.py`; `bundle.js` es una
copia empaquetada y desechable de esos bytes.

Al cerrar verifica que los dos bloques embebidos sean **byte a byte idénticos**
a los archivos de origen, recortándolos del archivo escrito por posición.

Uso:
    uv run python app/build_bundle.py
"""

from __future__ import annotations

import hashlib
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
DATOS = RAIZ / "data"
SALIDA = DATOS / "bundle.js"

ENCABEZADO = """/* Generado por app/build_bundle.py — NO editar a mano.
   Copia byte a byte de app/data/ageb.topo.json y app/data/brecha.json,
   empaquetada para que index.html abra con doble clic (file://), donde el
   navegador bloquea fetch(). Si este archivo no existe, app.js cae a fetch()
   y la app funciona igual servida por HTTP. */
window.__DATOS__ = {
"topo":
"""

MEDIO = """,
"brecha":
"""

CIERRE = """
};
"""

# U+2028 y U+2029 son saltos de línea en JavaScript pero no en JSON: dentro de
# un literal romperían el archivo. No aparecen en estos datos (claves de AGEB,
# nombres de alcaldía y números), pero si algún día aparecieran hay que
# escaparlos en vez de descubrirlo en la presentación.
PROHIBIDOS = {" ": "U+2028", " ": "U+2029"}


def md5(b: bytes) -> str:
    return hashlib.md5(b).hexdigest()


def main() -> int:
    fuentes = [DATOS / "ageb.topo.json", DATOS / "brecha.json"]
    faltan = [f for f in fuentes if not f.exists()]
    if faltan:
        print("Faltan los datos de la app: " + ", ".join(str(f) for f in faltan))
        print("Córrelos primero con:  uv run python app/build_app_data.py")
        return 1

    crudos = [f.read_bytes() for f in fuentes]
    textos = [b.decode("utf-8") for b in crudos]

    for nombre, texto in zip(fuentes, textos):
        for ch, etiqueta in PROHIBIDOS.items():
            if ch in texto:
                print(f"ERROR: {nombre.name} contiene {etiqueta}, que JavaScript no admite "
                      f"dentro de un literal. Hay que escaparlo antes de empaquetar.")
                return 1

    salida = ENCABEZADO + textos[0] + MEDIO + textos[1] + CIERRE
    SALIDA.write_text(salida, encoding="utf-8")

    # --- verificación: los bloques embebidos son los archivos, byte a byte ---
    escrito = SALIDA.read_text(encoding="utf-8")
    ini0 = len(ENCABEZADO)
    fin0 = ini0 + len(textos[0])
    ini1 = fin0 + len(MEDIO)
    fin1 = ini1 + len(textos[1])

    assert escrito[:ini0] == ENCABEZADO, "el encabezado no quedó donde se esperaba"
    assert escrito[fin0:ini1] == MEDIO, "el separador no quedó donde se esperaba"
    assert escrito[fin1:] == CIERRE, "el cierre no quedó donde se esperaba"

    for f, crudo, recorte in zip(fuentes, crudos, (escrito[ini0:fin0], escrito[ini1:fin1])):
        rb = recorte.encode("utf-8")
        assert rb == crudo, f"{f.name} no sobrevivió el empaquetado byte a byte"
        print(f"  {f.name:<20} {len(crudo)/1e6:6.3f} MB   md5 {md5(crudo)}")

    print(f"\n  {SALIDA.name:<20} {SALIDA.stat().st_size/1e6:6.3f} MB   "
          f"md5 {md5(SALIDA.read_bytes())}")
    print("\nLos dos bloques embebidos son idénticos byte a byte a sus archivos de origen.")
    print("index.html ya abre con doble clic, sin servidor.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
