---
title: Blog
description: "Comparaciones tecnológicas prácticas: una explicación breve, resultados y fuentes detrás de cada recomendación."
hide:
  - toc
icon: material/post-outline
---

<!-- markdownlint-disable MD003 MD013 MD033 -->

# :material-post-outline: Blog

> Decisiones técnicas explicadas brevemente: qué comparé, dónde encaja cada
> opción y qué verificaría antes de usarla. Los resultados van primero; las
> fuentes y el detalle operativo están disponibles cuando los necesitas.

## Almacenamiento y lakehouse

<div class="grid cards" markdown>

* :material-database-outline: **Almacenamiento de objetos open source**

    Garage, SeaweedFS, Silo, MinIO y otras opciones para instalaciones
    pequeñas, cloud privada y plataformas de datos. Una tabla comparativa,
    decisiones según la carga y las preguntas de recuperación que importan.

    [:octicons-arrow-right-24: Comparar almacenamiento de objetos](object-storage.md)

* :material-table-multiple: **Formatos de tabla y catálogos para lakehouse**

    Iceberg, Delta Lake, Hudi, DuckLake y Paimon. Distingue estado de tablas,
    catálogos, archivos Parquet y motores de consulta; compara
    interoperabilidad y recuperación.

    [:octicons-arrow-right-24: Comparar formatos de tabla y catálogos](lakehouse-table-formats.md)

</div>

## Pipelines de datos

<div class="grid cards" markdown>

* :material-source-branch: **Orquestadores de workflows**

    Airflow, Dagster, Prefect, Kestra, Argo Workflows y Windmill, con Temporal
    en contexto. Compara el modelo de ejecución, las licencias y la
    recuperación.

    [:octicons-arrow-right-24: Comparar orquestadores de workflows](workflow-orchestrators.md)

* :material-table-arrow-right: **Transformación y modelado de datos**

    dbt Core 1.12 y dbt 2.0, SQLMesh, Dataform Core y Bruin. Compara cambios de
    modelos, entornos, backfills y responsabilidad de despliegue.

    [:octicons-arrow-right-24: Comparar transformación de datos](data-transformation.md)

</div>

## Bases de datos

<div class="grid cards blog-databases-grid" markdown>

* :material-database-search-outline: **Bases de datos OLAP open source**

    ClickHouse, Doris, StarRocks, Trino, Druid, Pinot y DuckDB, además de
    alternativas AGPL. Elige por consultas, frescura, despliegue y costo de
    recuperación.

    [:octicons-arrow-right-24: Comparar bases de datos OLAP](olap-databases.md)

* :material-vector-polyline: **Bases de datos vectoriales open source**

    Qdrant, Milvus, Weaviate, pgvector, Chroma, LanceDB, Vespa y Redis.
    Compara búsqueda con filtros, licencias, despliegue y calidad bajo carga.

    [:octicons-arrow-right-24: Comparar bases de datos vectoriales](vector-databases.md)

* :material-graph-outline: **Bases de datos de grafos open source**

    Neo4j Community, Apache AGE, JanusGraph, LadybugDB, NebulaGraph, OrientDB
    y ArcadeDB. Elige por recorridos, lenguaje de consulta, despliegue, edición
    y recuperación.

    [:octicons-arrow-right-24: Comparar bases de datos de grafos](graph-databases.md)

</div>

## Inteligencia de negocio

<div class="grid cards" markdown>

* :material-chart-box-outline: **BI y visualización de datos**

    Superset, Metabase, Lightdash, Evidence y Redash, con Cube en contexto.
    Compara trabajo del lector, métricas gobernadas, permisos y publicación.

    [:octicons-arrow-right-24: Comparar herramientas de BI](business-intelligence.md)

</div>

## Observabilidad

<div class="grid cards" markdown>

* :material-pulse: **Herramientas de observabilidad y sus funciones**

    Prometheus, Grafana y alternativas para métricas, logs, trazas, perfiles
    y recolección. Compara herramientas con la misma función e identifica
    componentes que trabajan juntos.

    [:octicons-arrow-right-24: Comparar herramientas de observabilidad](observability.md)

</div>

## Cómo califico las herramientas

Cada tabla comparativa incluye una calificación editorial de 1 a 5 para el
encaje indicado en su fila, con la fecha del artículo. Es la suma de cinco
criterios de 0, 0,5 o 1 punto, puntuados con el repositorio, las versiones y
la documentación oficiales en la fecha de revisión. La licencia se muestra
en su propia columna y no se puntúa: el sitio trata toda licencia OSI,
copyleft incluido, como open source. Lo que se puntúa es lo que la edición
open source incluye de verdad.

| Criterio | 1 punto | 0,5 puntos | 0 puntos |
| :--- | :--- | :--- | :--- |
| **1. Mantenimiento** | Versión estable en los últimos 6 meses y ~100 commits en 90 días. | Versión estable en los últimos 18 meses, o menos commits que eso. | Nada estable en 18 meses, o upstream archivado. |
| **2. Edición abierta** | Cubre el encaje de punta a punta, incluidas las operaciones de día 2 (reparación, replicación/HA, identidad y control de acceso, respaldo/restauración, administración) sin función de pago. | El núcleo funciona, pero funciones operativas o de gobierno (SSO, roles, auditoría, replicación, niveles de almacenamiento, scrub/reparación, consola, modo distribuido) están en una edición de pago o servicio gestionado. | Sin licencia open source, o la edición abierta no sirve para el encaje. |
| **3. Madurez y comunidad** | Comunidad amplia de varias organizaciones con historial de producción largo (~10 mil estrellas y 5 años, o proyecto de fundación con 5+ años de versiones públicas). | Establecido pero joven, pequeño, de un solo mantenedor, en modo mantenimiento, o proyecto de fundación con menos de 5 años de versiones públicas. | Sin historial de producción. |
| **4. Alcance operativo** | Un proceso, biblioteca o extensión con respaldo y restauración documentados. | Varios roles o una dependencia externa (base de metadatos, cola u object store), o respaldos que exigen detener el servicio. | Una plataforma completa con su propia disciplina operativa. |
| **5. Interoperabilidad** | Interfaces estándar completas para el encaje (S3, Iceberg REST, OTLP, SQL y drivers, Cypher o Gremlin). | Cobertura parcial o ecosistema centrado en un motor. | Solo una interfaz propietaria. |

**Topes y alcance:** Un upstream archivado puntúa como máximo 1; sin versión
estable en 18 meses, como máximo 2; sin versión de disponibilidad general,
como máximo 2,5. Disponibilidad general significa una versión estable que el
propio proyecto presenta como apta para producción; un número 0.x por sí solo
no activa el tope. Las estrellas se rellenan en proporción al número, así que
media estrella es medio punto. No se califican betas, herramientas de
desarrollo ni productos fuera de la preselección open source. La calificación
resume la preparación para preseleccionar la edición abierta, no rendimiento
medido; las secciones por carga siguen decidiendo. Cada tabla de calificaciones
ordena las herramientas de la mejor a la peor calificada. Los candidatos a
seguir se nombran sin calificación hasta recibir la misma revisión.

## Lee a través de la plataforma

El almacenamiento conserva las entradas. La orquestación coordina las
transformaciones. Los modelos alimentan motores analíticos y BI; la búsqueda
vectorial y los grafos responden preguntas diferentes. La observabilidad ayuda
a investigar el comportamiento del sistema. Sigue los enlaces entre artículos
para elegir las capas que necesita tu aplicación.

<figure class="architecture-diagram architecture-overview">
  <ol class="architecture-flow" role="list">
    <li class="architecture-stage">
      <span class="architecture-stage__number" aria-hidden="true">01</span>
      <strong class="architecture-stage__title">Almacenamiento y tablas abiertas</strong>
      <p>El almacenamiento de objetos conserva las entradas inmutables mientras los formatos de tabla y catálogos registran snapshots, esquemas y compactación.</p>
    </li>
    <li class="architecture-stage">
      <span class="architecture-stage__number" aria-hidden="true">02</span>
      <strong class="architecture-stage__title">Orquestación y modelos</strong>
      <p>Los orquestadores coordinan reintentos y backfills mientras las herramientas de transformación validan contratos y publican modelos reproducibles.</p>
    </li>
    <li class="architecture-stage">
      <span class="architecture-stage__number" aria-hidden="true">03</span>
      <strong class="architecture-stage__title">Consultas y decisión</strong>
      <p>Los motores OLAP y el BI sirven métricas gobernadas; las bases vectoriales y de grafos resuelven similitud con filtros y recorridos.</p>
    </li>
    <li class="architecture-stage">
      <span class="architecture-stage__number" aria-hidden="true">04</span>
      <strong class="architecture-stage__title">Telemetría transversal</strong>
      <p>Los recolectores, métricas, logs, trazas y perfiles exponen saturación, errores y latencia en cada capa de almacenamiento, pipelines y consultas.</p>
    </li>
  </ol>
  <figcaption>Cómo se conectan las nueve comparaciones en una plataforma. Cada capa entrega estado durable o telemetría a la siguiente para aislar y reproducir fallos.</figcaption>
</figure>
