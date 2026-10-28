#import "plantilla-ieee.typ": ieee

#show: ieee.with(
  title: [Aproximar el subregistro delictivo por debajo de la alcaldía: la brecha entre llamadas al 911 y carpetas de investigación en los AGEB de la Ciudad de México],
  abstract: [
    La política de prevención en la Ciudad de México se reparte con el conteo de
    carpetas de investigación, pero una carpeta existe solo si alguien denunció, y
    en 2024 el 93.5% de los delitos ocurridos en la ciudad no llegó a carpeta. La
    encuesta que mide ese porcentaje no se puede desagregar por alcaldía: 12 de 16
    alcaldías quedan con precisión baja y la heterogeneidad aparente desaparece al
    corregir por el efecto de diseño (p = 0.84). Este trabajo aproxima, sin
    estimarlo, dónde se concentra la fricción entre el aviso y la denuncia, con un
    indicador indirecto: la razón entre llamadas al 911 y carpetas de la FGJ por
    violencia familiar, calculada en los 2,433 AGEB de la ciudad para dos ventanas
    (2019 y julio-2021 a abril-2022). Tres resultados. Primero, esa razón varía 4.82
    veces más entre AGEB de la misma alcaldía que entre alcaldías (IC 95%:
    2.81–6.44), con un mosaico de 1 a 2 km: la alcaldía es el grano
    equivocado. Segundo, el patrón se reproduce entre ventanas (ρ = 0.30 en
    violencia familiar y 0.46 en el par de control), así que no es ruido. Tercero,
    de las tres asociaciones con covariables del territorio que se preregistraron,
    una se sostiene —una desviación estándar más de escolaridad se
    asocia con una brecha 4% menor—, dos no concluyen y ninguna se
    rechaza. El nivel de
    ciudad no sale del indicador: lo acota la ENDIREH en 96.5% de no denuncia
    (IC 95%: 95.1–97.8%). La recomendación principal no requiere
    cambiar ninguna ley: publicar la llave que une el folio de la llamada con la
    carpeta.
  ],
  authors: (
    (
      name: "Emiliano Sandoval",
      department: [Maestría en Ciencia de Datos Aplicada],
      organization: [Instituto Tecnológico Autónomo de México],
      location: [Ciudad de México],
    ),
  ),
  index-terms: ("subregistro delictivo", "cifra negra", "AGEB", "datos administrativos", "componentes de varianza", "autocorrelación espacial"),
  bibliography: bibliography("referencias.bib"),
)

#set text(lang: "es")
#set table(stroke: 0.4pt + luma(120))

= Contexto

La política de prevención del delito en la Ciudad de México se reparte con un
número. La Ley del Sistema de Seguridad Ciudadana encarga al Sistema "dar
seguimiento a la incidencia delictiva y tomar decisiones respecto de las acciones
correctivas y preventivas en materia de seguridad en la Ciudad" @leyssc, y la
incidencia delictiva del fuero común, en la definición que usa el país, son los
delitos registrados en carpetas de investigación iniciadas @sesnsp. El ejemplo operativo más visible de esa cadena es la estrategia de
cuadrantes: en septiembre de 2021 la Secretaría de Seguridad Ciudadana declaró
prioritarios 126 de los 847 cuadrantes de la ciudad, repartidos en siete
alcaldías, por concentrar —según la propia Secretaría— alrededor del 40% de la
incidencia delictiva @cuadrantes.

Una carpeta existe solo si alguien denunció. En la Ciudad de México, el 93.5% de
los delitos ocurridos en 2024 no derivó en carpeta (IC 95%: 92.3–
94.7%; INEGI publica 93.2%), con una tasa de denuncia efectiva de 9.5% @envipe2025.
Expandidos, los delitos que la encuesta capta son entre 14 y 35 veces las carpetas
que la fiscalía abrió en 2024, con mediana de 21. El insumo con el que se decide
dónde prevenir es, entonces, una muestra de entre cinco y siete de cada cien
hechos, seleccionada por un mecanismo —la decisión de denunciar—
que no tiene por qué ser homogéneo en el territorio.

La huella de esa selección está a la vista en las cifras publicadas. Entre las 16
alcaldías, la tasa de carpetas por cien mil habitantes correlaciona
#emph[negativamente] con la proporción de población que se siente insegura
(ρ de Spearman = −0.65, p = 0.007), y la cifra negra correlaciona
#emph[positivamente] con esa misma percepción (ρ = +0.67, p = 0.005). El
caso extremo es una paradoja de manual: Benito Juárez tiene la segunda tasa de
carpetas más alta de la ciudad y la percepción de inseguridad más baja (17%),
mientras Iztapalapa tiene la tasa más baja y la percepción más alta (72%). Leído
como mapa del delito, el conteo de carpetas invierte el orden.

Qué hay publicado y qué no. La fiscalía publica 2.1 millones de carpetas de 2016 a
enero de 2025 con coordenadas del hecho @fgj2025, y el C5 publica las llamadas al
911 con coordenadas, pero nada posterior a abril de 2022 @c5911. La encuesta de
victimización mide la cifra negra con representatividad por entidad, no por
alcaldía @envipe2025. El Secretariado Ejecutivo no es una validación
independiente: en la Ciudad de México las cifras que publica las reporta la misma
fiscalía. Las aseguradoras, por su parte, solo publican agregados por entidad. El
resultado es que #emph[no existe ninguna fuente pública que mida, por debajo de la
alcaldía, qué proporción de lo que ocurre no se denuncia]. Ese hueco, y no una
limitación del análisis, es el problema de este trabajo.

= Definición del problema

#emph[¿Cómo se distribuye entre los AGEB de la Ciudad de México la brecha entre
las llamadas al 911 y las carpetas de la FGJ por violencia familiar, y qué
características de la vivienda y del hogar se asocian con ella?]

El verbo es deliberado. El trabajo #emph[aproxima] y #emph[acota] una brecha
relativa; no estima el subregistro real, porque ese número no se puede conocer con
los datos existentes. Poner esa imposibilidad en el centro del encuadre, y no en
un pie de página, es parte de la definición del problema.

== El encuadre por alcaldía no se sostiene, y ese es el primer resultado

La ruta obvia —desagregar la cifra negra de la encuesta por alcaldía y
corregir con ella el conteo de carpetas— se puso a prueba y falló. De
3,907 delitos ocurridos en la ciudad en la muestra, solo 288 derivaron en carpeta,
con una mediana de 16 carpetas por alcaldía. Doce de las 16 alcaldías quedan con
coeficiente de variación mayor a 30% en la tasa de carpeta, el umbral que INEGI
usa para declarar precisión baja, y el ancho mediano del intervalo de confianza es
de nueve puntos porcentuales. El rango aparente va de 84.9% a 97.2%, pero esa
heterogeneidad no sobrevive a la corrección por el efecto de diseño
(≈ 2.6): la ji cuadrada ingenua da p = 0.048 y la corregida, p = 0.84.

Esto es un resultado, no un fracaso. Dice que la encuesta no contiene la
información territorial que la pregunta necesita, descarta la ruta de estimación
en áreas pequeñas por falta de señal en la fuente, y obliga a buscar el grano en
datos administrativos censales en vez de muestrales. Lo que sí sobrevive de la
encuesta es su papel de #emph[calibrador de nivel]: sabe cuánto, para la ciudad
entera, pero no dónde.

== La bisagra: hecho → llamada → carpeta

Entre el hecho y la carpeta hay dos decisiones distintas: avisar y denunciar. El
911 registra la primera con coordenadas y sin requisito de ratificación; la
fiscalía registra la segunda. La razón entre ambas, por unidad territorial, no
mide el subregistro, pero sí mide la #emph[fricción] entre una y otra: dónde se
avisa mucho y se denuncia poco, relativo al resto de la ciudad. La unidad es el
AGEB (Área Geoestadística Básica), de los que la ciudad tiene 2,433 con una
población mediana cercana a 3,400 personas. La unión espacial funciona: el 93.5%
de las carpetas y el 99.8% de las llamadas caen dentro de un AGEB. Unir por nombre
de colonia, en cambio, no funciona (38% de coincidencia entre las dos fuentes).

== Los dos delitos, y por qué ninguno es perfecto

Ningún delito del catálogo cumple los cuatro criterios que harían el ejercicio
limpio: canal 911 identificable, cifra negra medible, denominador por AGEB y
coordenadas. La @tab-equiv muestra el resultado de la prueba de equivalencia entre
los 18 pares candidatos, de la que se reproducen seis: para cada par se midió la
correlación parcial entre AGEB (controlando el volumen total de cada fuente) y la
correlación entre perfiles horarios. El par nominalmente obvio
—"Agresión a persona" contra lesiones— falla la prueba espacial, y el
911 resulta no tener ningún canal de robo de vehículo ni de robo a transeúnte.

La combinación elegida hace que cada caso cubra lo que al otro le falta.
#strong[Violencia familiar] es la aplicación: tiene denominador por AGEB (las
viviendas habitadas, porque el hecho ocurre en el domicilio) y una no denuncia
medida por la ENDIREH, pero su canal 911 tiene confianza media. #strong[Robo a
conductor con violencia] es la calibración del método: es el único par con
confianza alta de mapeo, pero carece de denominador y la encuesta no lo separa del
robo en calle. Ambas limitaciones se declaran; ninguna se resuelve.

== Las tres hipótesis, declaradas antes de modelar

#strong[H1.] En violencia familiar, la brecha varía más entre AGEB que entre
alcaldías, y más de lo que daría el azar. #strong[H2.] Esa brecha disminuye con la
escolaridad y la derechohabiencia del AGEB, y aumenta con el hacinamiento.
#strong[H3.] En robo a conductor, la distribución territorial de la brecha se
mantiene entre 2019 y 2021–22 por encima de una permutación nula; si
no se mantuviera ni en el par mejor mapeado, la brecha no llevaría señal
territorial y H1 no sería interpretable.

Las tres se declararon con su regla de decisión completa —modelo,
universo, nula, sensibilidades y criterio de rechazo— antes de
calcular el estadístico correspondiente, y las fechas quedaron registradas en el
repositorio @repo: la agregación de H3 el 5 de octubre, la descomposición de H1 el
8, el diagnóstico espacial el 11 y la especificación de H2 el 16, el día antes de
estimarla.

== Control de calidad

Toda reconstrucción de una cifra de encuesta se verificó contra la cifra publicada
por el productor antes de usarla. El código reproduce la cifra negra de la Ciudad
de México en 93.5% contra 93.2% publicado; la prevalencia nacional de violencia
familiar de doce meses en 11.386% contra 11.4%; y la violencia total de doce meses
en la Ciudad de México en 46.138% contra 46.1%. Las tres coinciden, así que el
diseño muestral está bien implementado y las diferencias que se reporten abajo no
son errores de lectura de las bases.

#place(
  top,
  scope: "parent",
  float: true,
  [
    #figure(
      table(
        columns: (1.15fr, 1.9fr, 0.72fr, 0.72fr, 0.62fr, 0.62fr, 0.62fr, 0.72fr),
        align: (left, left, right, right, right, right, right, center),
        table.header(
          [Motivo 911], [Delito FGJ], [Llamadas], [Carpetas], [Ll./carp.], [ρ AGEB], [ρ hora], [Confianza],
        ),
        [Robo – Automovilista], [Robo a pasajero/conductor c/v], [11,280], [5,286], [2.13], [0.42], [0.93], [alta],
        [Robo – Automovilista], [Robo de vehículo particular c/v], [11,280], [3,856], [2.93], [0.02], [0.67], [baja],
        [Agresión – Casa habitación], [Violencia familiar], [48,381], [55,158], [0.88], [0.42], [−0.12], [media],
        [Agresión – Casa habitación], [Robo a casa habitación], [48,381], [9,515], [5.08], [0.27], [−0.36], [baja],
        [Robo – Otros], [Robo a transeúnte en vía pública], [8,939], [24,535], [0.36], [0.07], [0.83], [baja],
        [Agresión – Persona], [Lesiones intencionales (todas)], [279,006], [10,988], [25.39], [−0.09], [0.87], [baja],
      ),
      caption: [
        Prueba de equivalencia entre canales del 911 y delitos de la FGJ (6 de los
        18 pares evaluados). Ventana común: 2019 más julio-2021 a abril-2022.
        ρ AGEB es la correlación parcial entre AGEB controlando el volumen
        total de cada fuente; ρ hora, la correlación entre perfiles
        horarios. El par 1 contra el 2 muestra que «Automovilista» es robo
        #emph[al conductor] y no robo #emph[del vehículo]; el 3 contra el 4, que
        el canal de casa habitación se parece a violencia familiar y no a robo; el
        5 y el 6, dos pares nominalmente obvios que fallan la prueba espacial.
        Los conteos son del delito completo en la ventana, incluidos los eventos
        que no caen en un AGEB, así que no coinciden con los universos de la
        Sección IV. Tabla completa en @repo.
      ],
    ) <tab-equiv>
  ],
)

= Supuestos

El formato es el mismo en todos: #emph[uso X asumiendo Y; si Y no se cumpliera, Z
sería más apropiado]. La etiqueta final separa lo que movería la distribución
territorial, que es la pregunta, de lo que solo movería el nivel de ciudad.

#strong[S1. Canal.] Uso «Agresión – Casa habitación» como canal 911 de
la violencia familiar asumiendo que la parte de robo del código es chica y, sobre
todo, que no se concentra en ciertos territorios. La mezcla medida por vía espacial
es de 16% (IC 13–19%) y por vía temporal de 0%, así que el rango
defendible es 0–19%. Si el robo se concentrara en algunos AGEB, el
mapa mezclaría dos delitos; por eso toda la brecha se calcula con 0% y con 19%
descontado, y la clasificación de cada AGEB se reporta junto con si cambia entre
las dos variantes. #emph[Mueve el mapa.]

#strong[S2. Universo.] Uso la no denuncia que mide la ENDIREH en mujeres de 15
años o más, por violencia familiar o de pareja, como cota del nivel de ciudad de
la carpeta "violencia familiar", asumiendo que hombres y menores de 15 años
—que son entre 30% y 39% de las víctimas que la fiscalía registró en
2021— no denuncian de forma muy distinta. Si no fuera así, la
calibración se restringiría a las víctimas mujeres de 15 años o más, lo que es
posible con el archivo de víctimas, y el resto se declararía fuera de alcance.
#emph[Mueve el nivel.]

#strong[S3. Desfase.] La encuesta mide de octubre de 2020 a noviembre de 2021,
dentro del hueco de la pandemia que tiene la ventana del 911; solo de julio a
noviembre de 2021 hay traslape. Uso su cifra para toda la ventana asumiendo que la
propensión a denunciar durante el confinamiento no fue muy distinta de la de 2019
y 2021–22. Si lo fue, la cota vale solo para 2021–22.
#emph[Mueve el nivel.]

#strong[S4. Estabilidad territorial.] Uso 2019 y julio-2021 a abril-2022 como una
sola ventana asumiendo que la distribución territorial de la brecha es estable
entre ambas. El supuesto se pone a prueba, no solo se declara, con la misma
prueba de H3 (§IV-B). Si fallara, el resultado se reportaría por ventana y
describiría 2019–22 y no el presente. #emph[Mueve el mapa.]

#strong[S5. Falacia ecológica y denominador.] Uso las viviendas particulares
habitadas como denominador y las covariables censales del AGEB como descriptores
del entorno, asumiendo que el AGEB del hecho es el del domicilio —en
ambas fuentes la coordenada es la del lugar— y que los hogares
afectados se parecen al promedio de su AGEB. Si la violencia se concentrara en
subgrupos dentro del AGEB, H2 se lee como asociación territorial y nunca
individual @robinson1950; la inferencia individual solo la daría una encuesta que
no baja a este grano. Se excluyen los AGEB con cero viviendas, con dato protegido
por confidencialidad y con menos de 50 viviendas, donde las tasas se disparan
(hasta 7,250 carpetas por mil viviendas contra un percentil 99 de 44); son 0.9% de
las carpetas. #emph[Mueve el mapa, en H2.]

#strong[S6. La brecha no es el subregistro.] Uso llamadas por carpeta como
indicador de fricción entre el aviso y la denuncia, asumiendo que la propensión a
#emph[llamar] no varía en el territorio con las mismas covariables que la
propensión a #emph[denunciar]. Los hechos que no llegan a ninguna de las dos
fuentes son invisibles para el indicador: por eso el nivel lo acota la encuesta y
la brecha solo ordena territorios. En violencia familiar la razón es menor que
uno, es decir, hay más carpetas que llamadas y muchas carpetas entran sin pasar
por el 911. Si la propensión a llamar variara con las covariables, H2 estaría
mezclando dos mecanismos; el control pendiente es usar las llamadas de otros
motivos del mismo AGEB como proxy. #emph[Mueve el mapa. Es el supuesto más
frágil.]

#strong[S7. Coordenadas.] Uso solo los eventos geolocalizados (97.6% de las
carpetas en violencia familiar y 99.2% en robo a conductor) asumiendo que los
faltantes no se concentran en ciertos territorios. No es parejo: Cuauhtémoc tiene
87.7% de cobertura en 2021–22 y Milpa Alta 88.9% en 2019, así que su
brecha podría estar inflada hasta en 14%. La cobertura por alcaldía se reporta
junto al mapa. #emph[Mueve el mapa, en segundo orden.]

Los supuestos propios de H2 se declararon al fijar su especificación, también
antes de estimarla. #strong[(i)] Uso el centroide del polígono como posición del
AGEB asumiendo que a la escala de 1 a 2 km que mide el diagnóstico espacial un
AGEB urbano es casi puntual; si fuera grande o alargado, la distancia entre
centroides subestimaría la contigüidad y el error estándar quedaría optimista, y
el contraste sin distancias es el bootstrap por bloques. #strong[(ii)] Pondero con
el inverso de la suma de la varianza binomial conocida y el componente entre AGEB,
asumiendo que el ruido de conteo es binomial; si fuera sobredisperso, la
ponderación daría demasiado peso a los AGEB chicos y la alternativa sería mínimos
cuadrados sin pesos, que se corre como sensibilidad. #strong[(iii)] Estandarizo
con la media y la desviación estándar del universo de estimación de la
especificación primaria en todas las variantes, para que los coeficientes sean
comparables entre ellas. #strong[(iv)]
La variante con 19% de robo descontado verifica el signo, no la magnitud: el
descuento se reparte proporcionalmente a las carpetas de robo a casa habitación,
que traen su propia estructura socioeconómica.

= Resultados y discusión

== H1: la alcaldía es el grano equivocado

El indicador se descompone en el logaritmo de la brecha, donde la varianza del
error de medición es conocida en forma cerrada, y la descomposición por momentos
separa la varianza entre alcaldías, entre AGEB de la misma alcaldía y entre
ventanas del mismo AGEB. El detalle del estimador y de sus dos nulas está en el
repositorio @repo; aquí importa el resultado.

En los 2,294 AGEB que tienen al menos una carpeta en cada ventana (99.5% de las
carpetas, 47,828 llamadas y 53,050 carpetas), la varianza entre alcaldías es 0.021
(IC 95%: 0.016–0.030), la varianza entre AGEB de la misma alcaldía es
0.102 (0.072–0.127) y la de la interacción con la ventana, 0.070
(0.039–0.101). La razón entre las dos primeras es #strong[4.82 (IC
95%: 2.81–6.44)], enteramente por encima de uno, y el coeficiente de
correlación intraclase de alcaldía es #strong[0.110 (0.085–0.158)]: la
alcaldía explica el 11% de la variación y el 89% ocurre por debajo de ella. En
brecha relativa, una desviación estándar entre AGEB de la misma alcaldía equivale
a ×1.38, contra ×1.16 entre alcaldías. La varianza observada
supera el percentil 95 de una nula de homogeneidad con p = 0.001, y el intraclase
también supera el de reasignar alcaldías al azar conservando su tamaño: las
fronteras de alcaldía no son irrelevantes, son el grano equivocado.

El supuesto que podía tumbar esto se verificó, no se declaró. La sobredispersión
de Pearson es 2.02, el doble de la binomial pura, así que un contraste
beta-binomial por alcaldía y ventana da una varianza de 0.196 contra 0.171 de los
momentos para la misma cantidad: coinciden dentro del 14% y la estimación por
momentos es la conservadora. En una calibración sobre el diseño real con
componentes inyectados conocidos, el estimador recupera la razón 4.64 contra 4.86
cuando la verdad es la observada, y —lo que importa—
recupera 0.200 contra 0.206 cuando la verdad está #emph[invertida]: no inventa
predominio del AGEB. De nueve variantes interpretables, las nueve aceptan H1;
restringiendo a los 698 AGEB con al menos 12 carpetas en cada ventana la razón
sube a 5.01 (2.10–7.32), así que el resultado no lo producen los AGEB
de conteo bajo.

Hay un matiz que conviene decir en voz alta: el intraclase de alcaldía pasa de
0.057 en 2019 a 0.241 en 2021–22. El cambio de nivel entre ventanas no
fue parejo entre alcaldías, lo que matiza S4 en la dirección correcta
—se repite el orden, no el nivel— y es la razón por la que el mapa
pinta el promedio de las dos ventanas y no una sola.

== H3 y S4: el patrón se reproduce, así que no es ruido

Con menos de dos carpetas de robo a conductor por AGEB y ventana, la prueba de
estabilidad no se puede hacer sobre el AGEB crudo. La regla de agregación se fijó
antes de calcular cualquier correlación: grupos de AGEB contiguos dentro de la
misma alcaldía con al menos 12 carpetas en cada ventana, umbral elegido porque con
12 eventos el coeficiente de variación de Poisson del denominador es 28.9%, debajo
del 30% que la encuesta usa como frontera. Resultan 76 grupos que cubren 2,389 de
los 2,433 AGEB.

#strong[H3 se acepta.] La correlación de rangos entre ventanas es
#strong[ρ = 0.46 (IC 95%: 0.27–0.63; n = 76)] contra un percentil 95 de la nula
por permutación de 0.179, con p = 0.001, el mínimo que permiten mil permutaciones.
La potencia no fue el problema: la correlación queda 2.6 veces por encima del
umbral y todo su intervalo está arriba de él. La misma prueba aplicada a violencia
familiar —que es la verificación de S4— da
#strong[ρ = 0.30 (0.23–0.37; n = 698 AGEB)] contra un percentil 95 de 0.065, con
p = 0.001, y se sostiene en las tres sensibilidades declaradas (0.22 a 0.26). El
ruido de conteo atenúa ambas correlaciones, así que las dos son cotas inferiores.

Lo que esto prueba y lo que no: #emph[la brecha lleva señal territorial
reproducible y H1 es interpretable]. No prueba que la brecha mida subregistro, que
es S6 y sigue en pie. Y cada correlación valida un grano distinto: la de robo a
conductor es a grano de grupo (mediana 22 AGEB), la de violencia familiar es a
grano de AGEB.

== El mapa y la escala del mosaico

La @fig-mapa pinta, para cada AGEB, el promedio entre ventanas del logaritmo de la
brecha centrado en su ventana. La escala es divergente y sus límites son
±2 desviaciones estándar #emph[del modelo] (×1.89 y
×0.53), no los cuantiles observados, porque el 57% de la dispersión
visible es ruido de conteo: de una varianza total de 0.361, la parte binomial
esperada aporta 0.206 y el componente entre AGEB solo 0.102. Con esa escala saturan
589 de los 2,294 AGEB coloreados (26%), pero solo 99 de los 698 de conteo alto
(14%), que es justo lo que predice quitar ruido. Los 139 AGEB sin carpetas en
alguna ventana van en gris; los 1,596 con menos de 12 carpetas en alguna
ventana, que son los peor medidos, van rayados en el acercamiento y en las
versiones de respaldo del repositorio.

S1 se verifica aquí, no solo se declara. Con 19% de robo descontado cambian de
clasificación 596 de los 2,294 AGEB y #emph[ninguno se invierte]: todos los
cambios ocurren entre una clase definida y la de «indistinguible de la ciudad»,
y el orden entre AGEB se mantiene (ρ de Spearman 0.92 y 0.89 por ventana). El
supuesto más frágil del mapa decide una de cada siete clasificaciones, no su
forma.

A ojo, el mapa tiene a la vez mosaico fino y zonas amplias del mismo color. El I de
Moran @moran1950 separa las dos lecturas. Sobre los residuos #emph[dentro] de
alcaldía vale 0.097, contra un percentil 95 de 0.021 en la nula de permutación y
0.018 en la nula de homogeneidad, con p = 0.001 en ambas. El ruido de conteo es
espacialmente independiente y entra al denominador del índice, así que el valor
observado es cota inferior; corregido por esa atenuación da 0.245 en el universo
completo y 0.180 en los 698 AGEB de conteo alto, donde la corrección es mucho
menor. Las dos caen en la misma banda, lo que acota cuánto puede estar inflando el
supuesto. El correlograma por bandas de distancia ubica la estructura: 0.224 entre
0 y 1 km, 0.081 entre 1 y 2 km, y aproximadamente cero de 2 km en adelante.

La frase que resume el mapa es, entonces, que #emph[la fricción entre el aviso y la
denuncia cambia por zonas más chicas que la alcaldía y no respeta sus fronteras].
La @fig-zoom es la misma escala sobre una ventana de 6 km, elegida con una regla
que no mira el color —la ventana con más AGEB de conteo alto entre las
que tocan al menos dos alcaldías— y que cayó en el límite de Iztacalco,
Iztapalapa y Venustiano Carranza: 141 AGEB con centroide dentro, 70 de ellos de
conteo alto. Ahí el mosaico de 1 a 2 km se ve directamente.

Un límite nuevo y duro salió de ese diagnóstico: los AGEB de conteo bajo
#emph[no son intercambiables] con el resto. Su valor mediano es ×1.09
contra ×0.99 (Mann-Whitney p = 5×10#super[−6]) y están
agrupados en el espacio (I = 0.242). Parte de eso es mecánico, porque las carpetas
están en el denominador. Lo que no es mecánico, y conviene decirlo antes de que lo
pregunten, es que #emph[no son la periferia]: la fracción de AGEB con conteo bajo
va de 37% en Cuajimalpa y Magdalena Contreras a 82% en Benito Juárez, que es
céntrica y de ingreso alto.

#figure(
  image("../resultados/figuras/2.6_mapa_hero_violencia_familiar.png", width: 100%),
  caption: [
    Brecha entre llamadas al 911 y carpetas de la FGJ por violencia familiar, por
    AGEB, promedio de las dos ventanas, relativa a la del AGEB promedio. Escala
    divergente con límites ±2 desviaciones estándar del modelo. La
    línea punteada marca la brecha de la ciudad (×1.13), que pondera
    por volumen. Gris: sin carpetas en alguna ventana (139 de 2,433).
  ],
) <fig-mapa>

#figure(
  image("../resultados/figuras/2.6_zoom_mosaico_1km.png", width: 100%),
  caption: [
    Acercamiento de 6 km en el límite de Iztacalco, Iztapalapa y Venustiano
    Carranza, en la misma escala. La ventana se eligió con una regla fijada antes
    de dibujar, que no mira el color. Rayado: AGEB con menos de 12 carpetas en
    alguna ventana.
  ],
) <fig-zoom>

== El nivel de ciudad: lo acota la encuesta, no el mapa

El mapa ordena territorios; no dice cuánto subregistro hay. Ese nivel lo acota la
ENDIREH @endireh2021. Entre las mujeres de 15 años o más de la Ciudad de México
con violencia familiar o de pareja en los últimos doce meses, #strong[el 96.5% no
denunció (IC 95%: 95.1–97.8%)]: son #strong[34 denuncias entre 873
mujeres] de la muestra (1.10 millones expandidas), con un coeficiente de variación
de la tasa de denuncia de 19.8%, es decir precisión moderada. Los intervalos salen
de un bootstrap Rao-Wu @raowu1988 sobre las unidades primarias dentro de estrato,
porque el productor no publica réplicas.

Lo que mueve ese número no es el muestreo sino la definición del periodo, y eso es
un supuesto que refina S3. Sin acotar la queja de pareja a los doce meses da 92.0%
(72 casos, CV 13.0%); exigiendo que la última queja sea de 2020–21 da
98.3% (11 casos, CV 36.1%, precisión baja); solo familia, 95.7% (24 de 465, CV
22.6%); solo pareja sin acotar, 92.9% (39 de 594, CV 17.9%). La banda completa mide
#strong[6.3 puntos] contra 2.7 puntos de ancho del intervalo de la variante
principal. Se adopta la variante acotada porque es la única que respeta el periodo
de doce meses de la pregunta de familia, pero las cinco dicen lo mismo en términos
cualitativos: más de nueve de cada diez casos no llegan a la autoridad.

Puesto junto a la brecha, ese número es el argumento central del trabajo. La brecha
de ciudad en violencia familiar es 1.00 llamadas por carpeta en 2019
(0.98–1.02) y 0.82 en 2021–22 (0.80–0.83): hay
tantas o más carpetas que llamadas. Si al mismo tiempo el 96.5% de los casos no
llega a ninguna autoridad, entonces #emph[el 911 tampoco los ve]. La fricción de
nivel es enorme y ninguna de las dos fuentes administrativas la captura; lo único
que la brecha puede hacer, y lo hace, es ordenar territorios dentro de ese nivel.

== H2: una de tres predicciones se sostiene

La especificación se fijó el día anterior a estimarla: panel de AGEB por ventana,
logaritmo de la brecha como variable dependiente, efecto fijo de ventana,
covariables estandarizadas, mínimos cuadrados ponderados por el inverso de la
varianza total conocida, y errores estándar espacialmente robustos tipo Conley
@conley1999 con kernel de Bartlett y ancho de banda de 2 km, elegido porque el
correlograma sitúa ahí el fin de la dependencia. Cinco sensibilidades y un placebo
espacial quedaron declarados en la misma regla, junto con el criterio: una
covariable acepta solo si el signo es el predicho, el intervalo excluye el cero y
el signo sobrevive las cinco variantes. Se declaró de antemano que el R#super[2]
sería pequeño y que #emph[no es el criterio].

Antes de estimar nada apareció un hallazgo que cambia cómo se lee el resultado. En
la Ciudad de México, escolaridad y hacinamiento correlacionan a r =
−0.93, con factores de inflación de varianza de 7.54 y 7.82: #emph[son
un solo eje medido al revés], no dos predicciones independientes. Eso activó una
cláusula escrita en la misma regla, antes de calcular: el veredicto se lee sobre
las tres regresiones de una sola covariable, con la conjunta solo como referencia.
La @fig-h2 y la @tab-veredictos reportan el resultado.

#strong[Escolaridad es lo que se sostiene.] Una desviación estándar más de escolaridad
promedio #emph[se asocia] con una brecha ≈ 4% menor
(e#super[β] = 0.960; IC 95%: 0.925–0.997), y el signo aguanta
las cinco sensibilidades, incluida la más exigente: con efecto fijo de alcaldía el
coeficiente es −0.048 (IC 0.921–0.987), así que la asociación
existe #emph[entre AGEB de la misma alcaldía] y no es el gradiente centro-periferia
disfrazado. El verbo es "se asocia": tres covariables censales sobre dos ventanas
de datos administrativos no identifican nada causal.

#strong[El placebo espacial es el resultado metodológico que importa, y para una
covariable salió mal.] Mil permutaciones de las covariables restringidas dentro de
alcaldía conservan la estructura espacial y dan la distribución del estadístico t
bajo la nula. Para escolaridad, el percentil 95 de esa nula es 1.80 contra un t
observado de 2.14 (p = 0.011): los errores de Conley a 2 km cuentan bien. Para
derechohabiencia, el percentil 95 es #strong[3.93] contra un t observado de 2.28
(p = 0.76): su error estándar espacial #emph[subestima la incertidumbre], porque
esa covariable varía a escalas muy por encima de 2 km, y su intervalo nominal es
ilusorio. En la @fig-h2 esa barra gris desborda el intervalo de color por los dos
lados. Un t grande contra una nula ingenua no habría significado nada con una
autocorrelación corregida de 0.245; de tres auditorías, una falló, y se reporta.

#strong[Lo que no concluye, y por qué cada uno.] Derechohabiencia invierte el signo
al controlar por alcaldía (de −0.039 a +0.002): toda su asociación vive
#emph[entre] las 16 alcaldías, y el placebo lo confirma desde el otro lado.
Hacinamiento tiene el signo predicho y estable en las cinco variantes, pero la
precisión no alcanza: dos variantes excluyen el cero y la primaria no. Ninguna de
las tres se rechaza.

Dos cautelas que no se pueden omitir. Primera: como escolaridad y hacinamiento son
el mismo eje, que una acepte y la otra no #emph[no son dos resultados
independientes]; es la misma asociación vista por sus dos caras, y la de
escolaridad se mide con menos ruido. Segunda: el bootstrap por bloques mantiene los
tres signos (en 94%, 96% y 87% de las réplicas) pero sus tres intervalos de
percentil incluyen el cero. La regla le pedía el signo y el signo está, pero
conviene decir que #emph[la aceptación de escolaridad es del lado correcto del
cero, y por poco].

Y una advertencia de magnitud. El R#super[2] parcial de escolaridad es 0.0037.
Quitar la covariable deja el mosaico intacto: la proporción de AGEB que satura la
escala pasa de 25.7% a 24.6% y la varianza del promedio por AGEB baja 1.25%.
#strong[H2 acota una dirección; no explica el mapa.] Por eso la recomendación que
importa no es una covariable más, sino cerrar el hueco de información que la
Sección V describe. La lectura de forma la completa la figura de dispersión
parcial del repositorio: la asociación no es un gradiente parejo, la empuja la cola
de menor escolaridad.

== Lo que no validó

Dos cosas se intentaron y no funcionaron; se reportan porque delimitan el alcance.

#strong[La cota de la ENVIPE no puede falsar nada.] Para robo en calle y transporte
público ocurrido en la ciudad, la cifra negra es 94.8% (IC 95%:
92.1–97.3%; 31 carpetas de 562 delitos en 416 unidades primarias;
CV 25.3%, precisión moderada). Esa cota implica del orden de 19.2 delitos por
carpeta, y la brecha observada en el par es 2.15 llamadas por carpeta: hay nueve
veces de holgura, así que ningún resultado plausible la contradiría. El obstáculo
es de universo —la encuesta no separa al conductor del transeúnte—
y de unidad —la cota habla de delitos y la brecha de
llamadas—, no de precisión. Por eso se reporta como contexto y no como
prueba.

#strong[La concordancia con la percepción no concluye.] Agregada a alcaldía, la
brecha de robo a conductor contra la proporción que se siente insegura da
ρ = 0.10 (p = 0.71; n = 16), con 0.13 y 0.11 por ventana. El signo va en la dirección
esperada pero es indistinguible de cero, y era previsible: con 16 unidades se
necesita |ρ| ≥ 0.50 para p < 0.05, la percepción es
#emph[inversa] a la tasa de carpetas, y la variación de la brecha es sub-alcaldía,
así que agregarla a 16 unidades destruye la señal. Además la periferia no tiene
volumen a ese grano: Milpa Alta aporta 5 carpetas y 7 llamadas en total.

#place(
  top,
  scope: "parent",
  float: true,
  [
    #figure(
      image("../resultados/figuras/3.2_coeficientes_h2.png", width: 93%),
      caption: [
        H2 por covariable, en razón multiplicativa e#super[β] por
        desviación estándar. Barra de color: intervalo de confianza 95% con
        errores espaciales tipo Conley a 2 km. Barra gris detrás: el intervalo que
        permite la nula del placebo espacial (β±
        t#super[\*]#sub[95]·EE). Donde la barra gris desborda a la de
        color, el error estándar espacial subestima la incertidumbre y el
        intervalo nominal es ilusorio, que es el caso de la derechohabiencia.
      ],
    ) <fig-h2>
  ],
)

#place(
  top,
  scope: "parent",
  float: true,
  [
    #figure(
      table(
        columns: (0.5fr, 2.5fr, 2.1fr, 1.35fr),
        align: (center, left, left, left),
        table.header([], [Lo que se preguntó], [Lo que se midió], [Veredicto]),
        [H1],
        [¿La brecha varía más entre AGEB que entre alcaldías, y más de lo que daría el azar?],
        [Razón de varianzas 4.82 (IC 2.81–6.44); intraclase de alcaldía 0.110 (0.085–0.158); p = 0.001 en las dos nulas; 9 de 9 variantes],
        [#strong[Se acepta.] La alcaldía explica 11%],

        [H3],
        [¿La distribución territorial de la brecha se reproduce entre 2019 y 2021–22?],
        [ρ = 0.46 (IC 0.27–0.63; n = 76 grupos) contra un percentil 95 de la nula de 0.179; p = 0.001. En violencia familiar (S4), ρ = 0.30 (n = 698 AGEB)],
        [#strong[Se acepta.] No es ruido; no prueba que sea subregistro],

        [H2],
        [¿La brecha baja con escolaridad y derechohabiencia, y sube con hacinamiento?],
        [Escolaridad e#super[β] = 0.960 (0.925–0.997), placebo p = 0.011. Derechohabiencia 0.961 (0.930–0.994), placebo p = 0.76. Hacinamiento 1.031 (0.995–1.067), placebo p = 0.053],
        [#strong[Una se sostiene, dos no concluyen, ninguna se rechaza]],
      ),
      caption: [
        Veredicto de las tres hipótesis, con la regla de decisión tal como quedó
        fijada antes de calcular cada estadístico. Escolaridad y hacinamiento
        correlacionan a r = −0.93, así que son el mismo eje medido al
        revés y no dos predicciones independientes.
      ],
    ) <tab-veredictos>
  ],
)

= Conclusiones y recomendaciones

La Ciudad de México decide dónde prevenir con un conteo que depende de la
denuncia, y no tiene ninguna medición, por debajo de la alcaldía, de qué tanto esa
denuncia ocurre. Este trabajo no llena ese hueco —no se puede con los
datos públicos— pero acota tres cosas. Primero, el grano: la variación
que importa ocurre en zonas de 1 a 2 km, no entre alcaldías, y la alcaldía explica
apenas el 11%. Segundo, que el patrón es reproducible entre ventanas separadas por
la pandemia, así que no es ruido de conteo. Tercero, que una de las tres
asociaciones preregistradas con el entorno se sostiene, con una magnitud chica y
honesta: 4% de brecha menos por desviación estándar de escolaridad, sin explicar el
mapa.

Las cuatro recomendaciones van ordenadas por relación entre impacto y costo. La
primera no requiere cambiar ninguna ley ni levantar ningún dato nuevo.

#strong[1) Publicar la llave que une el folio de la llamada con la carpeta.]
#emph[Qué hacer:] que el C5 y la fiscalía publiquen, aunque sea anonimizada y con
rezago, la correspondencia entre folio de llamada de emergencia y número de
carpeta, para las llamadas que derivaron en una. #emph[Quién:] el C5 y la FGJ, por
convenio de intercambio de información, dentro del Sistema de Seguridad Ciudadana
que ya los coordina @leyssc. #emph[Viabilidad:] alta. No requiere reforma legal ni
recolección nueva: el vínculo operativo ya existe cuando una llamada se canaliza, y
lo que falta es publicarlo como tabla. #emph[Qué se necesita:] una tabla de dos
columnas y un criterio de anonimización. #emph[Qué riesgo corrige:] es el que
destraba todo lo demás. Con esa llave, la razón entre poblaciones de eventos que
este trabajo usa —con toda la incertidumbre de S6 encima—
se convierte en una tasa de conversión medida: de cada cien avisos, cuántos se
volvieron carpeta, por territorio. Eso convierte un indicador indirecto en una
medición directa y vuelve innecesaria la mitad de los supuestos de este documento.

#strong[2) Reanudar la publicación de las llamadas al 911.] #emph[Qué hacer:]
restablecer la publicación trimestral del 911 con coordenadas, interrumpida desde
abril de 2022, y mientras eso ocurre, solicitar 2023–2024 por
transparencia. #emph[Quién:] el C5; la solicitud, cualquier interesado ante la
Plataforma Nacional de Transparencia, con plazo de 20 días hábiles. #emph[Viabilidad:]
alta para la solicitud, media para la reanudación, que es una decisión
administrativa. #emph[Qué se necesita:] restablecer el proceso de publicación que
existió hasta 2022. #emph[Qué riesgo corrige:] el único límite temporal duro de este
trabajo. Todo lo que se reporta aquí describe 2019–2022 y no el
presente, y ese límite no es del método: es de la disponibilidad. Con datos
corrientes, el mismo mapa se vuelve un indicador de seguimiento en vez de un
diagnóstico histórico.

#strong[3) Reportar la brecha del territorio junto a su incidencia en la asignación
de cuadrantes prioritarios.] #emph[Qué hacer:] que el criterio de selección de
cuadrantes prioritarios publique, al lado del conteo de carpetas que hoy lo
determina @cuadrantes, la brecha relativa del territorio, como señal de dónde la
denuncia no está llegando. No para reemplazar la incidencia, sino para no
confundir "aquí hay poco delito" con "aquí se denuncia poco". #emph[Quién:] la
Secretaría de Seguridad Ciudadana, con el insumo del C5 y la fiscalía.
#emph[Viabilidad:] media. Es viable técnicamente —el cálculo es el de
este trabajo— pero exige aceptar públicamente que el conteo actual es
parcial. #emph[Qué se necesita:] la recomendación 1 o, en su defecto, el
procedimiento de este repositorio @repo aplicado a datos corrientes.
#emph[Qué riesgo corrige:] la paradoja de la Sección I. Benito Juárez concentra
carpetas y percibe poca inseguridad; Iztapalapa es lo contrario. Si la asignación
sigue solo al conteo, refuerza esa inversión año con año.

#strong[4) Usar el nivel de ciudad para diseñar canales de atención, no para
corregir conteos.] #emph[Qué hacer:] tomar el 96.5% de no denuncia en violencia
familiar como parámetro de diseño de la capacidad de los canales de atención
—cuántos casos existen detrás de cada carpeta— y no como
factor de expansión del conteo territorial. #emph[Quién:] las instituciones de
atención a la violencia de género de la ciudad. #emph[Viabilidad:] alta en lo
analítico; el costo está en la capacidad instalada, no en el dato.
#emph[Qué se necesita:] nada nuevo; la cifra ya existe y está publicada.
#emph[Qué riesgo corrige:] el uso incorrecto de este mismo trabajo. La tentación
natural es multiplicar las carpetas de cada AGEB por un factor derivado del 96.5%,
y eso sería inválido: ese número es de ciudad y de un universo distinto (S2), y el
mapa ordena territorios pero no entrega niveles. Decir explícitamente para qué
sirve cada cifra evita que el hallazgo se use al revés.

#strong[Trabajo futuro.] Tres cosas, en orden de retorno. Primera, separar los dos
mecanismos que S6 mezcla, usando las llamadas de otros motivos del mismo AGEB como
proxy de la propensión a llamar: es el supuesto más frágil del trabajo y es el
único que tiene un control construible con lo que ya está descargado. Segunda,
extender la serie con el 911 de 2023–2024 una vez obtenido, lo que
convierte S4 de supuesto en serie observada. Tercera, contrastar el nivel de
ciudad con la ENDIREH 2016, que permitiría ver si el desfase de S3 mueve el 96.5%
o no.

#strong[Reproducibilidad.] Todo el código, las 16 tablas de resultados y las 9
figuras están en un repositorio público @repo, con las reglas de decisión fechadas
antes de cada cálculo y una aplicación que permite mover S1, la ventana y el umbral de
conteo sobre el mapa, y ver la asociación de H2 a la escala de su propia
dispersión.
