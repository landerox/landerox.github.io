---
reviewed: 2026-09-23
description: "Compara ClickHouse, Doris, StarRocks, Trino, Druid, Pinot y DuckDB, además de alternativas AGPL: cargas SQL, despliegue, licencias y recuperación."
hide:
  - toc
icon: material/database-search-outline
---

<!-- markdownlint-disable MD013 -->

# :material-database-search-outline: Bases de datos OLAP open source

> Empieza por las consultas y el objetivo de frescura.

Consultar Parquet en un portátil y servir dashboards concurrentes a clientes
son cargas analíticas. Justifican arquitecturas distintas. Compararía forma
de las consultas, actualizaciones, retraso de ingesta y recuperación antes
de comparar cifras de rendimiento.

## Comparación de un vistazo

**Fuentes revisadas: septiembre de 2026**, a partir de repositorios, versiones
y documentación oficiales. La tabla combina servidores distribuidos, un motor
embebido y una extensión PostgreSQL. Cada calificación (1–5) es una nota
editorial de preparación para el encaje de su fila; el desglose está bajo la
tabla y el [método](index.md#como-califico-las-herramientas), en el índice del
Blog.

| Proyecto | Calificación | Licencia del núcleo | Lo preseleccionaría para | Restricción principal |
| :--- | :--- | :--- | :--- | :--- |
| [DuckDB 1.5.5](https://github.com/duckdb/duckdb/tree/v1.5.5) | <span class="tool-rating" data-rating="5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">5/5</span></span> | MIT | Analítica embebida, exploración de Parquet y procesos batch acotados | La base nativa dentro del proceso tiene un único proceso escritor; un servicio compartido requiere otro diseño. |
| [ClickHouse 26.8.11.7 LTS](https://github.com/ClickHouse/ClickHouse/tree/v26.8.11.7-lts) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span> | Apache-2.0 | SQL columnar sobre eventos y datasets analíticos | Diseño de tablas, lotes de ingesta, merges y replicación necesitan decisiones explícitas. |
| [Apache Doris 4.1.4](https://github.com/apache/doris/tree/4.1.4) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span> | Apache-2.0; excepciones en dependencias | Analítica SQL compartida, reporting y consultas al lake | Hay que operar metadatos frontend y datos backend; el despliegue cambia los componentes. |
| [StarRocks 4.1.3](https://github.com/StarRocks/starrocks/tree/4.1.3) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span> | Apache-2.0 | BI, joins, vistas materializadas y analítica del lake | Topología de almacenamiento y cómputo y actualización de vistas forman parte del diseño. |
| [Trino 483](https://github.com/trinodb/trino/tree/483) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span> | Apache-2.0 | SQL federado sobre tablas lakehouse y bases existentes, sin cargar antes los datos | No almacena datos: la organización de archivos, el catálogo y cada conector fijan su rendimiento. |
| [ParadeDB 0.25.10](https://github.com/paradedb/paradedb/tree/v0.25.10) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span> | AGPLv3 | Búsqueda y agregaciones analíticas dentro de PostgreSQL | Es una extensión que comparte recursos PostgreSQL, con un alcance distinto al de un warehouse distribuido. |
| [Apache Druid 37.0.0](https://github.com/apache/druid/tree/druid-37.0.0) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | Analítica temporal de eventos con ingesta continua | Segmentos, deep storage y metadatos requieren planes de recuperación distintos. |
| [Apache Pinot 1.5.1](https://github.com/apache/pinot/tree/release-1.5.1) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3,5/5</span></span> | Apache-2.0 | Analítica integrada en una aplicación | La selección de índices y el diseño de tablas real-time/offline condicionan el resultado. |

??? info faq-item "Cómo se calculó cada calificación"
    Cinco criterios de 0, 0,5 o 1 punto. Topes: upstream archivado 1, sin
    versión estable en 18 meses 2, sin versión de disponibilidad general 2,5.
    "Edición abierta" puntúa lo que incluye la edición open source sin nivel
    de pago. Puntuado en septiembre de 2026 con el repositorio, las versiones y la
    documentación oficiales; el método está en el
    [índice del Blog](index.md#como-califico-las-herramientas).

    | Proyecto | Mantenimiento | Edición abierta | Madurez | Operación | Interoperabilidad | Calificación |
    | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
    | DuckDB | 1 | 1 | 1 | 1 | 1 | 5 |
    | ClickHouse | 1 | 1 | 1 | 0,5 | 1 | 4,5 |
    | Apache Doris | 1 | 1 | 1 | 0,5 | 1 | 4,5 |
    | StarRocks | 1 | 1 | 1 | 0,5 | 1 | 4,5 |
    | Trino | 1 | 1 | 1 | 0,5 | 1 | 4,5 |
    | ParadeDB | 1 | 1 | 0,5 | 1 | 1 | 4,5 |
    | Apache Druid | 1 | 1 | 1 | 0 | 1 | 4 |
    | OpenObserve | 1 | 0,5 | 0,5 | 1 | 1 | 4 |
    | Apache Pinot | 1 | 1 | 1 | 0 | 0,5 | 3,5 |

[AGPLv3 es open source](https://spdx.org/licenses/AGPL-3.0-only.html); Apache, MIT
y AGPL representan elecciones de licencia distintas. Identifica la
compilación y extensiones exactas. Doris documenta
[excepciones de licencias de terceros](https://github.com/apache/doris/blob/4.1.3/thirdparty/LICENSE.txt).
Las ediciones cloud comerciales quedan fuera de estas etiquetas del núcleo.

## Empieza por la carga

- **Archivos locales o un paso analítico dentro de una aplicación:** empezaría
  con DuckDB. Mediría memoria y disco temporal antes de introducir un clúster.
  Un informe diario no exige automáticamente un servicio de base de datos
  permanente.
- **Una plataforma BI compartida con joins y dimensiones cambiantes:**
  compararía Doris y StarRocks con SQL representativo y el cliente BI real.
  Incluiría ClickHouse si encajan su ingesta y modelo de tablas. La
  compatibilidad del protocolo no demuestra semántica SQL idéntica.
- **Dashboards de eventos y analítica operativa:** compararía ClickHouse,
  Druid y Pinot. Reproduciría intervalos temporales, selectividad de filtros,
  usuarios concurrentes e ingesta mientras corren las consultas.
- **SQL sobre tablas lakehouse que siguen en el almacenamiento de objetos:**
  empezaría con Trino cuando las tablas Iceberg, Delta o Hudi son la fuente de
  verdad y varios motores deben leerlas. Elegiría ClickHouse, Doris o
  StarRocks cuando el serving de baja latencia justifica cargar los datos en
  su propio almacenamiento.
- **Búsqueda de aplicación y agregaciones sobre datos PostgreSQL existentes:**
  evaluaría ParadeDB antes de crear otro pipeline de ingesta. La decisión
  debe incluir contención con transacciones y actualizaciones de extensiones.

No los ordenaría por una única latencia publicada. Un dataset preagregado,
una caché caliente y un join exacto sobre datos originales son pruebas
distintas.

## Versiones y notas operativas

??? info faq-item "Trino — un motor de consulta, no un almacén"
    **Versión revisada: [483, publicada el 2026-07-18](https://github.com/trinodb/trino/tree/483).** Un coordinador
    planifica cada consulta y los workers leen los datos en su lugar mediante
    [conectores](https://trino.io/docs/current/connector.html) para Iceberg,
    Delta Lake, Hudi y bases relacionales. No carga ni guarda nada, así que el
    catálogo, el tamaño de los archivos y las particiones deciden casi todo el
    resultado. Las distribuciones comerciales añaden funciones que aquí no se
    califican.

    Consulta una tabla Iceberg particionada mientras cambian sus snapshots,
    mide el tiempo de planificación con un árbol de metadatos grande y detén
    un worker a mitad de consulta con la
    [ejecución tolerante a fallos](https://trino.io/docs/current/admin/fault-tolerant-execution.html)
    activada. Verifica el control de acceso con el plugin que vayas a usar.

??? info faq-item "ClickHouse — el diseño de tablas es una decisión operativa"
    La [introducción](https://clickhouse.com/docs/get-started/about/intro)
    describe SQL columnar, joins y replicación asíncrona. En la familia
    [MergeTree](https://clickhouse.com/docs/reference/engines/table-engines/mergetree-family/mergetree),
    ordenación, particiones y merges en segundo plano influyen en ingesta
    y consultas. 26.8 es la línea LTS de agosto; 26.3 LTS sigue recibiendo
    parches, así que elige la línea por ventana de soporte, no por novedad.

    Probaría el tamaño real de los lotes, correcciones tardías y borrados
    junto con las consultas. Mediría presión de merges y retraso de réplicas.
    La replicación aporta copias adicionales; un backup restaurable de forma
    independiente sigue necesitando su propio ensayo.

??? info faq-item "Doris — incluir metadatos y modo de despliegue"
    La [arquitectura revisada](https://github.com/apache/doris/tree/4.1.4#overall-architecture)
    describe responsabilidades frontend y backend, y distingue despliegues
    con almacenamiento y cómputo integrados o separados.

    Reproduciría joins y actualizaciones con el SQL del cliente de producción;
    después recuperaría metadatos frontend y datos juntos. Una lista menor
    de componentes ayuda si el equipo entiende sus dominios de fallo.
    Validaría las licencias de las dependencias del binario elegido.

??? info faq-item "StarRocks — probar vistas y lake con datos cambiantes"
    La [descripción del proyecto](https://docs.starrocks.io/docs/introduction/StarRocks_intro/)
    presenta ejecución MPP, motor columnar, vistas materializadas, ingesta
    continua y por lotes, y acceso a data lakes.

    Compararía consultas directas y vistas materializadas tras una
    actualización tardía de dimensión. Registraría retraso de actualización
    y espacio adicional, además de velocidad. Para el lake incluiría
    disponibilidad del catálogo, peticiones al object store y lecturas en
    frío. La versión 4.1.3 revisada es del 2026-07-14; 4.0.14 (2026-08-27) es
    la línea anterior mantenida, así que fija la versión exacta a desplegar.

??? info faq-item "Druid — proteger los segmentos y su catálogo"
    El [deep storage](https://druid.apache.org/docs/latest/design/deep-storage/)
    de Druid conserva segmentos durables fuera de los procesos de consulta.
    Su [arquitectura](https://druid.apache.org/docs/latest/design/architecture/)
    separa responsabilidades de ingesta y consulta.

    Verificaría retraso de ingesta, eventos tardíos y recuperación tras perder
    nodos de consulta. Protegería tanto metadatos como deep storage. Si se
    utiliza rollup, documentaría el detalle descartado al ingerir y si el
    origen conserva datos suficientes para reconstruirlo.

??? info faq-item "Pinot — el tráfico de aplicación debe guiar el ensayo"
    El [proyecto](https://github.com/apache/pinot/tree/release-1.5.1) se
    orienta a consultas analíticas en aplicaciones y admite ingesta por
    lotes y streaming con varios tipos de índices.

    Reproduciría tenants desbalanceados, filtros selectivos y peticiones
    concurrentes durante la ingesta. Probaría la transición entre datos
    offline y real-time buscando huecos o doble conteo. Incluiría gestión de
    segmentos y recuperación del clúster, además del endpoint SQL.

??? info faq-item "DuckDB — precisar el modelo de concurrencia"
    La [referencia de concurrencia](https://duckdb.org/docs/current/connect/concurrency)
    distingue el modelo nativo dentro del proceso: un proceso puede leer y
    escribir, o varios pueden abrir la base en modo de solo lectura.
    Se admiten varios hilos escritores dentro de ese proceso.

    La misma referencia presenta Quack como protocolo remoto beta y
    DuckLake con catálogo PostgreSQL como otra vía para escritores
    concurrentes. Añaden componentes y contratos de almacenamiento
    diferentes. No extendería la restricción del archivo nativo a todos
    los sistemas basados en DuckDB.

??? info faq-item "ParadeDB — una opción AGPL dentro de PostgreSQL"
    El [código revisado](https://github.com/paradedb/paradedb/tree/v0.25.10)
    incorpora búsqueda de texto y agregaciones mediante la extensión
    `pg_search`, con Tantivy y DataFusion. El límite de despliegue sigue
    siendo PostgreSQL.

    Probaría la combinación soportada de PostgreSQL y extensión,
    mantenimiento de índices y tráfico mixto de transacciones y búsquedas.
    Mantendría un plan de recuperación para ambos. Es una alternativa de
    búsqueda y analítica sobre datos existentes; esto no demuestra paridad
    con un warehouse distribuido.

## Un candidato AGPL especializado

[OpenObserve](https://github.com/openobserve/openobserve) <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> es una plataforma
de observabilidad AGPLv3 para
[logs, métricas y trazas](https://openobserve.ai/docs/) con consultas
analíticas. Lo evaluaría para búsqueda de telemetría, retención y dashboards.

Su alcance difiere del de un warehouse BI general. Verifica versión y
límites OSS/enterprise; la versión revisada
[1.0.3](https://github.com/openobserve/openobserve/releases/tag/v1.0.3)
pertenece a su primera línea 1.x de disponibilidad general, publicada el
2026-09-11, que además llevó SLOs y monitorización sintética a la edición
abierta. Un requisito AGPL debe acotar opciones técnicamente
adecuadas, sin convertir productos distintos en bases equivalentes.

## Una prueba que pueda cambiar la decisión

Usa el mismo dataset de eventos y dimensión de clientes en cada candidato.
Documenta particionado, índices, replicación, hardware y preprocesamiento.

1. **Corrección:** reconcilia conteos y sumas tras ingesta duplicada, un
   evento tardío, una dimensión actualizada y un borrado. Distingue
   agregaciones exactas y aproximadas.
2. **Frescura:** mide desde el evento de origen hasta su disponibilidad en
   consulta, además de p50/p95/p99 de consulta. Una respuesta rápida con
   datos antiguos puede incumplir el objetivo de negocio.
3. **Concurrencia:** ejecuta la mezcla real de consultas durante ingesta y
   mantenimiento; informa cachés frías y calientes por separado.
4. **Recuperación:** restaura datos, catálogo, permisos y offsets de ingesta
   en un entorno limpio. Compara los resultados recuperados con el origen.
5. **Coste:** incluye réplicas, índices, disco temporal, tráfico del object
   store, compactación y tiempo operativo. Fija los umbrales antes de probar.

## Completa el recorrido de los datos

Un [object store](object-storage.md) puede conservar entradas y backups.
Un [orquestador](workflow-orchestrators.md) coordina cargas y reconstrucciones.
Las [bases vectoriales](vector-databases.md) cubren otra carga de recuperación
de información. Mantén visibles esas responsabilidades al decidir si se
justifica otro servicio.

El [explorador SQL](../projects/tools.md#interactive-sql-sandbox) local muestra las
etapas lógicas de una consulta con datos ficticios. Sirve para estudiar los
conceptos, no para estimar el rendimiento de estos motores.

La [transformación](data-transformation.md) define los modelos que alimentan
estos motores; [BI](business-intelligence.md) presenta los resultados. Compara
[formatos lakehouse](lakehouse-table-formats.md) cuando varios motores comparten
tablas y [bases de grafos](graph-databases.md) cuando importan los recorridos.
