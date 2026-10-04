---
title: Blog
description: "Comparaciones tecnológicas prácticas: una explicación breve, resultados y fuentes detrás de cada recomendación."
hide:
  - toc
icon: material/post-outline
---

# :material-post-outline: Blog

Decisiones técnicas explicadas brevemente: qué comparé, dónde encaja cada
opción y qué verificaría antes de usarla. Los resultados van primero; las
fuentes y el detalle operativo están disponibles cuando los necesitas.

## Almacenamiento y lakehouse

**[Almacenamiento de objetos open source](object-storage.md)**

Garage, SeaweedFS, Silo, MinIO y otras opciones para instalaciones pequeñas,
cloud privada y plataformas de datos. Una tabla comparativa, decisiones según
la carga y las preguntas de recuperación que importan.

**[Formatos de tabla y catálogos lakehouse](lakehouse-table-formats.md)**

Iceberg, Delta Lake, Hudi, DuckLake y Paimon. Distingue estado de tablas, catálogos,
archivos Parquet y motores de consulta; compara interoperabilidad y recuperación.

## Pipelines de datos

**[Orquestadores de workflows](workflow-orchestrators.md)**

Airflow, Dagster, Prefect, Kestra, Argo Workflows y Windmill, con Temporal
en contexto. Compara el modelo de ejecución, las licencias y la recuperación.

**[Transformación y modelado de datos](data-transformation.md)**

dbt Core 1.12 y dbt 2.0, SQLMesh, Dataform Core y Bruin.
Compara cambios de modelos, entornos, backfills y responsabilidad de despliegue.

## Bases de datos

**[Bases de datos OLAP open source](olap-databases.md)**

ClickHouse, Doris, StarRocks, Trino, Druid, Pinot y DuckDB, además de
alternativas AGPL. Elige por consultas, frescura, despliegue y coste de recuperación.

**[Bases de datos vectoriales open source](vector-databases.md)**

Qdrant, Milvus, Weaviate, pgvector, Chroma, LanceDB, Vespa y Redis.
Compara búsqueda con filtros, licencias, despliegue y calidad bajo carga.

**[Bases de datos de grafos open source](graph-databases.md)**

Neo4j Community, Apache AGE, JanusGraph, LadybugDB, NebulaGraph, OrientDB y
ArcadeDB.
Elige por recorridos, lenguaje de consulta, despliegue, edición y recuperación.

## Inteligencia de negocio

**[BI y visualización de datos](business-intelligence.md)**

Superset, Metabase, Lightdash, Evidence y Redash, con Cube en contexto.
Compara trabajo del lector, métricas gobernadas, permisos y publicación.

## Observabilidad

**[Herramientas de observabilidad y sus funciones](observability.md)**

Prometheus, Grafana y alternativas para métricas, logs, trazas, perfiles
y recolección. Compara herramientas con la misma función e identifica
componentes que trabajan juntos.

## Cómo califico las herramientas

Cada tabla comparativa incluye una calificación editorial de 1 a 5 para el
encaje indicado en su fila, con la fecha del artículo. Es la suma de cinco
criterios de 0, 0,5 o 1 punto, puntuados con el repositorio, las versiones y
la documentación oficiales en la fecha de revisión. La licencia se muestra
en su propia columna y no se puntúa: el sitio trata toda licencia OSI,
copyleft incluido, como open source. Lo que se puntúa es lo que la edición
open source incluye de verdad.

1. **Mantenimiento.** 1: versión estable en los últimos seis meses y
   desarrollo activo (unos 100 commits en 90 días, o una cadencia regular).
   0,5: versión estable en los últimos 18 meses, o actividad baja. 0: nada
   estable en 18 meses, o upstream archivado.
2. **Edición abierta.** 1: la edición open source cubre el encaje de punta a
   punta, incluidas las operaciones de día 2 que el encaje necesite
   (reparación, replicación o alta disponibilidad, identidad y control de
   acceso, respaldo y restauración, administración), sin función de pago.
   0,5: el núcleo funciona, pero funciones operativas o de gobierno (inicio
   de sesión único, roles, auditoría, replicación, niveles de almacenamiento,
   scrub y reparación, consola, modo distribuido) están en una edición de
   pago o un servicio gestionado. 0: sin licencia open source, o la edición
   abierta no sirve para el encaje.
3. **Madurez y comunidad.** 1: comunidad amplia de varias organizaciones con
   historial de producción largo (unas diez mil estrellas y cinco años, o
   gobierno de una fundación con adopción amplia). 0,5: establecido pero
   joven, pequeño, de un solo mantenedor o en modo mantenimiento. 0: sin
   historial de producción.
4. **Alcance operativo.** 1: un proceso, biblioteca o extensión con respaldo y
   restauración documentados. 0,5: varios roles o una dependencia externa como
   base de metadatos, cola u object store, o respaldos que exigen detener el
   servicio. 0: una plataforma completa con su propia disciplina operativa.
5. **Interoperabilidad.** 1: interfaces estándar completas para el encaje (S3,
   Iceberg REST, OTLP, SQL y drivers, Cypher o Gremlin). 0,5: cobertura
   parcial o ecosistema centrado en un motor. 0: solo una interfaz
   propietaria.

Topes: un upstream archivado puntúa como máximo 1; sin versión estable en 18
meses, como máximo 2; sin versión de disponibilidad general, como máximo 2,5.
Las estrellas se rellenan en proporción al número, así que media estrella es
medio punto. No se califican betas, herramientas de desarrollo ni productos
fuera de la preselección open source. La calificación resume la preparación
para preseleccionar la edición abierta, no rendimiento medido; las secciones
por carga siguen decidiendo. Cada tabla de calificaciones ordena las
herramientas de la mejor a la peor calificada. Los candidatos a seguir se
nombran sin calificación hasta recibir la misma revisión.

## Lee a través de la plataforma

El almacenamiento conserva las entradas. La orquestación coordina las
transformaciones. Los modelos alimentan motores analíticos y BI; la búsqueda
vectorial y los grafos responden preguntas diferentes. La observabilidad ayuda
a investigar el comportamiento del sistema. Sigue los enlaces entre artículos
para elegir las capas que necesita tu aplicación.
