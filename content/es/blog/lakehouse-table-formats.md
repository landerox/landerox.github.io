---
reviewed: 2026-09-23
description: "Compara Apache Iceberg, Delta Lake, Apache Hudi, DuckLake y Apache Paimon, diferenciando formatos de tabla, catálogos SQL, motores y recuperación."
hide:
  - toc
icon: material/table-multiple
---

<!-- markdownlint-disable MD013 -->

# :material-table-multiple: Formatos de tablas y catálogos para lakehouse

> Compara cómo se confirma, consulta y recupera el estado de las tablas.

Parquet describe archivos. Un formato de tabla añade metadatos y reglas
para decidir qué archivos representan una tabla en un momento concreto.
El motor ejecuta consultas y el catálogo ayuda a localizar y gestionar la
tabla. Estas responsabilidades explican por qué Iceberg y DuckLake van aquí.

## Comparación de un vistazo

**Fuentes revisadas: septiembre de 2026**, a partir de repositorios, versiones
y documentación oficiales. Cada calificación (1–5) es una nota editorial de
preparación para el encaje de su fila; el desglose está bajo la tabla y el
[método](index.md#como-califico-las-herramientas), en el índice del Blog.

| Proyecto | Calificación | Licencia del código | Lo preseleccionaría para | Restricción principal |
| :--- | :--- | :--- | :--- | :--- |
| [Apache Iceberg 1.11.0](https://github.com/apache/iceberg/tree/apache-iceberg-1.11.0) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span> | Apache-2.0 | Tablas compartidas por motores analíticos elegidos de forma independiente | Cada combinación de lector, escritor, catálogo y versión de formato necesita pruebas. |
| [Delta Lake 4.4.0](https://github.com/delta-io/delta/tree/v4.4.0) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | Una plataforma cuyos motores y prácticas operativas ya soportan Delta | Las funciones de tabla y protocolos de lectura/escritura habilitados pueden limitar compatibilidad. |
| [Apache Hudi 1.2.0](https://github.com/apache/hudi/tree/release-1.2.0) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | CDC, actualizaciones y procesamiento incremental sobre un data lake | Tipo de tabla, índices, compactación y limpieza afectan frescura y mantenimiento. |
| [Especificación DuckLake 1.0](https://ducklake.select/docs/stable/specification/introduction) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3,5/5</span></span> | Implementación de referencia MIT | Un lakehouse con metadatos coordinados mediante una base SQL | Concurrencia del catálogo, recuperación e integración exacta con motores son decisiones centrales. |
| [Apache Paimon 2.0.0](https://github.com/apache/paimon/tree/release-2.0.0) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3,5/5</span></span> | Apache-2.0 | Escrituras streaming y batch en tablas del lake con Flink o Spark | Su soporte de motores se centra en Flink y Spark; confirma cada lector fuera de ellos. |

??? info faq-item "Cómo se calculó cada calificación"
    Cinco criterios de 0, 0,5 o 1 punto. Topes: upstream archivado 1, sin
    versión estable en 18 meses 2, sin versión de disponibilidad general 2,5.
    "Edición abierta" puntúa lo que incluye la edición open source sin nivel
    de pago. Puntuado en septiembre de 2026 con el repositorio, las versiones y la
    documentación oficiales; el método está en el
    [índice del Blog](index.md#como-califico-las-herramientas).

    | Proyecto | Mantenimiento | Edición abierta | Madurez | Operación | Interoperabilidad | Calificación |
    | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
    | Apache Iceberg | 1 | 1 | 1 | 0,5 | 1 | 4,5 |
    | Apache Polaris | 1 | 1 | 1 | 0,5 | 1 | 4,5 |
    | Delta Lake | 1 | 1 | 1 | 0,5 | 0,5 | 4 |
    | Apache Hudi | 1 | 1 | 1 | 0,5 | 0,5 | 4 |
    | Lakekeeper | 1 | 1 | 0,5 | 0,5 | 1 | 4 |
    | DuckLake | 1 | 1 | 0,5 | 0,5 | 0,5 | 3,5 |
    | Apache Paimon | 1 | 1 | 0,5 | 0,5 | 0,5 | 3,5 |
    | Nessie | 1 | 1 | 0,5 | 0,5 | 0,5 | 3,5 |
    | Unity Catalog OSS | 1 | 0,5 | 0,5 | 0,5 | 0,5 | 3 |

## Dónde encaja DuckLake

DuckLake es un **formato integrado de tablas y catálogo para lakehouse**.
Su [especificación](https://ducklake.select/docs/stable/specification/introduction)
sitúa metadatos en tablas SQL y datos en archivos Parquet. Pertenece a la
misma categoría que Iceberg, Delta Lake y Hudi, haciendo visible esa
diferencia arquitectónica.

DuckDB es un motor de consultas; DuckLake no es otro nombre para su archivo
de base de datos nativo. La [documentación](https://ducklake.select/docs/stable/)
separa especificación y extensión DuckDB. La
[implementación de referencia](https://github.com/duckdb/ducklake) utiliza MIT.
Su versión y el build DuckDB soportado se verifican por separado de la
especificación 1.0.

Para clientes remotos concurrentes, la
[guía del catálogo](https://ducklake.select/docs/stable/duckdb/usage/choosing_a_catalog_database)
recomienda PostgreSQL. Los catálogos DuckDB y SQLite cubren patrones locales
distintos. Elegir un catálogo SQL mantiene la responsabilidad de operar y
recuperar esa base de datos.

## Empieza por la carga

- **Varios motores deben leer y escribir las mismas tablas:** empezaría
  probando Iceberg con las versiones exactas. Confirmaría borrados, cambios
  de esquema y timestamps, además de la existencia de un conector.
- **Ya existe una plataforma Spark basada en Delta:** mantendría Delta entre
  las opciones. Probaría el segundo motor antes de habilitar funciones que
  su lector o escritor no soporte.
- **Un pipeline CDC con muchas actualizaciones:** compararía tipos de tabla
  y consulta de Hudi con Iceberg o Delta usando el mismo flujo de cambios.
  Incluiría compactación y frescura de lectura en el resultado.
- **Un lakehouse compacto centrado en DuckDB y catálogo SQL compartido:**
  probaría DuckLake. Verificaría transacciones concurrentes, recuperación de
  metadatos e integraciones antes de prometer portabilidad entre motores.

## Versiones y notas operativas

??? info faq-item "Iceberg — separar versiones de implementación y formato"
    La [especificación](https://iceberg.apache.org/spec/) identifica las
    versiones completas 1, 2 y 3 del formato, con v4 en desarrollo al revisar.
    Esa numeración es distinta de la biblioteca 1.11.0 de la tabla.

    Construye una matriz de lectores y escritores para las funciones
    habilitadas. Prueba evolución de particiones, borrado de filas y
    expiración de snapshots entre motores. Conectar al catálogo no demuestra
    que todas las funciones se lean o escriban correctamente.

??? info faq-item "Delta Lake — las funciones condicionan compatibilidad"
    La [referencia de propiedades](https://docs.delta.io/table-properties/)
    describe ajustes de retención y requisitos de protocolo. El
    [protocolo transaccional](https://github.com/delta-io/delta/blob/v4.4.0/PROTOCOL.md)
    define requisitos para lectores y escritores.

    Ensaya actualizaciones de funciones con todos los consumidores. Restaura
    historial transaccional y archivos juntos. Retención y vacuum son
    decisiones de recuperación; time travel no recupera archivos eliminados
    de todas las copias conservadas.

??? info faq-item "Hudi — comparar tipo de tabla y semántica de consulta"
    Los [tipos de tabla](https://hudi.apache.org/docs/table_types/) distinguen
    Copy on Write y Merge on Read. En Merge on Read, las consultas snapshot
    y read-optimized pueden tener distinta frescura entre compactaciones.

    Reproduce actualizaciones, eventos tardíos y borrados con la clave y
    reglas de orden reales. Mide ingesta, compactación pendiente y consultas
    juntas. Verifica que el tipo de consulta del consumidor satisface el
    requisito de frescura.

??? info faq-item "DuckLake — recuperar catálogo y archivos como un dataset"
    La [guía de recuperación](https://ducklake.select/docs/stable/duckdb/guides/backups_and_recovery)
    cubre la base del catálogo y el almacenamiento de archivos. Los metadatos
    forman parte del dataset durable; no siempre se reconstruyen listando Parquet.

    Restaura en un entorno limpio, comprueba referencias a cada archivo
    retenido y reproduce un fallo del escritor alrededor del commit. Prueba
    las transacciones del catálogo con la concurrencia prevista. Incluye
    escrituras pequeñas y mantenimiento en el ensayo operativo.

??? info faq-item "Apache Paimon — la escritura streaming hace de la compactación tu tarea"
    **Versión revisada: [2.0.0, publicada el 2026-08-07](https://github.com/apache/paimon/tree/release-2.0.0).** Proyecto
    de primer nivel de Apache, Paimon se describe como un formato de lake para
    lakehouses en tiempo real con Flink y Spark, tanto en streaming como en
    batch ([documentación](https://paimon.apache.org/docs/master/)). Todo el
    proyecto es Apache-2.0; no hay una edición de pago aparte que evaluar.

    Prueba un escritor streaming que falla a mitad de checkpoint, la lectura
    del changelog tras la compactación y los motores exactos que deben leer
    las tablas. Una comunidad menor que la de Iceberg o Delta implica que más
    de esa evidencia la tendrás que producir tú.

## Los catálogos son otra decisión

Estos proyectos gestionan descubrimiento de tablas o gobierno. Su licencia
no describe automáticamente el servicio alojado de un proveedor. Las
calificaciones usan el mismo método que la tabla anterior.

| Catálogo | Calificación | Licencia del código revisado | Función | Qué verificaría |
| :--- | :--- | :--- | :--- | :--- |
| [Apache Polaris 1.7.0](https://github.com/apache/polaris/tree/apache-polaris-1.7.0) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span> | Apache-2.0 | Servicios de catálogo para Iceberg | Autenticación de motores, manejo de credenciales y restauración del estado. |
| [Lakekeeper 0.13.6](https://github.com/lakekeeper/lakekeeper/tree/v0.13.6) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | Catálogo REST Iceberg | Integración de autorización, acceso al object store y recuperación de metadatos. |
| [Nessie 0.108.8](https://github.com/projectnessie/nessie/tree/nessie-0.108.8) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3,5/5</span></span> | Apache-2.0 | Catálogo versionado con ramas y etiquetas | Soporte de motores y relación entre referencias del catálogo y snapshots de tablas. |
| [Unity Catalog OSS 0.6.0](https://github.com/unitycatalog/unitycatalog/tree/v0.6.0) | <span class="tool-rating" data-rating="3"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3/5</span></span> | Apache-2.0 | Interfaces abiertas de catálogo y gobierno | APIs, autorización y alcance de funciones OSS frente al servicio gestionado. |

El catálogo SQL de DuckLake sigue su propia especificación de metadatos;
no es un catálogo REST Iceberg intercambiable. Asimismo, **Lance** es un
formato de datos usado por LanceDB, **Parquet** un formato de archivo y
**S3** una API de almacenamiento de objetos. Mantén visibles esas capas en
el [inventario tecnológico](../stack.md).

## Una prueba que pueda cambiar la decisión

Usa la misma tabla de eventos mutable y dos clientes independientes.

1. **Corrección del commit:** interrumpe un escritor y comprueba que los
   lectores ven un snapshot coherente, incluyendo requisitos entre tablas.
2. **Interoperabilidad:** lee y escribe con los motores exactos; incluye
   nulos, timestamps, borrados y evolución de esquema y particiones.
3. **Frescura y mantenimiento:** mide visibilidad junto con compactación,
   archivos pequeños, expiración de snapshots y crecimiento de metadatos.
4. **Autorización y recuperación:** prueba acceso al catálogo y directo a
   objetos; restaura estado, credenciales y archivos referenciados.
5. **Salida:** exporta un dataset representativo conservando su semántica.
   Compartir Parquet no demuestra que bastará con migrar metadatos.

## Completa el recorrido de los datos

Elige [almacenamiento de objetos](object-storage.md) para los archivos,
[transformación](data-transformation.md) para los modelos y un
[orquestador](workflow-orchestrators.md) para programar trabajo. Compara
[motores OLAP](olap-databases.md) y [BI](business-intelligence.md) para el
consumo. El formato de tabla no aporta por sí solo todos esos servicios.
